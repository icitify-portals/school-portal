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
    BarChart3,
    CheckCircle2,
    Clock,
    X,
    ExternalLink,
    Filter,
    CreditCard
} from "lucide-react";
import Link from "next/link";
import { getAdmissionV2Stats, getAdminV2Applications, getAdmissionAcademicUnits } from "@/actions/admission_v2";
import { cn } from "@/lib/utils";

export default function AdminAdmissionDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [departmentFilter, setDepartmentFilter] = useState<number | undefined>(undefined);
    const [programmeFilter, setProgrammeFilter] = useState<number | undefined>(undefined);
    const [levelFilter, setLevelFilter] = useState<string>("all");

    const [departments, setDepartments] = useState<any[]>([]);
    const [programmes, setProgrammes] = useState<any[]>([]);

    // Modal state for full user details
    const [modalTitle, setModalTitle] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalData, setModalData] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
        getAdmissionAcademicUnits().then((res) => {
            if (res.success) {
                setDepartments(res.departments || []);
                setProgrammes(res.programmes || []);
            }
        }).catch(() => {});
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        const data = await getAdmissionV2Stats();
        setStats(data);
        setLoading(false);
    };

    const handleStatCardClick = async (title: string, filters: { status?: string; paymentStatus?: string; level?: string; programmeId?: number; departmentId?: number; search?: string }) => {
        setModalTitle(title);
        setModalLoading(true);
        setModalData([]);

        try {
            const res = await getAdminV2Applications({
                ...filters,
                departmentId: filters.departmentId || departmentFilter,
                programmeId: filters.programmeId || programmeFilter,
                level: filters.level || (levelFilter !== 'all' ? levelFilter : undefined),
                pageSize: 500
            });
            setModalData(res.applications || []);
        } catch (e) {
            console.error("Failed to load applicant detail list:", e);
        } finally {
            setModalLoading(false);
        }
    };

    const filteredProgrammes = departmentFilter
        ? programmes.filter((p: any) => p.departmentId === departmentFilter || p.deptId === departmentFilter)
        : programmes;

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
            <div className="max-w-[1600px] w-full mx-auto space-y-8 text-slate-800">
                {/* Header Banner */}
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
                            Real-time statistics & applicant drill-down analytics for the 2026/2027 Session
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

                {/* Filter Controls Row */}
                <div className="p-6 bg-white/70 backdrop-blur-3xl rounded-[2.5rem] border border-white/50 shadow-xl flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 mr-2">
                        <Filter className="w-4 h-4 text-indigo-600" /> Filter View:
                    </div>

                    <select
                        value={departmentFilter || ""}
                        onChange={(e) => { setDepartmentFilter(e.target.value ? Number(e.target.value) : undefined); setProgrammeFilter(undefined); }}
                        className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Departments</option>
                        {departments.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>

                    <select
                        value={programmeFilter || ""}
                        onChange={(e) => { setProgrammeFilter(e.target.value ? Number(e.target.value) : undefined); }}
                        className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Programmes</option>
                        {filteredProgrammes.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Academic & Admin Levels</option>
                        <option value="Applicant">Applicant</option>
                        <option value="ND 1">ND 1</option>
                        <option value="ND 2">ND 2</option>
                        <option value="ND_GRADUATED">ND_GRADUATED</option>
                        <option value="HND 1">HND 1</option>
                        <option value="HND 2">HND 2</option>
                        <option value="HND_GRADUATED">HND_GRADUATED</option>
                    </select>

                    {(departmentFilter || programmeFilter || levelFilter !== 'all') && (
                        <Button
                            variant="ghost"
                            onClick={() => { setDepartmentFilter(undefined); setProgrammeFilter(undefined); setLevelFilter("all"); }}
                            className="text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl px-3 py-2"
                        >
                            Reset Filters
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <>
                        {/* Interactive Stat Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card 
                                onClick={() => handleStatCardClick("All Applicants List", {})}
                                className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-indigo-100 group-hover:bg-indigo-600 group-hover:text-white rounded-[1.5rem] text-indigo-650 transition-colors">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Applicants</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats?.totalApplicants || 0}</p>
                                        <p className="text-[9px] font-bold text-indigo-600 mt-1 flex items-center gap-1 group-hover:underline">Click for full details <ExternalLink className="w-3 h-3" /></p>
                                    </div>
                                </div>
                            </Card>

                            <Card 
                                onClick={() => handleStatCardClick("ND 1 Applicants", { level: "ND 1" })}
                                className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-amber-100 group-hover:bg-amber-600 group-hover:text-white rounded-[1.5rem] text-amber-650 transition-colors">
                                        <PieChart className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ND 1 Applicants</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats?.byLevel?.ND || 0}</p>
                                        <p className="text-[9px] font-bold text-amber-600 mt-1 flex items-center gap-1 group-hover:underline">Click for full details <ExternalLink className="w-3 h-3" /></p>
                                    </div>
                                </div>
                            </Card>

                            <Card 
                                onClick={() => handleStatCardClick("HND 1 Applicants", { level: "HND 1" })}
                                className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white rounded-[1.5rem] text-emerald-650 transition-colors">
                                        <BarChart3 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">HND 1 Applicants</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats?.byLevel?.HND || 0}</p>
                                        <p className="text-[9px] font-bold text-emerald-600 mt-1 flex items-center gap-1 group-hover:underline">Click for full details <ExternalLink className="w-3 h-3" /></p>
                                    </div>
                                </div>
                            </Card>

                            <Card 
                                onClick={() => handleStatCardClick("Admitted Applicants List", { status: "admitted" })}
                                className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-purple-100 group-hover:bg-purple-600 group-hover:text-white rounded-[1.5rem] text-purple-650 transition-colors">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Admitted Candidates</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter">View List</p>
                                        <p className="text-[9px] font-bold text-purple-600 mt-1 flex items-center gap-1 group-hover:underline">Click for full details <ExternalLink className="w-3 h-3" /></p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Applicants by Programme Table */}
                        <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem]">
                            <div className="px-8 py-6 border-b border-white/40 bg-white/40 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="w-6 h-6 text-indigo-650" />
                                    <h3 className="text-lg font-black uppercase tracking-wider text-slate-800">Applicants Breakdown by Programme</h3>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Programme Name</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Applicant Count</th>
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
                                                <tr 
                                                    key={idx} 
                                                    onClick={() => handleStatCardClick(`Applicants in ${progName}`, { search: progName })}
                                                    className="hover:bg-white/60 transition-colors group cursor-pointer"
                                                >
                                                    <td className="px-8 py-6">
                                                        <span className="text-base font-black text-slate-800 uppercase group-hover:text-indigo-700 transition-colors">
                                                            {progName}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="px-5 py-2 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-sm font-black tracking-widest shadow-sm font-mono group-hover:bg-indigo-600 group-hover:text-white transition-colors inline-flex items-center gap-2">
                                                            {String(count)} <ExternalLink className="w-3.5 h-3.5 opacity-70" />
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

            {/* Applicant Details Slide-Over Modal */}
            {modalTitle && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex justify-end p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl bg-white h-full rounded-none sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                        {/* Modal Header */}
                        <div className="p-6 sm:p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tight">{modalTitle}</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    Total Matching Records: {modalData.length}
                                </p>
                            </div>
                            <button
                                onClick={() => setModalTitle(null)}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                            {modalLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading applicant details...</p>
                                </div>
                            ) : modalData.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">
                                    No matching applicant records found.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {modalData.map((app: any) => (
                                        <div key={app.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-300 transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-base font-black text-slate-900 uppercase italic">{app.applicantName}</h4>
                                                    <span className="px-3 py-1 bg-slate-200 text-slate-800 rounded-lg text-[10px] font-mono font-bold">
                                                        #{app.formNumber || app.id}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-500">
                                                    {app.applicantEmail} • {app.applicantPhone}
                                                </p>
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                        {app.programmeName}
                                                    </span>
                                                    <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                                        {app.departmentName}
                                                    </span>
                                                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                        Acad Level: {app.academicLevel}
                                                    </span>
                                                    <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                        Admin Status: {app.administrativeLevel}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:items-end gap-2 shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                        app.status === 'admitted' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                        app.status === 'rejected' ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-700 border-slate-200"
                                                    )}>
                                                        {app.status}
                                                    </span>
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                        app.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
                                                    )}>
                                                        App Fee: {app.paymentStatus}
                                                    </span>
                                                </div>

                                                <Link href={`/admin/admission/v2`}>
                                                    <Button className="rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-black px-4 py-2 text-[10px] uppercase tracking-widest flex items-center gap-2">
                                                        View & Manage <ExternalLink className="w-3 h-3" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
