"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { broadcastMessages, users, students, admissionApplicationsV2, departments, programmes } from "@/db/schema";
import { addJob } from "@/lib/queue";
import { eq, desc, inArray, sql, and } from "drizzle-orm";

export interface CentralBroadcastPayload {
    title: string;
    message: string;
    channel: "toast" | "email" | "both";
    targetType: "all" | "levels" | "departments" | "programmes" | "users" | "applicants" | "debtors" | "staff";
    levels?: string[];
    departments?: number[];
    programmes?: number[];
    userIds?: number[];
    emails?: string[];
    admissionStatus?: string[]; // e.g. ["applied", "screened", "admitted", "rejected"]
    examAttendance?: "all" | "present" | "absent";
    scheduledFor?: string | null;
}

export async function dispatchCentralBroadcast(data: CentralBroadcastPayload) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized: Please log in." };

        const userRole = (session.user as any).role || "staff";
        const senderId = parseInt(session.user.id);

        const ALLOWED_ROLES = ["admin", "superadmin", "icitify_dev", "rector", "dvc", "registrar", "bursar", "admission_officer", "dean", "hod"];
        if (!ALLOWED_ROLES.includes(userRole)) {
            return { success: false, error: "Forbidden: You do not have permission to send broadcast messages." };
        }

        let targetCriteria: any = { 
            type: data.targetType,
            senderRole: userRole,
            senderName: session.user.name || "Administrative Office"
        };

        if (data.targetType === "levels") targetCriteria.levels = data.levels || [];
        if (data.targetType === "departments") targetCriteria.departments = data.departments || [];
        if (data.targetType === "programmes") targetCriteria.programmes = data.programmes || [];
        if (data.targetType === "applicants") {
            targetCriteria.admissionStatus = data.admissionStatus || ["all"];
            if (data.examAttendance) targetCriteria.examAttendance = data.examAttendance;
            if (data.departments && data.departments.length > 0) targetCriteria.departments = data.departments;
            if (data.programmes && data.programmes.length > 0) targetCriteria.programmes = data.programmes;
        }
        if (data.targetType === "users") {
            let ids: number[] = data.userIds || [];
            let externalEmails: string[] = [];
            
            if (data.emails && data.emails.length > 0) {
                const emailUsers = await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.email, data.emails));
                ids = [...ids, ...emailUsers.map(u => u.id)];
                
                const foundEmails = emailUsers.map(u => u.email?.toLowerCase());
                externalEmails = data.emails.filter(e => !foundEmails.includes(e.toLowerCase()));
            }
            
            targetCriteria.userIds = ids;
            if (externalEmails.length > 0) {
                targetCriteria.externalEmails = externalEmails;
            }
        }

        // Handle Scheduled Date
        let delayMs: number | undefined = undefined;
        let scheduledForDate: Date | null = null;
        if (data.scheduledFor) {
            scheduledForDate = new Date(data.scheduledFor);
            const now = new Date();
            if (scheduledForDate.getTime() > now.getTime()) {
                delayMs = scheduledForDate.getTime() - now.getTime();
            }
        }

        // Insert Broadcast Entry
        const [{ insertId }] = await db.insert(broadcastMessages).values({
            senderId,
            title: data.title,
            message: data.message,
            channel: data.channel,
            targetCriteria: JSON.stringify(targetCriteria),
            status: "pending",
            scheduledFor: scheduledForDate
        });

        // Queue in BullMQ or run inline
        try {
            await addJob("SEND_BULK_MESSAGE", {
                broadcastId: insertId,
                title: data.title,
                message: data.message,
                channel: data.channel,
                targetCriteria: targetCriteria
            }, undefined, delayMs);
        } catch (queueError) {
            console.error("Redis queue unavailable, processing broadcast inline:", queueError);
            const { processBulkMessageInline } = await import("@/actions/registrar-messages");
            await processBulkMessageInline({
                broadcastId: insertId,
                title: data.title,
                message: data.message,
                channel: data.channel,
                targetCriteria: targetCriteria
            });
        }

        return { success: true, broadcastId: insertId };
    } catch (error: any) {
        console.error("[dispatchCentralBroadcast] Error:", error);
        return { success: false, error: error.message || "Failed to dispatch broadcast message" };
    }
}

