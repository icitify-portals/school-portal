"use server";

import { db } from "@/db/db";
import {
    staffProfiles,
    leaveRequests,
    salaryStructures,
    payrollLogs,
    users,
    departments,
    generalLedger,
    chartOfAccounts,
    userRoles,
    roles
} from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";
import { v4 as uuidv4 } from 'uuid';
import { recordTransaction } from "./accounting";
import { getBursarySettings } from "./bursary";
import { sendEmail } from "@/lib/mail";
import { getHRSettings } from "./hr_settings";
import bcrypt from "bcryptjs";

async function ensureHRStaff() {
    const isHR = await hasRole("admin"); // For now, only admin or specific HR role if added later
    const isBursar = await hasRole("bursar");
    if (!isHR && !isBursar) throw new Error("Unauthorized: HR access required");
}

// --- STAFF MANAGEMENT ---
export async function getStaffProfiles() {
    try {
        const profiles = await db.select().from(staffProfiles);
        const allUsers = await db.select().from(users);
        const allDepts = await db.select().from(departments);

        return profiles.map(p => ({
            ...p,
            user: allUsers.find(u => u.id === p.userId),
            department: allDepts.find(d => d.id === p.departmentId)
        }));
    } catch (error) {
        console.error("Failed to fetch staff profiles:", error);
        return [];
    }
}

