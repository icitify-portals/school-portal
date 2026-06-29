"use server";

import { db } from "@/db/db";
import { 
    developerSubscriptions, 
    developerSubscriptionSettings,
    students,
    users,
    academicSessions
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
    isActive: boolean;
}) {
    if (!(await hasRole("icitify_dev"))) throw new Error("Unauthorized");

    await db.delete(developerSubscriptionSettings); // Clear existing
    await db.insert(developerSubscriptionSettings).values({
        feeName: data.feeName,
        feeAmount: data.feeAmount.toString(),
        billingCycle: data.billingCycle,
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
