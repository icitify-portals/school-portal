import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
    Heart,
    Users,
    FileText,
    ShieldCheck,
    AlertTriangle,
    ArrowRight,
    Activity,
    ClipboardList,
    Clock,
    UserCheck,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getHealthDashboardStats } from "@/actions/dashboards";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function HealthAdminDashboard() {
    const stats = await getHealthDashboardStats();

    if (!stats) {
        return (
            <div className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Failed to load dashboard data</h2>
                <p className="text-slate-500">Please check your database connection or permissions.</p>
            </div>
        );
    }

    const cards = [
        { name: "Total Students", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { name: "Health Cleared", value: stats.clearedCount, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
        { name: "Pending Review", value: stats.pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        { name: "Health Flagged", value: stats.flaggedCount, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
    ];

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic uppercase">
                        <Heart className="w-10 h-10 text-rose-600 fill-rose-600" />
                        Health Hub
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Student medical monitoring and clearance dashboard</p>
                </div>
                <Link href="/admin/health">
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl hover:shadow-slate-200">
                        Open Health Directory
                        <Search className="w-4 h-4" />
                    </button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((stat) => (
                    <Card key={stat.name} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative">
                        <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform", stat.color)}>
                            <stat.icon className="w-16 h-16" />
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={cn("p-3 rounded-xl", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.name}</span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{stat.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Reports */}
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Incoming Data</CardTitle>
                            <CardDescription className="text-xl font-black text-slate-900 uppercase italic">Recent Report Submissions</CardDescription>
                        </div>
                        <Link href="/admin/health" className="p-2 hover:bg-white rounded-xl transition-colors">
                            <ArrowRight className="w-5 h-5 text-slate-400" />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {stats.recentReports.length > 0 ? stats.recentReports.map((report) => (
                                <div key={report.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{report.title}</p>
                                            <p className="text-xs text-slate-500 font-medium">Student: <span className="text-slate-900 font-bold">{report.studentName}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block border",
                                            report.status === 'pending' ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                report.status === 'verified' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                    "bg-rose-50 border-rose-100 text-rose-600"
                                        )}>
                                            {report.status}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">{report.createdAt ? format(new Date(report.createdAt), "MMM d, HH:mm") : 'N/A'}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-12 text-center text-slate-400 italic text-sm">No recent report submissions.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Vitals */}
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Clinical Activity</CardTitle>
                            <CardDescription className="text-xl font-black text-slate-900 uppercase italic">Latest Vital Records</CardDescription>
                        </div>
                        <Activity className="w-6 h-6 text-rose-500 animate-pulse" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {stats.recentVitals.length > 0 ? stats.recentVitals.map((vital) => (
                                <div key={vital.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{vital.studentName}</p>
                                            <p className="text-xs text-slate-500 font-medium tracking-tight">Blood Pressure: <span className="text-rose-600 font-black">{vital.bp || 'N/A'}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-900 uppercase italic tracking-tighter">Recorded</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{vital.recordedAt ? format(new Date(vital.recordedAt), "MMM d, HH:mm") : 'N/A'}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-12 text-center text-slate-400 italic text-sm">No recent vital signs recorded.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Review Queue", desc: "Verify uploaded medical documents", icon: ClipboardList, color: "bg-indigo-600", href: "/admin/health" },
                    { title: "Student Directory", desc: "Search and manage student files", icon: Users, color: "bg-slate-900", href: "/admin/health" },
                    { title: "Screening Logs", desc: "View all vital sign history", icon: Activity, color: "bg-rose-600", href: "/admin/health" },
                ].map((action) => (
                    <Link key={action.title} href={action.href}>
                        <Card className="border-none shadow-sm hover:translate-y-[-4px] transition-all group cursor-pointer">
                            <CardContent className="p-6 flex items-center gap-5">
                                <div className={cn("p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform", action.color)}>
                                    <action.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 uppercase italic tracking-tight text-sm">{action.title}</h4>
                                    <p className="text-xs text-slate-500 font-medium">{action.desc}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-slate-900 transition-colors" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
