"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    BookOpen, Search, Plus, Trash2, Save, Loader2, CheckCircle2, User, RefreshCw
} from "lucide-react";
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

function AdminCourseRegistrationManageContent() {
    const searchParams = useSearchParams();
    const initialStudentId = searchParams.get("studentId");

    const [sessions, setSessions] = useState<any[]>([]);
    const [sessionId, setSessionId] = useState<number>(6);
    const [semester, setSemester] = useState<"1" | "2">("1");

    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
        initialStudentId ? parseInt(initialStudentId) : null
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
            const current = data.find((s: any) => s.isCurrent);
            if (current) setSessionId(current.id);
        });
    }, []);

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
            setSelectedCourseIds((res.registeredCourses || []).map((c: any) => c.id));
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

    async function handleSave() {
        if (!selectedStudentId) return;
        if (selectedCourseIds.length === 0) {
            toast.error("Select at least one course before saving.");
            return;
        }
        setSaving(true);
        const res = await adminUpdateStudentCoursesAction(
            selectedStudentId,
            sessionId,
            semester,
            selectedCourseIds
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
    }).slice(0, 60);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Admin Course Registration Editor</h1>
                        <p className="text-sm text-slate-500">Add or remove courses on any student&apos;s submitted registration</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Select value={String(sessionId)} onValueChange={(v) => setSessionId(Number(v))}>
                        <SelectTrigger className="w-40 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {sessions.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={semester} onValueChange={(v) => setSemester(v as "1" | "2")}>
                        <SelectTrigger className="w-40 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">First Semester</SelectItem>
                            <SelectItem value="2">Second Semester</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Student Search */}
            <Card>
                <CardContent className="p-5">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <Input
                            placeholder="Search student by Matric Number or Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={searching} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
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
                                    className="text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition"
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
                <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /></div>
            ) : selectedStudentId && studentInfo ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Student's Registered Courses */}
                    <Card>
                        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="w-5 h-5 text-indigo-600" />
                                    {studentInfo.fullName}
                                </CardTitle>
                                <p className="text-xs font-mono text-slate-500 mt-1">
                                    {studentInfo.matricNumber} • {studentInfo.departmentName} • {studentInfo.levelLabel}
                                </p>
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1">
                                {selectedCourseObjects.length} Courses • {totalUnits} Units
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3">
                            {selectedCourseObjects.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">No courses selected. Add courses from the right panel.</div>
                            ) : (
                                selectedCourseObjects.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                                        <div>
                                            <div className="font-bold text-sm text-slate-900">{c.code} — {c.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                <span>{c.units} Units</span>
                                                {c.isCarryOver && (
                                                    <Badge className="bg-amber-100 text-amber-800 text-[10px]">Carry-over</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => removeCourse(c.id)}
                                            className="text-rose-600 border-rose-200 hover:bg-rose-50 gap-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Remove
                                        </Button>
                                    </div>
                                ))
                            )}

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || selectedCourseIds.length === 0}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 px-6 font-bold"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Course Registration
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Add Courses */}
                    <Card>
                        <CardHeader className="border-b border-slate-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-600" />
                                Add Courses
                            </CardTitle>
                            <Input
                                placeholder="Filter courses by code or title..."
                                value={courseSearch}
                                onChange={(e) => setCourseSearch(e.target.value)}
                                className="mt-2"
                            />
                        </CardHeader>
                        <CardContent className="p-5 space-y-2 max-h-[540px] overflow-y-auto">
                            {filteredCandidates.map((c) => {
                                const isDeptCourse = availableCourses.some((av) => av.id === c.id);
                                return (
                                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
                                        <div>
                                            <div className="font-bold text-sm text-slate-900">{c.code} — {c.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                <span>{c.units} Units</span>
                                                {isDeptCourse && <Badge className="bg-emerald-50 text-emerald-700 text-[10px]">Recommended / Dept</Badge>}
                                                {c.isCarryOver && <Badge className="bg-amber-100 text-amber-800 text-[10px]">Carry-over</Badge>}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => addCourse(c.id)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 shrink-0"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add
                                        </Button>
                                    </div>
                                );
                            })}
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
