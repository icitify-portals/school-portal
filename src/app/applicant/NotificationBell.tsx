"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getUnreadNotificationCount } from "@/actions/notifications";

export function NotificationBell() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            const result = await getUnreadNotificationCount();
            if (result.success) setCount(result.count);
        };
        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span className="relative">
            <Bell className="w-4 h-4" />
            {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {count > 9 ? "9+" : count}
                </span>
            )}
        </span>
    );
}
