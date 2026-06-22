"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Users, 
    Calendar, 
    ClipboardList, 
    FileText, 
    Plus, 
    CheckCircle, 
    XCircle, 
    Clock, 
    ArrowRight, 
    GraduationCap, 
    Building2, 
    Sparkles,
    Loader2,
    BookOpen
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getStaffProfileByUserId, getAllLeaveRequests, updateLeaveStatus } from "@/actions/hr_leave";
import { getHODDashboardStats, getPendingLessonNotesForHOD, reviewLessonNote } from "@/actions/dashboards";
import { getDepartmentStaff } from "@/actions/timetable";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

export default function HODDashboard() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [pendingNotes, setPendingNotes] = useState<any[]>([]);
    const [notesFeedback, setNotesFeedback] = useState<Record<number, string>>({});
    const [showNotesInput, setShowNotesInput] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<number | null>(null);

    useEffect(() => {
        if (session?.user?.id) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const userId = parseInt(session?.user?.id as string);
            const prof = await getStaffProfileByUserId(userId);
            setProfile(prof);

            if (prof && prof.departmentId) {
                const [hodStats, staff, leaves, notes] = await Promise.all([
                    getHODDashboardStats(prof.departmentId),
                    getDepartmentStaff(prof.departmentId),
                    getAllLeaveRequests(),
                    getPendingLessonNotesForHOD(prof.departmentId)
                ]);
                
                setStats(hodStats);
                setStaffList(staff || []);
                setPendingNotes(notes || []);
                // Filter leave requests for staff in this HOD's department
                const deptStaffIds = (staff || []).map((s: any) => s.id);
                const filteredLeaves = (leaves || []).filter((l: any) => 
                    deptStaffIds.includes(l.staff?.id) && l.request?.status === 'pending'
                );
                setLeaveRequests(filteredLeaves);
            }
        } catch (error) {
            toast.error("Failed to load HOD metrics");
        }
        setLoading(false);
    };

    const handleLeaveAction = async (requestId: number, status: 'approved' | 'rejected') => {
        setActioningId(requestId);
        try {
            const res = await updateLeaveStatus(requestId, status, `${status.toUpperCase()} by Department HOD.`);
            if (res.success) {
                toast.success(`Leave request successfully ${status}!`);
                await fetchData();
            } else {
                toast.error(res.error || "Action failed");
            }
        } catch (error) {
            toast.error("Failed to update leave request");
        }
        setActioningId(null);
    };

    const handleLessonNoteAction = async (noteId: number, status: 'approved' | 'rejected') => {
        setActioningId(noteId);
        try {
            const feedback = notesFeedback[noteId]?.trim();
            const userId = parseInt(session?.user?.id as string);
            const res = await reviewLessonNote(noteId, status, feedback, userId);
            if (res.success) {
                toast.success(`Lesson note successfully ${status}!`);
                await fetchData();
            } else {
                toast.error(res.error || "Action failed");
            }
        } catch (error) {
            toast.error("Failed to audit lesson note");
        }
        setActioningId(null);
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Loading Department Command...</p>
            </div>
        );
    }

    if (!profile || !profile.departmentId) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center space-y-6">
                <Building2 className="w-16 h-16 text-slate-350 mx-auto" />
                <h2 className="text-2xl font-black text-slate-800 uppercase italic">Department Desk Locked</h2>
                <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                    You are not currently linked as the Head of Department (HOD) of an active department. Please contact Administration to synchronize your unit assignments.
                </p>
            </div>
        );
    }

    return (
        <div className="p-10 space-y-10 max-w-[1600px] mx-auto min-h-screen">
            {/* Header Stage */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-slate-900 text-white rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Building2 className="w-64 h-64 text-white" />
                </div>
                <div className="space-y-4 relative z-10">
                    <Badge className="bg-indigo-600 px-3 py-1 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5 w-fit">
                        <Sparkles className="w-3.5 h-3.5" /> Department Command Desk
                    </Badge>
                    <h1 className="text-5xl font-black tracking-tighter uppercase leading-none italic">
                        {profile.department?.name || "Sciences Division"}
                    </h1>
                    <p className="text-slate-400 font-bold italic text-sm">
                        HOD Portal Desk • {session?.user?.name || "Department Head"}
                    </p>
                </div>
                <div className="flex gap-3 shrink-0 relative z-10">
                    <Link href="/admin/students">
                        <Button className="h-14 px-8 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black shadow-xl text-white border border-slate-700">
                            <Users className="mr-2 h-5 w-5" /> Student Directory
                        </Button>
                    </Link>
                    <Link href="/admin/hr">
                        <Button className="h-14 px-8 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black shadow-xl text-white border border-slate-700">
                            <Users className="mr-2 h-5 w-5" /> Staff Directory
                        </Button>
                    </Link>
                    <Link href="/admin/academics/timetable">
                        <Button className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl text-white">
                            <Calendar className="mr-2 h-5 w-5" /> Timetable Builder
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Top Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: "Staff Lecturers", value: staffList.length, desc: "Active Department Faculty", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: "Courses Cataloged", value: stats?.coursesCount || 12, desc: "Department syllabus list", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
                    { 
                        title: "Timetable Status", 
                        value: (stats?.submissionStatus || "Draft").toUpperCase(), 
                        desc: "Submission status to Dean", 
                        icon: ClipboardList, 
                        color: stats?.submissionStatus === 'approved' ? "text-emerald-600" : "text-amber-600", 
                        bg: stats?.submissionStatus === 'approved' ? "bg-emerald-50" : "bg-amber-50" 
                    },
                    { title: "Pending Leaves", value: leaveRequests.length, desc: "Awaiting your verification", icon: Clock, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((stat) => (
                    <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform", stat.color)}>
                            <stat.icon className="w-14 h-14" />
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-3">
                                <div className={cn("p-3 rounded-xl", stat.bg)}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.title}</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 italic uppercase">{stat.value}</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1">{stat.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Bento Grid Command Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Leave Approval Desk (Span 2) */}
                <Card className="lg:col-span-2 shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Administrative Ledger</CardTitle>
                            <CardDescription className="text-2xl font-black text-slate-900 uppercase italic leading-none">Lecturer Leave Approvals</CardDescription>
                        </div>
                        <Badge className="bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-[9px]">Awaiting Decision</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {leaveRequests.length > 0 ? leaveRequests.map((req) => {
                                const start = new Date(req.request.startDate);
                                const end = new Date(req.request.endDate);
                                const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                return (
                                    <div key={req.request.id} className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="space-y-2">
                                            <div className="font-black text-lg text-slate-950 uppercase">{req.user?.name}</div>
                                            <div className="text-xs text-slate-500 font-bold flex gap-4">
                                                <span>Type: <span className="text-slate-950 font-black uppercase">{req.request.type}</span></span>
                                                <span>Duration: <span className="text-indigo-600 font-black">{days} Days</span></span>
                                            </div>
                                            <div className="text-xs text-slate-400 italic">" {req.request.reason || "No reason specified"} "</div>
                                            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase">{start.toLocaleDateString("en-GB")} to {end.toLocaleDateString("en-GB")}</div>
                                        </div>
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <Button 
                                                onClick={() => handleLeaveAction(req.request.id, 'approved')}
                                                disabled={actioningId === req.request.id}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-4 rounded-xl flex-1 md:flex-none uppercase tracking-wider"
                                            >
                                                {actioningId === req.request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="mr-1.5 h-4.5 w-4.5" />} Approve
                                            </Button>
                                            <Button 
                                                onClick={() => handleLeaveAction(req.request.id, 'rejected')}
                                                disabled={actioningId === req.request.id}
                                                variant="outline" 
                                                className="border-rose-200 hover:bg-rose-50 text-rose-600 font-black text-xs px-6 py-4 rounded-xl flex-1 md:flex-none uppercase tracking-wider"
                                            >
                                                {actioningId === req.request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="mr-1.5 h-4.5 w-4.5" />} Reject
                                            </Button>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-16 text-center text-slate-400 italic text-sm">
                                    <CheckCircle className="w-12 h-12 text-emerald-500/30 mx-auto mb-4" />
                                    No pending leave requests found for department staff.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Lesson Notes Audit Desk (Span 2) */}
                <Card className="lg:col-span-2 shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-650 mb-1">Curriculum Oversight</CardTitle>
                            <CardDescription className="text-2xl font-black text-slate-900 uppercase italic leading-none">Lesson Notes Audit Queue</CardDescription>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-[9px]">{pendingNotes.length} Pending Audit</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {pendingNotes.length > 0 ? pendingNotes.map((note) => (
                                <div key={note.id} className="p-8 space-y-6 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-slate-100 text-slate-700 font-black text-[9px] uppercase tracking-wider rounded-md">
                                                    Week {note.weekNumber}
                                                </Badge>
                                                <span className="text-xs font-black text-indigo-650 uppercase tracking-widest">
                                                    {note.course?.code} • {note.course?.name}
                                                </span>
                                            </div>
                                            <h4 className="font-black text-xl text-slate-950 uppercase">{note.title}</h4>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                Teacher: <span className="text-slate-700 font-black">{note.teacher?.name}</span>
                                            </p>
                                        </div>
                                        <Badge className="bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-[9px] shrink-0">
                                            Awaiting Clearance
                                        </Badge>
                                    </div>

                                    {/* Objectives & Content Body */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80">
                                        <div className="space-y-1.5">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <BookOpen className="w-3 h-3" /> Learning Objectives
                                            </div>
                                            <div className="text-xs text-slate-650 font-bold italic leading-relaxed whitespace-pre-line">
                                                {note.objectives || "No objectives provided."}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <FileText className="w-3 h-3" /> Curriculum Outline
                                            </div>
                                            <div className="text-xs text-slate-650 font-bold leading-relaxed whitespace-pre-line line-clamp-4">
                                                {note.contentBody || "No outline content provided."}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Desk */}
                                    <div className="space-y-3 pt-2">
                                        {showNotesInput[note.id] && (
                                            <div className="flex items-center gap-2.5 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
                                                <MessageSquare className="w-5 h-5 text-indigo-500 shrink-0" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Provide supervisor feedback or revision comments..."
                                                    value={notesFeedback[note.id] || ""}
                                                    onChange={(e) => setNotesFeedback(prev => ({ ...prev, [note.id]: e.target.value }))}
                                                    className="bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 font-bold focus:outline-none w-full"
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="flex gap-2 justify-end items-center">
                                            {!showNotesInput[note.id] && (
                                                <Button 
                                                    onClick={() => setShowNotesInput(prev => ({ ...prev, [note.id]: true }))}
                                                    variant="ghost" 
                                                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 uppercase tracking-wider"
                                                >
                                                    Add Feedback
                                                </Button>
                                            )}
                                            
                                            <Button 
                                                onClick={() => handleLessonNoteAction(note.id, 'approved')}
                                                disabled={actioningId === note.id}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-5 py-3 rounded-xl uppercase tracking-wider"
                                            >
                                                {actioningId === note.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="mr-1.5 h-4 w-4" />} Clear Notes
                                            </Button>
                                            <Button 
                                                onClick={() => handleLessonNoteAction(note.id, 'rejected')}
                                                disabled={actioningId === note.id}
                                                variant="outline" 
                                                className="border-rose-200 hover:bg-rose-50 text-rose-600 font-black text-xs px-5 py-3 rounded-xl uppercase tracking-wider"
                                            >
                                                {actioningId === note.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />} Reject Notes
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-16 text-center text-slate-400 italic text-sm">
                                    <BookOpen className="w-12 h-12 text-indigo-500/20 mx-auto mb-4" />
                                    Your department's curriculum is perfectly aligned.<br /> All lesson notes are reviewed and cleared.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Staff Directory */}
                <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Faculty Registry</CardTitle>
                        <CardDescription className="text-2xl font-black text-slate-900 uppercase italic leading-none">Lecturers & Staff</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-150 max-h-[500px] overflow-y-auto pr-1">
                            {staffList.map((lecturer) => (
                                <div key={lecturer.id} className="p-6 flex items-center justify-between hover:bg-indigo-50/20 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-black shadow-inner border border-slate-200 shrink-0">
                                            {lecturer.user?.name?.charAt(0) || "L"}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-none mb-1">{lecturer.user?.name}</div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{lecturer.jobTitle || "Lecturer"}</div>
                                        </div>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full uppercase text-[8px]">
                                        ID: {lecturer.staffId}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
