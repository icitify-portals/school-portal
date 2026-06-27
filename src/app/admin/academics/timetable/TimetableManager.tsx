"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Plus, Trash2, Shield, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
    assignCourseToLecturer,
    saveTimetableSlot,
    deleteTimetableSlot,
    getCourseAssignments,
    getDepartmentStaff,
    getDepartmentSettings,
    updateDepartmentTimetableSettings,
    getTimetableSubmission,
    submitTimetableForApproval,
    approveTimetable,
    requestTimetableRevision,
    addTimetableComment,
    removeLecturerFromCourse,
    getVenues,
    saveVenue,
    toggleCoursePractical,
    isUserDean
} from "@/actions/timetable";
import { BookOpen, Map, Check, FlaskConical } from "lucide-react";
import Link from "next/link";
import { AssignmentForm } from "./AssignmentForm";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, CheckCircle, Clock4, XCircle, Settings, ChevronRight } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

function generateTimeSlots(start: string, end: string) {
    const slots = [];
    let currentHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);

    for (let h = currentHour; h <= endHour; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
}

export default function TimetableManager({
    session,
    departments,
    allCourses,
    initialDeptId,
    initialStaff,
    initialAssignments,
    initialSubmission,
    deptSettings,
    userRole,
    userId,
    isHOD
}: any) {
    const isEditor = userRole === 'admin' || isHOD;
    const [isDean, setIsDean] = useState(false);
    const canApprove = userRole === 'admin' || isDean;

    const currentFacultyId = departments.find((d: any) => d.id.toString() === initialDeptId?.toString())?.facultyId;

    const [deptId, setDeptId] = useState(initialDeptId?.toString() || "");
    const [staff, setStaff] = useState(initialStaff);
    const [assignments, setAssignments] = useState(initialAssignments);
    const [submission, setSubmission] = useState(initialSubmission);
    const [settings, setSettings] = useState(deptSettings || {
        timetableStart: "08:00",
        timetableEnd: "16:00",
        breakStart: "13:00",
        breakEnd: "14:00"
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showSlotDialog, setShowSlotDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [showVenueDialog, setShowVenueDialog] = useState(false);
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [reviewNotes, setReviewNotes] = useState("");
    const [showAutoScheduleDialog, setShowAutoScheduleDialog] = useState(false);
    const [preserveExisting, setPreserveExisting] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [venues, setVenues] = useState<any[]>([]);
    const [newVenue, setNewVenue] = useState({ name: "", capacity: "" });

    const times = generateTimeSlots(settings.timetableStart, settings.timetableEnd);

    const [newSlot, setNewSlot] = useState({
        day: "monday",
        startTime: settings.timetableStart,
        endTime: `${(parseInt(settings.timetableStart.split(':')[0]) + 1).toString().padStart(2, '0')}:00`,
        venueId: "",
        type: "lecture",
        level: 100
    });

    useEffect(() => {
        if (deptId) {
            loadDeptData();
        }
    }, [deptId]);

    async function loadDeptData() {
        setIsLoading(true);
        try {
            const currentDept = departments.find((d: any) => d.id.toString() === deptId);
            const facultyId = currentDept?.facultyId;

            const [staffData, assignmentData, submissionData, settingsData] = await Promise.all([
                getDepartmentStaff(parseInt(deptId)),
                getCourseAssignments(parseInt(deptId), session.id, session.currentSemester === '1' ? '1' : '2'),
                getTimetableSubmission(parseInt(deptId), session.id, session.currentSemester === '1' ? '1' : '2'),
                getDepartmentSettings(parseInt(deptId))
            ]);

            setStaff(staffData);
            setAssignments(assignmentData);
            setSubmission(submissionData);
            if (settingsData) setSettings(settingsData);

            if (facultyId) {
                const deanStatus = await isUserDean(parseInt(userId), facultyId);
                setIsDean(deanStatus);
                const venueData = await getVenues(facultyId);
                setVenues(venueData);
            }
        } catch (error) {
            toast.error("Failed to load department data");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSaveVenue() {
        if (!newVenue.name || !currentFacultyId) return;
        const res = await saveVenue({ ...newVenue, capacity: parseInt(newVenue.capacity) || 0, facultyId: currentFacultyId });
        if (res.success) {
            toast.success("Venue added");
            setShowVenueDialog(false);
            setNewVenue({ name: "", capacity: "" });
            loadDeptData();
        } else {
            toast.error(res.error);
        }
    }

    async function handleTogglePractical(courseId: number, current: boolean) {
        const res = await toggleCoursePractical(courseId, !current);
        if (res.success) {
            toast.success("Course updated");
            loadDeptData();
        } else {
            toast.error(res.error);
        }
    }

    async function handleUpdateSettings(e: React.FormEvent) {
        e.preventDefault();
        const res = await updateDepartmentTimetableSettings(parseInt(deptId), settings);
        if (res.success) {
            toast.success("Settings updated");
            setShowSettingsDialog(false);
        } else {
            toast.error(res.error || "Failed to update settings");
        }
    }

    async function handleSubmitForApproval() {
        const res = await submitTimetableForApproval(parseInt(deptId), session.id, session.currentSemester === '1' ? '1' : '2');
        if (res.success) {
            toast.success("Timetable submitted for HOD approval");
            loadDeptData();
        } else {
            toast.error(res.error || "Failed to submit");
        }
    }

    async function handleApprove() {
        if (!submission) return;
        const res = await approveTimetable(submission.id);
        if (res.success) {
            toast.success("Timetable approved and published");
            loadDeptData();
        } else {
            toast.error(res.error || "Failed to approve");
        }
    }

    async function handleRequestRevision() {
        if (!submission || !reviewNotes) return;
        const res = await requestTimetableRevision(submission.id, reviewNotes);
        if (res.success) {
            toast.success("Revision requested");
            setShowReviewDialog(false);
            setReviewNotes("");
            loadDeptData();
        } else {
            toast.error(res.error || "Failed to request revision");
        }
    }

    async function handleAutoSchedule() {
        setIsGenerating(true);
        const { generateAutoTimetable } = await import("@/actions/timetable");
        const res = await generateAutoTimetable(parseInt(deptId), session.id, session.currentSemester === '1' ? '1' : '2', preserveExisting);
        setIsGenerating(false);
        if (res.success) {
            toast.success(res.message || "Auto-scheduled successfully");
            setShowAutoScheduleDialog(false);
            loadDeptData();
        } else {
            toast.error(res.error || "Failed to auto-schedule");
        }
    }

    async function handleAddComment() {
        if (!submission || !newComment) return;
        const res = await addTimetableComment(submission.id, newComment);
        if (res.success) {
            setNewComment("");
            loadDeptData();
        } else {
            toast.error(res.error || "Failed to add comment");
        }
    }

    async function handleAssignment(courseId: number, staffId: string, role: 'main' | 'co_lecturer') {
        if (!staffId) return;
        const res = await assignCourseToLecturer({
            sessionId: session.id,
            courseId,
            staffId: parseInt(staffId),
            deptId: parseInt(deptId),
            semester: session.currentSemester === '1' ? '1' : '2',
            role
        });

        if (res.success) {
            toast.success("Lecturer assigned successfully");
            loadDeptData();
        } else {
            toast.error(res.error || "Failed to assign lecturer");
        }
    }

    async function handleRemoveAssignment(assignmentId: number) {
        if (!confirm("Are you sure you want to remove this lecturer?")) return;
        const res = await removeLecturerFromCourse(assignmentId);
        if (res.success) {
            toast.success("Lecturer removed");
            loadDeptData();
        } else {
            toast.error(res.error || "Failed to remove lecturer");
        }
    }

    async function handleAddSlot() {
        if (!selectedAssignment || !newSlot.venueId) {
            toast.error("Please fill all fields");
            return;
        }

        const res = await saveTimetableSlot({
            courseLecturerId: selectedAssignment.id,
            ...newSlot as any,
            venueId: parseInt(newSlot.venueId)
        });

        if (res.success) {
            toast.success("Slot added successfully");
            setShowSlotDialog(false);
            loadDeptData();
        } else {
            toast.error(res.error || "Failed to add slot");
        }
    }

    async function handleDeleteSlot(id: number) {
        if (!confirm("Are you sure you want to delete this slot?")) return;
        const res = await deleteTimetableSlot(id);
        if (res.success) {
            toast.success("Slot removed");
            loadDeptData();
        }
    }

    const getSlotsForDayAndTime = (day: string, time: string) => {
        return assignments.flatMap((a: any) =>
            a.slots.filter((s: any) => s.day === day && s.startTime === time)
                .map((s: any) => ({ ...s, assignment: a }))
        );
    };

    // --- Search & Filter State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned' | 'co_lecturer'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // --- Filter Logic ---
    const filteredCourses = allCourses.filter((course: any) => {
        const matchesSearch = course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        const courseAssignments = assignments.filter((a: any) => a.courseId === course.id);

        if (filterStatus === 'assigned') return courseAssignments.length > 0;
        if (filterStatus === 'unassigned') return courseAssignments.length === 0;
        if (filterStatus === 'co_lecturer') return courseAssignments.some((a: any) => a.role === 'co_lecturer');

        return true;
    });

    // --- Pagination Logic ---
    const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
    const paginatedCourses = filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-8 pb-20">
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Configuration</CardTitle>
                        <Badge variant="outline" className="bg-white">{session.name} - Semester {session.currentSemester}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</label>
                            <Select
                                value={deptId}
                                onValueChange={setDeptId}
                                disabled={userRole === 'staff'}
                            >
                                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {departments.map((d: any) => (
                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {isEditor && deptId && (
                            <div className="flex gap-4">
                                <div className="space-y-2 flex-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settings</label>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowSettingsDialog(true)}
                                        className="w-full h-11 rounded-xl border-slate-200 flex items-center justify-start gap-3 px-4"
                                    >
                                        <Settings className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-600">Time Constraints</span>
                                    </Button>
                                </div>
                                <div className="space-y-2 flex-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Venues</label>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowVenueDialog(true)}
                                        className="w-full h-11 rounded-xl border-slate-200 flex items-center justify-start gap-3 px-4"
                                    >
                                        <Map className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-600">Register Rooms</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {submission && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</label>
                                <div className={cn(
                                    "h-11 rounded-xl px-4 flex items-center gap-3 border",
                                    submission.status === 'approved' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                                        submission.status === 'pending_approval' ? "bg-amber-50 border-amber-100 text-amber-700" :
                                            "bg-slate-50 border-slate-100 text-slate-600"
                                )}>
                                    {submission.status === 'approved' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase tracking-widest">DEAN APPROVED & LIVE</span>
                                        </>
                                    ) : submission.status === 'pending_approval' ? (
                                        <>
                                            <Clock4 className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase tracking-widest">PENDING DEAN APPROVAL</span>
                                        </>
                                    ) : (
                                        <>
                                            <Info className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">DRAFT STAGE (FACULTY VISIBLE)</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {submission && submission.status !== 'approved' && (
                        <div className="mt-8 p-6 bg-slate-900 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black italic uppercase text-lg">Dean Review Pending</h4>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">The Dean must provide final approval for this faculty timetable.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                {submission.status === 'draft' && (
                                    <>
                                        <Button
                                            onClick={() => setShowAutoScheduleDialog(true)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-12 rounded-xl shadow-xl shadow-indigo-500/20 uppercase text-[10px] tracking-widest"
                                        >
                                            <Wand2 className="w-4 h-4 mr-2" /> Auto-Schedule AI
                                        </Button>
                                        <Button
                                            onClick={handleSubmitForApproval}
                                            className="bg-slate-800 hover:bg-slate-900 text-white font-black px-8 h-12 rounded-xl shadow-xl shadow-slate-900/20 uppercase text-[10px] tracking-widest"
                                        >
                                            Submit for Dean Approval
                                        </Button>
                                    </>
                                )}
                                {submission.status === 'pending_approval' && canApprove && (
                                    <>
                                        <Button
                                            onClick={handleApprove}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 h-12 rounded-xl uppercase text-[10px] tracking-widest flex gap-2 items-center"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve & Publish
                                        </Button>
                                        <Button
                                            onClick={() => setShowReviewDialog(true)}
                                            variant="destructive"
                                            className="px-8 h-12 rounded-xl uppercase text-[10px] tracking-widest flex gap-2 items-center"
                                        >
                                            <XCircle className="w-4 h-4" /> Request Revision
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {deptId && (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    <div className="xl:col-span-1 space-y-6">
                        <Card className="border-none shadow-sm h-full flex flex-col">
                            <CardHeader className="border-b bg-slate-50/50">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Hour Allocation</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {assignments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-xs text-slate-400">No assignments found for this semester.</p>
                                    </div>
                                ) : (
                                    assignments.map((a: any) => (
                                        <div key={a.id} className="p-4 bg-white border rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-900">{a.course.code}</h4>
                                                    <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{a.course.name}</p>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className={cn("w-8 h-8 rounded-full", a.course.isPractical ? "text-indigo-600 bg-indigo-50" : "text-slate-300")}
                                                    onClick={() => handleTogglePractical(a.course.id, a.course.isPractical)}
                                                    title={a.course.isPractical ? "Practical Course" : "Mark as Practical"}
                                                >
                                                    <FlaskConical className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-tight">
                                                        <span>Lecture</span>
                                                        <span>{a.stats.lecture}/{a.requirements.lecture} H</span>
                                                    </div>
                                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full transition-all", a.stats.lecture >= a.requirements.lecture ? "bg-emerald-500" : "bg-indigo-500")}
                                                            style={{ width: `${Math.min(100, (a.stats.lecture / a.requirements.lecture) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                {a.requirements.practical > 0 && (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-tight">
                                                            <span>Practical</span>
                                                            <span>{a.stats.practical}/{a.requirements.practical} H</span>
                                                        </div>
                                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn("h-full transition-all", a.stats.practical >= a.requirements.practical ? "bg-emerald-500" : "bg-teal-500")}
                                                                style={{ width: `${Math.min(100, (a.stats.practical / a.requirements.practical) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                variant="outline"
                                                className="w-full text-[10px] h-8 rounded-lg font-bold"
                                                onClick={() => {
                                                    setSelectedAssignment(a);
                                                    setShowSlotDialog(true);
                                                }}
                                                disabled={submission?.status === 'approved'}
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add Slot
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="xl:col-span-3 space-y-6">
                        <Card className="border-none shadow-sm overflow-x-auto">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Weekly Schedule</CardTitle>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Lecture</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200"></div> Break</div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="min-w-[800px]">
                                    <div className="grid grid-cols-6 border-b border-slate-100 pb-4">
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Time</div>
                                        {DAYS.map(day => (
                                            <div key={day} className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">{day}</div>
                                        ))}
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {times.map(time => {
                                            const isBreak = time >= settings.breakStart && time < settings.breakEnd;
                                            return (
                                                <div key={time} className="grid grid-cols-6 items-stretch min-h-[100px]">
                                                    <div className="py-4 text-xs font-bold text-slate-400 flex items-start gap-2 pt-6">
                                                        <Clock className="w-3 h-3" />
                                                        {time}
                                                    </div>
                                                    {DAYS.map(day => {
                                                        const slots = getSlotsForDayAndTime(day, time);
                                                        return (
                                                            <div key={`${day}-${time}`} className={cn(
                                                                "p-2 border-l border-slate-50 flex flex-col gap-2",
                                                                isBreak ? "bg-slate-50/50" : "hover:bg-slate-50/30 transition-colors"
                                                            )}>
                                                                {isBreak ? (
                                                                    <div className="h-full flex items-center justify-center opacity-20 rotate-[-45deg] whitespace-nowrap overflow-hidden">
                                                                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">BREAK PERIOD</span>
                                                                    </div>
                                                                ) : (
                                                                    slots.map((slot: any) => (
                                                                        <div key={slot.id} className="bg-white border rounded-lg p-2 shadow-sm relative group hover:shadow-md transition-all border-indigo-100">
                                                                            <button
                                                                                onClick={() => handleDeleteSlot(slot.id)}
                                                                                disabled={submission?.status === 'approved' || !isEditor}
                                                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-50 rounded transition-all disabled:hidden"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">{slot.assignment.course.code}</p>
                                                                            <div className="mt-1 space-y-0.5">
                                                                                <div className="flex items-center gap-1 text-[9px] text-slate-600 font-bold group-hover:text-slate-900">
                                                                                    <User className="w-2 h-2" />
                                                                                    <span title={slot.assignment.staff.user.name}>{slot.assignment.staff.user.name.split(' ')[0]}...</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                                                                    <MapPin className="w-2 h-2" />
                                                                                    <span>{slot.venue?.name || 'No Venue'}</span>
                                                                                </div>
                                                                                <div className="flex gap-1 mt-1">
                                                                                    <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none text-[8px] h-4 py-0 px-1">L{slot.level}</Badge>
                                                                                    {slot.type === 'practical' && <Badge className="bg-teal-50 text-teal-600 border-none text-[8px] h-4 py-0 px-1 uppercase">P</Badge>}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div >
            )
            }

            <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle>Add Timetable Slot</DialogTitle>
                        <DialogDescription>
                            Schedule a slot for {selectedAssignment?.course.code}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold text-slate-500">Day</label>
                            <Select
                                value={newSlot.day}
                                onValueChange={(val) => setNewSlot(prev => ({ ...prev, day: val }))}
                            >
                                <SelectTrigger className="col-span-3 rounded-lg h-10 border-slate-200 bg-slate-50 text-slate-900">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl bg-white">
                                    {DAYS.map(day => (
                                        <SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold text-slate-500">Starts</label>
                            <Select
                                value={newSlot.startTime}
                                onValueChange={(val) => {
                                    const hour = parseInt(val.split(':')[0]);
                                    setNewSlot(prev => ({
                                        ...prev,
                                        startTime: val,
                                        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
                                    }));
                                }}
                            >
                                <SelectTrigger className="col-span-3 rounded-lg h-10 border-slate-200 bg-slate-50 text-slate-900">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl bg-white">
                                    {times.map(time => (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold text-slate-500">Venue</label>
                            <Select
                                value={newSlot.venueId}
                                onValueChange={(val) => setNewSlot(prev => ({ ...prev, venueId: val }))}
                            >
                                <SelectTrigger className="col-span-3 rounded-lg h-10 border-slate-200 bg-slate-50 text-slate-900">
                                    <SelectValue placeholder="Select Venue" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl bg-white">
                                    {venues.map(v => (
                                        <SelectItem key={v.id} value={v.id.toString()}>{v.name} (Cap: {v.capacity})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold text-slate-500">Type</label>
                            <Select
                                value={newSlot.type}
                                onValueChange={(val: any) => setNewSlot(prev => ({ ...prev, type: val }))}
                            >
                                <SelectTrigger className="col-span-3 rounded-lg h-10 border-slate-200 bg-slate-50 text-slate-900">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl bg-white">
                                    <SelectItem value="lecture">Lecture (Normal Class)</SelectItem>
                                    <SelectItem value="practical">Practical (Workshop/Lab)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold text-slate-500">Level</label>
                            <Select
                                value={newSlot.level.toString()}
                                onValueChange={(val) => setNewSlot(prev => ({ ...prev, level: parseInt(val) }))}
                            >
                                <SelectTrigger className="col-span-3 rounded-lg h-10 border-slate-200 bg-slate-50 text-slate-900">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl bg-white">
                                    {[100, 200, 300, 400, 500, 600].map(l => (
                                        <SelectItem key={l} value={l.toString()}>{l} Level</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleAddSlot}
                            disabled={submission?.status === 'approved'}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                        >
                            Save Schedule Slot
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Timetable Constraints Dialog */}
            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle>Timetable Constraints</DialogTitle>
                        <DialogDescription>Define the available hours and break period for this department.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateSettings} className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Day Start</label>
                                <Input
                                    type="time"
                                    value={settings.timetableStart}
                                    onChange={e => setSettings({ ...settings, timetableStart: e.target.value })}
                                    className="rounded-xl bg-slate-50 text-slate-900 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Day End</label>
                                <Input
                                    type="time"
                                    value={settings.timetableEnd}
                                    onChange={e => setSettings({ ...settings, timetableEnd: e.target.value })}
                                    className="rounded-xl bg-slate-50 text-slate-900 border-slate-200"
                                />
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Break Start</label>
                                <Input
                                    type="time"
                                    value={settings.breakStart}
                                    onChange={e => setSettings({ ...settings, breakStart: e.target.value })}
                                    className="rounded-xl bg-slate-50 text-slate-900 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Break End</label>
                                <Input
                                    type="time"
                                    value={settings.breakEnd}
                                    onChange={e => setSettings({ ...settings, breakEnd: e.target.value })}
                                    className="rounded-xl bg-slate-50 text-slate-900 border-slate-200"
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 bg-slate-900 rounded-xl font-black uppercase tracking-widest text-xs text-white">Update Constraints</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Revision Request Dialog */}
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Request Revision</DialogTitle>
                        <DialogDescription>Provide feedback on why this timetable needs changes.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Type instructions for the department staff..."
                            value={reviewNotes}
                            onChange={e => setReviewNotes(e.target.value)}
                            className="min-h-[150px] rounded-2xl p-4"
                        />
                        <Button
                            onClick={handleRequestRevision}
                            disabled={!reviewNotes}
                            className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest text-xs"
                        >
                            Send Review Instructions
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Comments / Review Column (Optional Sidebar or floating button) */}
            {
                submission && (
                    <div className="fixed bottom-8 right-8 z-50">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="w-14 h-14 rounded-full bg-slate-900 shadow-2xl flex items-center justify-center relative group">
                                    <MessageSquare className="w-6 h-6 text-white" />
                                    {submission.comments?.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-4 border-white">
                                            {submission.comments.length}
                                        </span>
                                    )}
                                    <span className="absolute right-full mr-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                                        Management Review Chat
                                    </span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-2xl overflow-hidden p-0 h-[600px] flex flex-col">
                                <DialogHeader className="p-6 bg-slate-50 border-b shrink-0">
                                    <DialogTitle className="flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                                        Review & Complaints
                                    </DialogTitle>
                                    <DialogDescription>Internal comments regarding the {settings.name} timetable.</DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="flex-1 p-6">
                                    <div className="space-y-6">
                                        {!submission.comments?.length && (
                                            <div className="text-center py-10">
                                                <p className="text-slate-400 text-xs font-medium italic">No comments or complaints yet.</p>
                                            </div>
                                        )}
                                        {submission.comments?.map((comment: any) => (
                                            <div key={comment.id} className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{comment.user.name.split(' ')[0]}</span>
                                                    <span className="text-[9px] font-bold text-slate-300">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                    <p className="text-xs text-slate-600 leading-relaxed">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="p-4 bg-white border-t space-y-3 shrink-0">
                                    <Textarea
                                        placeholder="Add a comment or observation..."
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        className="min-h-[80px] rounded-2xl text-xs border-slate-100 focus:ring-slate-200"
                                    />
                                    <Button
                                        onClick={handleAddComment}
                                        disabled={!newComment}
                                        className="w-full h-11 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] flex gap-2"
                                    >
                                        <Send className="w-3 h-3" /> Post Comment
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )
            }

            <VenueDialog
                open={showVenueDialog}
                onOpenChange={setShowVenueDialog}
                venues={venues}
                newVenue={newVenue}
                setNewVenue={setNewVenue}
                onSave={handleSaveVenue}
            />
            <Dialog open={showAutoScheduleDialog} onOpenChange={setShowAutoScheduleDialog}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-900">AI Auto-Scheduler</DialogTitle>
                        <DialogDescription>
                            Automatically fill the timetable with optimal slots, avoiding all clashes and constraints.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl">
                            <input 
                                type="checkbox" 
                                id="preserve" 
                                checked={preserveExisting} 
                                onChange={(e) => setPreserveExisting(e.target.checked)} 
                                className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <label htmlFor="preserve" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Preserve existing manually-placed slots
                            </label>
                        </div>
                        <p className="text-xs text-slate-500 px-1">
                            If checked, the AI will schedule around blocks you've already created. If unchecked, the AI will completely wipe the board and start fresh.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAutoScheduleDialog(false)} className="rounded-xl">Cancel</Button>
                        <Button 
                            onClick={handleAutoSchedule} 
                            disabled={isGenerating}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                        >
                            {isGenerating ? "Generating..." : "Generate Timetable"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

{/* Venue Management Dialog */ }
function VenueDialog({ open, onOpenChange, venues, newVenue, setNewVenue, onSave }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white">
                <DialogHeader>
                    <DialogTitle>Register Lecture Spaces</DialogTitle>
                    <DialogDescription>Add available venues for this faculty.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Venue Name</label>
                        <Input
                            placeholder="e.g. Hall A, 500 Capacity Aud..."
                            value={newVenue.name}
                            onChange={e => setNewVenue({ ...newVenue, name: e.target.value })}
                            className="rounded-xl bg-slate-50 border-slate-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capacity (Optional)</label>
                        <Input
                            type="number"
                            placeholder="e.g. 50"
                            value={newVenue.capacity}
                            onChange={e => setNewVenue({ ...newVenue, capacity: e.target.value })}
                            className="rounded-xl bg-slate-50 border-slate-200"
                        />
                    </div>
                    <Button
                        onClick={onSave}
                        className="w-full h-12 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs"
                    >
                        Save Venue
                    </Button>

                    <div className="mt-6">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Registered Venues</label>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {venues.map((v: any) => (
                                <div key={v.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-100">
                                            <MapPin className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{v.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">Capacity: {v.capacity || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {venues.length === 0 && <p className="text-[10px] text-slate-400 italic text-center py-4">No venues registered for this faculty yet.</p>}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { cn } from "@/lib/utils";
