"use server";

import { BursaryService } from "@/services/BursaryService";
import { revalidatePath } from "next/cache";
import { hasRole, hasPermission } from "@/lib/rbac";

export async function getBursaryOverviewAction() {
    try {
        const isAuth = await hasPermission("finance.dashboard.view") || await hasPermission("finance.ledger.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("bursar");
        if (!isAuth) throw new Error("Unauthorized: Bursary access required");

        const data = await BursaryService.getFinancialOverview();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function requestExpenditureAction(data: {
    title: string,
    purpose: string,
    amount: number,
    departmentId?: number
}) {
    try {
        const userId = 1; // Current User Placeholder
        await BursaryService.requestExpenditure({
            ...data,
            requestedBy: userId
        });
        revalidatePath("/admin/accounting/expenditures");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getExpenditureLedgerAction() {
    try {
        const isAuth = await hasPermission("finance.ledger.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("bursar");
        if (!isAuth) throw new Error("Unauthorized");

        const data = await BursaryService.getExpenditureLedger();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function approveExpenditureAction(requestId: number) {
    try {
        const isAuth = await hasPermission("finance.expenditure.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("bursar");
        if (!isAuth) throw new Error("Unauthorized");

        const adminId = 1; // Current User Placeholder
        await BursaryService.approveAndDisburse(requestId, adminId);
        revalidatePath("/admin/accounting/expenditures");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
