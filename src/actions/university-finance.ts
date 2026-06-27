"use server";

import { UniversityFinanceService } from "@/services/UniversityFinanceService";
import { revalidatePath } from "next/cache";
import { hasRole, hasPermission } from "@/lib/rbac";
import { db } from "@/db/db";
import { staffProfiles, cashAdvances } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

async function ensureStaffAccess() {
    // Both staff and bursars can interact with university finance (requests vs approvals)
    const isStaff = await hasRole("staff");
    const isBursar = await hasRole("bursar");
    if (!isStaff && !isBursar) throw new Error("Unauthorized access to university financials");
}

async function verifyStaffOwner(staffId: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = parseInt(session.user.id);
    const userRole = (session?.user as any)?.role?.toLowerCase() || "";

    // Allow Bursars, Admins, or users with finance loan manage permissions to bypass
    const hasOverride = await hasPermission("finance.loans.manage") || ['superadmin', 'admin', 'bursar'].includes(userRole);
    if (hasOverride) return;

    const [profile] = await db.select().from(staffProfiles).where(and(
        eq(staffProfiles.id, staffId),
        eq(staffProfiles.userId, userId)
    )).limit(1);
    if (!profile) throw new Error("Unauthorized: Staff profile mismatch");
}

export async function getLoanTemplates() {
    try {
        await ensureStaffAccess();
        const result = await UniversityFinanceService.getLoanTemplates();
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function applyForStaffLoan(data: {
    staffId: number,
    templateId: number,
    amount: number,
    months: number,
    customData: Record<string, any>
}) {
    try {
        await ensureStaffAccess();
        await verifyStaffOwner(data.staffId);
        const result = await UniversityFinanceService.applyForLoan(data);
        revalidatePath("/staff/finance/loans");
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function requestCashAdvance(data: {
    staffId: number,
    purpose: string,
    amount: number
}) {
    try {
        await ensureStaffAccess();
        await verifyStaffOwner(data.staffId);
        const result = await UniversityFinanceService.requestAdvance(data);
        revalidatePath("/staff/finance/imprest");
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function retireCashAdvance(data: {
    advanceId: number,
    receipts: Array<{ description: string, amount: number, url?: string }>,
    returnedBalance: number
}) {
    try {
        await ensureStaffAccess();
        const [advance] = await db.select().from(cashAdvances).where(eq(cashAdvances.id, data.advanceId)).limit(1);
        if (!advance) throw new Error("Cash advance request not found");
        await verifyStaffOwner(advance.staffId);

        const result = await UniversityFinanceService.retireAdvance(data);
        revalidatePath("/staff/finance/imprest");
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getStaffAdvances(staffId: number) {
    try {
        await ensureStaffAccess();
        await verifyStaffOwner(staffId);
        const result = await UniversityFinanceService.getStaffAdvances(staffId);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

