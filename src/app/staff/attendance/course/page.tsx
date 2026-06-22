"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Users,
    BookOpen,
    Search,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    UserPlus,
    Loader2,
    BarChart3,
    Download,
} from "lucide-react";
import { getCourseAttendanceSummary, manualMarkAttendance } from "@/actions/attendance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CourseOption {
    id: number;
    name: string;
    code: string;
}

export default function StaffCourseAttendancePage() {
    const [courseId, setCourseId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [manualStudentId, setManualStudentId] = useState("");
    const [manualSessionId, setManualSessionId] = useState("");
    const [markingManual, setMarkingManual] = useState(false);

    const fetchSummary = async (id: number) => {
        setLoading(true);
        setCourseId(id);
        const res = await getCourseAttendanceSummary(id);
        if (res.success) {
            setData(res);
        } else {
            toast.error(res.error || "Failed to load");
        }
        setLoading(false);
    };

    const handleManualMark = async () => {
        if (!manualSessionId || !manualStudentId) {
            toast.error("Enter both Session ID and Student ID.");
            return;
        }
        setMarkingManual(true);
        const res = await manualMarkAttendance(parseInt(manualSessionId), parseInt(manualStudentId));
        if (res.success) {
            toast.success(res.message);
            if (courseId) fetchSummary(courseId);
        } else {
            toast.error(res.error || "Failed to mark");
        }
        setMarkingManual(false);
    };

    const filteredStudents = data?.students?.filter((s: any) =>
        s.studentName?.toLowerCase().includes(search.toLowerCase()) ||
        s.matricNo?.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const riskIcons: Record<string, any> = {
        safe: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        at_risk: <XCircle className="w-4 h-4 text-red-600" />,
    };

    const riskBadges: Record<string, string> = {
        safe: "bg-emerald-100 text-emerald-700",
        warning: "bg-amber-100 text-amber-700",
        at_risk: "bg-red-100 text-red-700",
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-2xl">
                    <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                        Course Attendance
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        View per-student attendance breakdown and manually mark attendance.
                    </p>
                </div>
            </div>

            {/* Course ID Input */}
            <Card className="border-none shadow-xl rounded-2xl bg-white/80 backdrop-blur-xl">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Course ID</label>
                            <Input
                                placeholder="Enter course ID (e.g. 1)"
                                type="number"
                                className="rounded-xl h-12 font-bold"
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val) setCourseId(val);
                                }}
                            />
                        </div>
                        <Button
                            onClick={() => courseId && fetchSummary(courseId)}
                            disabled={!courseId || loading}
                            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px] gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                            Load Attendance
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {data && (
                <>
                    {/* Summary stat */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-slate-900 text-white border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">
                                {data.totalSessions} Sessions
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-700 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">
                                {data.students?.length || 0} Students
                            </Badge>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search students..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 rounded-xl h-10 w-64 font-medium"
                            />
                        </div>
                    </div>

                    {/* Manual Mark Card */}
                    <Card className="border-none shadow-lg rounded-[1.5rem] bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100">
                        <CardContent className="p-5">
                            <h3 className="font-black text-xs uppercase tracking-widest text-indigo-700 mb-3 flex items-center gap-2">
                                <UserPlus className="w-4 h-4" /> Manual Attendance Mark
                            </h3>
                            <div className="flex flex-col md:flex-row gap-3 items-end">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Session ID</label>
                                    <Input
                                        placeholder="Session ID"
                                        value={manualSessionId}
                                        onChange={(e) => setManualSessionId(e.target.value)}
                                        className="rounded-xl h-10 font-bold"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Student ID</label>
                                    <Input
                                        placeholder="Student ID"
                                        value={manualStudentId}
                                        onChange={(e) => setManualStudentId(e.target.value)}
                                        className="rounded-xl h-10 font-bold"
                                    />
                                </div>
                                <Button
                                    onClick={handleManualMark}
                                    disabled={markingManual}
                                    className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px] gap-2"
                                >
                                    {markingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Mark Present
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Students Table */}
                    <Card className="border-none shadow-xl rounded-[1.5rem] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">#</th>
                                        <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Student</th>
                                        <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Matric No</th>
                                        <th className="text-center p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Attended</th>
                                        <th className="text-center p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Total</th>
                                        <th className="text-center p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">%</th>
                                        <th className="text-center p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length > 0 ? filteredStudents.map((s: any, i: number) => (
                                        <tr key={s.studentId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 text-xs font-bold text-slate-400">{i + 1}</td>
                                            <td className="p-4 text-xs font-black text-slate-900">{s.studentName}</td>
                                            <td className="p-4 text-xs font-bold text-slate-600">{s.matricNo || '—'}</td>
                                            <td className="p-4 text-center text-xs font-black text-emerald-600">{s.attended}</td>
                                            <td className="p-4 text-center text-xs font-bold text-slate-500">{s.totalSessions}</td>
                                            <td className="p-4 text-center">
                                                <span className={cn("text-xs font-black", {
                                                    "text-emerald-600": s.riskStatus === 'safe',
                                                    "text-amber-600": s.riskStatus === 'warning',
                                                    "text-red-600": s.riskStatus === 'at_risk',
                                                })}>{s.percentage}%</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge className={cn("border-none font-black text-[8px] uppercase gap-1", riskBadges[s.riskStatus])}>
                                                    {riskIcons[s.riskStatus]}
                                                    {s.riskStatus === 'safe' ? 'SAFE' : s.riskStatus === 'warning' ? 'WARNING' : 'AT RISK'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="p-10 text-center">
                                                <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                                <p className="text-xs font-bold text-slate-400">No student data found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