export async function hireStaff(data: {
    userId: number;
    departmentId?: number;
    jobTitle: string;
    gradeLevel?: string;
    bankName?: string;
    accountNumber?: string;
    staffId?: string;
}) {
    try {
        await ensureHRStaff();

        const [user] = await db.select().from(users).where(eq(users.id, data.userId)).limit(1);
        if (!user) return { success: false, error: "User not found" };

        const staffId = data.staffId || `STF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const barcode = `${user.name} | ${staffId}`;

        await db.insert(staffProfiles).values({
            ...data,
            staffId,
            barcode
        });

        revalidatePath("/admin/hr");
        return { success: true };
    } catch (error) {
        console.error("Failed to hire staff:", error);
        return { success: false, error: (error as Error).message };
    }
}

// --- LEAVE MANAGEMENT ---
export async function getLeaveRequests() {
    try {
        const requests = await db.select().from(leaveRequests).orderBy(desc(leaveRequests.startDate));
        const profiles = await getStaffProfiles();
        const allUsers = await db.select().from(users);

        return requests.map(r => ({
            ...r,
            staff: profiles.find(p => p.id === r.staffId),
            approver: allUsers.find(u => u.id === r.approvedBy)
        }));
    } catch (error) {
        console.error("Failed to fetch leave requests:", error);
        return [];
    }
}

export async function submitLeaveRequest(data: {
    staffId: number;
    type: 'annual' | 'sick' | 'maternity' | 'study' | 'casual';
    startDate: Date;
    endDate: Date;
    reason?: string;
}) {
    try {
        await db.insert(leaveRequests).values(data);
        revalidatePath("/admin/hr/leave");
        return { success: true };
    } catch (error) {
        console.error("Failed to submit leave request:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function approveLeave(id: number, approverId: number) {
    try {
        await ensureHRStaff();
        await db.update(leaveRequests)
            .set({
                status: 'approved',
                approvedBy: approverId,
                approvedAt: new Date()
            })
            .where(eq(leaveRequests.id, id));
        revalidatePath("/admin/hr/leave");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve leave:", error);
        return { success: false, error: (error as Error).message };
    }
}

// --- PAYROLL ENGINE ---
export async function getSalaryStructures() {
    return await db.select().from(salaryStructures);
}

export async function processPayroll(month: number, year: number) {
    try {
        await ensureHRStaff();
        const profiles = await db.select().from(staffProfiles).where(eq(staffProfiles.isActive, true));
        const allUsers = await db.select().from(users);
        const structures = await getSalaryStructures();
        const settings = await getBursarySettings();
        const bankAcc = settings['gl_cash_bank_account'];
        const expenseAcc = settings['gl_salary_expense_account'];

        if (!bankAcc || !expenseAcc) {
            return { success: false, error: "GL accounts for payroll are not configured in Bursary Settings." };
        }

        const batchId = uuidv4();
        const logs: { staff: string, amount: number }[] = [];
        const emailQueue: { to: string, name: string, amount: string, month: number, year: number }[] = [];
        const hrSettings = await getHRSettings();

        await db.transaction(async (tx) => {
            for (const profile of profiles) {
                const structure = structures.find(s => s.gradeLevel === profile.gradeLevel);
                if (!structure) continue; // Skip if no salary structure defined for this level

                const netPay = parseFloat(structure.basePay) + parseFloat(structure.allowances || "0") - parseFloat(structure.deductions || "0");

                // 1. Log Employee Payroll
                await tx.insert(payrollLogs).values({
                    staffId: profile.id,
                    month,
                    year,
                    basePay: structure.basePay,
                    allowances: structure.allowances || "0.00",
                    deductions: structure.deductions || "0.00",
                    netPay: netPay.toFixed(2),
                    status: 'paid',
                    ledgerBatchId: batchId,
                    paidAt: new Date()
                });

                // 2. Automated GL Posting
                await tx.insert(generalLedger).values({
                    accountId: parseInt(expenseAcc),
                    description: `Payroll Disbursement: ${month}/${year} (Staff: ${profile.jobTitle})`,
                    debit: netPay.toFixed(2),
                    credit: "0.00",
                    batchId,
                    recordedBy: 1 // System
                });

                await tx.insert(generalLedger).values({
                    accountId: parseInt(bankAcc),
                    description: `Payroll Disbursement: ${month}/${year} (Staff: ${profile.jobTitle})`,
                    debit: "0.00",
                    credit: netPay.toFixed(2),
                    batchId,
                    recordedBy: 1 // System
                });

                logs.push({ staff: profile.jobTitle, amount: netPay });

                // Add to email queue
                const user = allUsers.find((u: any) => u.id === profile.userId);
                if (user?.email) {
                    emailQueue.push({
                        to: user.email,
                        name: user.name!,
                        amount: netPay.toFixed(2),
                        month,
                        year
                    });
                }
            }
        });

        // 3. Send Emails (Non-blocking / After transaction)
        for (const mail of emailQueue) {
            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 10px;">
                    <h2 style="color: #4f46e5; margin-bottom: 20px;">Monthly Payslip: ${mail.month}/${mail.year}</h2>
                    <p>Hello <strong>${mail.name}</strong>,</p>
                    <p>Your salary for <strong>${mail.month}/${mail.year}</strong> has been processed successfully.</p>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280;">Net Salary Disbursed</p>
                        <h1 style="margin: 0; color: #111827;">\u20a6${mail.amount}</h1>
                    </div>
                    <p style="font-size: 14px; color: #6b7280;">You can view and download your full breakdown from the staff portal.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #9ca3af; text-align: center;">${hrSettings['institutional_name'] || 'Institutional School Portal'} | HR Department</p>
                </div>
            `;
            await sendEmail(
                mail.to,
                `Your Payslip for ${mail.month}/${mail.year}`,
                html,
                hrSettings['sender_email'],
                hrSettings['resend_api_key']
            );
        }

        revalidatePath("/admin/hr/payroll");
        return { success: true, processed: logs.length, logs };
    } catch (error) {
        console.error("Payroll processing failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function bulkImportStaff(data: any[]) {
    try {
        await ensureHRStaff();
        const passwordHash = await bcrypt.hash("welcome123", 10);

        // 1. Get the 'staff' role ID
        const staffRole = await db.select().from(roles).where(eq(roles.name, "staff")).limit(1);
        const roleId = staffRole[0]?.id;

        await db.transaction(async (tx) => {
            for (const row of data) {
                const { name, email, jobTitle, departmentId, gradeLevel, staffId } = row;
                if (!email || !name || !jobTitle) continue;

                // Check if user exists
                const existingUser = await tx.select().from(users).where(eq(users.email, email)).limit(1);
                if (existingUser.length > 0) continue;

                // Create User
                const [newUser] = await tx.insert(users).values({
                    name,
                    email,
                    password: passwordHash,
                    role: 'staff'
                });

                // Assign granular role if it exists
                if (roleId) {
                    await tx.insert(userRoles).values({
                        userId: newUser.insertId,
                        roleId: roleId
                    });
                }

                // Create Staff Profile
                const finalStaffId = staffId || `STF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                const barcode = `${name} | ${finalStaffId}`;

                await tx.insert(staffProfiles).values({
                    userId: newUser.insertId,
                    staffId: finalStaffId,
                    departmentId: parseInt(departmentId) || null,
                    jobTitle,
                    gradeLevel: gradeLevel || "L1",
                    barcode: barcode
                });
            }
        });

        revalidatePath("/admin/hr");
        return { success: true, message: `Successfully processed ${data.length} records.` };
    } catch (error) {
        console.error("Staff Bulk Import Error:", error);
        return { success: false, error: "Failed to process bulk import. Ensure email and staff IDs are unique." };
    }
}

