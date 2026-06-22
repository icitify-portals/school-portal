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
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Financial Clearance & Permits</h1>
                    <p className="text-slate-500 font-medium">Automated eligibility engine for exam admissions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={fetchData} variant="outline" className="gap-2 border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest h-10 px-6">
                        <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} /> Refresh Stats
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-indigo-600 text-white relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="w-16 h-16" />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Enrollment</p>
                        <h3 className="text-4xl font-black tracking-tight">{stats?.total || 0}</h3>
                        <div className="mt-4 bg-white/20 h-1 rounded-full overflow-hidden">
                            <div className="bg-white h-full" style={{ width: `${stats?.clearedPercentage || 0}%` }} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-emerald-50 border border-emerald-100 group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Cleared</p>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h3 className="text-4xl font-black text-emerald-900 tracking-tight">{stats?.clearedCount || 0}</h3>
                        <p className="text-xs text-emerald-600 font-bold mt-2">Eligible for Exam Permits</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-rose-50 border border-rose-100 group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Blocked</p>
                            <XCircle className="w-4 h-4 text-rose-600" />
                        </div>
                        <h3 className="text-4xl font-black text-rose-900 tracking-tight">{stats?.blockedCount || 0}</h3>
                        <p className="text-xs text-rose-600 font-bold mt-2">Insufficient Payment Level</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-slate-50 border border-slate-100 group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unprocessed</p>
                            <Activity className="w-4 h-4 text-slate-500" />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stats?.pendingCount || 0}</h3>
                        <p className="text-xs text-slate-500 font-bold mt-2">Awaiting Ledger Sync</p>
                    </CardContent>
                </Card>
            </div>

            {/* Student List */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Student Clearance Directory</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search student or matric..."
                                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 italic">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Student Identity</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Financial Standing</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Eligibility Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Verification</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-900">{student.name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{student.regNumber} • {student.programme}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-32">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase">{student.percentagePaid.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full transition-all",
                                                            student.percentagePaid >= 100 ? "bg-emerald-500" :
                                                                student.percentagePaid >= 70 ? "bg-indigo-500" : "bg-rose-500"
                                                        )}
                                                        style={{ width: `${student.percentagePaid}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                student.status === 'cleared' ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                                                    student.status === 'blocked' ? "bg-rose-50 border-rose-200 text-rose-600" :
                                                        "bg-amber-50 border-amber-200 text-amber-600"
                                            )}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {student.type === 'manual' ? (
                                                    <div className="flex items-center gap-1.5 text-amber-600">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase">Manual</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <RefreshCw className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase">Auto-Sync</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="w-8 h-8 text-slate-400 hover:text-indigo-600 transition-colors"
                                                    onClick={() => handleSync(student.id)}
                                                    disabled={syncing === student.id}
                                                >
                                                    <RefreshCw className={cn("w-4 h-4", syncing === student.id && "animate-spin")} />
                                                </Button>
                                                <Button
                                                    onClick={() => handleManualClear(student.id)}
                                                    variant="outline"
                                                    className="h-8 text-[10px] font-black uppercase tracking-widest px-3 border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
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
    );
}
