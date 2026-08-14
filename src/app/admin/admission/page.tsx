"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    GraduationCap,
    Users,
    Activity,
    BookOpen,
    Loader2,
    PieChart,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import { getAdmissionV2Stats } from "@/actions/admission_v2";
import { cn } from "@/lib/utils";

export default function AdminAdmissionDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        const data = await getAdmissionV2Stats();
        setStats(data);
        setLoading(false);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
            <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-650/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <Activity className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                                Admission Dashboard
                            </h2>
                        </div>
                        <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                            Real-time statistics and analytics for the 2026/2027 Application Exercise
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
                        <Link href="/admin/admission/v2">
                            <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white border border-white/10 active:scale-95">
                                <Users className="w-5 h-5" />
                                Manage Applications
                            </Button>
                        </Link>
                        <Link href="/admin/admission/jamb">
                            <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-indigo-650 hover:bg-indigo-700 text-white border border-white/10 active:scale-95">
                                <GraduationCap className="w-5 h-5" />
                                JAMB Candidates
                            </Button>
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-indigo-100 rounded-[1.5rem] text-indigo-650 shadow-inner">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Applicants</p>
                                        <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats?.totalApplicants || 0}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-emerald-100 rounded-[1.5rem] text-emerald-650 shadow-inner">
                                        <BarChart3 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">HND Applicants</p>
                                        <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats?.byLevel?.HND || 0}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-amber-100 rounded-[1.5rem] text-amber-650 shadow-inner">
                                        <PieChart className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ND Applicants</p>
                                        <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats?.byLevel?.ND || 0}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem]">
                            <div className="px-8 py-6 border-b border-white/40 bg-white/40">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="w-6 h-6 text-indigo-650" />
                                    <h3 className="text-lg font-black uppercase tracking-wider text-slate-800">Applicants by Programme</h3>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Programme Name</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] w-32">Applicant Count</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/40 bg-white/20">
                                        {!stats?.byProgramme || Object.keys(stats.byProgramme).length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="px-8 py-20 text-center">
                                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No applicants found</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            Object.entries(stats.byProgramme).map(([progName, count], idx) => (
                                                <tr key={idx} className="hover:bg-white/40 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <span className="text-base font-black text-slate-800 uppercase group-hover:text-indigo-700 transition-colors">
                                                            {progName}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-4 py-1.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-sm font-black tracking-widest shadow-sm font-mono">
                                                            {String(count)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
