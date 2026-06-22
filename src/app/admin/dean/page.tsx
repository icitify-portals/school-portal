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
    CheckCircle, 
    XCircle, 
    Clock, 
    ArrowRight, 
    GraduationCap, 
    Building2, 
    Sparkles,
    Loader2,
    BookOpen,
    Map,
    Wallet,
    Landmark,
    MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getStaffProfileByUserId } from "@/actions/hr_leave";
import { getDeanDashboardStats } from "@/actions/dashboards";
import { getFacultySubmissions, getFacultyDepartments, approveTimetable, requestTimetableRevision } from "@/actions/timetable";
import { getExpenditureRequests, deanApproveExpenditureRequest } from "@/actions/bursary";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DeanDashboard() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [departmentsList, setDepartmentsList] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [expenditures, setExpenditures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<number | null>(null);
    const [revisionNotes, setRevisionNotes] = useState<Record<number, string>>({});
    const [showRevisionInput, setShowRevisionInput] = useState<Record<number, boolean>>({});

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

            if (prof && prof.department?.facultyId) {
                const facId = prof.department.facultyId;
                const [deanStats, depts, subs, exps] = await Promise.all([
                    getDeanDashboardStats(facId),
                    getFacultyDepartments(facId),
                    getFacultySubmissions(facId),
                    getExpenditureRequests()
                ]);
                
                setStats(deanStats);
                setDepartmentsList(depts || []);
                setSubmissions(subs || []);
                
                // Filter expenditures that belong to this faculty's departments or specific facultyId
                const deptIds = (depts || []).map((d: any) => d.id);
                const filteredExps = (exps || []).filter((e: any) => 
                    (e.departmentId && deptIds.includes(e.departmentId)) || e.facultyId === facId
                );
                setExpenditures(filteredExps);
            }
        } catch (error) {
            toast.error("Failed to load Dean dashboard data");
        }
        setLoading(false);
    };

    const handleApproveTimetable = async (submissionId: number) => {
        setActioningId(submissionId);
        try {
            const res = await approveTimetable(submissionId, "Approved by Faculty Dean.");
            if (res.success) {
                toast.success("Timetable successfully cleared and approved!");
                await fetchData();
            } else {
                toast.error(res.error || "Approval failed");
            }
        } catch (error) {
            toast.error("Failed to approve timetable");
        }
        setActioningId(null);
    };

    const handleRejectTimetable = async (submissionId: number) => {
        const notes = revisionNotes[submissionId]?.trim();
        if (!notes) {
            toast.error("Please enter a revision reason or comment!");
            setShowRevisionInput(prev => ({ ...prev, [submissionId]: true }));
            return;
        }

        setActioningId(submissionId);
        try {
            const res = await requestTimetableRevision(submissionId, notes);
            if (res.success) {
                toast.success("Revision requested successfully!");
                await fetchData();
            } else {
                toast.error(res.error || "Revision request failed");
            }
        } catch (error) {
            toast.error("Failed to request revision");
        }
        setActioningId(null);
    };

    const handleApproveExpenditure = async (expId: number) => {
        setActioningId(expId);
        try {
            const userId = parseInt(session?.user?.id as string);
            const res = await deanApproveExpenditureRequest(expId, userId);
            if (res.success) {
                toast.success("Faculty fund outflow request cleared!");
                await fetchData();
            } else {
                toast.error(res.error || "Clearance failed");
            }
        } catch (error) {
            toast.error("Failed to clear expenditure");
        }
        setActioningId(null);
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Loading Faculty Boardroom...</p>
            </div>
        );
    }

    if (!profile || !profile.department?.facultyId) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center space-y-6">
                <Map className="w-16 h-16 text-slate-355 mx-auto" />
                <h2 className="text-2xl font-black text-slate-800 uppercase italic">Boardroom Stage Locked</h2>
                <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                    You are not currently linked as the Faculty Dean of an active faculty branch. Please contact Administration to synchronize your unit governance credentials.
                </p>
            </div>
        );
    }

    const facultyName = profile.department?.faculty?.name || "Science & Arts Boardroom";

    return (
        <div className="p-10 space-y-10 max-w-[1600px] mx-auto min-h-screen">
            {/* Header Stage */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-slate-900 text-white rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Map className="w-64 h-64 text-white" />
                </div>
                <div className="space-y-4 relative z-10">
                    <Badge className="bg-emerald-600 px-3 py-1 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5 w-fit">
                        <Sparkles className="w-3.5 h-3.5" /> Faculty Governance Board
                    </Badge>
                    <h1 className="text-5xl font-black tracking-tighter uppercase leading-none italic">
                        {facultyName}
                    </h1>
                    <p className="text-slate-400 font-bold italic text-sm">
                        Dean's Office Boardroom • {session?.user?.name || "Faculty Dean"}
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
                        <Button className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black shadow-xl text-white">
                            <Calendar className="mr-2 h-5 w-5" /> Faculty Timetable Tracker
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Top Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: "Academic Units", value: departmentsList.length, desc: "Departments in Faculty", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
                    { 
                        title: "Approved Schedules", 
                        value: stats?.approvedCount || 0, 
                        desc: `Out of ${stats?.totalDepartments || 0} total units`, 
                        icon: CheckCircle, 
                        color: "text-emerald-600", 
                        bg: "bg-emerald-50" 
                    },
                    { 
                        title: "Schedules Review Queue", 
                        value: stats?.pendingCount || 0, 
                        desc: "Awaiting your final clearance", 
                        icon: Clock, 
                        color: (stats?.pendingCount || 0) > 0 ? "text-amber-600" : "text-slate-500", 
                        bg: (stats?.pendingCount || 0) > 0 ? "bg-amber-50" : "bg-slate-50" 
                    },
                    { 
                        title: "Clearance Outflows", 
                        value: expenditures.filter(e => e.status === 'pending').length, 
                        desc: "Pending funds outflow request", 
                        icon: Wallet, 
                        color: "text-rose-600", 
                        bg: "bg-rose-50" 
                    },
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

            {/* Bento Grid Boardroom Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side (Timetables & Budgets, Span 2) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* A. Timetables clearance desk */}
                    <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Academic Clearance Ledger</CardTitle>
                                <CardDescription className="text-2xl font-black text-slate-900 uppercase italic leading-none">Timetable Review Queue</CardDescription>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-[9px] w-fit">Timetable Audit</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {submissions.length > 0 ? submissions.map((sub) => (
                                    <div key={sub.submission.id} className="p-8 space-y-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="space-y-1">
                                                <div className="font-black text-lg text-slate-950 uppercase">{sub.department?.name}</div>
                                                <div className="text-xs text-slate-500 font-bold flex gap-4">
                                                    <span>Semester: <span className="text-slate-950 font-black">Semester {sub.submission.semester}</span></span>
                                                    <span>Submitted By: <span className="text-indigo-600 font-black">{sub.submittedBy?.name || "HOD Office"}</span></span>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "font-bold px-3 py-1 rounded-full uppercase text-[9px]",
                                                sub.submission.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                                                sub.submission.status === 'pending_approval' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                                            )}>
                                                {sub.submission.status}
                                            </Badge>
                                        </div>

                                        {sub.submission.status === 'pending_approval' && (
                                            <div className="space-y-3">
                                                {showRevisionInput[sub.submission.id] && (
                                                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                                                        <MessageSquare className="w-5 h-5 text-rose-500 shrink-0" />
                                                        <input 
                                                            type="text" 
                                                            placeholder="Enter revision comments..."
                                                            value={revisionNotes[sub.submission.id] || ""}
                                                            onChange={(e) => setRevisionNotes(prev => ({ ...prev, [sub.submission.id]: e.target.value }))}
                                                            className="bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 font-bold focus:outline-none w-full"
                                                        />
                                                    </div>
                                                )}
                                                
                                                <div className="flex gap-2 justify-end">
                                                    <Button 
                                                        onClick={() => handleApproveTimetable(sub.submission.id)}
                                                        disabled={actioningId === sub.submission.id}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-3 rounded-xl uppercase tracking-wider"
                                                    >
                                                        {actioningId === sub.submission.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="mr-1.5 h-4 w-4" />} Clear Timetable
                                                    </Button>
                                                    
                                                    {showRevisionInput[sub.submission.id] ? (
                                                        <Button 
                                                            onClick={() => handleRejectTimetable(sub.submission.id)}
                                                            disabled={actioningId === sub.submission.id}
                                                            variant="outline"
                                                            className="border-rose-200 hover:bg-rose-50 text-rose-600 font-black text-xs px-5 py-3 rounded-xl uppercase tracking-wider"
                                                        >
                                                            Submit Request
                                                        </Button>
                                                    ) : (
                                                        <Button 
                                                            onClick={() => setShowRevisionInput(prev => ({ ...prev, [sub.submission.id]: true }))}
                                                            variant="outline" 
                                                            className="border-amber-200 hover:bg-amber-50 text-amber-600 font-black text-xs px-5 py-3 rounded-xl uppercase tracking-wider"
                                                        >
                                                            Request Revision
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="p-16 text-center text-slate-400 italic text-sm">
                                        <CheckCircle className="w-12 h-12 text-emerald-550/30 mx-auto mb-4" />
                                        No department timetables currently submitted for review.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* B. Expenditure clearance desk */}
                    <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Financial Governance Stage</CardTitle>
                                <CardDescription className="text-2xl font-black text-slate-900 uppercase italic leading-none">Fund Outflow Clearance</CardDescription>
                            </div>
                            <Badge className="bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-[9px] w-fit">Budget Clearance</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {expenditures.length > 0 ? expenditures.map((exp) => (
                                    <div key={exp.id} className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="space-y-2">
                                            <div className="font-black text-lg text-slate-950 uppercase">{exp.title}</div>
                                            <div className="text-xs text-slate-500 font-bold flex gap-4">
                                                <span>Dept: <span className="text-slate-950 font-black uppercase">{exp.department?.name || "General Faculty"}</span></span>
                                                <span>Amount: <span className="text-rose-600 font-black">{settings?.base_currency || '₦'}{parseFloat(exp.amount).toLocaleString()}</span></span>
                                            </div>
                                            <div className="text-xs text-slate-400 italic">" {exp.purpose || "No description provided"} "</div>
                                            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase">Submitted By: {exp.requestedBy?.name || "Department HOD"}</div>
                                        </div>
                                        <div className="flex gap-2 w-full md:w-auto shrink-0">
                                            {exp.status === 'pending' ? (
                                                <Button 
                                                    onClick={() => handleApproveExpenditure(exp.id)}
                                                    disabled={actioningId === exp.id}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-4 rounded-xl w-full md:w-auto uppercase tracking-wider"
                                                >
                                                    {actioningId === exp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="mr-1.5 h-4 w-4" />} Clear Fund
                                                </Button>
                                            ) : (
                                                <Badge className={cn(
                                                    "font-black px-4 py-2.5 rounded-xl uppercase tracking-wider text-[10px]",
                                                    exp.status === 'approved' || exp.status === 'disbursed' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-650"
                                                )}>
                                                    {exp.status.toUpperCase()}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-16 text-center text-slate-400 italic text-sm">
                                        <Landmark className="w-12 h-12 text-rose-500/30 mx-auto mb-4" />
                                        No pending expenditure fund clearance requests in this faculty.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Right Side (Departments Registry, Span 1) */}
                <div>
                    <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-150 p-8">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Boardroom Directory</CardTitle>
                            <CardDescription className="text-2xl font-black text-slate-900 uppercase italic leading-none">Departments Registry</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-150 max-h-[600px] overflow-y-auto pr-1">
                                {departmentsList.length > 0 ? departmentsList.map((dept) => (
                                    <div key={dept.id} className="p-6 flex items-center justify-between hover:bg-emerald-50/20 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-black shadow-inner border border-slate-200 shrink-0">
                                                {dept.name?.charAt(0) || "D"}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 group-hover:text-emerald-700 transition-colors uppercase leading-none mb-1">{dept.name}</div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{dept.code || "DEPT"}</div>
                                            </div>
                                        </div>
                                        <Badge className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full uppercase text-[8px]">
                                            ID: {dept.id}
                                        </Badge>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-400 italic text-xs">
                                        No active departments registered in this faculty.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
