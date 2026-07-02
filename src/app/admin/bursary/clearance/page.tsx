"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    Filter,
    Search,
    ShieldCheck,
    MoreHorizontal,
    GraduationCap,
    Users,
    Activity,
    QrCode
} from "lucide-react";
import { getClearanceList, getClearanceStats, syncClearanceStatus, manuallyClearStudent } from "@/actions/clearance";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function AdminClearancePage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        setLoading(true);
        const [s, list] = await Promise.all([getClearanceStats(), getClearanceList()]);
        setStats(s);
        setStudents(list);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSync = async (id: number) => {
        setSyncing(id);
        const res = await syncClearanceStatus(id, "2025/2026", "both");
        if (res.success) {
            await fetchData();
        }
        setSyncing(null);
    };

    const handleManualClear = async (id: number) => {
        if (!session?.user) return;
        const res = await manuallyClearStudent({
            studentId: id,
            academicYear: "2025/2026",
            semester: "both",
            approvedBy: (session.user as any).id,
            notes: "Bursar manual override"
        });
        if (res.success) {
            await fetchData();
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.regNumber.includes(searchTerm)
    );

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-655/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <ShieldCheck className="w-12 h-12 text-emerald-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Financial Clearance
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Automated eligibility engine for exam admissions & registrations
                </p>
            </div>
            
            <Button 
                onClick={fetchData} 
                variant="outline" 
                className="relative z-10 h-12 px-6 rounded-[1.5rem] font-black uppercase text-xs tracking-wider border-white/20 text-white bg-white/10 hover:bg-white hover:text-slate-900 transition-all gap-2"
            >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh Statistics
            </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border border-indigo-500/25 shadow-xl shadow-indigo-500/10 bg-indigo-650 text-white rounded-[2rem] overflow-hidden relative group hover:shadow-2xl transition-all">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 opacity-25 group-hover:scale-110 transition-transform duration-500" />
                <CardContent className="p-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Total Enrollment</p>
                    <h3 className="text-4xl font-black tracking-tight">{stats?.total || 0}</h3>
                    <div className="mt-4 bg-white/20 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-white h-full transition-all duration-1000" style={{ width: `${stats?.clearedPercentage || 0}%` }} />
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-emerald-200/40 shadow-xl shadow-emerald-250/20 bg-emerald-500/10 backdrop-blur-3xl rounded-[2rem] overflow-hidden relative group hover:shadow-2xl transition-all">
                <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-650">Cleared</p>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-4xl font-black text-emerald-900 tracking-tight">{stats?.clearedCount || 0}</h3>
                    <p className="text-xs font-bold text-emerald-650 mt-2 uppercase tracking-wide">Eligible for Exam Permits</p>
                </CardContent>
            </Card>

            <Card className="border border-rose-200/40 shadow-xl shadow-rose-250/20 bg-rose-500/10 backdrop-blur-3xl rounded-[2rem] overflow-hidden relative group hover:shadow-2xl transition-all">
                <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-650">Blocked</p>
                        <XCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <h3 className="text-4xl font-black text-rose-900 tracking-tight">{stats?.blockedCount || 0}</h3>
                    <p className="text-xs font-bold text-rose-650 mt-2 uppercase tracking-wide">Insufficient Payment Level</p>
                </CardContent>
            </Card>

            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] overflow-hidden relative group hover:shadow-2xl transition-all">
                <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unprocessed</p>
                        <Activity className="w-5 h-5 text-slate-500" />
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stats?.pendingCount || 0}</h3>
                    <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-wide">Awaiting Ledger Sync</p>
                </CardContent>
            </Card>
        </div>

        {/* Student List */}
        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 lg:p-10 border-b border-white/40 bg-white/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Clearance Directory</CardTitle>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search student or matric..."
                            className="w-full pl-12 pr-4 py-3 bg-white/60 border border-white/60 rounded-[1.2rem] text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white outline-none transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-800">
                                <th className="px-8 py-6">Student Identity</th>
                                <th className="px-8 py-6">Financial Standing</th>
                                <th className="px-8 py-6">Eligibility Status</th>
                                <th className="px-8 py-6">Verification</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/40 bg-white/20">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-white/40 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="text-base font-black text-slate-800">{student.name}</p>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mt-0.5">{student.regNumber} • {student.programme}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="w-36">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-black text-slate-800">{student.percentagePaid.toFixed(0)}% Paid</span>
                                            </div>
                                            <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden shadow-inner border border-white/45">
                                                <div
                                                    className={cn(
                                                        "h-full transition-all shadow-md",
                                                        student.percentagePaid >= 100 ? "bg-gradient-to-r from-emerald-500 to-emerald-600" :
                                                            student.percentagePaid >= 70 ? "bg-gradient-to-r from-indigo-500 to-indigo-600" : "bg-gradient-to-r from-rose-500 to-rose-600"
                                                    )}
                                                    style={{ width: `${student.percentagePaid}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm inline-block",
                                            student.status === 'cleared' ? "bg-emerald-100 border-emerald-250 text-emerald-700" :
                                                student.status === 'blocked' ? "bg-rose-100 border-rose-250 text-rose-700" :
                                                    "bg-amber-100 border-amber-250 text-amber-700"
                                        )}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            {student.type === 'manual' ? (
                                                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    <span>Manual Clearance</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    <span>Auto-Sync</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="w-10 h-10 rounded-xl bg-white/80 border border-white/60 text-slate-400 hover:text-indigo-600 hover:border-indigo-400 transition-all shadow-sm active:scale-95"
                                                onClick={() => handleSync(student.id)}
                                                disabled={syncing === student.id}
                                            >
                                                <RefreshCw className={cn("w-4 h-4", syncing === student.id && "animate-spin")} />
                                            </Button>
                                            <Button
                                                onClick={() => handleManualClear(student.id)}
                                                variant="outline"
                                                className="h-10 text-[10px] font-black uppercase tracking-wider px-4 border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 rounded-xl transition-all shadow-sm active:scale-95"
                                                disabled={student.status === 'cleared'}
                                            >
                                                Manual Clear
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
