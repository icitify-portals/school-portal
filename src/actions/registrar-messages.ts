"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { broadcastMessages, users, students } from "@/db/schema";
import { addJob } from "@/lib/queue";
import { eq, desc } from "drizzle-orm";
import { hasRole } from "@/lib/rbac";

export async function dispatchBulkMessage(data: {
    title: string;
    message: string;
    channel: "toast" | "email" | "both";
    targetType: "all" | "levels" | "departments" | "programmes" | "users" | "staff";
    levels?: string[];
    departments?: number[];
    programmes?: number[];
    userIds?: number[];
    emails?: string[];
    scheduledFor?: string | null;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const isAllowed = await hasRole("admin") || await hasRole("registrar") || await hasRole("superadmin") || await hasRole("bursar");
        if (!isAllowed) {
            return { success: false, error: "Forbidden: You do not have permission to send bulk messages." };
        }

        const senderId = parseInt(session.user.id);
        
        let targetCriteria: any = { type: data.targetType };
        if (data.targetType === "levels") targetCriteria.levels = data.levels;
        if (data.targetType === "departments") targetCriteria.departments = data.departments;
        if (data.targetType === "programmes") targetCriteria.programmes = data.programmes;
        if (data.targetType === "users") {
            let ids: number[] = data.userIds || [];
            let externalEmails: string[] = [];
            
            if (data.emails && data.emails.length > 0) {
                const { inArray } = await import("drizzle-orm");
                const emailUsers = await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.email, data.emails));
                ids = [...ids, ...emailUsers.map(u => u.id)];
                
                // Track emails not found in the users table
                const foundEmails = emailUsers.map(u => u.email?.toLowerCase());
                externalEmails = data.emails.filter(e => !foundEmails.includes(e.toLowerCase()));
            }
            
            targetCriteria.userIds = ids;
            if (externalEmails.length > 0) {
                targetCriteria.externalEmails = externalEmails;
            }
        }

        // Calculate delay for scheduler
        let delayMs: number | undefined = undefined;
        let scheduledForDate: Date | null = null;
        
        if (data.scheduledFor) {
            scheduledForDate = new Date(data.scheduledFor);
            const now = new Date();
            if (scheduledForDate.getTime() > now.getTime()) {
                delayMs = scheduledForDate.getTime() - now.getTime();
            }
        }

        // Create broadcast record
        const [{ insertId }] = await db.insert(broadcastMessages).values({
            senderId,
            title: data.title,
            message: data.message,
            channel: data.channel,
            targetCriteria: JSON.stringify(targetCriteria),
            status: "pending",
            scheduledFor: scheduledForDate
        });

        try {
            // Add to bullmq queue
            await addJob("SEND_BULK_MESSAGE", {
                broadcastId: insertId,
                title: data.title,
                message: data.message,
                channel: data.channel,
                targetCriteria: targetCriteria
            }, undefined, delayMs);
        } catch (queueError) {
            console.error("Queue unavailable, processing inline synchronously:", queueError);
            // Fallback inline processing if Redis is down
            await processBulkMessageInline({
                broadcastId: insertId,
                title: data.title,
                message: data.message,
                channel: data.channel,
                targetCriteria: targetCriteria
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to dispatch bulk message:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

// Inline fallback processor
export async function processBulkMessageInline(jobData: any) {
    const { broadcastId, title, message, channel, targetCriteria } = jobData;
    const { sendInAppNotification } = await import('./notifications');
    const { broadcastMessages, users, students } = await import('@/db/schema');
    
    try {
        let studentIds: number[] = [];
        let externalEmails: string[] = targetCriteria.externalEmails || [];

        if (targetCriteria.type === 'users') {
            studentIds = targetCriteria.userIds || [];
        } else if (targetCriteria.type === 'staff') {
            const { inArray } = await import('drizzle-orm');
            const queryResult = await db.select({ id: users.id })
                .from(users)
                .where(inArray(users.role, ['staff', 'admin', 'bursar', 'registrar', 'librarian', 'hod', 'dean', 'admission_officer', 'dvc', 'superadmin']));
            studentIds = queryResult.map((r: any) => r.id);
        } else if (targetCriteria.type === 'applicants') {
            const { inArray, and, sql } = await import('drizzle-orm');
            const { admissionApplicationsV2 } = await import('@/db/schema');
            let appConditions: any[] = [];
            if (targetCriteria.admissionStatus && targetCriteria.admissionStatus.length > 0 && !targetCriteria.admissionStatus.includes('all')) {
                appConditions.push(inArray(admissionApplicationsV2.status, targetCriteria.admissionStatus));
            }
            const apps = await db.select({ applicantId: admissionApplicationsV2.applicantId, data: admissionApplicationsV2.data })
                .from(admissionApplicationsV2)
                .where(appConditions.length > 0 ? and(...appConditions) : sql`1=1`);

            for (const app of apps) {
                if (app.applicantId) studentIds.push(app.applicantId);
                if (app.data) {
                    try {
                        const parsed = JSON.parse(app.data);
                        if (parsed.email && !externalEmails.includes(parsed.email)) {
                            externalEmails.push(parsed.email);
                        }
                    } catch (e) {}
                }
            }
        } else if (targetCriteria.type === 'levels' && targetCriteria.levels?.length) {
            const levelStr = targetCriteria.levels[0];
            if (levelStr === 'Applicant') {
                const queryResult = await db.select({ id: users.id })
                    .from(users)
                    .where(eq(users.role, 'applicant'));
                studentIds = queryResult.map((r: any) => r.id);
            } else {
                const { and } = await import('drizzle-orm');
                let conditions: any[] = [];
                if (levelStr === 'ND_graduated') conditions.push(eq(students.status, 'nd_graduated'));
                else if (levelStr === 'HND_graduated') conditions.push(eq(students.status, 'hnd_graduated'));
                else if (levelStr === 'ND 1') { conditions.push(eq(students.status, 'active'), eq(students.currentLevel, 100), eq(students.programmeType, 'ND')); }
                else if (levelStr === 'ND 2') { conditions.push(eq(students.status, 'active'), eq(students.currentLevel, 200), eq(students.programmeType, 'ND')); }
                else if (levelStr === 'HND 1') { conditions.push(eq(students.status, 'active'), eq(students.currentLevel, 100), eq(students.programmeType, 'HND')); }
                else if (levelStr === 'HND 2') { conditions.push(eq(students.status, 'active'), eq(students.currentLevel, 200), eq(students.programmeType, 'HND')); }

                if (conditions.length > 0) {
                    const queryResult = await db.select({ userId: students.userId })
                        .from(students).where(and(...conditions));
                    studentIds = queryResult.filter((r: any) => r.userId).map((r: any) => r.userId as number);
                }
            }
        } else {
            const { inArray, and } = await import('drizzle-orm');
            let conditions = [eq(students.status, 'active')];
            if (targetCriteria.type === 'departments' && targetCriteria.departments?.length) {
                conditions.push(inArray(students.departmentId, targetCriteria.departments));
            } else if (targetCriteria.type === 'programmes' && targetCriteria.programmes?.length) {
                conditions.push(inArray(students.programmeId, targetCriteria.programmes));
            }
            const queryResult = await db.select({ userId: students.userId })
                .from(students).where(and(...conditions));
            studentIds = queryResult.filter((r: any) => r.userId).map((r: any) => r.userId as number);
        }
        
        const externalEmails: string[] = targetCriteria.externalEmails || [];
        
        if (!studentIds.length && !externalEmails.length) {
            await db.update(broadcastMessages).set({ status: 'completed', totalRecipients: 0 }).where(eq(broadcastMessages.id, broadcastId));
            return;
        }
        
        await db.update(broadcastMessages).set({ status: 'processing', totalRecipients: studentIds.length + externalEmails.length }).where(eq(broadcastMessages.id, broadcastId));
        
        for (let i = 0; i < studentIds.length; i++) {
            try {
                await sendInAppNotification({
                    userId: studentIds[i],
                    title,
                    message,
                    type: 'info',
                    channel: channel
                });
            } catch (err) {}
        }
        
        if (externalEmails.length > 0 && (channel === 'both' || channel === 'email')) {
            const { sendEmail } = await import('@/lib/mail');
            const { config } = await import('@/lib/config');
            const html = `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4f46e5;">${title}</h2>
                    <p style="font-size: 16px; color: #374151;">${message}</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #9ca3af;">This is an automated alert from your FSS Portal.</p>
                </div>`;
            for (let i = 0; i < externalEmails.length; i++) {
                try {
                    const res = await sendEmail(externalEmails[i], title, html, config.mail.from);
                    if (!res.success) {
                        console.error(`[REGISTRAR MESSAGE EMAIL ERROR] ${externalEmails[i]}:`, res.error);
                    }
                } catch (err) {
                    console.error(`[REGISTRAR MESSAGE EXCEPTION] ${externalEmails[i]}:`, err);
                }
            }
        }
        
        await db.update(broadcastMessages).set({ status: 'completed' }).where(eq(broadcastMessages.id, broadcastId));
    } catch (error) {
        console.error(`Inline Job Fatal error:`, error);
        await db.update(broadcastMessages).set({ status: 'failed' }).where(eq(broadcastMessages.id, broadcastId));
    }
}

export async function getBroadcastMessages() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        
        const isAllowed = await hasRole("admin") || await hasRole("registrar") || await hasRole("superadmin");
        if (!isAllowed) {
            return { success: false, error: "Forbidden" };
        }
        
        const records = await db.select()
            .from(broadcastMessages)
            .orderBy(desc(broadcastMessages.createdAt))
            .limit(50);
            
        return { success: true, data: records };
    } catch (error) {
        console.error("Failed to fetch broadcast messages:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

export async function deleteBroadcastMessage(broadcastId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        
        const isAllowed = await hasRole("admin") || await hasRole("registrar") || await hasRole("superadmin");
        if (!isAllowed) {
            return { success: false, error: "Forbidden" };
        }

        await db.delete(broadcastMessages).where(eq(broadcastMessages.id, broadcastId));
        return { success: true };
    } catch (error) {
        console.error("Failed to delete broadcast message:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

export async function clearBroadcastHistory() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        
        const isAllowed = await hasRole("admin") || await hasRole("registrar") || await hasRole("superadmin");
        if (!isAllowed) {
            return { success: false, error: "Forbidden" };
        }

        await db.delete(broadcastMessages);
        return { success: true };
    } catch (error) {
        console.error("Failed to clear broadcast history:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
