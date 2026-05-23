"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { pushSubscriptions, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Subscribe a user to push notifications
export async function subscribePush(subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Unauthorized" };

        const userId = parseInt(session.user.id);

        // Check if already subscribed with this endpoint
        const [existing] = await db.select().from(pushSubscriptions)
            .where(and(
                eq(pushSubscriptions.userId, userId),
                eq(pushSubscriptions.endpoint, subscription.endpoint)
            ))
            .limit(1);

        if (existing) return { success: true, message: "Already subscribed." };

        await db.insert(pushSubscriptions).values({
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        });

        return { success: true, message: "Push subscription saved." };
    } catch (error) {
        console.error("Push Subscribe Error:", error);
        return { error: "Failed to save push subscription." };
    }
}

// Unsubscribe from push notifications
export async function unsubscribePush(endpoint: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Unauthorized" };

        await db.delete(pushSubscriptions)
            .where(and(
                eq(pushSubscriptions.userId, parseInt(session.user.id)),
                eq(pushSubscriptions.endpoint, endpoint)
            ));

        return { success: true, message: "Push subscription removed." };
    } catch (error) {
        console.error("Push Unsubscribe Error:", error);
        return { error: "Failed to remove push subscription." };
    }
}

import webpush from 'web-push';
import config from "@/lib/config";

// Send push notification to a specific user (server-side utility)
// This would be called from other server actions when events happen
export async function sendPushToUser(userId: number, payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
}) {
    try {
        const subs = await db.select().from(pushSubscriptions)
            .where(eq(pushSubscriptions.userId, userId));

        if (subs.length === 0) return { success: true, message: "No push subscriptions for user." };

        if (!config.push.publicKey || !config.push.privateKey) {
            console.error("VAPID keys not configured.");
            return { error: "Push notification configuration missing." };
        }

        webpush.setVapidDetails(
            config.push.subject,
            config.push.publicKey,
            config.push.privateKey,
        );

        const sendPromises = subs.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    { 
                        endpoint: sub.endpoint, 
                        keys: { p256dh: sub.p256dh, auth: sub.auth } 
                    },
                    JSON.stringify(payload)
                );
            } catch (err: any) {
                // If subscription expired or invalid, remove it
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
                }
                console.error(`Error sending push to subscription ${sub.id}:`, err);
            }
        });

        await Promise.all(sendPromises);

        return { success: true, message: `Attempted to send push to ${subs.length} subscription(s).` };
    } catch (error) {
        console.error("Send Push Error:", error);
        return { error: "Failed to send push notification." };
    }
}
