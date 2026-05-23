import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
    BarChart3,
    Users,
    Home,
    BookOpen,
    Wallet,
    TrendingUp,
    ShieldCheck,
    Settings,
    ArrowUpRight,
    PieChart,
    Calendar,
    Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDVCDashboardStats } from "@/actions/dashboards";

export const dynamic = "force-dynamic";

export default async function DVCDashboard() {
    const stats = await getDVCDashboardStats();

    if (!stats) {
        return <div className="p-8 text-center text-rose-500">Failed to load institutional data.</div>;
    }

    const metrics = [
        { name: "Total Enrollment", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { name: "Staff Strength", value: stats.totalStaff, icon: Award, color: "text-indigo-600", bg: "bg-indigo-50" },
        { name: "Faculties", value: stats.totalFaculties, icon: Home, color: "text-rose-600", bg: "bg-rose-50" },
        { name: "Total Revenue", value: `₦${Number(stats.totalRevenue).toLocaleString()}`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 bg-slate-50/20 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic uppercase">
                        <ShieldCheck className="w-12 h-12 text-indigo-600" />
                        Provost Console
                    </h1>
                    <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs flex items-center gap-2">
                        Institutional Governance & Strategy
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-white rounded-xl shadow-sm border flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-black text-slate-700 uppercase italic">Session: 2025/2026</span>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {metrics.map((metric) => (
                    <Card key={metric.name} className="border-none shadow-xl bg-white group hover:-translate-y-2 transition-all duration-300">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn("p-4 rounded-2xl shadow-inner", metric.bg)}>
                                    <metric.icon className={cn("w-8 h-8", metric.color)} />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{metric.name}</p>
                            <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter">{metric.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Academic Overview */}
                <Card className="lg:col-span-2 border-none shadow-2xl bg-indigo-900 text-white rounded-[2.5rem] overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                        <TrendingUp className="w-64 h-64" />
                    </div>
                    <CardHeader className="p-10 pb-0">
                        <CardTitle className="text-3xl font-black italic uppercase italic tracking-tight">Academic Landscape</CardTitle>
                        <CardDescription className="text-indigo-300 font-bold uppercase tracking-widest text-xs mt-2">Programmes and Faculty Distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-12">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                            <div className="p-6 bg-indigo-800/50 rounded-3xl border border-indigo-700/50 hover:bg-indigo-800 transition-colors">
                                <p className="text-4xl font-black italic">{stats.totalProgrammes}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-2">Active Programmes</p>
                            </div>
                            <div className="p-6 bg-indigo-800/50 rounded-3xl border border-indigo-700/50 hover:bg-indigo-800 transition-colors">
                                <p className="text-4xl font-black italic">85%</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-2">Admissions Filled</p>
                            </div>
                            <div className="p-6 bg-indigo-800/50 rounded-3xl border border-indigo-700/50 hover:bg-indigo-800 transition-colors">
                                <p className="text-4xl font-black italic">94%</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-2">Result Audit Rate</p>
                            </div>
                        </div>
                        <div className="mt-12 flex gap-4">
                            <Link href="/admin/programmes">
                                <button className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform">
                                    Curriculum Audit
                                </button>
                            </Link>
                            <Link href="/admin/faculties">
                                <button className="px-8 py-4 bg-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest border border-indigo-600 hover:bg-indigo-600 transition-all">
                                    Units Review
                                </button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* System Monitoring */}
                <div className="space-y-8">
                    <Card className="border-none shadow-xl bg-white rounded-3xl">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase italic tracking-widest text-slate-400">Governance Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { name: "Institutional Settings", icon: Settings, href: "/admin/settings/portal" },
                                { name: "System Audit Logs", icon: ShieldCheck, href: "/admin/rbac" },
                                { name: "Financial Auditing", icon: BarChart3, href: "/admin/bursary" },
                            ].map((tool) => (
                                <Link key={tool.name} href={tool.href} className="block group">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group-hover:bg-slate-900 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-slate-800 group-hover:text-white transition-colors">
                                                <tool.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-black text-slate-800 uppercase italic tracking-tight group-hover:text-white">{tool.name}</span>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-emerald-600 text-white rounded-3xl overflow-hidden relative group cursor-pointer hover:bg-emerald-700 transition-colors">
                        <div className="absolute -bottom-4 -right-4 p-8 opacity-10 group-hover:scale-125 transition-transform">
                            <PieChart className="w-24 h-24" />
                        </div>
                        <CardContent className="p-8">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-2">Market Insight</p>
                            <h4 className="text-2xl font-black italic tracking-tight">Financial Health: OPTIMAL</h4>
                            <p className="text-xs font-medium text-emerald-100 mt-2">Institutional reserves and fee collections are within projected targets for the current quarter.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
