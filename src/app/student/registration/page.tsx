"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    BookOpen,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ShieldCheck,
    Info,
    Lock,
    ChevronRight,
    GraduationCap,
    Clock,
    Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getStudentByUserId } from "@/actions/students";
import { getCourses } from "@/actions/courses";
// I should use actions instead.
import { registerCourses } from "@/actions/registration";
import { getCurrentSession } from "@/actions/portal";
import { checkRegistrationAccess, requestConcession } from "@/actions/concessions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StudentRegistration() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<any>(null);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [availableCourses, setAvailableCourses] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [access, setAccess] = useState<{ canRegister: boolean; reason?: string; hasPendingConcession?: boolean } | null>(null);
    const [showConcessionForm, setShowConcessionForm] = useState(false);
    const [concessionReason, setConcessionReason] = useState("");

    useEffect(() => {
        if (session?.user) fetchData();
    }, [session]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const userId = (session?.user as any).id;
            const studentData = await getStudentByUserId(userId);
            if (!studentData) {
                setError("Student profile not found.");
                setLoading(false);
                return;
            }
            setStudent(studentData);

            // 2. Fetch Current Session
            const sessionData = await getCurrentSession();
            if (!sessionData) {
                setError("No active academic session found.");
                setLoading(false);
                return;
            }
            setActiveSession(sessionData);

            // 3. Check Registration Access
            const accessData = await checkRegistrationAccess(studentData.id, sessionData.id);
            setAccess(accessData);

            if (!accessData.canRegister) {
                setLoading(false);
                return;
            }

            // 4. Fetch Courses
            const allCourses = await getCourses();
            setAvailableCourses(allCourses);

        } catch (err) {
            console.error(err);
            setError("Failed to load registration data.");
        }
        setLoading(false);
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const totalUnits = availableCourses
        .filter(c => selectedIds.includes(c.id))
        .reduce((sum, c) => sum + (c.creditUnits || 0), 0);

    const handleSubmit = async () => {
        if (selectedIds.length === 0) return toast.error("Select at least one course");
        setIsSubmitting(true);
        const res = await registerCourses(student.id, selectedIds, activeSession.name, parseInt(activeSession.currentSemester));
        if (res.success) {
            toast.success((res as any).message || "Registration successful");
            // Optionally redirect
        } else {
            toast.error((res as any).error || "Registration failed");
        }
        setIsSubmitting(false);
    };

    const handleRequestConcession = async () => {
        if (!concessionReason) return toast.error("Please provide a reason");
        setIsSubmitting(true);
        const res = await requestConcession({
            studentId: student.id,
            sessionId: activeSession.id,
            reason: concessionReason
        });
        if (res.success) {
            toast.success("Concession request submitted to DVC");
            fetchData();
        } else {
            toast.error(res.error || "Failed to submit request");
        }
        setIsSubmitting(false);
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>;
    if (error) return <div className="p-20 text-center text-red-500 font-bold">{error}</div>;

    if (access && !access.canRegister) {
        return (
            <div className="p-8 max-w-4xl mx-auto space-y-8">
                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    <CardHeader className="p-12 text-center space-y-4">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-rose-200">
                            <Lock className="w-10 h-10 text-rose-500" />
                        </div>
                        <CardTitle className="text-4xl font-black italic uppercase tracking-tight text-slate-900">Portal Locked</CardTitle>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs leading-loose max-w-lg mx-auto">
                            The registration portal is currently closed for your level ({student?.currentLevel}L).
                            Standard enrollment is only available during the institution's official windows.
                        </p>
                    </CardHeader>
                    <CardContent className="p-12 pt-0 space-y-8">
                        {access.hasPendingConcession ? (
                            <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 flex gap-6 items-center">
                                <Clock className="w-8 h-8 text-amber-500 shrink-0" />
                                <div>
                                    <h4 className="font-black italic uppercase text-amber-900">Request Under Review</h4>
                                    <p className="text-xs font-bold text-amber-700/60 uppercase tracking-widest mt-1">
                                        Your concession request has been received and is waiting for DVC approval.
                                        Check back shortly for portal access.
                                    </p>
                                </div>
                            </div>
                        ) : showConcessionForm ? (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Reason for special access request</label>
                                    <textarea
                                        value={concessionReason}
                                        onChange={e => setConcessionReason(e.target.value)}
                                        className="w-full rounded-2xl border-slate-200 p-6 font-medium text-sm focus:ring-2 focus:ring-indigo-500 min-h-[150px]"
                                        placeholder="Explain why you need registration access after the ddl (e.g. Health issues, delayed payment clearance...)"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        onClick={handleRequestConcession}
                                        disabled={isSubmitting || !concessionReason}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-8 rounded-2xl shadow-xl uppercase text-xs tracking-widest"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit to DVC for Approval"}
                                    </Button>
                                    <Button
                                        onClick={() => setShowConcessionForm(false)}
                                        variant="outline"
                                        className="px-8 py-8 rounded-2xl font-black uppercase text-xs tracking-widest"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <Button
                                    onClick={() => setShowConcessionForm(true)}
                                    className="bg-slate-900 hover:bg-black text-white px-12 py-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl"
                                >
                                    Apply for Special Concession
                                </Button>
                                <p className="mt-6 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Only legitimate requests will be reviewed by the DVC office.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    const compulsoryCourses = availableCourses.filter(c => c.setting?.status === 'compulsory');
    const requiredCourses = availableCourses.filter(c => c.setting?.status === 'required');
    const electiveCourses = availableCourses.filter(c => c.setting?.status === 'elective');
    const gstCourses = availableCourses.filter(c => c.isGST);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <BookOpen className="w-10 h-10 text-indigo-600" />
                        Course Registration
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        {activeSession?.currentSemester === '1' ? 'First' : 'Second'} Semester, {activeSession?.name} Session
                    </p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex items-center gap-8 min-w-[300px]">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Unit Load</p>
                        <h2 className={cn("text-3xl font-black", totalUnits > 24 ? "text-rose-500" : "text-indigo-600")}>
                            {totalUnits} <span className="text-sm text-slate-300 font-bold">/ 24 Units</span>
                        </h2>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || totalUnits === 0 || totalUnits > 24}
                        className="bg-slate-900 hover:bg-black text-white px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalize Registration"}
                    </Button>
                </div>
            </div>

            {activeSession?.isAddDropOpen && (
                <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 flex flex-col md:flex-row justify-between items-center gap-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex gap-6 items-center">
                        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100/50">
                            <Plus className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black italic uppercase text-indigo-900">Add/Drop Window Active</h4>
                            <p className="text-xs font-bold text-indigo-700/60 uppercase tracking-widest mt-1">
                                You can now request to add or remove courses for this semester.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push('/student/registration/add-drop')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 py-7 rounded-2xl shadow-xl shadow-indigo-100 uppercase text-xs tracking-widest flex gap-3 transition-all hover:scale-105"
                    >
                        Open Add/Drop Module
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-10">
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Compulsory Courses
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {compulsoryCourses.map(course => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    isSelected={selectedIds.includes(course.id)}
                                    onToggle={() => toggleSelection(course.id)}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Required Courses
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {requiredCourses.map(course => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    isSelected={selectedIds.includes(course.id)}
                                    onToggle={() => toggleSelection(course.id)}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Electives
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {electiveCourses.map(course => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    isSelected={selectedIds.includes(course.id)}
                                    onToggle={() => toggleSelection(course.id)}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" /> University Required (GST)
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {gstCourses.map(course => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    isSelected={selectedIds.includes(course.id)}
                                    onToggle={() => toggleSelection(course.id)}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden sticky top-8">
                        <CardHeader className="p-8">
                            <CardTitle className="text-xl font-black uppercase italic tracking-tight">Registration Guide</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</div>
                                    <p className="text-sm font-medium text-indigo-100">Select all compulsory and required courses for your level.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</div>
                                    <p className="text-sm font-medium text-indigo-100">Ensure your total units are between 18 and 24.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">3</div>
                                    <p className="text-sm font-medium text-indigo-100">Click "Finalize" to submit for HOD approval.</p>
                                </div>
                            </div>

                            <div className="p-6 bg-white/10 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5" />
                                    <h4 className="font-black text-[10px] uppercase tracking-widest">Important Note</h4>
                                </div>
                                <p className="text-xs text-indigo-100 leading-relaxed font-medium">Courses with missing prerequisites will appear locked. You must pass the required preceding course to unlock them.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function CourseCard({ course, isSelected, onToggle }: { course: any, isSelected: boolean, onToggle: () => void }) {
    if (course.locked) {
        return (
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center justify-between opacity-60 grayscale cursor-not-allowed">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-slate-200 rounded-2xl">
                        <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-400">{course.code}: {course.name}</h4>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" /> Prerequisite Required
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black text-slate-300">{course.creditUnits} <span className="text-[10px] uppercase">Units</span></p>
                </div>
            </div>
        );
    }

    return (
        <label className={cn(
            "group flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all cursor-pointer",
            isSelected ? "border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100/50" : "border-slate-100 bg-white hover:border-indigo-200"
        )}>
            <input
                type="checkbox"
                className="hidden"
                checked={isSelected}
                onChange={onToggle}
            />
            <div className="flex items-center gap-6">
                <div className={cn(
                    "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all",
                    isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-200 bg-white group-hover:border-indigo-400"
                )}>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                </div>
                <div>
                    <h4 className={cn("text-lg font-black tracking-tight", isSelected ? "text-indigo-900" : "text-slate-800")}>
                        {course.code}: {course.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                        {course.isGST && <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black uppercase rounded-full tracking-tighter">Univ. Required</span>}
                        {course.countsForCgpa ? (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> CGPA Compatible
                            </span>
                        ) : (
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                <Info className="w-3 h-3" /> Non-CGPA Course
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className={cn("text-2xl font-black", isSelected ? "text-indigo-600" : "text-slate-900")}>
                    {course.creditUnits} <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Units</span>
                </p>
            </div>
        </label>
    );
}
