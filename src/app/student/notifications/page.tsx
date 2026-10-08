"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Circle, MailOpen, Inbox, Megaphone, Calendar, AlertTriangle, Info, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAllNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { getAnnouncements } from "@/actions/communication";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'announcements' | 'alerts' | 'unread'>('all');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [notifRes, annData] = await Promise.all([
                getAllNotifications(1, 100),
                getAnnouncements()
            ]);

            if (notifRes.success && notifRes.data) {
                setNotifications(notifRes.data);
            }
            if (Array.isArray(annData)) {
                setAnnouncements(annData);
            }
        } catch (error) {
            console.error("Failed to fetch notifications & announcements", error);
            toast.error("Failed to load notification items");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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
        toast.success("All personal alerts marked as read");
    };

    // Combine and sort both announcements and personal notifications chronologically by post date
    const combinedItems = [
        ...announcements.map((a: any) => ({
            id: `ann-${a.id}`,
            rawId: a.id,
            kind: 'announcement' as const,
            title: a.title,
            message: a.content,
            category: a.category || 'general',
            priority: a.priority || 'normal',
            createdAt: a.createdAt,
            eventDate: a.eventDate,
            sender: a.sender?.name || 'School Administration',
            isRead: true, // announcements are public notices
            link: a.slug ? `/notices/${a.slug}` : '/notices'
        })),
        ...notifications.map((n: any) => ({
            id: `notif-${n.id}`,
            rawId: n.id,
            kind: 'notification' as const,
            title: n.title,
            message: n.message,
            category: n.type || 'info',
            priority: n.type === 'error' ? 'high' : 'normal',
            createdAt: n.createdAt,
            eventDate: null,
            sender: 'System Alert',
            isRead: !!n.isRead,
            link: n.link
        }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const filteredItems = combinedItems.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'announcements') return item.kind === 'announcement';
        if (activeTab === 'alerts') return item.kind === 'notification';
        if (activeTab === 'unread') return item.kind === 'notification' && !item.isRead;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto min-h-screen">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
                            <Bell className="w-6 h-6" />
                        </div>
                        Information & Notification Board
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">
                        Official institution bulletins, academic notices, and personalized system alerts arranged chronologically by post date.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                    {unreadCount > 0 && (
                        <Button 
                            onClick={handleMarkAllAsRead}
                            variant="outline"
                            className="bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200 hover:border-indigo-300 font-bold shadow-sm rounded-xl text-xs h-10 px-4"
                        >
                            <CheckCheck className="w-4 h-4 mr-2" /> Mark All Read
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {[
                    { key: 'all', label: 'All Updates', count: combinedItems.length },
                    { key: 'announcements', label: 'School Notices & Bulletins', count: announcements.length },
                    { key: 'alerts', label: 'Personal Alerts', count: notifications.length },
                    { key: 'unread', label: 'Unread Alerts', count: unreadCount },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={cn(
                            "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-sm",
                            activeTab === tab.key
                                ? "bg-slate-900 text-white shadow-slate-200"
                                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                        )}
                    >
                        <span>{tab.label}</span>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px]",
                            activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                        )}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content Listing */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-16 text-center text-slate-400">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                        Loading notifications & announcements...
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                            <Inbox className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-base font-black text-slate-700 uppercase tracking-wider">No Items Found</h3>
                        <p className="text-xs text-slate-400 mt-1">There are no updates in this category at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredItems.map((item) => {
                            const postDateFormatted = item.createdAt 
                                ? format(new Date(item.createdAt), 'EEEE, d MMMM yyyy • h:mm a')
                                : 'Recent';
                            const relativeTime = item.createdAt 
                                ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                                : '';

                            return (
                                <div 
                                    key={item.id} 
                                    className={cn(
                                        "p-6 sm:p-8 flex flex-col sm:flex-row gap-5 transition-colors relative group",
                                        item.kind === 'announcement'
                                            ? item.priority === 'high'
                                                ? "bg-rose-50/20 hover:bg-rose-50/30"
                                                : "hover:bg-slate-50/70"
                                            : !item.isRead 
                                                ? "bg-indigo-50/30 hover:bg-indigo-50/50" 
                                                : "hover:bg-slate-50"
                                    )}
                                >
                                    {/* Icon Badge */}
                                    <div className="shrink-0">
                                        {item.kind === 'announcement' ? (
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-md",
                                                item.priority === 'high' 
                                                    ? "bg-rose-100 text-rose-700 border border-rose-200" 
                                                    : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                            )}>
                                                <Megaphone className="w-5 h-5" />
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-md",
                                                !item.isRead
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                            )}>
                                                <Bell className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Info */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        {/* Meta & Category Header */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.kind === 'announcement' ? (
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg",
                                                    item.priority === 'high'
                                                        ? "bg-rose-600 text-white"
                                                        : "bg-slate-900 text-white"
                                                )}>
                                                    Notice &bull; {item.category}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800">
                                                    Personal Alert
                                                </span>
                                            )}

                                            {!item.isRead && (
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500 text-white">
                                                    Unread
                                                </span>
                                            )}

                                            <span className="text-xs font-bold text-slate-500">
                                                From: <strong className="text-slate-800">{item.sender}</strong>
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                                            {item.title}
                                        </h3>

                                        {/* Message Body */}
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                                            {item.message}
                                        </p>

                                        {/* Post Date details */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 pt-2 border-t border-slate-100">
                                            <span className="flex items-center gap-1.5 text-slate-600">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                Post Date: <strong className="text-slate-700">{postDateFormatted}</strong>
                                            </span>
                                            {relativeTime && (
                                                <span className="text-slate-400 font-normal">
                                                    ({relativeTime})
                                                </span>
                                            )}
                                            {item.link && (
                                                <a 
                                                    href={item.link} 
                                                    className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline ml-auto"
                                                >
                                                    View Details &rarr;
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    {item.kind === 'notification' && !item.isRead && (
                                        <div className="shrink-0 flex items-start">
                                            <button 
                                                onClick={() => handleMarkAsRead(item.rawId)}
                                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200 hover:border-indigo-200"
                                                title="Mark as read"
                                            >
                                                <MailOpen className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
