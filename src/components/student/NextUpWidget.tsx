"use client";

import { useEffect, useState } from "react";
import { Clock, BookOpen, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function NextUpWidget() {
    // In a real scenario, fetch this from the backend.
    // For now, providing a dynamic mock schedule to create urgency.
    const [timeLeft, setTimeLeft] = useState("");
    const [progress, setProgress] = useState(0);
    
    // Hardcoded example: class starts in 45 minutes
    const nextEventName = "Software Engineering (CSC 401)";
    const nextEventType = "Class";
    const totalMinutes = 60; // Just for progress bar visualization
    const [minutesRemaining, setMinutesRemaining] = useState(45);

    useEffect(() => {
        // Update countdown timer every minute
        const interval = setInterval(() => {
            setMinutesRemaining((prev) => (prev > 0 ? prev - 1 : 0));
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (minutesRemaining <= 0) {
            setTimeLeft("Started");
            setProgress(100);
        } else {
            const hours = Math.floor(minutesRemaining / 60);
            const mins = minutesRemaining % 60;
            setTimeLeft(`${hours > 0 ? hours + "h " : ""}${mins}m`);
            setProgress(Math.max(0, 100 - (minutesRemaining / totalMinutes) * 100));
        }
    }, [minutesRemaining]);

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-500/20 group hover:shadow-indigo-900/20 transition-all duration-500">
            {/* Animated glowing background */}
            <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Next Up on Schedule
                    </h3>
                    {minutesRemaining <= 15 && minutesRemaining > 0 && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full animate-pulse border border-rose-500/20">
                            <AlertCircle className="w-3 h-3" /> Starting Soon
                        </span>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none mb-2">
                            {nextEventName}
                        </h2>
                        <p className="text-indigo-200 text-sm font-medium flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-400" /> {nextEventType} • Venue: Lecture Theater 1
                        </p>
                    </div>

                    <div className="text-right shrink-0 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl group-hover:bg-white/15 transition-colors">
                        <span className="block text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Starts In</span>
                        <span className={cn(
                            "text-3xl font-black font-mono leading-none drop-shadow-md tracking-tighter",
                            minutesRemaining <= 15 ? "text-rose-400" : "text-white"
                        )}>
                            {timeLeft}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8">
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-400 to-emerald-400 rounded-full transition-all duration-1000 ease-in-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
