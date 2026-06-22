import { getStudentCourseAttendance } from "@/actions/attendance";
import { getAttendanceSettings } from "@/actions/settings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Calendar,
    CheckCircle2,
    XCircle,
    BarChart3,
    AlertTriangle,
    Shield,
    Clock,
    TrendingUp,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const riskColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    safe: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" },
    warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
    at_risk: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700" },
};

const riskLabels: Record<string, string> = {
    safe: "SAFE",
    warning: "WARNING",
    at_risk: "AT RISK",
};

export default async function AttendanceHistoryPage() {
    const data = await getStudentCourseAttendance();

    if ("error" in data) {
        return (
            <div className="p-6 md:p-10 max-w-[1600px] w-full mx-auto">
                <Card className="border-none shadow-xl rounded-2xl bg-red-50">
                    <CardContent className="p-8 text-center">
                        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-red-600 font-bold">{data.error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { courses, summary, settings } = data as {
        courses: any[];
        summary: { totalClasses: number; totalAttended: number; totalMissed: number; overallPercentage: number };
        settings: { safeThreshold: number; warningThreshold: number };
    };

    const overallRisk = summary.overallPercentage >= settings.safeThreshold ? 'safe'
        : summary.overallPercentage >= settings.warningThreshold ? 'warning' : 'at_risk';

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-2xl">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                            Attendance History
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Your class attendance record and risk assessment.
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-xl rounded-[1.5rem] bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-5 text-center">
                        <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <div className="text-3xl font-black text-slate-900">{summary.totalClasses}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Total Classes</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl rounded-[1.5rem] bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-5 text-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <div className="text-3xl font-black text-emerald-600">{summary.totalAttended}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Attended</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl rounded-[1.5rem] bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-5 text-center">
                        <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                        <div className="text-3xl font-black text-red-600">{summary.totalMissed}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Missed</div>
                    </CardContent>
                </Card>
                <Card className={`border-none shadow-xl rounded-[1.5rem] ${riskColors[overallRisk].bg}`}>
                    <CardContent className="p-5 text-center">
                        <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${riskColors[overallRisk].text}`} />
                        <div className={`text-3xl font-black ${riskColors[overallRisk].text}`}>{summary.overallPercentage}%</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Overall Rate</div>
                    </CardContent>
                </Card>
            </div>

            {/* Per-Course Cards */}
            {courses.length > 0 ? (
                <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Per-Course Breakdown
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.map((course: any) => {
                            const risk = riskColors[course.riskStatus] || riskColors.safe;
                            return (
                                <Card key={course.courseId} className={`border shadow-lg rounded-[1.5rem] overflow-hidden ${risk.border}`}>
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <Badge className="bg-slate-900 text-white border-none font-black uppercase text-[9px] tracking-widest px-2 py-0.5">
                                                    {course.courseCode}
                                                </Badge>
                                                <h3 className="font-black text-slate-900 text-sm mt-1.5 tracking-tight">{course.courseName}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold">{course.creditUnits} credit units</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-2xl font-black ${risk.text}`}>{course.percentage}%</div>
                                                <Badge className={`${risk.badge} border-none font-black text-[8px] uppercase tracking-widest`}>
                                                    {riskLabels[course.riskStatus]}
                                                </Badge>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${
                                                    course.riskStatus === 'safe' ? 'bg-emerald-500'
                                                    : course.riskStatus === 'warning' ? 'bg-amber-500'
                                                    : 'bg-red-500'
                                                }`}
                                                style={{ width: `${Math.min(course.percentage, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                                            <span>{course.attended}/{course.totalSessions} sessions</span>
                                            <span>{course.totalSessions - course.attended} missed</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <Card className="border-none shadow-xl rounded-2xl bg-slate-50">
                    <CardContent className="p-10 text-center space-y-3">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                        <h3 className="text-lg font-black text-slate-900 uppercase">No Attendance Records</h3>
                        <p className="text-sm text-slate-500 font-medium">
                            Attendance data will appear here once you start scanning QR codes in class.
                        </p>
                        <Link
                            href="/student/attendance"
                            className="inline-flex items-center gap-2 mt-2 text-blue-600 font-bold text-sm hover:underline"
                        >
                            Go to Scanner →
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Recent Sessions Table */}
            {courses.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Recent Sessions
                    </h2>
                    <Card className="border-none shadow-xl rounded-[1.5rem] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                                        <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Course</th>
                                        <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Check-In</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.flatMap((c: any) =>
                                        c.sessions.slice(0, 5).map((s: any, i: number) => (
                                            <tr key={`${c.courseId}-${i}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 text-xs font-bold text-slate-600">
                                                    {s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-black text-slate-900">{c.courseCode}</span>
                                                </td>
                                                <td className="p-4">
                                                    <Badge className={`border-none font-black text-[8px] uppercase ${
                                                        s.status === 'present' ? 'bg-emerald-100 text-emerald-700'
                                                        : s.status === 'late' ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {s.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-xs font-bold text-slate-500">
                                                    {s.timeIn ? new Date(s.timeIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
