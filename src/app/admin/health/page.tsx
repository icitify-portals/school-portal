"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users,
    Heart,
    Search,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Activity,
    ClipboardList,
    ShieldCheck
} from "lucide-react";
import { getStudents } from "@/actions/students";
import { getHealthDashboardStats } from "@/actions/health";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

function HealthDashboardContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [students, setStudents] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const res = await getStudents({ search, page, pageSize });
        if (res.success) {
            setStudents(res.data);
            setTotalCount(res.totalCount);
        }

        const statsRes = await getHealthDashboardStats();
        if (statsRes.success) {
            setStats(statsRes.data);
        }
        setLoading(false);
    }, [search, page, pageSize]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleSearch = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set("search", value);
        else params.delete("search");
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600/30 to-purple-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Heart className="w-12 h-12 text-rose-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic">
                                    Health Directory
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Monitoring and clearance of student medical records
                            </p>
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white/10 backdrop-blur-md text-white font-bold placeholder:text-slate-400 shadow-inner"
                                placeholder="Search student name or matric..."
                                defaultValue={search}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearch((e.target as HTMLInputElement).value);
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-rose-600 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                            <CardTitle className="text-[10px] font-black text-rose-200 uppercase tracking-widest">Avg. Medical Clearance</CardTitle>
                            <div className="p-3 bg-white/20 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4">
                            <div className="text-4xl font-black tracking-tighter italic">{stats ? Math.round((stats.clearedCount / (stats.clearedCount + stats.flaggedCount + 1)) * 100) : '0'}%</div>
                            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white w-4/5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flagged Cases</CardTitle>
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="text-4xl font-black text-rose-500 tracking-tighter italic">{stats?.flaggedCount || '0'}</div>
                            <p className="text-[9px] uppercase font-bold text-slate-400 mt-2 tracking-widest italic">Requires Officer Review</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                            <CardTitle className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pending Appointments</CardTitle>
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="text-4xl font-black text-emerald-600 tracking-tighter italic">{stats?.pendingAppointments || '0'}</div>
                            <p className="text-[9px] uppercase font-bold text-slate-400 mt-2 tracking-widest italic">Action Required</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cleared</CardTitle>
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="text-4xl font-black text-indigo-600 tracking-tighter italic">{stats?.clearedCount || '0'}</div>
                            <p className="text-[9px] uppercase font-bold text-slate-400 mt-2 tracking-widest italic">Full Medical Pass</p>
                        </CardContent>
                    </Card>
                </div>

            <Card className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-[3rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-100/30 text-slate-400 text-[10px] font-black uppercase tracking-widest italic border-b border-white/40">
                                <th className="px-10 py-6">Student Information</th>
                                <th className="px-10 py-6">Status</th>
                                <th className="px-10 py-6">Programme</th>
                                <th className="px-10 py-6 text-right">Medical Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-200" />
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-20 text-center text-slate-400 font-bold italic">
                                        No students matching the criteria found.
                                    </td>
                                </tr>
                            ) : (
                                students.map((s) => (
                                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 font-black italic shadow-sm uppercase group-hover:scale-105 transition-transform">
                                                    {s.user?.name?.[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-slate-800 uppercase italic tracking-tight">{s.user?.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.matricNumber || 'NO MATRIC'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic border",
                                                s.healthStatus === 'cleared' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                    s.healthStatus === 'flagged' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                        "bg-amber-50 text-amber-600 border-amber-100"
                                            )}>
                                                {s.healthStatus || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.programme?.code || 'GEN'} • {s.currentLevel}L</span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <Button
                                                onClick={() => router.push(`/admin/health/${s.id}`)}
                                                className="bg-indigo-600 hover:bg-black text-white px-6 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2 ml-auto"
                                            >
                                                <Activity className="w-4 h-4" />
                                                Review Medicals
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <DataTablePagination
                    totalItems={totalCount}
                    pageSize={pageSize}
                    currentPage={page}
                />
            </Card>
        </div>
        </div>
    );
}

export default function AdminHealthDashboard() {
    return (
        <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>}>
            <HealthDashboardContent />
        </Suspense>
    );
}
