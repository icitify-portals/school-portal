import { db } from "@/db/db";
import { 
    payrollLogs, 
    salaryStructures, 
    staffProfiles, 
    users, 
    academicSessions,
    expenditureRequests 
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export class PayrollService {

    /**
     * Generates a monthly payroll for all active staff members.
     */
    static async generatePayroll(month: number, year: number) {
        // 1. Fetch all active staff with their salary structures
        const staff = await db.select({
            id: staffProfiles.id,
            userId: staffProfiles.userId,
            basePay: salaryStructures.basePay,
            allowances: salaryStructures.allowances,
            deductions: salaryStructures.deductions
        })
        .from(staffProfiles)
        .innerJoin(salaryStructures, eq(staffProfiles.salaryStructureId, salaryStructures.id))
        .where(eq(staffProfiles.isActive, true));

        const logs = [];
        let totalPayrollAmount = 0;

        for (const s of staff) {
            // Check if payroll already exists for this staff/month/year
            const existing = await db.select()
                .from(payrollLogs)
                .where(and(
                    eq(payrollLogs.staffId, s.id),
                    eq(payrollLogs.month, month),
                    eq(payrollLogs.year, year)
                )).limit(1);

            if (!existing[0]) {
                const base = parseFloat(s.basePay);
                const allow = parseFloat(s.allowances || "0");
                const deduct = parseFloat(s.deductions || "0");
                const net = base + allow - deduct;

                await db.insert(payrollLogs).values({
                    staffId: s.id,
                    month,
                    year,
                    basePay: base.toString(),
                    allowances: allow.toString(),
                    deductions: deduct.toString(),
                    netPay: net.toString(),
                    status: 'draft'
                });
                
                totalPayrollAmount += net;
            }
        }

        return { count: staff.length, total: totalPayrollAmount };
    }

    /**
     * Approves and disburses the entire payroll for a month.
     * This creates an official expenditure record in the Bursary.
     */
    static async approveMonthlyPayroll(month: number, year: number, adminId: number) {
        const payroll = await db.select()
            .from(payrollLogs)
            .where(and(
                eq(payrollLogs.month, month),
                eq(payrollLogs.year, year),
                eq(payrollLogs.status, 'draft')
            ));

        if (payroll.length === 0) throw new Error("No draft payroll found for this period.");

        let totalAmount = 0;
        for (const log of payroll) {
            totalAmount += parseFloat(log.netPay);
            
            // Mark individual log as paid
            await db.update(payrollLogs)
                .set({ status: 'paid', paidAt: new Date() })
                .where(eq(payrollLogs.id, log.id));
        }

        // Create an institutional expenditure request for the total payroll
        await db.insert(expenditureRequests).values({
            requestedBy: adminId,
            title: `Staff Payroll - ${month}/${year}`,
            purpose: `Monthly compensation for ${payroll.length} active staff members.`,
            amount: totalAmount.toString(),
            status: 'disbursed',
            approvedBy: adminId,
            approvedAt: new Date(),
            disbursedAt: new Date()
        });

        return { count: payroll.length, total: totalAmount };
    }

    /**
     * Retrieves the payroll history for a specific staff member.
     */
    static async getStaffPayrollHistory(staffId: number) {
        return await db.select()
            .from(payrollLogs)
            .where(eq(payrollLogs.staffId, staffId))
            .orderBy(desc(payrollLogs.year), desc(payrollLogs.month));
    }
}
