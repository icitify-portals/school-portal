"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Circle, MailOpen, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getUnreadNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            // In a robust system, we would have an endpoint for ALL notifications (paginated), 
            // but for now we reuse the existing unread/recent fetcher and assume it returns a list.
            const result = await getUnreadNotifications();
            if (result.success && result.data) {
                setNotifications(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
            toast.error("Failed to load notifications");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: number) => {
        setNotifications((prev) => 
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        await markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
        await markAllAsRead();
        toast.success("All notifications marked as read");
    };

    const filteredNotifications = notifications.filter(n => filter === 'all' || !n.isRead);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                            <Bell className="w-6 h-6" />
                        </div>
                        Notification Center
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">
                        Stay updated with your academic alerts, announcements, and system messages.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
                        <button 
                            onClick={() => setFilter('all')}
                            className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-colors", filter === 'all' ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700")}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setFilter('unread')}
                            className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-colors", filter === 'unread' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-700")}
                        >
                            Unread
                        </button>
                    </div>
                    {notifications.some(n => !n.isRead) && (
                        <Button 
                            onClick={handleMarkAllAsRead}
                            variant="outline"
                            className="bg-white hover:bg-slate-50 text-indigo-600 border-indigo-100 hover:border-indigo-200 font-bold shadow-sm"
                        >
                            <CheckCheck className="w-4 h-4 mr-2" /> Mark All Read
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                        Loading notifications...
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Inbox className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-600">You're all caught up!</h3>
                        <p className="text-sm mt-1">No {filter === 'unread' ? 'unread ' : ''}notifications at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {filteredNotifications.map((notification) => (
                            <div 
                                key={notification.id} 
                                className={cn(
                                    "p-5 sm:p-8 flex gap-4 transition-colors relative group",
                                    !notification.isRead ? "bg-indigo-50/30 hover:bg-indigo-50/50" : "hover:bg-slate-50"
                                )}
                            >
                                <div className="shrink-0 mt-1">
                                    {!notification.isRead ? (
                                        <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                    ) : (
                                        <Circle className="w-3 h-3 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
                                        <h4 className={cn("text-base font-bold", !notification.isRead ? "text-slate-900" : "text-slate-700")}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className={cn("text-sm", !notification.isRead ? "text-slate-600 font-medium" : "text-slate-500")}>
                                        {notification.message}
                                    </p>
                                    
                                    {notification.link && (
                                        <a href={notification.link} className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                                            View Details
                                        </a>
                                    )}
                                </div>
                                
                                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                    {!notification.isRead && (
                                        <button 
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip"
                                            title="Mark as read"
                                        >
                                            <MailOpen className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
