"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Calendar,
    Clock,
    FileText,
    Send,
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
    NotebookPen
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
            setIsStartingClass(null); // Reset before routing so it doesn't freeze if user comes back
            router.push(`/live/${selectedCourseForLive.id}/${result.id}`);
        } catch (error: any) {
            toast.error(error.message);
            setIsStartingClass(null);
            setShowStartClassDialog(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

    if (!profile) return (
        <div className="p-8 max-w-2xl mx-auto text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900">Profile Not Found</h2>
            <p className="text-slate-500 mt-2">Your account is not yet linked to a staff profile. Please contact HR.</p>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen relative">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Portal</h1>
                <p className="text-slate-500 font-medium">{`Welcome back, `}<span className="text-indigo-600 font-bold">{session?.user?.name || "User"}</span></p>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: "Annual Leave", key: "annual", color: "text-blue-600", bg: "bg-blue-50", icon: Calendar },
                    { label: "Sick Leave", key: "sick", color: "text-rose-600", bg: "bg-rose-50", icon: AlertCircle },
                    { label: "Maternity", key: "maternity", color: "text-purple-600", bg: "bg-purple-50", icon: Clock },
                    { label: "Study Leave", key: "study", color: "text-amber-600", bg: "bg-amber-50", icon: FileText },
                    { label: "Casual Leave", key: "casual", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
                ].map((item) => (
                    <Card key={item.key} className="border-none shadow-sm hover:translate-y-[-2px] transition-all">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn("p-2 rounded-lg", item.bg)}>
                                    <item.icon className={cn("w-4 h-4", item.color)} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">{item.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-900">{balances?.[item.key] ?? 0}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Days Rem.</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Lecturer Quick View */}
                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardHeader className="bg-slate-50/50 border-b pb-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lecturer Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 transition-colors">
                                    <BookOpen className="w-5 h-5 text-indigo-600 group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-900">{lecturerStats?.courses || 0}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Courses</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-slate-900">{lecturerStats?.hours || 0}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Weekly Hours</p>
                            </div>
                        </div>
                        <Link href="/staff/courses">
                            <Button variant="outline" className="w-full rounded-xl text-[10px] font-bold uppercase tracking-widest h-10 border-slate-200">
                                Manage My Courses
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Live Classes Management */}
                <Card className="border-none shadow-sm bg-white overflow-hidden group border-l-4 border-l-red-600">
                    <CardHeader className="bg-red-50/50 border-b pb-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-red-600">Live Virtual Classroom</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {lecturerStats?.assignments?.length > 0 ? (
                                lecturerStats.assignments.map((assignment: any) => (
                                    <div key={assignment.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-red-50 transition-colors group/item">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg text-red-600 shadow-sm">
                                                <Video className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase italic">{`${assignment.courseCode}`}</p>
                                                <p className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">{assignment.courseName}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={isStartingClass === assignment.courseCode}
                                            onClick={() => handleStartClass(assignment.courseId, assignment.courseCode, assignment.courseName)}
                                            className="h-8 text-[9px] font-black uppercase tracking-widest bg-white text-red-600 border border-red-100 hover:bg-red-600 hover:text-white shadow-sm"
                                        >
                                            {isStartingClass === assignment.courseCode ? <Loader2 className="w-3 h-3 animate-spin" /> : "Go Live"}
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-[10px] font-bold text-slate-400 italic">No courses assigned.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Role Specific Views */}
                {(isHOD || (session?.user as any)?.role === 'admin') && (
                    <Card className="border-none shadow-sm bg-white overflow-hidden group border-l-4 border-l-amber-500">
                        <CardHeader className="bg-amber-50/50 border-b pb-3">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-amber-600">Departmental Admin (HOD)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-600 transition-colors text-amber-600 group-hover:text-white">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-900">{hodStats?.staffCount || 0}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Dept. Staff</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={cn(
                                        "px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter inline-block",
                                        hodStats?.submissionStatus === 'approved' ? "bg-emerald-100 text-emerald-700" :
                                            hodStats?.submissionStatus === 'pending_approval' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                                    )}>
                                        {`Timetable: ${hodStats?.submissionStatus || 'Draft'}`}
                                    </div>
                                </div>
                            </div>
                            <Link href="/admin/academics/timetable">
                                <Button className="w-full rounded-xl text-[10px] font-bold uppercase tracking-widest h-10 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-100">
                                    Dept Timetable Settings
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {(isDean || (session?.user as any)?.role === 'admin') && (
                    <Card className="border-none shadow-sm bg-white overflow-hidden group border-l-4 border-l-indigo-600">
                        <CardHeader className="bg-indigo-50/50 border-b pb-3">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Faculty Governance (DEAN)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 transition-colors text-indigo-600 group-hover:text-white">
                                        <Map className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-900">{`${deanStats?.approvedCount || 0}/${deanStats?.totalDepartments || 0}`}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Timetables Approved</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-slate-900">{deanStats?.pendingCount || 0}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase font-black text-amber-500">Awaiting Action</p>
                                </div>
                            </div>
                            <Link href="/admin/academics/timetable">
                                <Button className="w-full rounded-xl text-[10px] font-bold uppercase tracking-widest h-10 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                                    Faculty Timetable Tracker
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* K-12 Progress Tracker */}
            {k12Data && (k12Data.classes?.length > 0 || k12Data.subjects?.length > 0) && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-indigo-600" />
                                Work Completion Tracker
                            </h2>
                            <p className="text-slate-500 text-sm">Targeting records for <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold">{k12Data.sessionName} / Term {k12Data.term}</Badge></p>
                        </div>
                    </div>
                    <TeacherProgressStats 
                        items={[
                            ...k12Data.classes.map((c: any) => ({
                                id: c.id.toString(),
                                type: 'class' as const,
                                title: c.name,
                                subtitle: `Class Arm (Level ${c.level})`,
                                percentage: c.percentage,
                                total: c.stats.total,
                                link: `/staff/results/class/${c.id}?term=${k12Data.term}&sessionId=${k12Data.sessionId}`
                            })),
                            ...k12Data.subjects.map((s: any) => ({
                                id: s.courseId.toString(),
                                type: 'subject' as const,
                                title: s.subjectName,
                                subtitle: `${s.className} (${s.subjectCode})`,
                                percentage: s.percentage,
                                total: 0, // Subject stats calculation logic can be refined later for student counts
                                link: `/staff/results/subject/${s.courseId}/${s.groupId}?term=${k12Data.term}&sessionId=${k12Data.sessionId}`
                            }))
                        ]}
                    />
                </div>
            )}

            {/* Academic Modules Quick Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Weekly Timetable", icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50", link: "/admin/academics/timetable", desc: "View class schedule" },
                    { label: "Result Grading", icon: ClipboardCheck, color: "text-emerald-600", bg: "bg-emerald-50", link: "/staff/results", desc: "Enter student scores" },
                    { label: "Assignments", icon: FileText, color: "text-blue-600", bg: "bg-blue-50", link: "/staff/assignments", desc: "Grade submissions" },
                    { label: "CBT Quizzes", icon: BrainCircuit, color: "text-purple-600", bg: "bg-purple-50", link: "/staff/quizzes", desc: "Manage assessments" },
                    { label: "Lesson Notes", icon: NotebookPen, color: "text-amber-600", bg: "bg-amber-50", link: "/staff/notes", desc: "Prep curriculum" },
                    { 
                        label: "Note Approvals", 
                        icon: CheckCircle, 
                        color: "text-indigo-600", 
                        bg: "bg-indigo-50", 
                        link: "/staff/notes/approvals", 
                        desc: "Review manuscripts", 
                        show: isHOD || isDean || (session?.user as any)?.role === 'admin' 
                    },
                ].filter(m => m.show !== false).map((mod) => (
                    <Link href={mod.link} key={mod.label}>
                        <Card className="border-none shadow-sm hover:shadow-md transition-all group cursor-pointer hover:-translate-y-1">
                            <CardContent className="p-6">
                                <div className={cn("inline-flex p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform", mod.bg)}>
                                    <mod.icon className={cn("w-6 h-6", mod.color)} />
                                </div>
                                <h3 className="font-black text-slate-800 uppercase tracking-tight italic mb-1">{mod.label}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{mod.desc}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Requests Table */}
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="flex flex-row justify-between items-center border-b border-slate-50">
                            <CardTitle className="text-sm font-black uppercase tracking-tight text-slate-700 italic">My Leave Requests</CardTitle>
                            <Button
                                onClick={() => setShowLeaveForm(true)}
                                className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold gap-2"
                            >
                                <Plus className="w-3 h-3" />
                                Request Leave
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50">
                                        <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Period</th>
                                            <th className="px-6 py-4">Days</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 italic">
                                        {requests.map((req) => {
                                            const start = new Date(req.startDate);
                                            const end = new Date(req.endDate);
                                            const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                            return (
                                                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {req.status === 'pending' && <Clock className="w-3 h-3 text-amber-500" />}
                                                            {req.status === 'approved' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                                                            {req.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-500" />}
                                                            <span className={cn(
                                                                "text-[10px] font-black uppercase tracking-tighter",
                                                                req.status === 'pending' ? "text-amber-600" :
                                                                    req.status === 'approved' ? "text-emerald-600" : "text-rose-600"
                                                            )}>
                                                                {req.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{req.type}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-left">
                                                        <p className="text-[10px] font-bold text-slate-500">{start.toLocaleDateString('en-GB')} - {end.toLocaleDateString('en-GB')}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-slate-900">{days}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {requests.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic text-sm">No leave requests found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <Card className="border-none shadow-sm bg-indigo-900 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <GraduationCap className="w-32 h-32" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-300">Staff Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black uppercase text-indigo-400">Full Name</p>
                                <p className="text-lg font-bold">{session?.user?.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-indigo-400">Staff ID</p>
                                    <p className="text-sm font-bold font-mono">{profile.staffId}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-indigo-400">Designation</p>
                                    <p className="text-sm font-bold">{profile.jobTitle}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-indigo-400">Grade Level</p>
                                <p className="text-sm font-bold uppercase">{profile.gradeLevel || 'L1'}</p>
                            </div>
                            <div className="pt-4 border-t border-indigo-800">
                                <Button variant="outline" className="w-full bg-transparent border-indigo-400 text-indigo-100 hover:bg-indigo-800 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest h-10">
                                    View Digital ID
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Leave Request Form Overlay */}
            {showLeaveForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row justify-between items-center border-b border-slate-50">
                            <CardTitle className="text-lg font-black uppercase tracking-tight italic">Submit Leave Request</CardTitle>
                            <button onClick={() => setShowLeaveForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleLeaveSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Leave Type</label>
                                        <select name="type" required className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                                            <option value="annual">Annual Leave</option>
                                            <option value="sick">Sick Leave</option>
                                            <option value="maternity">Maternity Leave</option>
                                            <option value="study">Study Leave</option>
                                            <option value="casual">Casual Leave</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Grade Estimate</label>
                                        <div className="p-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 italic">Self-service clearance ACTIVE</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Start Date</label>
                                        <input name="startDate" type="date" required className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">End Date</label>
                                        <input name="endDate" type="date" required className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Reason / Description</label>
                                    <textarea name="reason" required rows={3} placeholder="Provide details for your leave request..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-200"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Start Class Dialog */}
            <Dialog open={showStartClassDialog} onOpenChange={setShowStartClassDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start Live Session</DialogTitle>
                        <DialogDescription>
                            {`Configure the settings for ${selectedCourseForLive?.code}.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <RadioGroup value={liveMode} onValueChange={(v) => setLiveMode(v as any)}>
                            <div
                                onClick={() => setLiveMode('meeting')}
                                className={cn(
                                    "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                    liveMode === 'meeting' ? "border-red-500 bg-red-50/50" : "border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <RadioGroupItem value="meeting" id="meeting" className="mt-1" />
                                <div className="grid gap-1">
                                    <Label htmlFor="meeting" className="font-bold cursor-pointer">Regular Meeting</Label>
                                    <p className="text-xs text-slate-500 cursor-pointer" onClick={() => setLiveMode('meeting')}>
                                        Interactive session where all students can share audio/video. Best for small tutorials.
                                    </p>
                                </div>
                            </div>
                            <div
                                onClick={() => setLiveMode('webinar')}
                                className={cn(
                                    "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                    liveMode === 'webinar' ? "border-red-500 bg-red-50/50" : "border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <RadioGroupItem value="webinar" id="webinar" className="mt-1" />
                                <div className="grid gap-1">
                                    <Label htmlFor="webinar" className="font-bold cursor-pointer">Webinar / Large Lecture</Label>
                                    <p className="text-xs text-slate-500 cursor-pointer" onClick={() => setLiveMode('webinar')}>
                                        Only you can share audio/video. Students are view-only. Best for large classes.
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowStartClassDialog(false)}>Cancel</Button>
                        <Button
                            onClick={confirmStartClass}
                            disabled={!selectedCourseForLive}
                            className="bg-red-600 hover:bg-red-700 font-bold"
                        >
                            {isStartingClass ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                            Go Live
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
