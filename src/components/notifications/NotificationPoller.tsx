"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { getUnreadNotifications, markAsToasted } from "@/actions/notifications";

export function NotificationPoller() {
    useEffect(() => {
        // Function to poll for new notifications
        const fetchNotifications = async () => {
            try {
                const result = await getUnreadNotifications();
                if (result.success && result.data && result.data.length > 0) {
                    // Filter notifications that haven't been toasted yet
                    const untoasted = result.data.filter((n) => !n.isToasted);
                    
                    if (untoasted.length > 0) {
                        const idsToMark: number[] = [];

                        untoasted.forEach((notification) => {
                            // Show toast based on type
                            if (notification.type === "error") {
                                toast.error(notification.title, { description: notification.message });
                            } else if (notification.type === "success") {
                                toast.success(notification.title, { description: notification.message });
                            } else if (notification.type === "warning") {
                                toast.warning(notification.title, { description: notification.message });
                            } else {
                                toast(notification.title, { description: notification.message });
                            }

                            idsToMark.push(notification.id);
                        });

                        // Mark these as toasted in the database so they don't show again
                        await markAsToasted(idsToMark);
                    }
                }
            } catch (error) {
                console.error("Error polling notifications:", error);
            }
        };

        // Poll immediately on mount
        fetchNotifications();

        // Then poll every 15 seconds
        const intervalId = setInterval(fetchNotifications, 15000);

        return () => clearInterval(intervalId);
    }, []);

    // This component renders nothing visible
    return null;
}
