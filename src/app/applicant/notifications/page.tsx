"use client";

import { useEffect, useState } from "react";
import { getAllNotifications, getUnreadNotificationCount, markAsRead, markAllAsRead } from "@/actions/notifications";
import { Loader2, Bell, BellOff, CheckCheck, ChevronLeft, ChevronRight, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
    info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
    success: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    error: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, [page]);

    const fetchNotifications = async () => {
        setLoading(true);
        const [result, countResult] = await Promise.all([
            getAllNotifications(page, 15),
            getUnreadNotificationCount()
        ]);
        if (result.success) {
            setNotifications(result.data);
            setTotalPages(result.totalPages);
            setTotal(result.total);
        }
        if (countResult.success) {
            setUnreadCount(countResult.count);
        }
        setLoading(false);
    };

    const handleMarkAsRead = async (id: number) => {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const timeAgo = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return then.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
    };

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-wider">Notifications</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        onClick={handleMarkAllAsRead}
                        variant="ghost"
                        className="text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase tracking-widest"
                    >
                        <CheckCheck className="w-4 h-4 mr-2" /> Mark All Read
                    </Button>
                )}
            </div>

            {/* Notifications List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20">
                    <BellOff className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No notifications yet</p>
                    <p className="text-slate-600 text-xs mt-2">You'll be notified about your application status here.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => {
                        const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                        const Icon = config.icon;
                        return (
                            <div
                                key={n.id}
                                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                                    n.isRead
                                        ? "bg-slate-900/30 border-slate-800 hover:bg-slate-800/30"
                                        : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                                }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                                    <Icon className={`w-4 h-4 ${config.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`text-sm font-bold ${n.isRead ? 'text-slate-400' : 'text-white'}`}>
                                            {n.title}
                                        </h3>
                                        {!n.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        )}
                                    </div>
                                    <p className={`text-xs mt-0.5 ${n.isRead ? 'text-slate-500' : 'text-slate-300'}`}>
                                        {n.message}
                                    </p>
                                    <p className="text-[10px] text-slate-600 mt-1.5 font-bold uppercase tracking-wider">
                                        {timeAgo(n.createdAt)}
                                    </p>
                                </div>
                                {n.link && (
                                    <a
                                        href={n.link}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest shrink-0 mt-1"
                                    >
                                        View
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
                    <p className="text-xs text-slate-500 font-bold">
                        Page {page} of {totalPages} ({total} total)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
