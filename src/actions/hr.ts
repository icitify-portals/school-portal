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
    roles,
    systemAuditLogs,
    departmentHeads,
    payrollDeductionRules,
    staffAttendance
} from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasRole, hasPermission } from "@/lib/rbac";
import { v4 as uuidv4 } from 'uuid';
import { recordTransaction } from "./accounting";
import { getBursarySettings } from "./bursary";
import { sendEmail } from "@/lib/mail";
import { getHRSettings } from "./hr_settings";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

async function ensureHRStaff() {
    const session = await auth();
    const role = (session?.user as any)?.role?.toLowerCase();
    const hasHRManage = await hasPermission("hr.staff.manage") || await hasRole("hr");
    if (!hasHRManage && !['superadmin', 'admin', 'dvc', 'bursar', 'registrar'].includes(role)) {
        throw new Error("Unauthorized: HR access required (only superadmin, vice chancellor, bursar, registrar are allowed).");
    }
}

// --- STAFF MANAGEMENT ---
export async function getStaffProfiles() {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role?.toLowerCase() || "";
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;

        const hasHRView = await hasPermission("hr.staff.view") || await hasPermission("hr.staff.manage") || await hasRole("hr");

        let scopeCondition: any = undefined;

        if (userRole === "hod" && actorId) {
            const [profile] = await db.select({ departmentId: staffProfiles.departmentId })
                .from(staffProfiles)
                .where(eq(staffProfiles.userId, actorId))
                .limit(1);
            const hodDeptId = profile?.departmentId;
            if (!hodDeptId) {
                return [];
            }
            scopeCondition = eq(staffProfiles.departmentId, hodDeptId);
        } else if (userRole === "dean" && actorId) {
            const [profile] = await db.select({ facultyId: departments.facultyId })
                .from(staffProfiles)
                .leftJoin(departments, eq(staffProfiles.departmentId, departments.id))
                .where(eq(staffProfiles.userId, actorId))
                .limit(1);
            const deanFacultyId = profile?.facultyId;
            if (!deanFacultyId) {
                return [];
            }
            const depts = await db.select({ id: departments.id })
                .from(departments)
                .where(eq(departments.facultyId, deanFacultyId));
            const deanDeptIds = depts.map(d => d.id);
            if (deanDeptIds.length === 0) {
                return [];
            }
            scopeCondition = inArray(staffProfiles.departmentId, deanDeptIds);
        } else if (!hasHRView && !["superadmin", "admin", "dvc", "bursar", "registrar", "librarian"].includes(userRole)) {
            // Unauthorized roles see nothing
            return [];
        }

        const profilesQuery = db.select().from(staffProfiles);
        const profiles = scopeCondition 
            ? await profilesQuery.where(scopeCondition)
            : await profilesQuery;

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

        const session = await auth();
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;
        if (actorId) {
            await db.insert(systemAuditLogs).values({
                actorId,
                action: 'HIRE_STAFF',
                targetId: staffId,
                details: JSON.stringify({ userId: data.userId, jobTitle: data.jobTitle, departmentId: data.departmentId, timestamp: new Date() }),
                status: 'success'
            });
        }

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
        const session = await auth();
        const userRole = (session?.user as any)?.role?.toLowerCase() || "";
        const hasLeaveAccess = await hasPermission("hr.leave.manage") || await hasPermission("hr.staff.view") || await hasPermission("hr.staff.manage") || await hasRole("hr");
        if (!hasLeaveAccess && !['superadmin', 'admin', 'dvc', 'bursar', 'registrar'].includes(userRole)) {
            return [];
        }

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
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = parseInt(session.user.id);

        const [staff] = await db.select().from(staffProfiles).where(and(eq(staffProfiles.id, data.staffId), eq(staffProfiles.userId, userId))).limit(1);
        if (!staff) return { success: false, error: "Unauthorized: Staff ID mismatch" };

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
        const session = await auth();
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;

        const profiles = await db.select().from(staffProfiles).where(eq(staffProfiles.isActive, true));
        const allUsers = await db.select().from(users);
        const structures = await getSalaryStructures();
        const rules = await db.select().from(payrollDeductionRules);
        
        // Find absent days for the month
        const attendance = await db.select().from(staffAttendance).where(
            and(
                // We should filter by month/year, but for simplicity we fetch all and filter in memory
                // or just leave it if there's no easy date extraction in Drizzle SQLite without raw SQL
            )
        ); // Will optimize in memory


        const batchId = uuidv4();
        const logs: { staff: string, amount: number }[] = [];
        const emailQueue: { to: string, name: string, amount: string, month: number, year: number }[] = [];
        const hrSettings = await getHRSettings();

        await db.transaction(async (tx) => {
            for (const profile of profiles) {
                const structure = structures.find(s => s.gradeLevel === profile.gradeLevel);
                if (!structure) continue; // Skip if no salary structure defined for this level

                let basePay = parseFloat(structure.basePay);
                let allowances = parseFloat(structure.allowances || "0");
                let standardDeductions = parseFloat(structure.deductions || "0");

                // Unpaid Leave Deduction (Absent Days)
                const monthAttendance = attendance.filter(a => {
                    const d = new Date(a.date);
                    return d.getMonth() + 1 === month && d.getFullYear() === year && a.staffId === profile.id;
                });
                const absentDays = monthAttendance.filter(a => a.status === 'absent').length;
                // Assuming 22 working days
                const dailyRate = basePay / 22;
                const unpaidLeaveDeduction = absentDays * dailyRate;

                // Statutory Deductions (PAYE, Pension)
                let statutoryDeductions = 0;
                for (const rule of rules) {
                    if (rule.type === 'percentage') {
                        statutoryDeductions += (basePay * parseFloat(rule.value as string)) / 100;
                    } else {
                        statutoryDeductions += parseFloat(rule.value as string);
                    }
                }

                const totalDeductions = standardDeductions + unpaidLeaveDeduction + statutoryDeductions;
                const netPay = basePay + allowances - totalDeductions;

                // 1. Log Employee Payroll (Pending Approval)
                await tx.insert(payrollLogs).values({
                    staffId: profile.id,
                    month,
                    year,
                    basePay: structure.basePay,
                    allowances: allowances.toFixed(2),
                    deductions: totalDeductions.toFixed(2),
                    netPay: netPay.toFixed(2),
                    status: 'pending_approval',
                    ledgerBatchId: batchId
                });

                logs.push({ staff: profile.jobTitle, amount: netPay });
            }
        });

        // 3. Send Notification to Finance
        const financeUsers = allUsers.filter(u => u.role === 'bursar' || u.role === 'admin' || u.role === 'superadmin');
        for (const user of financeUsers) {
            if (user.email) {
                emailQueue.push({
                    to: user.email,
                    name: user.name!,
                    amount: "0", // Not used in this email template but keeping structure
                    month,
                    year
                });
            }
        }

        // 3. Send Emails (Non-blocking / After transaction)
        for (const mail of emailQueue) {
            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 10px;">
                    <h2 style="color: #4f46e5; margin-bottom: 20px;">Payroll Approval Required: ${mail.month}/${mail.year}</h2>
                    <p>Hello <strong>${mail.name}</strong>,</p>
                    <p>The HR Department has generated the payroll batch for <strong>${mail.month}/${mail.year}</strong>.</p>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280;">Action Required</p>
                        <h3 style="margin: 0; color: #111827;">Please review and approve the batch to disburse funds.</h3>
                    </div>
                    <p style="font-size: 14px; color: #6b7280;">You can view the breakdown and authorize payments from the Finance Portal.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #9ca3af; text-align: center;">${hrSettings['institutional_name'] || 'Institutional School Portal'} | HR Department</p>
                </div>
            `;
            await sendEmail(
                mail.to,
                `Action Required: Approve Payroll ${mail.month}/${mail.year}`,
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
                    requiresPasswordChange: true,
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

        const session = await auth();
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;
        if (actorId) {
            await db.insert(systemAuditLogs).values({
                actorId,
                action: 'BULK_IMPORT_STAFF',
                targetId: 'SYSTEM',
                details: JSON.stringify({ count: data.length, timestamp: new Date() }),
                status: 'success'
            });
        }

        revalidatePath("/admin/hr");
        return { success: true, message: `Successfully processed ${data.length} records.` };
    } catch (error) {
        console.error("Staff Bulk Import Error:", error);
        return { success: false, error: "Failed to process bulk import. Ensure email and staff IDs are unique." };
    }
}


export async function getDeductionRules() {
    try {
        const rules = await db.select().from(payrollDeductionRules);
        return { success: true, data: rules };
    } catch (error) {
        return { success: false, error: 'Failed to fetch rules' };
    }
}

export async function saveDeductionRule(data: { name: string, type: 'fixed' | 'percentage', value: number, category: string }) {
    try {
        await db.insert(payrollDeductionRules).values({
            name: data.name,
            type: data.type,
            value: data.value.toString(),
            category: data.category
        });
        revalidatePath('/admin/hr/payroll');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to save rule' };
    }
}

export async function deleteDeductionRule(id: number) {
    try {
        await db.delete(payrollDeductionRules).where(eq(payrollDeductionRules.id, id));
        revalidatePath('/admin/hr/payroll');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete rule' };
    }
}

