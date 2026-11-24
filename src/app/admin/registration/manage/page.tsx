"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    BookOpen, Search, Plus, Trash2, Save, Loader2, User, Printer, AlertTriangle, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { getAcademicSessions } from "@/actions/portal";
import {
    adminSearchStudentsForRegistrationAction,
    adminGetStudentRegistrationDetailAction,
    adminUpdateStudentCoursesAction,
} from "@/actions/course-registration";
import { printOfficialCourseForms, type CourseFormData } from "@/components/documents/CourseFormPrintable";

function AdminCourseRegistrationManageContent() {
    const searchParams = useSearchParams();
    const paramStudentId = searchParams.get("studentId");
    const paramSessionId = searchParams.get("sessionId");
    const paramSemester = searchParams.get("semester") as "1" | "2" | null;

    const [sessions, setSessions] = useState<any[]>([]);
    const [sessionId, setSessionId] = useState<number>(paramSessionId ? parseInt(paramSessionId) : 6);
    const [semester, setSemester] = useState<"1" | "2">(paramSemester === "2" ? "2" : "1");

    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
        paramStudentId ? parseInt(paramStudentId) : null
    );
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [registeredCourses, setRegisteredCourses] = useState<any[]>([]);
    const [availableCourses, setAvailableCourses] = useState<any[]>([]);
    const [allCourses, setAllCourses] = useState<any[]>([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [courseSearch, setCourseSearch] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getAcademicSessions().then((data) => {
            setSessions(data);
            if (!paramSessionId) {
                const current = data.find((s: any) => s.isCurrent);
                if (current) setSessionId(current.id);
            }
        });
    }, [paramSessionId]);

    useEffect(() => {
        if (selectedStudentId && sessionId) {
            loadStudentDetail(selectedStudentId, sessionId, semester);
        }
    }, [selectedStudentId, sessionId, semester]);

    async function handleSearch(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        const res = await adminSearchStudentsForRegistrationAction(searchQuery);
        setSearching(false);
        if (res.success) {
            setSearchResults(res.data || []);
            if (res.data?.length === 0) {
                toast.info("No matching students found.");
            }
        } else {
            toast.error(res.error || "Search failed");
        }
    }

    async function loadStudentDetail(sid: number, sessId: number, sem: "1" | "2") {
        setLoadingDetail(true);
        const res = await adminGetStudentRegistrationDetailAction(sid, sessId, sem);
        setLoadingDetail(false);
        if (res.success) {
            setStudentInfo(res.studentInfo);
            setRegisteredCourses(res.registeredCourses || []);
            setAvailableCourses(res.availableCourses || []);
            setAllCourses(res.allCourses || []);
            setSelectedCourseIds(Array.from(new Set((res.registeredCourses || []).map((c: any) => c.id))));
        } else {
            toast.error(res.error || "Failed to load student registration");
        }
    }

    function addCourse(courseId: number) {
        setSelectedCourseIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
    }

    function removeCourse(courseId: number) {
        setSelectedCourseIds((prev) => prev.filter((id) => id !== courseId));
    }

    async function handleClearAll() {
        if (!selectedStudentId) return;
        if (!confirm("Are you sure you want to remove ALL registered courses for this student in this semester?")) return;
        setSaving(true);
        const res = await adminUpdateStudentCoursesAction(
            selectedStudentId,
            sessionId,
            semester,
            []
        );
        setSaving(false);
        if (res.success) {
            toast.success("All registered courses removed.");
            await loadStudentDetail(selectedStudentId, sessionId, semester);
        } else {
            toast.error(res.error || "Failed to remove courses");
        }
    }

    async function handleSave() {
        if (!selectedStudentId) return;
        setSaving(true);
        const res = await adminUpdateStudentCoursesAction(
            selectedStudentId,
            sessionId,
            semester,
            Array.from(new Set(selectedCourseIds))
        );
        setSaving(false);
        if (res.success) {
            toast.success(`Updated student's course registration (${res.totalUnits} units).`);
            await loadStudentDetail(selectedStudentId, sessionId, semester);
        } else {
            toast.error(res.error || "Failed to update courses");
        }
    }

    // Build combined lookup for displaying selected courses
    const courseLookup = new Map<number, any>();
    for (const c of allCourses) courseLookup.set(c.id, c);
    for (const c of availableCourses) courseLookup.set(c.id, c);
    for (const c of registeredCourses) courseLookup.set(c.id, c);

    const selectedCourseObjects = selectedCourseIds
        .map((id) => courseLookup.get(id))
        .filter(Boolean);
    const totalUnits = selectedCourseObjects.reduce(
        (sum, c) => sum + Number(c.units || 0),
        0
    );

    function handlePrint() {
        if (!studentInfo || selectedCourseObjects.length === 0) {
            toast.error("No registered courses to print.");
            return;
        }
        const formData: CourseFormData = {
            matricNumber: studentInfo.matricNumber || '',
            fullName: studentInfo.fullName || '',
            levelLabel: studentInfo.levelLabel || '',
            program: studentInfo.program || 'FULL-TIME',
            sessionSemester: studentInfo.sessionSemester || '',
            departmentName: studentInfo.departmentName || '',
            imageUrl: studentInfo.imageUrl || null,
            signatureUrl: studentInfo.signatureUrl || null,
            courses: selectedCourseObjects.map((c: any) => ({
                id: c.id,
                code: c.code || '',
                title: c.name || '',
                units: Number(c.units) || 0,
                statusCode: c.statusCode || (c.status === 'elective' ? 'E' : c.status === 'required' ? 'R' : 'C'),
                isCarryOver: Boolean(c.isCarryOver),
            })),
        };
        printOfficialCourseForms([formData]);
    }

    const candidatePool = [
        ...availableCourses,
        ...allCourses.filter((ac) => !availableCourses.some((av) => av.id === ac.id)),
    ].filter((c) => !selectedCourseIds.includes(c.id));

    const filteredCandidates = candidatePool.filter((c) => {
        if (!courseSearch.trim()) return true;
        const q = courseSearch.toLowerCase();
        return (
            (c.code || "").toLowerCase().includes(q) ||
            (c.name || "").toLowerCase().includes(q)
        );
    }).slice(0, 80);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/ict/course-registrations"
                        className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-sm"
                        title="Back to Print Queue"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Admin Course Registration Editor</h1>
                        <p className="text-sm text-slate-500">Add or remove courses on any student&apos;s submitted course registration</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Select value={String(sessionId)} onValueChange={(v) => setSessionId(Number(v))}>
                        <SelectTrigger className="w-40 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {sessions.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={semester} onValueChange={(v) => setSemester(v as "1" | "2")}>
                        <SelectTrigger className="w-40 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">First Semester</SelectItem>
                            <SelectItem value="2">Second Semester</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Student Search */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="p-5">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <Input
                            placeholder="Search student by Matric Number, Admission Number, or Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 h-11"
                        />
                        <Button type="submit" disabled={searching} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-5 gap-2 font-semibold">
                            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Search Student
                        </Button>
                    </form>

                    {searchResults.length > 0 && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {searchResults.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedStudentId(s.id);
                                        setSearchResults([]);
                                    }}
                                    className="text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition bg-white"
                                >
                                    <div className="font-bold text-sm text-slate-900">
                                        {s.name || `${s.lastName || ""} ${s.firstName || ""}`.trim()}
                                    </div>
                                    <div className="text-xs font-mono text-indigo-700 mt-0.5">{s.matricNumber || s.admissionNumber || `ID: ${s.id}`}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">{s.deptName || "No Dept"} • {s.programmeType} {s.currentLevel || ""}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {loadingDetail ? (
                <div className="p-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-xs text-slate-500 mt-2 font-medium">Loading course registration...</p>
                </div>
            ) : selectedStudentId && studentInfo ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Student's Registered Courses */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-900">
                                    <User className="w-5 h-5 text-indigo-600" />
                                    {studentInfo.fullName}
                                </CardTitle>
                                <p className="text-xs font-mono text-slate-500 mt-1">
                                    {studentInfo.matricNumber} • {studentInfo.departmentName} • {studentInfo.levelLabel}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 font-bold">
                                    {selectedCourseObjects.length} Courses • {totalUnits} Units
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                                <span>CURRENTLY REGISTERED COURSES</span>
                                {selectedCourseObjects.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearAll}
                                        disabled={saving}
                                        className="text-rose-600 hover:text-rose-700 font-bold hover:underline"
                                    >
                                        Delete All Courses
                                    </button>
                                )}
                            </div>

                            {selectedCourseObjects.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                                    <p className="font-semibold text-sm">No courses registered</p>
                                    <p className="text-xs text-slate-400 mt-1">Add courses from the right panel to register them for this student.</p>
                                </div>
                            ) : (
                                selectedCourseObjects.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition">
                                        <div>
                                            <div className="font-bold text-sm text-slate-900">{c.code} — {c.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                <span className="font-semibold text-slate-700">{c.units} Units</span>
                                                {c.isCarryOver && (
                                                    <Badge className="bg-amber-100 text-amber-800 text-[10px]">Carry-over</Badge>
                                                )}
                                                {c.statusCode && (
                                                    <Badge variant="outline" className="text-[10px] uppercase font-mono">{c.statusCode}</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => removeCourse(c.id)}
                                            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 gap-1 font-semibold"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </Button>
                                    </div>
                                ))
                            )}

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handlePrint}
                                    disabled={selectedCourseObjects.length === 0}
                                    className="gap-2 h-11 px-4 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                                >
                                    <Printer className="w-4 h-4 text-slate-600" />
                                    Print Form
                                </Button>

                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 px-6 font-bold shadow-md"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save & Apply Courses
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Add Courses */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-900">
                                <Plus className="w-5 h-5 text-emerald-600" />
                                Add Courses to Form
                            </CardTitle>
                            <Input
                                placeholder="Search courses by code or title (e.g. COM 111, MTH)..."
                                value={courseSearch}
                                onChange={(e) => setCourseSearch(e.target.value)}
                                className="mt-2 h-10"
                            />
                        </CardHeader>
                        <CardContent className="p-5 space-y-2 max-h-[560px] overflow-y-auto">
                            {filteredCandidates.length === 0 ? (
                                <div className="p-10 text-center text-slate-400 text-sm">
                                    No courses found matching &ldquo;{courseSearch}&rdquo;
                                </div>
                            ) : (
                                filteredCandidates.map((c) => {
                                    const isDeptCourse = availableCourses.some((av) => av.id === c.id);
                                    return (
                                        <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 transition bg-white">
                                            <div>
                                                <div className="font-bold text-sm text-slate-900">{c.code} — {c.name}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                    <span className="font-semibold text-slate-700">{c.units} Units</span>
                                                    {isDeptCourse && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Recommended / Dept</Badge>}
                                                    {c.isCarryOver && <Badge className="bg-amber-100 text-amber-800 text-[10px]">Carry-over</Badge>}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => addCourse(c.id)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 shrink-0 font-semibold h-8 px-3"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Add
                                            </Button>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </div>
    );
}

export default function AdminCourseRegistrationManagePage() {
    return (
        <Suspense fallback={<div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /></div>}>
            <AdminCourseRegistrationManageContent />
        </Suspense>
    );
}
