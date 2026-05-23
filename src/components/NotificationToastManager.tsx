"use client";

import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react";

export function NotificationToastManager() {
    const { data: session } = useSession();

    const pollNotifications = useCallback(async () => {
        if (!session?.user) return;

        try {
            const res = await fetch("/api/notifications/poll");
            if (!res.ok) return;

            const newNotifications = await res.json();
            if (newNotifications.length === 0) return;

            // Trigger Toasts
            newNotifications.forEach((n: any) => {
                const Icon = n.type === 'success' ? CheckCircle :
                    n.type === 'error' ? XCircle :
                        n.type === 'warning' ? AlertTriangle : Info;

                toast(n.title, {
                    description: n.message,
                    duration: 10000, // Show for 10 seconds
                    icon: <Icon className="w-4 h-4" />,
                });
            });

            // Mark as toasted in DB immediately
            const ids = newNotifications.map((n: any) => n.id);
            await fetch("/api/notifications/mark-read", {
                method: "POST",
                body: JSON.stringify({ ids }),
                headers: { "Content-Type": "application/json" }
            });

        } catch (error) {
            console.error("Notification polling failed:", error);
        }
    }, [session]);

    useEffect(() => {
        if (!session?.user) return;

        // Initial poll
        pollNotifications();

        // Interval poll every 30 seconds
        const interval = setInterval(pollNotifications, 30000);

        return () => clearInterval(interval);
    }, [session, pollNotifications]);

    return null; // Side-effect only component
}