export async function getCentralBroadcastHistory() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const rows = await db
            .select({
                id: broadcastMessages.id,
                title: broadcastMessages.title,
                message: broadcastMessages.message,
                channel: broadcastMessages.channel,
                targetCriteria: broadcastMessages.targetCriteria,
                totalRecipients: broadcastMessages.totalRecipients,
                status: broadcastMessages.status,
                scheduledFor: broadcastMessages.scheduledFor,
                createdAt: broadcastMessages.createdAt,
                senderName: users.name,
                senderEmail: users.email,
                senderRole: users.role
            })
            .from(broadcastMessages)
            .leftJoin(users, eq(broadcastMessages.senderId, users.id))
            .orderBy(desc(broadcastMessages.createdAt))
            .limit(100);

        const parsedData = rows.map(r => {
            let criteria: any = {};
            try {
                criteria = JSON.parse(r.targetCriteria || '{}');
            } catch (e) {}
            return {
                ...r,
                criteria
            };
        });

        return { success: true, data: parsedData };
    } catch (error: any) {
        console.error("[getCentralBroadcastHistory] Error:", error);
        return { success: false, error: error.message || "Failed to fetch broadcast history", data: [] };
    }
}

export async function getAudienceCountPreview(criteria: {
    targetType: string;
    levels?: string[];
    departments?: number[];
    programmes?: number[];
    admissionStatus?: string[];
    examAttendance?: "all" | "present" | "absent";
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, count: 0 };

        if (criteria.targetType === "all") {
            const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.status, 'active'));
            return { success: true, count: userCount?.count || 0 };
        }

        if (criteria.targetType === "staff") {
            const [staffCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.status, 'active'), inArray(users.role, ['staff', 'admin', 'bursar', 'registrar', 'librarian', 'hod', 'dean', 'admission_officer', 'dvc', 'superadmin'])));
            return { success: true, count: staffCount?.count || 0 };
        }

        if (criteria.targetType === "applicants") {
            let conditions: any[] = [];
            if (criteria.admissionStatus && criteria.admissionStatus.length > 0 && !criteria.admissionStatus.includes("all")) {
                conditions.push(inArray(admissionApplicationsV2.status, criteria.admissionStatus as any));
            }
            if (criteria.examAttendance && criteria.examAttendance !== "all") {
                conditions.push(eq(admissionApplicationsV2.examAttendanceStatus, criteria.examAttendance as any));
            }
            if (criteria.programmes && criteria.programmes.length > 0) {
                conditions.push(inArray(admissionApplicationsV2.programmeId, criteria.programmes));
            } else if (criteria.departments && criteria.departments.length > 0) {
                const deptProgs = await db.select({ id: programmes.id }).from(programmes).where(inArray(programmes.deptId, criteria.departments));
                const progIds = deptProgs.map(p => p.id);
                if (progIds.length > 0) {
                    conditions.push(inArray(admissionApplicationsV2.programmeId, progIds));
                } else {
                    conditions.push(sql`1=0`);
                }
            }
            const query = db.select({ count: sql<number>`count(*)` }).from(admissionApplicationsV2);
            const [appCount] = conditions.length > 0 ? await query.where(and(...conditions)) : await query;
            return { success: true, count: appCount?.count || 0 };
        }

        if (criteria.targetType === "levels" && criteria.levels && criteria.levels.length > 0) {
            const [stuCount] = await db.select({ count: sql<number>`count(*)` }).from(students).where(inArray(students.level, criteria.levels as any));
            return { success: true, count: stuCount?.count || 0 };
        }

        if (criteria.targetType === "departments" && criteria.departments && criteria.departments.length > 0) {
            const [stuCount] = await db.select({ count: sql<number>`count(*)` }).from(students).where(inArray(students.departmentId, criteria.departments));
            return { success: true, count: stuCount?.count || 0 };
        }

        if (criteria.targetType === "programmes" && criteria.programmes && criteria.programmes.length > 0) {
            const [stuCount] = await db.select({ count: sql<number>`count(*)` }).from(students).where(inArray(students.programmeId, criteria.programmes));
            return { success: true, count: stuCount?.count || 0 };
        }

        // Fallback default
        const [defaultCount] = await db.select({ count: sql<number>`count(*)` }).from(students);
        return { success: true, count: defaultCount?.count || 0 };
    } catch (e: any) {
        return { success: false, count: 0 };
    }
}

export async function deleteCentralBroadcastRecord(broadcastId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.delete(broadcastMessages).where(eq(broadcastMessages.id, broadcastId));
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete broadcast message:", error);
        return { success: false, error: "Failed to delete broadcast message" };
    }
}

export async function clearCentralBroadcastHistory() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.delete(broadcastMessages);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to clear broadcast history:", error);
        return { success: false, error: "Failed to clear broadcast history" };
    }
}
