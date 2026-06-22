"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { notifications } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";

/**
 * Fetch unread notifications for the currently logged-in user.
 * This is used for populating the bell dropdown and tracking unseen toasts.
 */
export async function getUnreadNotifications() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const userId = parseInt(session.user.id);

        const items = await db.select()
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.isRead, false)
                )
            )
            .orderBy(desc(notifications.createdAt))
            .limit(50); // Limit to recent 50 for performance

        return { success: true, data: items };
    } catch (error) {
        console.error("Failed to fetch unread notifications:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

/**
 * Marks specific notifications as 'toasted' so they don't trigger the toast popup again.
 */
export async function markAsToasted(notificationIds: number[]) {
    if (!notificationIds || notificationIds.length === 0) return { success: true };

    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const userId = parseInt(session.user.id);

        await db.update(notifications)
            .set({ isToasted: true })
            .where(
                and(
                    eq(notifications.userId, userId),
                    inArray(notifications.id, notificationIds)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Failed to mark notifications as toasted:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

/**
 * Marks a specific notification as read (e.g., when the user clicks on it in the bell menu).
 */
export async function markAsRead(notificationId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const userId = parseInt(session.user.id);

        await db.update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.id, notificationId)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

/**
 * Marks all unread notifications as read.
 */
export async function markAllAsRead() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const userId = parseInt(session.user.id);

        await db.update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.isRead, false)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Failed to mark all as read:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

/**
 * Utility function to be imported and used by other server actions to trigger an in-app notification.
 */
export async function sendInAppNotification({
    userId,
    title,
    message,
    type = "info",
    link = null,
    channel = "both"
}: {
    userId: number;
    title: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    link?: string | null;
    channel?: "toast" | "email" | "both";
}) {
    try {
        await db.insert(notifications).values({
            userId,
            title,
            message,
            type,
            link,
            channel,
            isRead: false,
            isToasted: false,
        });
        
        // Note: If channel is 'both' or 'email', integration with Resend/Nodemailer would go here.
        // Integration with web-push can also be triggered here if desired.

        return { success: true };
    } catch (error) {
        console.error("Failed to send in-app notification:", error);
        return { success: false, error: "Failed to create notification" };
    }
}
