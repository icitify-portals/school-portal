"use client";

import { subscribePush } from "@/actions/push";
import { useSession } from "next-auth/react";
import { useCallback, useEffect } from "react";

export function PushNotificationManager() {
    const { data: session } = useSession();

    const subscribeToPush = useCallback(async () => {
        if (!session?.user) return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

        try {
            const registration = await navigator.serviceWorker.ready;

            // Check existing subscription
            const existingSub = await registration.pushManager.getSubscription();
            if (existingSub) return; // Already subscribed

            // Check permission
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;

            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) return;

            // Subscribe
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey) as any,
            });

            // Send subscription to server via action
            const result = await subscribePush(sub.toJSON() as any);
            if (result.success) {
                console.log("Push subscription successful");
            }

        } catch (error) {
            console.warn("Push subscription failed:", error);
        }
    }, [session]);

    useEffect(() => {
        // Wait a bit before requesting push permission to not overwhelm the user
        const timer = setTimeout(subscribeToPush, 10000);
        return () => clearTimeout(timer);
    }, [subscribeToPush]);

    return null; // Side-effect only
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
