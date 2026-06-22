"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { getUnreadNotifications, markAsToasted, markAsRead, markAllAsRead } from "@/actions/notifications";
import Link from "next/link";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const result = await getUnreadNotifications();
            if (result.success && result.data) {
                setNotifications(result.data);

                // Handle Toasts for new untoasted notifications
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

                    // Mark as toasted in DB
                    await markAsToasted(idsToMark);
                    
                    // Update local state to prevent re-toasting before next fetch completes
                    setNotifications(prev => prev.map(n => 
                        idsToMark.includes(n.id) ? { ...n, isToasted: true } : n
                    ));
                }
            }
        } catch (error) {
            console.error("Error polling notifications:", error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        // Poll every 15 seconds
        const intervalId = setInterval(fetchNotifications, 15000);
        return () => clearInterval(intervalId);
    }, []);

    const handleMarkAsRead = async (id: number) => {
        // Optimistic UI update
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        await markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        setNotifications([]);
        await markAllAsRead();
    };

    return (
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
            <Popover.Trigger asChild>
                <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none">
                    <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {notifications.length > 99 ? "99+" : notifications.length}
                        </span>
                    )}
                </button>
            </Popover.Trigger>
            
            <Popover.Portal>
                <Popover.Content 
                    className="z-50 w-80 md:w-96 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 shadow-lg"
                    align="end"
                    sideOffset={8}
                >
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {notifications.length > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                                <CheckCheck className="w-3 h-3" />
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                You have no new notifications.
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map((notification) => (
                                    <div 
                                        key={notification.id} 
                                        className={cn(
                                            "flex items-start gap-3 border-b border-gray-50 dark:border-gray-800/50 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer",
                                            !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                                        )}
                                        onClick={() => {
                                            handleMarkAsRead(notification.id);
                                            // Handled navigation manually if there is a link
                                            if (notification.link) {
                                                window.location.href = notification.link;
                                            }
                                        }}
                                    >
                                        <div className={cn(
                                            "mt-1 flex h-2 w-2 shrink-0 rounded-full",
                                            notification.type === 'error' ? "bg-red-500" :
                                            notification.type === 'success' ? "bg-green-500" :
                                            notification.type === 'warning' ? "bg-amber-500" : "bg-blue-500"
                                        )} />
                                        <div className="flex flex-col flex-1 gap-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
