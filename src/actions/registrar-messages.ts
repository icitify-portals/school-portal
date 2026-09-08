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

        // Shared resolver keeps inline processing identical to the worker and
        // to the live audience preview, using correct schema columns.
        const { resolveBroadcastRecipients } = await import("@/actions/broadcast-resolver");
        const resolved = await resolveBroadcastRecipients(targetCriteria);
        studentIds = resolved.userIds;
        externalEmails = Array.from(new Set([...externalEmails, ...resolved.emails]));
        
        if (!studentIds.length && !externalEmails.length) {
            await db.update(broadcastMessages).set({ status: 'completed', totalRecipients: 0 }).where(eq(broadcastMessages.id, broadcastId));
            return;
        }
        
        await db.update(broadcastMessages).set({ status: 'processing', totalRecipients: studentIds.length + externalEmails.length }).where(eq(broadcastMessages.id, broadcastId));
        
        // 1. High-Performance Bulk In-App Notification Insertion
        if ((channel === 'both' || channel === 'toast') && studentIds.length > 0) {
            try {
                const { notifications } = await import('@/db/schema');
                const notifValues = studentIds.map(uid => ({
                    userId: uid,
                    title,
                    message,
                    type: 'info' as const,
                    channel: channel,
                    isRead: false,
                    isToasted: false,
                }));
                
                const NOTIF_CHUNK = 250;
                for (let i = 0; i < notifValues.length; i += NOTIF_CHUNK) {
                    const chunk = notifValues.slice(i, i + NOTIF_CHUNK);
                    await db.insert(notifications).values(chunk);
                }
            } catch (notifErr) {
                console.error("[processBulkMessageInline] In-app notification bulk insert error:", notifErr);
            }
        }
        
        // 2. High-Speed Concurrent Batch Email Dispatching
        if (channel === 'both' || channel === 'email') {
            const { sendEmail } = await import('@/lib/mail');
            const { config } = await import('@/lib/config');
            const { inArray } = await import('drizzle-orm');
            
            let recipientEmails: string[] = [...externalEmails];
            if (studentIds.length > 0) {
                const dbUsers = await db.select({ email: users.email }).from(users).where(inArray(users.id, studentIds));
                for (const u of dbUsers) {
                    if (u.email && !recipientEmails.includes(u.email)) {
                        recipientEmails.push(u.email);
                    }
                }
            }

            const html = `<div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    <h2 style="color: #4f46e5; margin-top: 0;">${title}</h2>
                    <p style="font-size: 15px; color: #334155; line-height: 1.6;">${message}</p>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
                    <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from your institution's official portal.</p>
                </div>`;
            
            const EMAIL_BATCH_SIZE = 10;
            for (let i = 0; i < recipientEmails.length; i += EMAIL_BATCH_SIZE) {
                const batch = recipientEmails.slice(i, i + EMAIL_BATCH_SIZE);
                await Promise.all(batch.map(async (email) => {
                    try {
                        await sendEmail(email, title, html, config.mail.from);
                    } catch (err) {
                        console.error(`[processBulkMessageInline] Email exception ${email}:`, err);
                    }
                }));
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
