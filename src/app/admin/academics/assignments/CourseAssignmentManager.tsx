"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    BookOpen, Users, Search, Filter, ChevronDown, ChevronRight, Plus, X,
    Loader2, CheckCircle2, XCircle, GraduationCap, Building2, Layers,
    UserCheck, RefreshCw, AlertCircle, Star, BookMarked, ArrowRight
} from "lucide-react";
import {
    assignCourseToLecturer,
    getCourseAssignments,
    getDepartmentStaff,
    removeLecturerFromCourse,
    getDepartmentCourses,
    getAllCourseAssignmentsForSession,
    getAllStaff,
} from "@/actions/timetable";
import { cn } from "@/lib/utils";

// ---- Toast ----
function Toast({ message, type }: { message: string; type: "success" | "error" }) {
    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-semibold",
            "animate-in slide-in-from-bottom-4 duration-300",
            type === "success" ? "bg-emerald-600" : "bg-rose-600"
        )}>
            {type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            {message}
        </div>
    );
}

// ---- Level label helper ----
function levelLabel(level: number | string | null | undefined) {
    const map: Record<string, string> = { "1": "ND 1", "2": "ND 2", "3": "HND 1", "4": "HND 2" };
    return map[String(level)] || (level ? `Level ${level}` : "—");
}

