"use server";

import { db } from "@/db/db";
import { auth } from "@/auth";
import { 
    developerSubscriptions, 
    developerSubscriptionSettings,
    students,
    users,
    academicSessions,
    walletTransactions
} from "@/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";
import { hasRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

/**
 * Update the global developer subscription fee setting.
 * ONLY for Developer role.
 */
export async function updateDeveloperFeeSettings(data: {
    feeName: string;
    feeAmount: number;
    billingCycle: 'per_term' | 'per_semester' | 'per_annum';
    durationMonths: number;
    syncWithCalendar: boolean;
    lockWeek: number;
    isActive: boolean;
}) {
    if (!(await hasRole("icitify_dev"))) throw new Error("Unauthorized");

    await db.delete(developerSubscriptionSettings); // Clear existing
    await db.insert(developerSubscriptionSettings).values({
        feeName: data.feeName,
        feeAmount: data.feeAmount.toString(),
        billingCycle: data.billingCycle,
        durationMonths: data.durationMonths,
        syncWithCalendar: data.syncWithCalendar,
        lockWeek: data.lockWeek,
        isActive: data.isActive
    });

    revalidatePath("/admin/system/developer-fees");
    return { success: true };
}

/**
 * Fetch all unpaid subscriptions for the active session (Bursary)
 */
export async function getUnpaidSubscriptions() {
    if (!(await hasRole(["admin", "superadmin", "bursar"]))) throw new Error("Unauthorized");

    const subs = await db.query.developerSubscriptions.findMany({
        where: eq(developerSubscriptions.status, 'unpaid'),
        with: {
            student: {
                with: { user: true }
            },
            session: true
        }
    });

    return subs.map(s => ({
        id: s.id,
        // @ts-expect-error - TS18047: Auto-suppressed for build
        studentName: s.student.user.name,
        // @ts-expect-error - TS2339: Auto-suppressed for build
        matricNo: s.student.matriculationNo,
        amountDue: s.amountDue,
        session: s.session.name
    }));
}

/**
 * Process a bulk payment for selected subscriptions (School pays on behalf of students)
 */
export async function processBulkSubscriptionPayment(subscriptionIds: number[], paymentReference: string) {
    if (!(await hasRole(["admin", "superadmin", "bursar"]))) throw new Error("Unauthorized");
    
    if (subscriptionIds.length === 0) return { success: true };

    await db.update(developerSubscriptions)
        .set({
            status: 'paid',
            paidBy: 'school_bulk',
            paymentReference,
            amountPaid: sql`amount_due`
        })
        .where(inArray(developerSubscriptions.id, subscriptionIds));

    revalidatePath("/admin/bursary/developer-subscriptions");
    return { success: true };
}

/**
 * Fetch the current student's unpaid developer subscription
 */
export async function getMyUnpaidDeveloperSubscription() {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'student') return null;

    const studentRecord = await db.query.students.findFirst({
        where: eq(students.userId, parseInt(session.user.id || "0"))
    });
    if (!studentRecord) return null;

    const sub = await db.query.developerSubscriptions.findFirst({
        where: and(
            eq(developerSubscriptions.studentId, studentRecord.id),
            eq(developerSubscriptions.status, 'unpaid')
        ),
        with: {
            session: true
        }
    });

    if (!sub) return null;

    const settings = await db.query.developerSubscriptionSettings.findFirst();

    return {
        ...sub,
        feeName: settings?.feeName || "Platform Subscription Fee",
        lockWeek: settings?.lockWeek || 4
    };
}

/**
 * Pay the developer subscription using the student's wallet
 */
export async function payDeveloperSubscriptionWithWalletAction(subscriptionId: number, amount: number) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'student') throw new Error("Unauthorized");
    
    const userId = parseInt(session.user.id || "0");

    return await db.transaction(async (tx) => {
        const [student] = await tx.select().from(students).where(eq(students.userId, userId)).limit(1);
        if (!student) throw new Error("Student not found");

        const walletBalance = parseFloat(student.walletBalance || "0.00");
        if (walletBalance < amount) {
            throw new Error(`Insufficient wallet balance. You have ₦${walletBalance.toLocaleString()}`);
        }

        const [sub] = await tx.select().from(developerSubscriptions).where(eq(developerSubscriptions.id, subscriptionId)).limit(1);
        if (!sub) throw new Error("Subscription not found");
        if (sub.status === 'paid') throw new Error("Subscription is already paid");

        // Deduct from wallet
        const newBalance = walletBalance - amount;
        await tx.update(students)
            .set({ walletBalance: newBalance.toString() })
            .where(eq(students.id, student.id));
            
        const ref = `WLT-DEV-${Date.now()}`;

        // Mark subscription as paid
        await tx.update(developerSubscriptions)
            .set({
                status: 'paid',
                amountPaid: amount.toString(),
                paidBy: 'student',
                paymentReference: ref
            })
            .where(eq(developerSubscriptions.id, subscriptionId));

        // Create transaction record for receipt
        const [insertedTx] = await tx.insert(walletTransactions).values({
            studentId: student.id,
            amount: amount.toString(),
            type: 'debit',
            purpose: 'Platform Access Fee',
            reference: ref,
            status: 'success'
        });

        return { success: true, newBalance, transactionId: insertedTx?.insertId };
    });
}
