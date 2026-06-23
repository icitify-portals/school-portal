"use server";

import { db } from "@/db/db";
import { payrollLogs, staffProfiles, users, generalLedger } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getBursarySettings } from "./bursary";
import { getHRSettings } from "./hr_settings";
import { sendEmail } from "@/lib/mail";

export async function approvePayrollBatch(batchId: string) {
    try {
        const session = await auth();
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;
        if (!actorId) return { success: false, error: "Unauthorized" };

        const settings = await getBursarySettings();
        const bankAcc = settings['gl_cash_bank_account'];
        const expenseAcc = settings['gl_salary_expense_account'];
        const liabAcc = settings['gl_other_payroll_liability_account'] || settings['gl_paye_liability_account'] || settings['gl_pension_liability_account'];

        if (!bankAcc || !expenseAcc) {
            return { success: false, error: "GL accounts for payroll are not configured." };
        }

        const hrSettings = await getHRSettings();

        // 1. Fetch pending logs
        const pendingLogs = await db.select().from(payrollLogs)
            .where(and(eq(payrollLogs.ledgerBatchId, batchId), eq(payrollLogs.status, 'pending_approval')));

        if (pendingLogs.length === 0) {
            return { success: false, error: "No pending payroll records found for this batch." };
        }

        const allUsers = await db.select().from(users);
        const profiles = await db.select().from(staffProfiles);

        await db.transaction(async (tx) => {
            for (const log of pendingLogs) {
                const profile = profiles.find(p => p.id === log.staffId);
                const title = profile ? profile.jobTitle : "Staff";

                const grossPay = parseFloat(log.basePay as string) + parseFloat(log.allowances as string || "0");
                const deductions = parseFloat(log.deductions as string || "0");

                if (deductions > 0 && !liabAcc) {
                    throw new Error("Payroll Liability account is not configured in settings, but deductions exist.");
                }

                // Mark as approved (or paid)
                await tx.update(payrollLogs)
                    .set({ status: 'approved', paidAt: new Date() })
                    .where(eq(payrollLogs.id, log.id));

                // 2. Automated GL Posting
                // Debit Salary Expense (Gross Pay)
                await tx.insert(generalLedger).values({
                    accountId: parseInt(expenseAcc),
                    description: `Payroll Expense (Gross): ${log.month}/${log.year} (Staff: ${title})`,
                    debit: grossPay.toFixed(2),
                    credit: "0.00",
                    batchId,
                    recordedBy: actorId
                });

                // Credit Bank (Net Pay)
                await tx.insert(generalLedger).values({
                    accountId: parseInt(bankAcc),
                    description: `Payroll Disbursement (Net): ${log.month}/${log.year} (Staff: ${title})`,
                    debit: "0.00",
                    credit: log.netPay,
                    batchId,
                    recordedBy: actorId
                });

                // Credit Liability (Deductions withheld)
                if (deductions > 0 && liabAcc) {
                    await tx.insert(generalLedger).values({
                        accountId: parseInt(liabAcc),
                        description: `Payroll Deductions Withheld: ${log.month}/${log.year} (Staff: ${title})`,
                        debit: "0.00",
                        credit: deductions.toFixed(2),
                        batchId,
                        recordedBy: actorId
                    });
                }
            }
        });

        // 3. Send Payslips
        for (const log of pendingLogs) {
            const profile = profiles.find(p => p.id === log.staffId);
            if (!profile) continue;
            const user = allUsers.find(u => u.id === profile.userId);
            if (user?.email) {
                const html = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 10px;">
                        <h2 style="color: #4f46e5; margin-bottom: 20px;">Monthly Payslip: ${log.month}/${log.year}</h2>
                        <p>Hello <strong>${user.name}</strong>,</p>
                        <p>Your salary for <strong>${log.month}/${log.year}</strong> has been processed successfully.</p>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">Net Salary Disbursed</p>
                            <h1 style="margin: 0; color: #111827;">\u20a6${log.netPay}</h1>
                        </div>
                        <p style="font-size: 14px; color: #6b7280;">You can view and download your full breakdown from the staff portal.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="font-size: 12px; color: #9ca3af; text-align: center;">${hrSettings['institutional_name'] || 'Institutional School Portal'} | Finance Department</p>
                    </div>
                `;
                await sendEmail(
                    user.email,
                    `Your Payslip for ${log.month}/${log.year}`,
                    html,
                    hrSettings['sender_email'],
                    hrSettings['resend_api_key']
                );
            }
        }

        revalidatePath('/admin/finance/payroll');
        revalidatePath('/admin/finance/payroll/reconciliation');
        return { success: true };
    } catch (error) {
        console.error("Approve Payroll Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function getPendingPayrollBatches() {
    try {
        const logs = await db.select().from(payrollLogs).where(eq(payrollLogs.status, 'pending_approval'));
        // Group by ledgerBatchId
        const batches = logs.reduce((acc, log) => {
            const batchId = log.ledgerBatchId || 'unknown';
            if (!acc[batchId]) {
                acc[batchId] = {
                    batchId,
                    month: log.month,
                    year: log.year,
                    totalStaff: 0,
                    totalAmount: 0
                };
            }
            acc[batchId].totalStaff += 1;
            acc[batchId].totalAmount += parseFloat(log.netPay as string);
            return acc;
        }, {} as Record<string, any>);

        return { success: true, data: Object.values(batches) };
    } catch (error) {
        return { success: false, error: 'Failed to fetch batches' };
    }
}