// ---- Inline staff picker dropdown ----
function StaffPicker({
    staff,
    onSelect,
    onClose,
}: {
    staff: any[];
    onSelect: (staffId: number, role: "main" | "co_lecturer") => void;
    onClose: () => void;
}) {
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<"main" | "co_lecturer">("main");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    const filtered = staff.filter(s =>
        s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.jobTitle?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div
            ref={ref}
            className="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        >
            <div className="p-3 border-b border-slate-100 space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search lecturer..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </div>
                <div className="flex gap-2">
                    {(["main", "co_lecturer"] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setRole(r)}
                            className={cn(
                                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                                role === r ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            {r === "main" ? "Main Lecturer" : "Co-Lecturer"}
                        </button>
                    ))}
                </div>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                {filtered.length === 0 ? (
                    <p className="py-6 text-center text-slate-400 text-xs">No staff found</p>
                ) : (
                    filtered.map(s => (
                        <button
                            key={s.id}
                            onClick={() => onSelect(s.id, role)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left"
                        >
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                                {s.user?.name?.charAt(0) || "?"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{s.user?.name}</p>
                                <p className="text-xs text-slate-400 truncate">{s.jobTitle || s.rank || "Lecturer"}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 ml-auto" />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

// ---- Course Card ----
function CourseCard({
    course,
    assignments,
    availableStaff,
    isEditor,
    onAssign,
    onRemove,
    deptName,
}: {
    course: any;
    assignments: any[];
    availableStaff: any[];
    isEditor: boolean;
    onAssign: (courseId: number, deptId: number, staffId: number, role: "main" | "co_lecturer") => Promise<void>;
    onRemove: (assignmentId: number) => Promise<void>;
    deptName?: string;
}) {
    const [showPicker, setShowPicker] = useState(false);
    const [removing, setRemoving] = useState<number | null>(null);

    const mainLecturer = assignments.find(a => a.role === "main");
    const coLecturers = assignments.filter(a => a.role === "co_lecturer");
    const isAssigned = assignments.length > 0;

    return (
        <div className={cn(
            "relative bg-white rounded-2xl border-2 transition-all hover:shadow-lg",
            isAssigned ? "border-indigo-100" : "border-slate-100 hover:border-slate-200"
        )}>
            {/* Status bar */}
            <div className={cn(
                "h-1 rounded-t-2xl",
                isAssigned ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-slate-100"
            )} />

            <div className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                {course.code}
                            </span>
                            {course.settings?.level && (
                                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
                                    {levelLabel(course.settings.level)}
                                </span>
                            )}
                            <span className="text-xs font-bold text-slate-400">
                                Sem {course.settings?.semester || "—"}
                            </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">
                            {course.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">{course.creditUnits} units</span>
                            {deptName && <span className="text-xs text-slate-400">· {deptName}</span>}
                        </div>
                    </div>

                    {isEditor && (
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setShowPicker(v => !v)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Assign
                            </button>
                            {showPicker && (
                                <StaffPicker
                                    staff={availableStaff}
                                    onSelect={async (staffId, role) => {
                                        setShowPicker(false);
                                        await onAssign(course.id, course.settings?.deptId || course.deptId, staffId, role);
                                    }}
                                    onClose={() => setShowPicker(false)}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Assigned lecturers */}
                {isAssigned ? (
                    <div className="space-y-2">
                        {mainLecturer && (
                            <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                                        {mainLecturer.staff?.user?.name?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-indigo-900">{mainLecturer.staff?.user?.name}</p>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Main</span>
                                    </div>
                                </div>
                                {isEditor && (
                                    <button
                                        onClick={async () => {
                                            setRemoving(mainLecturer.id);
                                            await onRemove(mainLecturer.id);
                                            setRemoving(null);
                                        }}
                                        className="text-rose-400 hover:text-rose-600 transition-colors p-1"
                                    >
                                        {removing === mainLecturer.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <X className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                        {coLecturers.map(co => (
                            <div key={co.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-slate-300 flex items-center justify-center text-slate-700 text-xs font-black shrink-0">
                                        {co.staff?.user?.name?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">{co.staff?.user?.name}</p>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Co-Lecturer</span>
                                    </div>
                                </div>
                                {isEditor && (
                                    <button
                                        onClick={async () => {
                                            setRemoving(co.id);
                                            await onRemove(co.id);
                                            setRemoving(null);
                                        }}
                                        className="text-rose-400 hover:text-rose-600 transition-colors p-1"
                                    >
                                        {removing === co.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <X className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 py-3 px-3 bg-amber-50 border border-amber-100 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-xs text-amber-600 font-semibold">No lecturer assigned</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- Main Component ----
export default function CourseAssignmentManager({
    session,
    departments,
    faculties,
    allStaff: initialAllStaff,
    initialDeptId,
    initialAssignments,
    initialDeptCourses,
    userRole,
    isHOD,
}: any) {
    const isAdmin = userRole === "admin" || userRole === "superadmin";
    const isEditor = isAdmin || isHOD;

    // ---- State ----
    const [activeView, setActiveView] = useState<"courses" | "lecturers">("courses");
    const [filterDept, setFilterDept] = useState<string>(initialDeptId?.toString() || "all");
    const [filterFaculty, setFilterFaculty] = useState<string>("all");
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [filterSemester, setFilterSemester] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [allAssignments, setAllAssignments] = useState<any[]>(initialAssignments || []);
    const [deptCourseMap, setDeptCourseMap] = useState<Record<number, any[]>>({});
    const [allStaff, setAllStaff] = useState<any[]>(initialAllStaff || []);
    const [deptStaffMap, setDeptStaffMap] = useState<Record<number, any[]>>({});
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [expandedLecturers, setExpandedLecturers] = useState<Set<number>>(new Set());

    const semester = (session.currentSemester === "1" ? "1" : "2") as "1" | "2";

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(t);
        }
    }, [toast]);

    // Load courses for a specific dept if not cached
    async function ensureDeptCourses(deptId: number) {
        if (deptCourseMap[deptId]) return;
        const courses = await getDepartmentCourses(deptId);
        setDeptCourseMap(prev => ({ ...prev, [deptId]: courses }));
    }

    // Load staff for a specific dept if not cached
    async function ensureDeptStaff(deptId: number) {
        if (deptStaffMap[deptId]) return;
        const staff = await getDepartmentStaff(deptId);
        setDeptStaffMap(prev => ({ ...prev, [deptId]: staff }));
    }

    // When dept filter changes, load courses for that dept
    useEffect(() => {
        if (filterDept !== "all") {
            const deptId = parseInt(filterDept);
            ensureDeptCourses(deptId);
            if (!isAdmin) ensureDeptStaff(deptId);
        }
    }, [filterDept]);

    // Initialize deptCourseMap with initial data
    useEffect(() => {
        if (initialDeptId && initialDeptCourses?.length > 0) {
            setDeptCourseMap(prev => ({ ...prev, [initialDeptId]: initialDeptCourses }));
        }
    }, []);

    async function refreshAssignments() {
        setLoading(true);
        try {
            if (isAdmin) {
                const data = await getAllCourseAssignmentsForSession(session.id, semester);
                setAllAssignments(data);
            } else if (filterDept !== "all") {
                const data = await getCourseAssignments(parseInt(filterDept), session.id, semester);
                setAllAssignments(data);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleAssign(courseId: number, deptId: number, staffId: number, role: "main" | "co_lecturer") {
        const res = await assignCourseToLecturer({
            sessionId: session.id,
            courseId,
            staffId,
            deptId,
            semester,
            role,
        });
        if (res.success) {
            setToast({ message: "Lecturer assigned successfully", type: "success" });
        } else {
            setToast({ message: res.error || "Failed to assign lecturer", type: "error" });
        }
        await refreshAssignments();
    }

    async function handleRemove(assignmentId: number) {
        const res = await removeLecturerFromCourse(assignmentId);
        if (res.success) {
            setToast({ message: "Lecturer removed", type: "success" });
        } else {
            setToast({ message: res.error || "Failed to remove", type: "error" });
        }
        await refreshAssignments();
    }

    // ---- Compute all visible courses ----
    const allVisibleCourses = useMemo(() => {
        let courses: any[] = [];
        if (filterDept !== "all") {
            const deptId = parseInt(filterDept);
            courses = (deptCourseMap[deptId] || []).map(c => ({
                ...c,
                deptId,
            }));
        } else {
            // All departments
            Object.entries(deptCourseMap).forEach(([deptId, deptCourses]) => {
                deptCourses.forEach(c => courses.push({ ...c, deptId: parseInt(deptId) }));
            });
        }
        return courses;
    }, [deptCourseMap, filterDept]);

    // ---- Filter courses ----
    const filteredCourses = useMemo(() => {
        return allVisibleCourses.filter(course => {
            const q = search.toLowerCase();
            const matchesSearch = !q ||
                course.code?.toLowerCase().includes(q) ||
                course.name?.toLowerCase().includes(q);
            if (!matchesSearch) return false;

            // Faculty filter
            if (filterFaculty !== "all") {
                const dept = departments.find((d: any) => d.id === course.deptId);
                if (!dept || dept.facultyId?.toString() !== filterFaculty) return false;
            }

            // Level filter
            if (filterLevel !== "all" && course.settings?.level?.toString() !== filterLevel) return false;

            // Semester filter
            if (filterSemester !== "all" && course.settings?.semester !== filterSemester) return false;

            // Assignment status filter
            const courseAssignments = allAssignments.filter(a => a.courseId === course.id);
            if (filterStatus === "assigned" && courseAssignments.length === 0) return false;
            if (filterStatus === "unassigned" && courseAssignments.length > 0) return false;

            return true;
        });
    }, [allVisibleCourses, allAssignments, search, filterFaculty, filterLevel, filterSemester, filterStatus, departments]);

    // ---- Lecturer view: group assignments by lecturer ----
    const lecturerGroups = useMemo(() => {
        const map: Record<number, { staff: any; courses: any[] }> = {};
        allAssignments.forEach(a => {
            if (!a.staff) return;
            const key = a.staff.id;
            if (!map[key]) map[key] = { staff: a.staff, courses: [] };
            map[key].courses.push(a);
        });
        const grouped = Object.values(map).sort((a, b) =>
            (a.staff.user?.name || "").localeCompare(b.staff.user?.name || "")
        );
        if (search) {
            const q = search.toLowerCase();
            return grouped.filter(g => g.staff.user?.name?.toLowerCase().includes(q));
        }
        return grouped;
    }, [allAssignments, search]);

    // Stats
    const stats = useMemo(() => {
        const totalCourses = allVisibleCourses.length;
        const assignedCourses = new Set(allAssignments.map(a => a.courseId)).size;
        const uniqueLecturers = new Set(allAssignments.map(a => a.staffId)).size;
        return { totalCourses, assignedCourses, unassigned: totalCourses - assignedCourses, uniqueLecturers };
    }, [allVisibleCourses, allAssignments]);

    // staff available for a course (use all staff for admin, dept staff for HOD)
    function getStaffForCourse(deptId: number): any[] {
        if (isAdmin) return allStaff;
        return deptStaffMap[deptId] || [];
    }

    // Dept filter options (filtered by faculty selection)
    const filteredDepts = useMemo(() => {
        if (filterFaculty === "all") return departments;
        return departments.filter((d: any) => d.facultyId?.toString() === filterFaculty);
    }, [departments, filterFaculty]);

    // Load courses when "all depts" is selected for admins  
    useEffect(() => {
        if (isAdmin && filterDept === "all" && Object.keys(deptCourseMap).length === 0) {
            // Load courses for all depts
            departments.forEach((d: any) => {
                getDepartmentCourses(d.id).then(courses => {
                    setDeptCourseMap(prev => ({ ...prev, [d.id]: courses }));
                });
            });
        }
    }, [filterDept, isAdmin]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/10 p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* ---- Header ---- */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-10 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-600/40 via-purple-600/20 to-transparent" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                    <BookMarked className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight">Course Assignments</h1>
                                    <p className="text-slate-400 text-sm">{session.name} · Semester {semester}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-300">
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                                    {stats.totalCourses} Courses
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    {stats.assignedCourses} Assigned
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-300">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                                    {stats.unassigned} Unassigned
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-300">
                                    <Users className="w-3.5 h-3.5 text-purple-400" />
                                    {stats.uniqueLecturers} Lecturers Active
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={refreshAssignments}
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-sm font-semibold transition-all"
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* ---- View Tabs ---- */}
                <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm w-fit">
                    {[
                        { id: "courses", label: "Course View", icon: BookOpen },
                        { id: "lecturers", label: "Lecturer View", icon: Users },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                activeView === tab.id
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ---- Filters ---- */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* Search */}
                        <div className="lg:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={activeView === "courses" ? "Search courses..." : "Search lecturers..."}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                            />
                        </div>

                        {/* Faculty */}
                        {isAdmin && (
                            <select
                                value={filterFaculty}
                                onChange={e => { setFilterFaculty(e.target.value); setFilterDept("all"); }}
                                className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-700"
                            >
                                <option value="all">All Faculties</option>
                                {faculties.map((f: any) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Department */}
                        <select
                            value={filterDept}
                            onChange={e => setFilterDept(e.target.value)}
                            disabled={!isAdmin && !!initialDeptId}
                            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-700 disabled:opacity-60"
                        >
                            {isAdmin && <option value="all">All Departments</option>}
                            {filteredDepts.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>

                        {/* Level */}
                        <select
                            value={filterLevel}
                            onChange={e => setFilterLevel(e.target.value)}
                            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-700"
                        >
                            <option value="all">All Levels</option>
                            <option value="1">ND 1</option>
                            <option value="2">ND 2</option>
                            <option value="3">HND 1</option>
                            <option value="4">HND 2</option>
                        </select>

                        {/* Status */}
                        {activeView === "courses" && (
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-700"
                            >
                                <option value="all">All Statuses</option>
                                <option value="assigned">Assigned</option>
                                <option value="unassigned">Unassigned</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* ======== COURSE VIEW ======== */}
                {activeView === "courses" && (
                    <>
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                            </div>
                        ) : filteredCourses.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No courses found</p>
                                <p className="text-sm mt-1">Try adjusting your filters or select a department</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredCourses.map(course => {
                                    const courseAssignments = allAssignments.filter(a => a.courseId === course.id);
                                    const dept = departments.find((d: any) => d.id === course.deptId);
                                    return (
                                        <CourseCard
                                            key={`${course.id}-${course.deptId}`}
                                            course={course}
                                            assignments={courseAssignments}
                                            availableStaff={getStaffForCourse(course.deptId)}
                                            isEditor={isEditor}
                                            onAssign={handleAssign}
                                            onRemove={handleRemove}
                                            deptName={dept?.name}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ======== LECTURER VIEW ======== */}
                {activeView === "lecturers" && (
                    <div className="space-y-3">
                        {lecturerGroups.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No assignments found</p>
                            </div>
                        ) : (
                            lecturerGroups.map(({ staff, courses }) => {
                                const isExpanded = expandedLecturers.has(staff.id);
                                return (
                                    <div key={staff.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                        <div
                                            className="flex items-center justify-between p-5 cursor-pointer"
                                            onClick={() => setExpandedLecturers(prev => {
                                                const next = new Set(prev);
                                                if (next.has(staff.id)) next.delete(staff.id);
                                                else next.add(staff.id);
                                                return next;
                                            })}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                                                    {staff.user?.name?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{staff.user?.name}</p>
                                                    <p className="text-sm text-slate-500">{staff.jobTitle || staff.rank || "Lecturer"}</p>
                                                </div>
                                                <div className="flex gap-2 ml-2">
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold">
                                                        {courses.length} course{courses.length !== 1 ? "s" : ""}
                                                    </span>
                                                    {courses.filter(c => c.role === "main").length > 0 && (
                                                        <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl text-xs font-bold hidden sm:inline-flex items-center gap-1">
                                                            <Star className="w-3 h-3" />
                                                            {courses.filter(c => c.role === "main").length} main
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                        </div>

                                        {isExpanded && (
                                            <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {courses.map(a => (
                                                        <div key={a.id} className={cn(
                                                            "p-4 rounded-2xl border-2 flex items-start justify-between gap-3",
                                                            a.role === "main" ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-100"
                                                        )}>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs font-black text-indigo-600">{a.course?.code}</span>
                                                                    <span className={cn(
                                                                        "text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase",
                                                                        a.role === "main" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"
                                                                    )}>
                                                                        {a.role === "main" ? "Main" : "Co"}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm font-bold text-slate-900 leading-tight">{a.course?.name}</p>
                                                                <p className="text-xs text-slate-400 mt-0.5">{a.department?.name || ""}</p>
                                                            </div>
                                                            {isEditor && (
                                                                <button
                                                                    onClick={() => handleRemove(a.id)}
                                                                    className="text-rose-400 hover:text-rose-600 transition-colors shrink-0 p-1"
                                                                    title="Remove assignment"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
}
