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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
                        <Heart className="w-10 h-10 text-rose-500" />
                        Health Directory
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">Monitoring and clearance of student medical records</p>
                </div>
                <div className="relative w-full md:w-96 shadow-2xl shadow-indigo-100/50 rounded-2xl overflow-hidden">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
                        placeholder="Search student name or matric..."
                        defaultValue={search}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch((e.target as HTMLInputElement).value);
                        }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-xl rounded-[2rem] bg-indigo-600 text-white p-8 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Avg. Medical Clearance</p>
                    <h3 className="text-4xl font-black italic">{stats ? Math.round((stats.clearedCount / (stats.clearedCount + stats.flaggedCount + 1)) * 100) : '0'}%</h3>
                    <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-4/5" />
                    </div>
                </Card>
                <Card className="border-none shadow-xl rounded-[2rem] bg-white p-8 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Flagged Cases</p>
                    <h3 className="text-4xl font-black italic text-rose-500">{stats?.flaggedCount || '0'}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Requires Officer Review</p>
                </Card>
                <Card className="border-none shadow-xl rounded-[2rem] bg-white p-8 space-y-4 border-2 border-emerald-500/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Pending Appointments</p>
                    <h3 className="text-4xl font-black italic text-emerald-600">{stats?.pendingAppointments || '0'}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Action Required</p>
                </Card>
                <Card className="border-none shadow-xl rounded-[2rem] bg-white p-8 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Cleared</p>
                    <h3 className="text-4xl font-black italic text-indigo-600">{stats?.clearedCount || '0'}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Full Medical Pass</p>
                </Card>
            </div>

            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest italic border-b border-slate-50">
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
                                    <tr key={s.id} className="group hover:bg-slate-50 transition-all duration-300">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black italic border border-slate-200 uppercase">
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
                                                className="bg-indigo-600 hover:bg-black text-white px-6 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 ml-auto"
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
    );
}

export default function AdminHealthDashboard() {
    return (
        <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>}>
            <HealthDashboardContent />
        </Suspense>
    );
}
