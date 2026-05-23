
import { getStudentCourseAttendance } from "@/actions/attendance";
import { 
    Clock, 
    CheckCircle2, 
    AlertTriangle, 
    XCircle, 
    Calendar, 
    BarChart3, 
    ShieldCheck, 
    Info,
    ArrowLeft,
    Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function ChildAttendancePage({ params }: { params: { id: string } }) {
    const studentId = parseInt(params.id);
    const result = await getStudentCourseAttendance(studentId);

    if (!result || result.error) {
        return (
            <div className="p-20 text-center space-y-4">
                <AlertTriangle className="w-16 h-16 text-slate-200 mx-auto" />
                <h2 className="text-2xl font-black text-slate-900 uppercase italic">Attendance Data Unavailable</h2>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                    We could not retrieve attendance records for this student. This may be due to a lack of recorded sessions this term.
                </p>
            </div>
        );
    }

    const { 
        courses = [], 
        summary = { overallPercentage: 0, totalClasses: 0, totalAttended: 0, totalMissed: 0 }, 
        settings = { safeThreshold: 75, warningThreshold: 60 } 
    } = result;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                    <Clock className="w-3 h-3" />
                    Attendance Tracking
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
                    Lecture <span className="text-green-600">Presence</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg max-w-xl">
                    Real-time monitoring of classroom engagement. Ensure your child maintains the 75% attendance threshold required for exam eligibility.
                </p>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Overall Attendance", value: `${summary.overallPercentage}%`, icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Total Classes", value: summary.totalClasses, icon: Calendar, color: "text-slate-600", bg: "bg-slate-50" },
                    { label: "Attended", value: summary.totalAttended, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Missed", value: summary.totalMissed, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all bg-white">
                        <CardContent className="p-8 flex items-center gap-6">
                            <div className={cn("p-4 rounded-2xl", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Course Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-green-600 rounded-full" />
                        Course Performance
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {courses.map((course: any) => (
                            <div 
                                key={course.courseId} 
                                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:shadow-2xl hover:shadow-green-500/10 transition-all flex flex-col md:flex-row justify-between items-center gap-8"
                            >
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl",
                                        course.riskStatus === 'safe' ? "bg-emerald-500 shadow-emerald-100" :
                                        course.riskStatus === 'warning' ? "bg-amber-500 shadow-amber-100" : "bg-rose-500 shadow-rose-100"
                                    )}>
                                        <h4 className="text-2xl font-black uppercase italic">{course.percentage}%</h4>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-green-600 transition-colors">
                                            {course.courseName}
                                        </h3>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                                            {course.courseCode} • {course.creditUnits} Units • {course.attended}/{course.totalSessions} Sessions
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-6 md:pt-0 border-slate-50">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Status</p>
                                        <Badge className={cn(
                                            "font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-xl border-none",
                                            course.riskStatus === 'safe' ? "bg-emerald-100 text-emerald-600" :
                                            course.riskStatus === 'warning' ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
                                        )}>
                                            {course.riskStatus === 'safe' ? "Eligible" : 
                                             course.riskStatus === 'warning' ? "At Risk" : "Ineligible"}
                                        </Badge>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-green-50 transition-colors">
                                        {course.riskStatus === 'safe' ? <ShieldCheck className="w-6 h-6 text-emerald-500" /> : <AlertTriangle className="w-6 h-6 text-amber-500" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend & Guidelines */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden sticky top-8">
                        <CardHeader className="p-10 border-b border-white/10">
                            <CardTitle className="text-xl font-black uppercase italic tracking-tight">Eligibility Guidelines</CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                                        <Zap className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-xs uppercase text-white">Safe Threshold ({settings.safeThreshold}%+)</h5>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">Student is fully eligible for exams in this course.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                                        <Zap className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-xs uppercase text-white">Warning Zone ({settings.warningThreshold}% - {settings.safeThreshold}%)</h5>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">Caution! Attendance is dropping. Immediate improvement needed.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                                        <Zap className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-xs uppercase text-white">Critical Zone (Below {settings.warningThreshold}%)</h5>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">Student is currently ineligible for exams. Contact HOD.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center gap-4">
                                <Info className="w-6 h-6 text-indigo-400" />
                                <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                                    Excuse letters for medical absences must be submitted within {result.settings?.excuseWindowDays || 7} days.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
