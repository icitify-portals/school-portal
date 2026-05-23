"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { subscribePush, unsubscribePush } from "@/actions/push";
import { toast } from "sonner";

export function PushSubscriptionToggle() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkSubscription = useCallback(async () => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            setIsLoading(false);
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error("Error checking push subscription:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSubscription();
    }, [checkSubscription]);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            if (isSubscribed) {
                // Unsubscribe
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                    await unsubscribePush(subscription.endpoint);
                    setIsSubscribed(false);
                    toast.success("Push notifications disabled");
                }
            } else {
                // Subscribe
                const registration = await navigator.serviceWorker.ready;
                const permission = await Notification.requestPermission();
                
                if (permission !== "granted") {
                    toast.error("Notification permission denied");
                    setIsLoading(false);
                    return;
                }

                const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!publicVapidKey) {
                    toast.error("VAPID keys not configured");
                    setIsLoading(false);
                    return;
                }

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey) as any,
                });

                const result = await subscribePush(subscription.toJSON() as any);
                if (result.success) {
                    setIsSubscribed(true);
                    toast.success("Push notifications enabled!");
                } else {
                    toast.error(result.error || "Failed to subscribe");
                }
            }
        } catch (error) {
            console.error("Push toggle error:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return null; // Browser doesn't support push
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${
                isSubscribed 
                    ? "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
            }`}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSubscribed ? (
                <BellOff className="w-4 h-4" />
            ) : (
                <Bell className="w-4 h-4" />
            )}
            {isLoading ? "Processing..." : isSubscribed ? "Disable Push Notifications" : "Enable Push Notifications"}
        </button>
    );
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
