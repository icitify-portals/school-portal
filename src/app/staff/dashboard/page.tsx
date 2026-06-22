"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Calendar,
    Clock,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    Plus,
    X,
    GraduationCap,
    BookOpen,
    Users,
    Map,
    Video,
    ClipboardCheck,
    BrainCircuit,
    NotebookPen,
    Smartphone,
    ArrowUpRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
    getStaffProfileByUserId,
    getLeaveBalances,
    submitLeaveRequest,
    getMyLeaveRequests
} from "@/actions/hr_leave";
import { useSession } from "next-auth/react";
import {
    getLecturerDashboardStats,
    getHODDashboardStats,
    getDeanDashboardStats
} from "@/actions/dashboards";
import { isUserHOD, isUserDean } from "@/actions/timetable";
import { cn } from "@/lib/utils";
import { createClassSession } from "@/actions/live-class";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getTeacherDashboardData } from "@/actions/teachers";
import TeacherProgressStats from "@/components/lms/TeacherProgressStats";
import { Badge } from "@/components/ui/badge";

export default function StaffDashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState(null as any);
    const [balances, setBalances] = useState(null as any);
    const [requests, setRequests] = useState([] as any[]);
    const [loading, setLoading] = useState(true);
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStartingClass, setIsStartingClass] = useState(null as string | null);

    // Role-specific states
    const [isHOD, setIsHODState] = useState(false);
    const [isDean, setIsDeanState] = useState(false);
    const [lecturerStats, setLecturerStats] = useState(null as any);
    const [hodStats, setHodStats] = useState(null as any);
    const [deanStats, setDeanStats] = useState(null as any);
    const [k12Data, setK12Data] = useState(null as any);

    // Live Class State
    const [showStartClassDialog, setShowStartClassDialog] = useState(false);
    const [selectedCourseForLive, setSelectedCourseForLive] = useState(null as { id: number; code: string; name: string } | null);
    const [liveMode, setLiveMode] = useState('meeting' as 'meeting' | 'webinar');

    useEffect(() => {
        if (session?.user?.id) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        const userId = parseInt(session.user.id);
        const prof = await getStaffProfileByUserId(userId);

        if (prof) {
            setProfile(prof);
            const [balData, reqData, lStats, kData] = await Promise.all([
                getLeaveBalances(prof.id),
                getMyLeaveRequests(),
                getLecturerDashboardStats(prof.id),
                getTeacherDashboardData(prof.id)
            ]);
            setBalances(balData);
            setRequests(reqData);
            setLecturerStats(lStats);
            setK12Data(kData);

            // Role Checks
            if (prof.departmentId) {
                const [hodStatus, deanStatus] = await Promise.all([
                    isUserHOD(userId, prof.departmentId),
                    prof.department?.facultyId ? isUserDean(userId, prof.department.facultyId) : Promise.resolve(false)
                ]);

                setIsHODState(hodStatus);
                setIsDeanState(deanStatus);

                if (hodStatus) {
                    const hStats = await getHODDashboardStats(prof.departmentId);
                    setHodStats(hStats);
                }

                if (deanStatus && prof.department?.facultyId) {
                    const dStats = await getDeanDashboardStats(prof.department.facultyId);
                    setDeanStats(dStats);
                }
            }
        }
        setLoading(false);
    };

    const handleLeaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const res = await submitLeaveRequest({
            type: formData.get("type") as any,
            startDate: formData.get("startDate") as string,
            endDate: formData.get("endDate") as string,
            reason: formData.get("reason") as string,
        });

        if (res.success) {
            setShowLeaveForm(false);
            fetchData();
        } else {
            alert(res.error);
        }
        setIsSubmitting(false);
    };

    const handleStartClass = (courseId: number, courseCode: string, courseName: string) => {
        setSelectedCourseForLive({ id: courseId, code: courseCode, name: courseName });
        setLiveMode('meeting'); // Default
        setShowStartClassDialog(true);
    };

    const confirmStartClass = async () => {
        if (!selectedCourseForLive) return;

        setIsStartingClass(selectedCourseForLive.code);
        try {
            const result = await createClassSession(
                selectedCourseForLive.id,
                `${selectedCourseForLive.code} Live Session`,
                undefined,
                liveMode
            );
            setShowStartClassDialog(false);
            setIsStartingClass(null);
            router.push(`/live/${selectedCourseForLive.id}/${result.id}`);
        } catch (error: any) {
            toast.error(error.message);
            setIsStartingClass(null);
            setShowStartClassDialog(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600">Loading Staff Console...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md shadow-lg">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold text-slate-800">Staff Profile Not Linked</h2>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        Your user account is not currently linked to an active staff profile record. Please contact the University HR unit to configure your staff credentials.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 md:p-6 max-w-[1600px] w-full mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-800 relative">
            
            {/* 1. Header & Digital ID Bento Banner (Eliminates the bulky isolated profile card) */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-950 to-teal-950 border border-slate-200 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-5 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
                
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
                            Digital Command Center
                        </span>
                        <span className="text-emerald-600 text-xs">•</span>
                        <span className="text-xs text-slate-200 font-mono">ID: {profile.staffId}</span>
                    </div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight leading-none animate-pulse">
                        Welcome back, {session?.user?.name || "Lecturer"}
                    </h1>
                    <p className="text-sm text-slate-200 font-medium">
                        {profile.jobTitle} • {profile.rank || 'Academic Staff'} • Grade {profile.gradeLevel || 'L1'}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" className="bg-white/15 border-white/20 hover:bg-white/25 text-white rounded-xl text-xs font-bold uppercase tracking-wider h-10 px-4 flex items-center gap-2 shadow-md">
                        <Smartphone className="w-4 h-4 text-emerald-300" />
                        Digital ID
                    </Button>
                </div>
            </div>

            {/* 2. Compact Leave Balances Pill Strip (Replaces bulky full cards grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { label: "Annual Leave", key: "annual", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
                    { label: "Sick Leave", key: "sick", color: "text-rose-700", bg: "bg-rose-50 border-rose-100" },
                    { label: "Maternity", key: "maternity", color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
                    { label: "Study Leave", key: "study", color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
                    { label: "Casual Leave", key: "casual", color: "text-teal-700", bg: "bg-teal-50 border-teal-100" },
                ].map((item) => (
                    <div key={item.key} className={cn("border rounded-xl p-3.5 shadow-sm transition-all flex items-center justify-between gap-3", item.bg)}>
                        <div className="space-y-1">
                            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider leading-none">{item.label}</p>
                            <p className={cn("text-lg font-black tracking-tight leading-none mt-1", item.color)}>
                                {balances?.[item.key] ?? 0} <span className="text-[10px] text-slate-400 font-bold uppercase">Days</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Main Multi-Module Bento Board (Closes all vertical gaps) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Column 1 & 2: Main Staff Duties (Assigned Courses + Virtual Live Classes + Leave Admin) */}
                <div className="lg:col-span-2 space-y-5">
                    
                    {/* Courses & Virtual Classrooms Unified Bento Box */}
                    <Card className="bg-white border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-350 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <BookOpen className="w-5 h-5 text-emerald-600" />
                                    Virtual Classroom & Courses
                                </h3>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                    <span>Courses: <strong className="text-slate-800 font-black">{lecturerStats?.courses || 0}</strong></span>
                                    <span>Hours: <strong className="text-slate-800 font-black">{lecturerStats?.hours || 0} hrs/wk</strong></span>
                                </div>
                            </div>

                            {/* Go Live classrooms lists */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                {lecturerStats?.assignments?.length > 0 ? (
                                    lecturerStats.assignments.map((assignment: any) => (
                                        <div key={assignment.id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex items-center justify-between gap-3 text-sm group hover:border-emerald-350 transition-all">
                                            <div className="space-y-1 max-w-[150px]">
                                                <p className="font-bold text-slate-800 truncate uppercase text-sm">{assignment.courseCode}</p>
                                                <p className="text-xs text-slate-500 font-medium truncate">{assignment.courseName}</p>
                                            </div>
                                            <button
                                                disabled={isStartingClass === assignment.courseCode}
                                                onClick={() => handleStartClass(assignment.courseId, assignment.courseCode, assignment.courseName)}
                                                className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 font-bold py-1.5 px-3.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                                            >
                                                {isStartingClass === assignment.courseCode ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <>Go Live <ArrowUpRight className="w-3.5 h-3.5" /></>
                                                )}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-500 italic py-2 col-span-2 text-center">No assigned courses found.</p>
                                )}
                            </div>
                        </div>

                        <Link href="/staff/courses">
                            <button className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all mt-4">
                                Manage My Course Catalog
                            </button>
                        </Link>
                    </Card>

                    {/* Role-Specific Admin Card (Unified HOD and Dean side-by-side to save spaces) */}
                    {(isHOD || isDean || (session?.user as any)?.role === 'admin') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            
                            {/* HOD Card */}
                            {(isHOD || (session?.user as any)?.role === 'admin') && (
                                <Card className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all border-l-4 border-l-amber-500">
                                    <div>
                                        <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                            <Users className="w-4.5 h-4.5" />
                                            Dept. Admin (HOD)
                                        </h4>
                                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 text-xs space-y-2 mb-4">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Department Staff:</span>
                                                <span className="font-bold text-slate-800">{hodStats?.staffCount || 0} Lecturers</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Timetable Status:</span>
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded text-[10px] font-bold capitalize border",
                                                    hodStats?.submissionStatus === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                    hodStats?.submissionStatus === 'pending_approval' ? "bg-amber-50 text-amber-700 border-amber-250" : "bg-slate-100 text-slate-650 border-slate-200"
                                                )}>
                                                    {hodStats?.submissionStatus || 'Draft'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link href="/admin/hod">
                                        <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all">
                                            Department Command Desk
                                        </button>
                                    </Link>
                                </Card>
                             )}
 
                             {/* Dean Card */}
                             {(isDean || (session?.user as any)?.role === 'admin') && (
                                 <Card className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all border-l-4 border-l-emerald-600">
                                     <div>
                                         <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                             <Map className="w-4.5 h-4.5" />
                                             Faculty Governance (Dean)
                                         </h4>
                                         <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 text-xs space-y-2 mb-4">
                                             <div className="flex justify-between">
                                                 <span className="text-slate-500">Approved Timetables:</span>
                                                 <span className="font-bold text-slate-800">{deanStats?.approvedCount || 0} / {deanStats?.totalDepartments || 0}</span>
                                             </div>
                                             <div className="flex justify-between">
                                                 <span className="text-slate-500">Awaiting Decision:</span>
                                                 <span className="font-bold text-amber-600">{deanStats?.pendingCount || 0} Departments</span>
                                             </div>
                                         </div>
                                     </div>
                                     <Link href="/admin/dean">
                                         <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all">
                                             Dean's Governance Boardroom
                                         </button>
                                     </Link>
                                 </Card>
                             )}
                        </div>
                    )}

                    {/* Leave Requests Administration Dashboard */}
                    <Card className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Clock className="w-5 h-5 text-emerald-600" />
                                My Leave Requests
                            </h3>
                            <button
                                onClick={() => setShowLeaveForm(true)}
                                className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs flex items-center gap-1 transition-all shadow-sm"
                            >
                                <Plus className="w-3.5 h-3.5" /> Request Leave
                            </button>
                        </div>

                        <div className="overflow-x-auto border border-slate-100 rounded-xl">
                            <table className="w-full border-collapse text-xs text-left bg-white">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                        <th className="p-3.5">Status</th>
                                        <th className="p-3.5">Leave Type</th>
                                        <th className="p-3.5">Period Details</th>
                                        <th className="p-3.5 text-center">Days</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((req) => {
                                        const start = new Date(req.startDate);
                                        const end = new Date(req.endDate);
                                        const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                        return (
                                            <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <td className="p-3.5">
                                                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                                                        {req.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                                                        {req.status === 'approved' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                                        {req.status === 'rejected' && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                                                        <span className={cn(
                                                            req.status === 'pending' ? "text-amber-600" :
                                                            req.status === 'approved' ? "text-emerald-600" : "text-rose-600"
                                                        )}>
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3.5 capitalize font-bold text-slate-700">{req.type}</td>
                                                <td className="p-3.5 text-slate-500 font-mono text-xs">
                                                    {start.toLocaleDateString('en-GB')} - {end.toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="p-3.5 text-center font-black text-slate-800">{days}</td>
                                            </tr>
                                        );
                                    })}
                                    {requests.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-6 text-center text-slate-400 italic">No leave applications registered.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Column 3: Navigation Console & Progress (Highly compact actions grid, closes open spaces) */}
                <div className="space-y-5">
                    
                    {/* Academic Console Links: re-arranged in 2-column small bento tiles */}
                    <Card className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                            Academic Console
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Timetable", icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100/40 hover:border-emerald-250", link: "/admin/academics/timetable" },
                                { label: "Result Grading", icon: ClipboardCheck, color: "text-emerald-600", bg: "bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100/40 hover:border-emerald-200", link: "/staff/results" },
                                { label: "Assignments", icon: FileText, color: "text-blue-600", bg: "bg-blue-50/50 hover:bg-blue-50 border-blue-100/40 hover:border-blue-200", link: "/staff/assignments" },
                                { label: "CBT Quizzes", icon: BrainCircuit, color: "text-purple-600", bg: "bg-purple-50/50 hover:bg-purple-50 border-purple-100/40 hover:border-purple-200", link: "/staff/quizzes" },
                                { label: "Lesson Notes", icon: NotebookPen, color: "text-amber-600", bg: "bg-amber-50/50 hover:bg-amber-50 border-amber-100/40 hover:border-amber-200", link: "/staff/notes" },
                                { 
                                    label: "Note Approvals", 
                                    icon: CheckCircle, 
                                    color: "text-cyan-600", 
                                    bg: "bg-cyan-50/50 hover:bg-cyan-50 border-cyan-100/40 hover:border-cyan-200", 
                                    link: "/staff/notes/approvals", 
                                    show: isHOD || isDean || (session?.user as any)?.role === 'admin' 
                                },
                            ].filter(m => m.show !== false).map((mod) => (
                                <Link href={mod.link} key={mod.label}>
                                    <div className={cn("border rounded-xl p-3.5 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-sm active:scale-95 group", mod.bg)}>
                                        <mod.icon className={cn("w-5.5 h-5.5 mb-2 transition-transform group-hover:scale-110", mod.color)} />
                                        <span className="text-xs font-bold text-slate-800 tracking-tight uppercase leading-none">{mod.label}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </Card>

                    {/* K-12 Work Completion Stats (Closes spaces on right side) */}
                    {k12Data && (k12Data.classes?.length > 0 || k12Data.subjects?.length > 0) && (
                        <Card className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-650" />
                                    Completion Stats
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Active: {k12Data.sessionName} / Term {k12Data.term}
                                </p>
                            </div>
                            
                            <div className="border-t border-slate-100 pt-3 max-h-[240px] overflow-y-auto pr-1">
                                <TeacherProgressStats 
                                    items={[
                                        ...k12Data.classes.map((c: any) => ({
                                            id: c.id.toString(),
                                            type: 'class' as const,
                                            title: c.name,
                                            subtitle: ` arm (Lvl ${c.level})`,
                                            percentage: c.percentage,
                                            total: c.stats.total,
                                            link: `/staff/results/class/${c.id}?term=${k12Data.term}&sessionId=${k12Data.sessionId}`
                                        })),
                                        ...k12Data.subjects.map((s: any) => ({
                                            id: s.courseId.toString(),
                                            type: 'subject' as const,
                                            title: s.subjectName,
                                            subtitle: ` (${s.subjectCode})`,
                                            percentage: s.percentage,
                                            total: 0,
                                            link: `/staff/results/subject/${s.courseId}/${s.groupId}?term=${k12Data.term}&sessionId=${k12Data.sessionId}`
                                        }))
                                    ]}
                                />
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Leave Request Dialog Overlay */}
            {showLeaveForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row justify-between items-center border-b border-slate-100 pb-3">
                            <CardTitle className="text-base font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <Plus className="w-4.5 h-4.5 text-emerald-600" />
                                Submit Leave Request
                            </CardTitle>
                            <button onClick={() => setShowLeaveForm(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-all">
                                <X className="w-4.5 h-4.5 text-slate-400 hover:text-slate-650" />
                            </button>
                        </CardHeader>
                        <CardContent className="pt-5 text-sm text-slate-600">
                            <form onSubmit={handleLeaveSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Leave Category</label>
                                        <select name="type" required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-emerald-500">
                                            <option value="annual">Annual Leave</option>
                                            <option value="sick">Sick Leave</option>
                                            <option value="maternity">Maternity Leave</option>
                                            <option value="study">Study Leave</option>
                                            <option value="casual">Casual Leave</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clearance Mode</label>
                                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400 italic">Self-service clearance ACTIVE</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start Date</label>
                                        <input name="startDate" type="date" required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">End Date</label>
                                        <input name="endDate" type="date" required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-emerald-500" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Leave Appraisal Reason</label>
                                    <textarea name="reason" required rows={3} placeholder="Explain the rationale for your leave application..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-emerald-500 leading-relaxed" />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Submit Leave Application"}
                                </button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Start Class Dialog */}
            <Dialog open={showStartClassDialog} onOpenChange={setShowStartClassDialog}>
                <DialogContent className="bg-white border-slate-200 text-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-800 text-base font-bold uppercase tracking-wider flex items-center gap-2">
                            <Video className="w-5 h-5 text-red-500" />
                            Start Live Classroom Session
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm mt-1">
                            {`Configure video streaming mode for ${selectedCourseForLive?.code}.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3 text-sm text-slate-600">
                        <RadioGroup value={liveMode} onValueChange={(v) => setLiveMode(v as any)}>
                            <div
                                onClick={() => setLiveMode('meeting')}
                                className={cn(
                                    "flex items-start space-x-3 p-3.5 rounded-lg border cursor-pointer transition-all",
                                    liveMode === 'meeting' ? "border-red-500 bg-red-50 text-red-750" : "border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <RadioGroupItem value="meeting" id="meeting" className="mt-1" />
                                <div className="grid gap-1 pointer-events-none">
                                    <Label htmlFor="meeting" className="font-bold cursor-pointer text-sm">Regular Meeting (Interactive)</Label>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Fully interactive. All students can share audio/video. Best for active tutor sessions.
                                    </p>
                                </div>
                            </div>
                            <div
                                onClick={() => setLiveMode('webinar')}
                                className={cn(
                                    "flex items-start space-x-3 p-3.5 rounded-lg border cursor-pointer transition-all",
                                    liveMode === 'webinar' ? "border-red-500 bg-red-50 text-red-755" : "border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <RadioGroupItem value="webinar" id="webinar" className="mt-1" />
                                <div className="grid gap-1 pointer-events-none">
                                    <Label htmlFor="webinar" className="font-bold cursor-pointer text-sm">Webinar / Large Lecture (View-Only)</Label>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Presenter shares audio/video. Students are view-only, minimizing bandwidth and disruptions.
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="flex justify-end gap-3 text-sm">
                        <Button variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-650" onClick={() => setShowStartClassDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmStartClass}
                            disabled={!selectedCourseForLive}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                            {isStartingClass ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Video className="w-3.5 h-3.5 mr-1.5" />}
                            Go Live
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
