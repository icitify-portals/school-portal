"use client";

import { useState, useEffect } from "react";
import { 
    Zap, 
    Trophy, 
    Star, 
    ChevronRight,
    TrendingUp,
    Shield,
    Medal,
    Flame
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getStudentGamification } from "@/actions/gamification";
import { cn } from "@/lib/utils";

export function HeroHeader({ studentName }: { studentName: string }) {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        async function load() {
            const res = await getStudentGamification();
            setStats(res);
        }
        load();
    }, []);

    const levelProgress = stats ? (stats.currentXp / (stats.level * 1000)) * 100 : 0;

    return (
        <div className="relative bg-slate-950 rounded-[3rem] p-10 text-white overflow-hidden shadow-2xl shadow-indigo-500/10 border border-white/5">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full -mr-48 -mt-48 blur-[120px] opacity-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full -ml-32 -mb-32 blur-[100px] opacity-10" />
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-12">
                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-indigo-500/20 text-indigo-400 border-none font-black px-4 py-2 rounded-xl text-[10px] tracking-widest uppercase">
                            Academic Season 2024/2025
                        </Badge>
                        <div className="flex items-center gap-1 text-amber-400">
                            <Flame className="w-4 h-4 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{stats?.streakDays || 0} Day Streak</span>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black tracking-tighter leading-none">
                            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{studentName}</span>
                        </h1>
                        <p className="text-slate-400 font-medium italic text-lg max-w-xl">
                            "The expert in anything was once a beginner. Keep ascending, Scholar."
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-3">
                            <Shield className="w-5 h-5 text-indigo-400" />
                            <div>
                                <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Global Rank</p>
                                <p className="text-sm font-black italic">Top 12%</p>
                            </div>
                        </div>
                        <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            <div>
                                <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Growth Rate</p>
                                <p className="text-sm font-black italic">+24% Monthly</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* XP & Level Progress */}
                <div className="w-full lg:w-96 bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm group hover:border-indigo-500/50 transition-all duration-500">
                    <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Current Level</p>
                            <h3 className="text-4xl font-black italic">{stats?.level || 1}</h3>
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                            <Trophy className="w-8 h-8" />
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10 pt-8">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">XP Progress</p>
                            <p className="text-xs font-mono font-bold">{stats?.currentXp || 0} / {(stats?.level || 1) * 1000} XP</p>
                        </div>
                        <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                                style={{ width: `${levelProgress}%` }}
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-between items-center relative z-10 border-t border-white/10 mt-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="text-xl font-black tracking-tighter">{stats?.eduCoins || 0}</span>
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">EduCoins</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Medal className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                                <span className="text-xl font-black tracking-tighter">{(stats as any)?.badgeCount || 0}</span>
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Honors</span>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
}
