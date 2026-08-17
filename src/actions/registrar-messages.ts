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
    targetType: "all" | "levels" | "departments" | "programmes" | "users";
    levels?: number[];
    departments?: number[];
    programmes?: number[];
    userIds?: number[];
    scheduledFor?: string | null;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const isAllowed = await hasRole("admin") || await hasRole("registrar") || await hasRole("superadmin");
        if (!isAllowed) {
            return { success: false, error: "Forbidden: You do not have permission to send bulk messages." };
        }

        const senderId = parseInt(session.user.id);
        
        let targetCriteria: any = { type: data.targetType };
        if (data.targetType === "levels") targetCriteria.levels = data.levels;
        if (data.targetType === "departments") targetCriteria.departments = data.departments;
        if (data.targetType === "programmes") targetCriteria.programmes = data.programmes;
        if (data.targetType === "users") targetCriteria.userIds = data.userIds;

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

        // Add to bullmq queue
        await addJob("SEND_BULK_MESSAGE", {
            broadcastId: insertId,
            title: data.title,
            message: data.message,
            channel: data.channel,
            targetCriteria: targetCriteria
        }, undefined, delayMs);

        return { success: true };
    } catch (error) {
        console.error("Failed to dispatch bulk message:", error);
        return { success: false, error: "Internal Server Error" };
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
