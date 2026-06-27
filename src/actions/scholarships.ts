"use server";

import { db } from "@/db/db";
import { sponsors, scholarships, studentScholarships, sponsorLedger, students, studentLedger, transactions, users, academicSessions } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getCurrentSession } from "./portal";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getSponsors() {
    try {
        return await db.select().from(sponsors).orderBy(desc(sponsors.createdAt));
    } catch (error) {
        console.error("Failed to fetch sponsors:", error);
        return [];
    }
}

export async function createSponsor(data: {
    name: string;
    type: 'government' | 'corporate' | 'ngo' | 'individual' | 'internal';
    contactEmail?: string;
}) {
    try {
        const allowed = await hasPermission("finance.scholarships.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("bursar") || await hasRole("scholarship_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to create sponsor" };

        await db.insert(sponsors).values(data);
        revalidatePath("/admin/bursary/scholarships");
        return { success: true };
    } catch (error) {
        console.error("Failed to create sponsor:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function depositSponsorFunds(data: {
    sponsorId: number;
    amount: string;
    reference: string;
    description: string;
    recordedBy: number;
}) {
    try {
        const allowed = await hasPermission("finance.scholarships.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("bursar") || await hasRole("scholarship_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to deposit sponsor funds" };

        await db.transaction(async (tx) => {
            // 1. Record in sponsor ledger
            await tx.insert(sponsorLedger).values({
                sponsorId: data.sponsorId,
                type: 'deposit',
                amount: data.amount,
                reference: data.reference,
                description: data.description,
                recordedBy: data.recordedBy
            });

            // 2. Update sponsor balance
            await tx.update(sponsors)
                .set({ balance: sql`${sponsors.balance} + ${data.amount}` })
                .where(eq(sponsors.id, data.sponsorId));
        });

        revalidatePath("/admin/bursary/scholarships");
        return { success: true };
    } catch (error) {
        console.error("Deposit failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getScholarshipDefinitions() {
    try {
        return await db.select().from(scholarships).orderBy(desc(scholarships.createdAt));
    } catch (error) {
        return [];
    }
}

export async function allocateScholarship(data: {
    studentId: number;
    scholarshipId: number;
    sessionId?: number;
}) {
    try {
        const allowed = await hasPermission("finance.scholarships.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("bursar") || await hasRole("scholarship_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to allocate scholarship" };

        let sessionId = data.sessionId;
        if (!sessionId) {
            const currentSession = await getCurrentSession();
            sessionId = currentSession?.id;
        }

        if (!sessionId) throw new Error("No active session found");

        await db.insert(studentScholarships).values({
            studentId: data.studentId,
            scholarshipId: data.scholarshipId,
            sessionId: sessionId,
            status: 'active'
        });

        revalidatePath("/admin/bursary/scholarships");
        return { success: true };
    } catch (error) {
        console.error("Allocation failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function disburseScholarship(allocationId: number, recordedBy: number) {
    try {
        const allowed = await hasPermission("finance.scholarships.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("bursar") || await hasRole("scholarship_officer");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to disburse scholarship" };

        // 1. Get allocation details
        const results = await db.select({
            allocation: studentScholarships,
            scholarship: scholarships,
            student: students
        })
            .from(studentScholarships)
            .innerJoin(scholarships, eq(studentScholarships.scholarshipId, scholarships.id))
            .innerJoin(students, eq(studentScholarships.studentId, students.id))
            .where(eq(studentScholarships.id, allocationId))
            .limit(1);

        const joinedResult = results[0];

        if (!joinedResult) throw new Error("Allocation not found");
        if (joinedResult.allocation.status !== 'active') throw new Error("Scholarship allocation is not active");

        const amountToDisburse = parseFloat(joinedResult.scholarship.amount || "0");
        if (amountToDisburse <= 0) throw new Error("Scholarship amount is not configured correctly");

        // Note: For now, we assume internal scholarships. 
        // If we needed sponsor balance check, we'd need a sponsor link on studentScholarships or Definition.

        await db.transaction(async (tx) => {
            // 2. Create Student Transaction
            const [newTx] = await tx.insert(transactions).values({
                studentId: joinedResult.allocation.studentId,
                amount: amountToDisburse.toString(),
                type: 'credit',
                purpose: `Scholarship Disbursement: ${joinedResult.scholarship.name}`,
                status: 'completed'
            });

            // 3. Update Student Ledger
            const currentWalletBalance = joinedResult.student.walletBalance || "0";
            const newBalance = parseFloat(currentWalletBalance) + amountToDisburse;

            await tx.insert(studentLedger).values({
                studentId: joinedResult.allocation.studentId,
                transactionId: newTx.insertId,
                description: `Scholarship: ${joinedResult.scholarship.name}`,
                credit: amountToDisburse.toString(),
                balance: newBalance.toFixed(2)
            });

            // 4. Update Student Wallet
            await tx.update(students)
                .set({ walletBalance: newBalance.toFixed(2) })
                .where(eq(students.id, joinedResult.allocation.studentId));

            // 5. Update Allocation Status
            await tx.update(studentScholarships)
                .set({
                    status: 'expired', // Marking as disbursed/expired for this session
                })
                .where(eq(studentScholarships.id, allocationId));
        });

        revalidatePath("/admin/bursary/scholarships");
        return { success: true };
    } catch (error) {
        console.error("Disbursement failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getScholarshipSummary() {
    try {
        const results = await db
            .select({
                allocation: studentScholarships,
                scholarship: scholarships,
                student: students,
                user: users,
            })
            .from(studentScholarships)
            .innerJoin(scholarships, eq(studentScholarships.scholarshipId, scholarships.id))
            .innerJoin(students, eq(studentScholarships.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .orderBy(desc(studentScholarships.appliedAt));

        return results.map(r => ({
            ...r.allocation,
            definition: r.scholarship,
            student: {
                ...r.student,
                user: r.user
            }
        }));
    } catch (error) {
        console.error("Failed to fetch summary:", error);
        return [];
    }
}
