"use server";

import { UniversityFinanceService } from "@/services/UniversityFinanceService";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";

async function ensureStaffAccess() {
    // Both staff and bursars can interact with university finance (requests vs approvals)
    const isStaff = await hasRole("staff");
    const isBursar = await hasRole("bursar");
    if (!isStaff && !isBursar) throw new Error("Unauthorized access to university financials");
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
        const result = await UniversityFinanceService.getStaffAdvances(staffId);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
