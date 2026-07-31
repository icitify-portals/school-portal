"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Target, CalendarDays, Award } from "lucide-react";

export function SemesterProgress() {
    // In a real scenario, calculate this from the DB's session dates
    const [progress, setProgress] = useState(0);
    const targetProgress = 65; // e.g., 65% through the semester

    useEffect(() => {
        // Animate the progress bar on load
        const timeout = setTimeout(() => setProgress(targetProgress), 500);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Semester Progress
                        </h3>
                    </div>
                    
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        First Semester, 2026/2027
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Week 9 of 14 • Examinations approach in 5 weeks.
                    </p>
                </div>

                <div className="flex-shrink-0 flex gap-4 text-center">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 px-5">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</span>
                        <span className="text-xl font-black text-emerald-600">{progress}%</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 px-5 hidden sm:block">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target CGPA</span>
                        <span className="text-xl font-black text-slate-700">4.50</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 relative z-10">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Resumption</span>
                    <span className="flex items-center gap-1">Exams <Award className="w-3 h-3 text-amber-500"/></span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-[1500ms] ease-out relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                    </div>
                </div>
                
                {/* Milestone Markers */}
                <div className="absolute bottom-0 left-0 w-full px-8 hidden sm:flex justify-between h-3 pointer-events-none opacity-50">
                    <div className="w-0.5 h-full bg-white ml-[25%]" />
                    <div className="w-0.5 h-full bg-white ml-[50%]" />
                    <div className="w-0.5 h-full bg-white ml-[75%]" />
                </div>
            </div>
        </div>
    );
}
