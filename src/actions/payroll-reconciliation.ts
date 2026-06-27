"use server";

import { PayrollReconciliationService } from "@/services/PayrollReconciliationService";
import { revalidatePath } from "next/cache";
import { hasRole, hasPermission } from "@/lib/rbac";
import { db } from "@/db/db";
import { payrollReconciliationLogs, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

async function ensureBursarAccess() {
    const isBursar = await hasPermission("finance.payroll.approve") || await hasRole("bursar") || await hasRole("superadmin");
    if (!isBursar) throw new Error("Unauthorized: Bursary access required");
}

export async function getRecentReconciliations() {
    try {
        await ensureBursarAccess();
        const logs = await db.select({
            id: payrollReconciliationLogs.id,
            month: payrollReconciliationLogs.month,
            totalExpected: payrollReconciliationLogs.totalExpected,
            totalActual: payrollReconciliationLogs.totalActual,
            discrepancyCount: payrollReconciliationLogs.discrepancyCount,
            status: payrollReconciliationLogs.status,
            createdAt: payrollReconciliationLogs.createdAt,
            reconciledBy: users.name
        })
        .from(payrollReconciliationLogs)
        .leftJoin(users, eq(payrollReconciliationLogs.reconciledBy, users.id))
        .orderBy(desc(payrollReconciliationLogs.createdAt))
        .limit(10);

        return { success: true, data: logs };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function runPayrollReconciliation(data: {
    month: string,
    bankReport: Array<{ staffEmail: string, paidAmount: number }>
}) {
    try {
        await ensureBursarAccess();
        
        // Use a placeholder for the current user ID - in a real app, get from session
        const userId = 1; 

        const result = await PayrollReconciliationService.reconcile({
            month: data.month,
            bankReport: data.bankReport,
            reconciledBy: userId
        });

        revalidatePath("/admin/finance/payroll/reconciliation");
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getReconciliationDetails(logId: number) {
    try {
        await ensureBursarAccess();
        const [log] = await db.select()
            .from(payrollReconciliationLogs)
            .where(eq(payrollReconciliationLogs.id, logId))
            .limit(1);
        
        if (!log) throw new Error("Log not found");

        return { 
            success: true, 
            data: {
                ...log,
                discrepancyDetails: JSON.parse(log.discrepancyDetails || "[]")
            } 
        };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
