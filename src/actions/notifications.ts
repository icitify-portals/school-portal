"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { notifications, users } from "@/db/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/mail";
import { config } from "@/lib/config";

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
 * Fetch ALL notifications for the currently logged-in user (for inbox page).
 */
export async function getAllNotifications(page: number = 1, limit: number = 20) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const userId = parseInt(session.user.id);
        const offset = (page - 1) * limit;

        const items = await db.select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit)
            .offset(offset);

        const [countResult] = await db.select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(eq(notifications.userId, userId));

        return { 
            success: true, 
            data: items, 
            total: countResult?.count || 0,
            page,
            totalPages: Math.ceil((countResult?.count || 0) / limit)
        };
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

/**
 * Get count of unread notifications for the bell badge.
 */
export async function getUnreadNotificationCount() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: true, count: 0 };

        const userId = parseInt(session.user.id);

        const [result] = await db.select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.isRead, false)
                )
            );

        return { success: true, count: result?.count || 0 };
    } catch (error) {
        return { success: true, count: 0 };
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

        if (channel === "both" || channel === "email") {
            const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
            if (user?.email) {
                const html = `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4f46e5;">${title}</h2>
                    <p style="font-size: 16px; color: #374151;">${message}</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #9ca3af;">This is an automated alert from your FSS Portal.</p>
                </div>`;
                await sendEmail(user.email, title, html, config.mail.from);
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to send in-app notification:", error);
        return { success: false, error: "Failed to create notification" };
    }
}
