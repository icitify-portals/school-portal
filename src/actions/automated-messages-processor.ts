import { db } from "@/db/db";
import { automatedMessageSchedules, broadcastMessages } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { addJob } from "@/lib/queue";
import { processBulkMessageInline } from "./registrar-messages";
import { hasRole } from "@/lib/rbac";
import { auth } from "@/auth";

export async function processAutomatedMessages() {
    console.log("[Automated Messages] Starting scheduled message processor...");
    const today = new Date();
    
    // Find active schedules that apply today
    const activeSchedules = await db.select().from(automatedMessageSchedules).where(eq(automatedMessageSchedules.isActive, true));
    
    for (const schedule of activeSchedules) {
        let shouldTrigger = false;
        
        if (schedule.triggerType === "fixed_date" && schedule.triggerDate) {
            const tDate = new Date(schedule.triggerDate);
            if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear()) {
                shouldTrigger = true;
            }
        } else if (schedule.triggerType === "birthday") {
            // For birthdays, it triggers every day to find matching users
            shouldTrigger = true;
        } else if (schedule.triggerType === "custom_event") {
            // Custom logic for recurring events like holidays, handle later
            shouldTrigger = true; 
        }

        if (shouldTrigger) {
            let targetCriteria;
            try {
                targetCriteria = JSON.parse(schedule.targetCriteria);
            } catch {
                continue;
            }

            // Create a broadcast message record as 'admin' (senderId = 1)
            const [{ insertId }] = await db.insert(broadcastMessages).values({
                senderId: 1, // Assume Admin user
                title: schedule.title,
                message: schedule.messageTemplate,
                channel: "both",
                targetCriteria: JSON.stringify(targetCriteria),
                status: "pending",
            });

            // Enqueue the job for actual processing
            try {
                await addJob("SEND_BULK_MESSAGE", {
                    broadcastId: insertId,
                    title: schedule.title,
                    message: schedule.messageTemplate,
                    channel: "both",
                    targetCriteria: targetCriteria
                });
                console.log(`[Automated Messages] Queued schedule ${schedule.id} -> broadcast ${insertId}`);
            } catch (err) {
                console.error("[Automated Messages] Queue failed, processing inline...", err);
                processBulkMessageInline({
                    broadcastId: insertId,
                    title: schedule.title,
                    message: schedule.messageTemplate,
                    channel: "both",
                    targetCriteria: targetCriteria
                }).catch(console.error);
            }
        }
    }
}

export async function getAutomatedSchedules() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        
        const isAllowed = await hasRole("admin") || await hasRole("registrar") || await hasRole("superadmin");
        if (!isAllowed) {
            return { success: false, error: "Forbidden" };
        }
        
        const records = await db.select()
            .from(automatedMessageSchedules)
            .orderBy(desc(automatedMessageSchedules.createdAt))
            .limit(100);
            
        return { success: true, data: records };
    } catch (error) {
        console.error("Failed to fetch automated schedules:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

export async function createAutomatedSchedule(data: {
    title: string;
    messageTemplate: string;
    triggerType: "fixed_date" | "birthday" | "custom_event";
    triggerDate?: string;
    targetCriteria: any;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        
        const isAllowed = await hasRole("admin") || await hasRole("registrar") || await hasRole("superadmin");
        if (!isAllowed) {
            return { success: false, error: "Forbidden" };
        }
        
        let tDate: Date | null = null;
        if (data.triggerType === "fixed_date" && data.triggerDate) {
            tDate = new Date(data.triggerDate);
        }
        
        await db.insert(automatedMessageSchedules).values({
            title: data.title,
            messageTemplate: data.messageTemplate,
            triggerType: data.triggerType,
            triggerDate: tDate,
            targetCriteria: JSON.stringify(data.targetCriteria),
            isActive: true
        });
        
        return { success: true };
    } catch (error) {
        console.error("Failed to create automated schedule:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
