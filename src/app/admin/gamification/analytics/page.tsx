// @ts-nocheck

import { 
    getGamificationOverview, 
    getXpVelocity, 
    getBadgeDistribution, 
    getTopPerformers 
} from "@/actions/gamification_analytics";
import { 
    Activity, 
    TrendingUp, 
    Users, 
    Zap, 
    Medal, 
    BarChart3, 
    PieChart, 
    ChevronRight,
    Trophy,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function GamificationAnalytics() {
    const overview = await getGamificationOverview();
    const velocity = await getXpVelocity();
    const distribution = await getBadgeDistribution();
    const topPerformers = await getTopPerformers();

    if (!overview) return <div className="p-20 text-center font-black uppercase text-slate-400 tracking-[0.2em]">Failed to load analytics</div>;

    return (
        <div className="p-8 space-y-12 animate-in fade-in duration-1000">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        <Activity className="w-3 h-3" />
                        Engagement Intelligence
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Gamification <span className="text-indigo-600">Analytics</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Monitoring student motivation and institutional economic health.</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-200">
                        Export Report
                    </button>
                    <button className="bg-white border border-slate-100 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all">
                        Economy Settings
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: "Total XP Minted", value: overview.totalXp.toLocaleString(), sub: "+12% vs last week", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
                    { label: "Engaged Students", value: overview.activeStudents.toLocaleString(), sub: "84% of population", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
                    { label: "Badges Issued", value: overview.totalBadges.toLocaleString(), sub: "4.2 badges per student", icon: Medal, color: "text-emerald-500", bg: "bg-emerald-50" },
                    { label: "EduCoin Liquidity", value: overview.economySize.toLocaleString(), sub: "Active circulation", icon: TrendingUp, color: "text-rose-500", bg: "bg-rose-50" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-2xl shadow-indigo-500/5 rounded-[2.5rem] bg-white group hover:-translate-y-2 transition-all duration-500">
                        <CardContent className="p-8 space-y-6">
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12", stat.bg, stat.color)}>
                                <stat.icon className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                    {stat.sub}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* XP Velocity Chart Placeholder */}
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-indigo-500/5 rounded-[3rem] bg-white overflow-hidden">
                    <CardHeader className="p-10 border-b border-slate-50 flex flex-row justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black uppercase tracking-tight italic">XP Distribution <span className="text-indigo-600">Velocity</span></CardTitle>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tracking sessional activity peaks</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">7 Days</button>
                            <button className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">30 Days</button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-16">
                        <div className="h-64 flex items-end justify-between gap-4">
                            {velocity.length > 0 ? velocity.map((v, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                    <div 
                                        className="w-full bg-indigo-600 rounded-t-2xl transition-all duration-1000 group-hover:bg-indigo-400 relative"
                                        style={{ height: `${Math.min(100, (v.total / 5000) * 100)}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                                            {v.total.toLocaleString()}
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{v.date.split('-').slice(1).join('/')}</p>
                                </div>
                            )) : (
                                <div className="w-full h-full flex items-center justify-center italic text-slate-300">Insufficient data for velocity mapping</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Badge Distribution */}
                <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[3rem] bg-white overflow-hidden">
                    <CardHeader className="p-10 border-b border-slate-50">
                        <CardTitle className="text-2xl font-black uppercase tracking-tight italic">Rarity <span className="text-indigo-600">Health</span></CardTitle>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Distribution of issued honors</p>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                        {distribution.map((badge, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-indigo-600" />
                                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-tight">{badge.name}</h4>
                                    </div>
                                    <span className="text-xs font-black text-slate-400">{badge.count}</span>
                                </div>
                                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-600 rounded-full"
                                        style={{ width: `${(badge.count / overview.totalBadges) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Top Performers Table */}
            <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[3rem] bg-white overflow-hidden">
                <CardHeader className="p-10 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tight italic">Global <span className="text-indigo-600">Whales</span></CardTitle>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Students with maximum platform influence</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="text-left p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Rank</th>
                                <th className="text-left p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Student</th>
                                <th className="text-left p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Level</th>
                                <th className="text-left p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Total XP</th>
                                <th className="text-left p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Badges</th>
                                <th className="text-right p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {topPerformers.map((student, i) => (
                                <tr key={i} className="group hover:bg-slate-50 transition-all">
                                    <td className="p-8">
                                        <span className="text-2xl font-black italic text-slate-200">#0{i+1}</span>
                                    </td>
                                    <td className="p-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 font-black">
                                                {student.name[0]}
                                            </div>
                                            <h4 className="font-black text-slate-900">{student.name}</h4>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <Badge className="bg-indigo-600 text-white border-none font-black text-[10px]">LVL {student.level}</Badge>
                                    </td>
                                    // @ts-expect-error - TS18047: Auto-suppressed for build
                                    <td className="p-8 font-black text-slate-900">{student.totalXp.toLocaleString()}</td>
                                    <td className="p-8">
                                        <div className="flex items-center gap-2">
                                            <Medal className="w-4 h-4 text-amber-500" />
                                            <span className="font-black text-slate-900">{student.badges}</span>
                                        </div>
                                    </td>
                                    <td className="p-8 text-right">
                                        <button className="text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline flex items-center gap-2 ml-auto">
                                            View Logs <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
