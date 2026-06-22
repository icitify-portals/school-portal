"use server";

import { db } from "@/db/db";
import {
    leaveRequests,
    leaveBalances,
    staffProfiles,
    users,
    departments
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendInAppNotification } from "./notifications";

export async function getStaffProfileByUserId(userId: number) {
    const profile = await db.select({
        staff: staffProfiles,
        department: departments,
        user: users
    })
        .from(staffProfiles)
        .leftJoin(departments, eq(staffProfiles.departmentId, departments.id))
        .leftJoin(users, eq(staffProfiles.userId, users.id))
        .where(eq(staffProfiles.userId, userId))
        .limit(1);

    if (!profile[0]) {
        // Auto-heal/Self-initialize staff profile if the user has an allowed role (staff, admin, superadmin, developer)
        const [usr] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (usr && ['staff', 'superadmin', 'admin', 'icitify_dev', 'bursar', 'registrar', 'librarian', 'hod', 'dean'].includes(usr.role)) {
            await db.insert(staffProfiles).values({
                userId,
                staffId: "STF/" + Math.floor(1000 + Math.random() * 9000),
                jobTitle: ['bursar', 'registrar', 'librarian'].includes(usr.role) ? usr.role.toUpperCase() + " Admin" : usr.role === 'staff' ? "Lecturer I" : "Administrator (" + usr.role + ")",
                rank: ['bursar', 'registrar', 'librarian'].includes(usr.role) ? "Administrative Staff" : usr.role === 'staff' ? "Academic Staff" : "Management Staff",
                gradeLevel: "L1",
                isActive: true
            });

            // Re-fetch the newly created profile
            const newProfile = await db.select({
                staff: staffProfiles,
                department: departments,
                user: users
            })
                .from(staffProfiles)
                .leftJoin(departments, eq(staffProfiles.departmentId, departments.id))
                .leftJoin(users, eq(staffProfiles.userId, users.id))
                .where(eq(staffProfiles.userId, userId))
                .limit(1);

            if (newProfile[0]) {
                return {
                    ...newProfile[0].staff,
                    department: newProfile[0].department,
                    user: newProfile[0].user
                };
            }
        }
        return null;
    }
    return {
        ...profile[0].staff,
        department: profile[0].department,
        user: profile[0].user
    };
}

export async function getLeaveBalances(staffId: number) {
    const currentYear = new Date().getFullYear();
    const balance = await db.select()
        .from(leaveBalances)
        .where(and(
            eq(leaveBalances.staffId, staffId),
            eq(leaveBalances.year, currentYear)
        ))
        .limit(1);

    if (balance.length === 0) {
        // Initialize balance if not exists
        const [newBalance] = await db.insert(leaveBalances).values({
            staffId,
            year: currentYear,
            annual: 20,
            sick: 10,
            maternity: 90,
            study: 15,
            casual: 5
        });
        const created = await db.select().from(leaveBalances).where(eq(leaveBalances.id, newBalance.insertId)).limit(1);
        return created[0];
    }
    
    return {
        ...balance[0],
        annual: balance[0].annual ?? 20,
        sick: balance[0].sick ?? 10,
        maternity: balance[0].maternity ?? 90,
        study: balance[0].study ?? 15,
        casual: balance[0].casual ?? 5
    };
}

export async function submitLeaveRequest(data: {
    type: 'annual' | 'sick' | 'maternity' | 'study' | 'casual';
    startDate: string;
    endDate: string;
    reason: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const profile = await getStaffProfileByUserId(parseInt(session.user.id));
    if (!profile) return { success: false, error: "Staff profile not found" };

    try {
        await db.insert(leaveRequests).values({
            staffId: profile.id,
            type: data.type,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            reason: data.reason,
            status: 'pending'
        });

        await sendInAppNotification({
            userId: parseInt(session.user.id),
            title: "Leave Request Submitted",
            message: `Your ${data.type} leave request has been submitted and is pending approval.`,
            type: "success",
            link: "/staff/dashboard"
        });

        revalidatePath("/staff/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Leave submission error:", error);
        return { success: false, error: "Failed to submit request" };
    }
}

export async function getMyLeaveRequests() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const profile = await getStaffProfileByUserId(parseInt(session.user.id));
    if (!profile) return [];

    return await db.select()
        .from(leaveRequests)
        .where(eq(leaveRequests.staffId, profile.id))
        .orderBy(desc(leaveRequests.startDate));
}

export async function getAllLeaveRequests() {
    const results = await db.select({
        request: leaveRequests,
        staff: staffProfiles,
        user: users
    })
        .from(leaveRequests)
        .innerJoin(staffProfiles, eq(leaveRequests.staffId, staffProfiles.id))
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .orderBy(desc(leaveRequests.startDate));

    return results;
}

export async function updateLeaveStatus(requestId: number, status: 'approved' | 'rejected', comments: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await db.transaction(async (tx) => {
            // 1. Update the request
            await tx.update(leaveRequests)
                .set({
                    status,
                    comments,
                    approvedBy: parseInt(session?.user?.id || "0"),
                    approvedAt: new Date()
                })
                .where(eq(leaveRequests.id, requestId));

            // 2. If approved, deduct from balance
            if (status === 'approved') {
                const [request] = await tx.select().from(leaveRequests).where(eq(leaveRequests.id, requestId)).limit(1);
                if (!request) throw new Error("Request not found");

                const start = new Date(request.startDate);
                const end = new Date(request.endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                const balance = await getLeaveBalances(request.staffId);
                const leaveTypeKey = request.type as keyof typeof balance;
                const currentBalance = (balance as any)[leaveTypeKey] || 0;

                await tx.update(leaveBalances)
                    .set({ [leaveTypeKey]: currentBalance - diffDays })
                    .where(eq(leaveBalances.id, (balance as any).id));
            }
        });

        // 3. Send Notification
        const [requestDetails] = await db.select({ userId: staffProfiles.userId })
            .from(leaveRequests)
            .innerJoin(staffProfiles, eq(leaveRequests.staffId, staffProfiles.id))
            .where(eq(leaveRequests.id, requestId))
            .limit(1);

        if (requestDetails?.userId) {
            await sendInAppNotification({
                userId: requestDetails.userId,
                title: "Leave Request Update",
                message: `Your leave request has been ${status}. ${comments ? `Comments: ${comments}` : ''}`,
                type: status === 'approved' ? "success" : "error",
                link: "/staff/dashboard"
            });
        }

        revalidatePath("/admin/hr/leave");
        revalidatePath("/staff/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Update leave status error:", error);
        return { success: false, error: "Failed to update status" };
    }
}
