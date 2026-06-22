"use client";

import { useState, useEffect } from "react";
import { getAnnouncements } from "@/actions/communication";
import { Megaphone, X, ChevronRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnnouncementBanner() {
    const [latest, setLatest] = useState<any>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const fetchLatest = async () => {
            const data = await getAnnouncements();
            if (data.length > 0) {
                setLatest(data[0]);
                setVisible(true);
            }
        };
        fetchLatest();
    }, []);

    if (!visible || !latest) return null;

    return (
        <div className={cn(
            "bg-indigo-600 text-white py-2 px-4 shadow-lg sticky top-12 z-[90] animate-in slide-in-from-top duration-500",
            latest.priority === 'high' ? "bg-rose-600" :
                latest.priority === 'low' ? "bg-slate-800" : "bg-indigo-600"
        )}>
            <div className="max-w-[1600px] w-full mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Megaphone className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-1.5 py-0.5 rounded">
                                {latest.priority} Notice
                            </span>
                            <h3 className="text-sm font-bold truncate">{latest.title}</h3>
                        </div>
                        <p className="text-xs text-white/80 line-clamp-1 truncate max-w-2xl">{latest.content}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button className="text-[10px] font-black uppercase tracking-widest bg-white text-indigo-900 px-4 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-100 transition-colors">
                        View Details <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => setVisible(false)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
