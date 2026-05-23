"use server";

import { PayrollService } from "@/services/PayrollService";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";
import { db } from "@/db/db";
import { payrollLogs, users, staffProfiles } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function generateMonthlyPayrollAction(month: number, year: number) {
    try {
        const isAuth = await hasRole("admin") || await hasRole("superadmin") || await hasRole("bursar") || await hasRole("hr");
        if (!isAuth) throw new Error("Unauthorized: HR/Bursar access required");

        const result = await PayrollService.generatePayroll(month, year);
        revalidatePath("/admin/hr/payroll");
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function approvePayrollAction(month: number, year: number) {
    try {
        const isAuth = await hasRole("admin") || await hasRole("superadmin") || await hasRole("bursar");
        if (!isAuth) throw new Error("Unauthorized: Financial clearance required");

        const adminId = 1; // Placeholder
        const result = await PayrollService.approveMonthlyPayroll(month, year, adminId);
        revalidatePath("/admin/hr/payroll");
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getPayrollLogsAction(month: number, year: number) {
    try {
        const isAuth = await hasRole("admin") || await hasRole("superadmin") || await hasRole("hr");
        if (!isAuth) throw new Error("Unauthorized");

        const logs = await db.select({
            id: payrollLogs.id,
            staffName: users.name,
            netPay: payrollLogs.netPay,
            status: payrollLogs.status,
            paidAt: payrollLogs.paidAt
        })
        .from(payrollLogs)
        .innerJoin(staffProfiles, eq(payrollLogs.staffId, staffProfiles.id))
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .where(and(eq(payrollLogs.month, month), eq(payrollLogs.year, year)));

        return { success: true, data: logs };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
