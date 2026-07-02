"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Trash2, Loader2, BookOpen, ChevronRight, Settings2, Link as LinkIcon, FileUp, X, UserPlus } from "lucide-react";
import { getCourses, createCourse, updateCourse, addCourseToDepartment, updateCourseDepartmentSetting, removeCourseFromDepartment, addPrerequisite, removePrerequisite, deleteCourse, bulkImportCourses } from "@/actions/courses";
import { UniversalImporter } from "@/components/UniversalImporter";
import { getDepartments } from "@/actions/departments";
import { getAllCohorts } from "@/actions/cohorts";
import { getStudents } from "@/actions/students";
import { enrollStudentInCourse, enrollCohortInCourse, getEnrolledStudents } from "@/actions/enrollment";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/providers/BranchProvider";

export default function CoursesPage() {
    const { isK12 } = useBranch();
    const [courses, setCourses] = useState<any[]>([]);
    const [depts, setDepts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [showImporter, setShowImporter] = useState(false);

    // Form States
    const [step, setStep] = useState(1); // 1: Base, 2: Depts, 3: Prerequisites
    const [newCourseId, setNewCourseId] = useState<number | null>(null);
    const [baseData, setBaseData] = useState({
        name: "",
        code: "",
        creditUnits: 2,
        description: "",
        isUniversityRequired: false,
        countsForCgpa: true,
        isGroupSubject: false,
        parentCourseId: null as number | null
    });
    const [deptSettings, setDeptSettings] = useState({ deptId: "", semester: "1", status: "compulsory", level: 100 });
    const [prereqId, setPrereqId] = useState("");

    const [editingCourse, setEditingCourse] = useState<any>(null);

    // Enrollment State
    const [enrollingCourse, setEnrollingCourse] = useState<any | null>(null);
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [enrollType, setEnrollType] = useState<"individual" | "cohort">("individual");
    const [enrollData, setEnrollData] = useState({ studentId: "", cohortId: "", session: "2024/2025", semester: "1" });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [courseData, deptData, cohortData, studentData] = await Promise.all([
            getCourses(),
            getDepartments(),
            getAllCohorts(),
            getStudents()
        ]);
        setCourses(courseData);
        setDepts(deptData);
        setCohorts(cohortData);
        setStudents((studentData as any).data || []);
        setLoading(false);
    };

    const handleCreateBase = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createCourse(baseData);
        if (res.success) {
            setNewCourseId(res.courseId!);
            setStep(2);
        } else alert(res.error);
    };

    const handleAddDept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCourseId || !deptSettings.deptId) return;
        const res = await addCourseToDepartment({
            courseId: newCourseId,
            deptId: parseInt(deptSettings.deptId),
            semester: deptSettings.semester as any,
            status: deptSettings.status as any,
            level: deptSettings.level
        });
        if (res.success) {
            alert("Department setting added! You can add another or proceed.");
        } else alert(res.error);
    };

    const handleAddPrereq = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCourseId || !prereqId) return;
        const res = await addPrerequisite(newCourseId, parseInt(prereqId));
        if (res.success) alert("Prerequisite added!");
        else alert(res.error);
    };

    const resetForm = () => {
        setStep(1);
        setNewCourseId(null);
        setBaseData({
            name: "",
            code: "",
            creditUnits: 2,
            description: "",
            isUniversityRequired: false,
            countsForCgpa: true,
            isGroupSubject: false,
            parentCourseId: null
        });
        setIsAdding(false);
        fetchData();
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        const { id, departmentSettings, prerequisites, ...rest } = editingCourse;
        const res = await updateCourse(id, rest);
        if (res.success) {
            setEditingCourse(null);
            fetchData();
        } else alert(res.error);
    };

    const handleUpdateDeptInEdit = async (deptId: number, data: any) => {
        const res = await updateCourseDepartmentSetting(editingCourse.id, deptId, data);
        if (res.success) {
            fetchData();
            // Update local state to reflect change without closing modal
            const updatedSettings = editingCourse.departmentSettings.map((s: any) =>
                s.deptId === deptId ? { ...s, ...data } : s
            );
            setEditingCourse({ ...editingCourse, departmentSettings: updatedSettings });
        } else alert(res.error);
    };

    const handleRemoveDeptInEdit = async (deptId: number) => {
        if (!confirm("Remove this course from this department?")) return;
        const res = await removeCourseFromDepartment(editingCourse.id, deptId);
        if (res.success) {
            fetchData();
            const updatedSettings = editingCourse.departmentSettings.filter((s: any) => s.deptId !== deptId);
            setEditingCourse({ ...editingCourse, departmentSettings: updatedSettings });
        } else alert(res.error);
    };

    const handleAddDeptInEdit = async () => {
        if (!deptSettings.deptId) return;
        const res = await addCourseToDepartment({
            courseId: editingCourse.id,
            deptId: parseInt(deptSettings.deptId),
            semester: deptSettings.semester as any,
            status: deptSettings.status as any,
            level: deptSettings.level
        });
        if (res.success) {
            fetchData();
            // Refresh settings in modal
            const dept = depts.find(d => d.id === parseInt(deptSettings.deptId));
            const newSetting = {
                deptId: parseInt(deptSettings.deptId),
                courseId: editingCourse.id,
                semester: deptSettings.semester,
                status: deptSettings.status,
                level: deptSettings.level,
                department: dept
            };
            setEditingCourse({
                ...editingCourse,
                departmentSettings: [...editingCourse.departmentSettings, newSetting]
            });
            setDeptSettings({ deptId: "", semester: "1", status: "compulsory", level: 100 });
        } else alert(res.error);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-12 h-12 text-indigo-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    {isK12 ? "Subject Architecture" : "Course Architecture"}
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                {isK12 ? "Configure subjects, group subjects, parent linkages, and prerequisites" : "Configure multi-department courses, syllabi, and prerequisites"}
                            </p>
                        </div>
                        
                        <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner gap-2 flex-wrap">
                            <button
                                onClick={() => setShowImporter(!showImporter)}
                                className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap text-slate-300 hover:text-white hover:bg-white/10"
                            >
                                {showImporter ? <X className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                                {showImporter ? "Close Importer" : (isK12 ? "Import Subjects" : "Import Courses")}
                            </button>
                            <button
                                onClick={() => isAdding ? resetForm() : setIsAdding(true)}
                                className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
                                    isAdding 
                                    ? "bg-white text-indigo-600 shadow-lg" 
                                    : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg"
                                }`}
                            >
                                {isAdding ? "Close Form" : <><Plus className="w-4 h-4" /> Register {isK12 ? "Subject" : "Course"}</>}
                            </button>
                        </div>
                    </div>
                </div>

            {showImporter && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <UniversalImporter
                        title={isK12 ? "Bulk Subject Import" : "Bulk Course Import"}
                        description={isK12 ? "Import a list of subjects. Required columns: name, code, creditUnits. Description is optional." : "Import a list of courses. Required columns: name, code, creditUnits. Description is optional."}
                        templateColumns={["name", "code", "creditUnits", "description"]}
                        onImport={bulkImportCourses}
                        onComplete={() => {
                            fetchData();
                            setShowImporter(false);
                        }}
                    />
                </div>
            )}

            {isAdding && (
                <Card className="mb-10 border-none shadow-lg bg-slate-900 text-white overflow-hidden">
                    <div className="flex border-b border-slate-800">
                        <div className={cn("flex-1 p-4 text-center text-xs font-bold uppercase tracking-widest border-r border-slate-800", step === 1 ? "text-indigo-400 bg-slate-800/50" : "text-slate-500")}>{isK12 ? "1. Base Subject Info" : "1. Base Info"}</div>
                        <div className={cn("flex-1 p-4 text-center text-xs font-bold uppercase tracking-widest border-r border-slate-800", step === 2 ? "text-indigo-400 bg-slate-800/50" : "text-slate-500")}>{isK12 ? "2. Grouping & Linkages" : "2. Dept Settings"}</div>
                        <div className={cn("flex-1 p-4 text-center text-xs font-bold uppercase tracking-widest", step === 3 ? "text-indigo-400 bg-slate-800/50" : "text-slate-500")}>{isK12 ? "3. Prerequisites" : "3. Prerequisites"}</div>
                    </div>
                    <CardContent className="p-8">
                        {step === 1 && (
                            <form onSubmit={handleCreateBase} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">{isK12 ? "SUBJECT NAME" : "COURSE NAME"}</label>
                                    <input required className="w-full bg-slate-800 border-none rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500" placeholder={isK12 ? "e.g. Mathematics" : "e.g. Advanced Calculus"} value={baseData.name} onChange={e => setBaseData({ ...baseData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">{isK12 ? "SUBJECT CODE" : "COURSE CODE"}</label>
                                    <input required className="w-full bg-slate-800 border-none rounded-xl p-4 text-white uppercase placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500" placeholder={isK12 ? "e.g. MAT101" : "e.g. MAT201"} value={baseData.code} onChange={e => setBaseData({ ...baseData, code: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">{isK12 ? "CREDIT UNITS / PERIODS" : "CREDIT UNITS"}</label>
                                    <input required type="number" className="w-full bg-slate-800 border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500" value={baseData.creditUnits} onChange={e => setBaseData({ ...baseData, creditUnits: parseInt(e.target.value) })} />
                                </div>
                                <div className="flex gap-6 items-center pt-6">
                                    {!isK12 && (
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className={cn("w-5 h-5 rounded border-2 border-slate-700 flex items-center justify-center transition-colors", baseData.isUniversityRequired ? "bg-indigo-500 border-indigo-500" : "bg-slate-800")}>
                                                <input type="checkbox" className="hidden" checked={baseData.isUniversityRequired} onChange={e => setBaseData({ ...baseData, isUniversityRequired: e.target.checked })} />
                                                {baseData.isUniversityRequired && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Univ. Required (GST)</span>
                                        </label>
                                    )}
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={cn("w-5 h-5 rounded border-2 border-slate-700 flex items-center justify-center transition-colors", baseData.countsForCgpa ? "bg-emerald-500 border-emerald-500" : "bg-slate-800")}>
                                            <input type="checkbox" className="hidden" checked={baseData.countsForCgpa} onChange={e => setBaseData({ ...baseData, countsForCgpa: e.target.checked })} />
                                            {baseData.countsForCgpa && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isK12 ? "Counts for Cumulative Score" : "Counts for CGPA"}</span>
                                    </label>
                                </div>

                                {isK12 && (
                                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/40 p-6 rounded-xl border border-slate-700/50">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div className={cn("w-5 h-5 rounded border-2 border-slate-600 flex items-center justify-center transition-colors", baseData.isGroupSubject ? "bg-indigo-500 border-indigo-500" : "bg-slate-800")}>
                                                <input type="checkbox" className="hidden" checked={baseData.isGroupSubject} onChange={e => {
                                                    setBaseData({ ...baseData, isGroupSubject: e.target.checked, parentCourseId: e.target.checked ? null : baseData.parentCourseId });
                                                }} />
                                                {baseData.isGroupSubject && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest block">Is Group Subject (Parent)</span>
                                                <span className="text-[10px] text-slate-500">Enable if this is a parent category for other subjects (e.g. Sciences, Languages)</span>
                                            </div>
                                        </label>

                                        {!baseData.isGroupSubject && (
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Belongs to Group Subject</label>
                                                <select 
                                                    className="w-full bg-slate-800 text-white border-none rounded-lg p-3 text-xs focus:ring-2 focus:ring-indigo-500" 
                                                    value={baseData.parentCourseId || ""} 
                                                    onChange={e => setBaseData({ ...baseData, parentCourseId: e.target.value ? parseInt(e.target.value) : null })}
                                                >
                                                    <option value="">None (Independent Subject)</option>
                                                    {courses.filter(c => c.isGroupSubject).map(c => (
                                                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-end col-span-1 md:col-span-2">
                                    <Button type="submit" className="w-full bg-indigo-600 py-6 h-auto text-lg rounded-xl">Next: {isK12 ? "Subject Grouping & Linkages" : "Department Settings"} <ChevronRight className="ml-2 w-5 h-5" /></Button>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="space-y-8">
                                <form onSubmit={handleAddDept} className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-800/30 p-6 rounded-2xl border border-slate-800">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500">DEPARTMENT</label>
                                        <select className="w-full bg-slate-800 text-white border-none rounded-lg p-3 text-sm" value={deptSettings.deptId} onChange={e => setDeptSettings({ ...deptSettings, deptId: e.target.value })}>
                                            <option value="">Select Dept</option>
                                            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500">SEMESTER</label>
                                        <select className="w-full bg-slate-800 text-white border-none rounded-lg p-3 text-sm" value={deptSettings.semester} onChange={e => setDeptSettings({ ...deptSettings, semester: e.target.value })}>
                                            <option value="1">1st Semester</option>
                                            <option value="2">2nd Semester</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500">STATUS</label>
                                        <select className="w-full bg-slate-800 text-white border-none rounded-lg p-3 text-sm" value={deptSettings.status} onChange={e => setDeptSettings({ ...deptSettings, status: e.target.value })}>
                                            <option value="compulsory">Compulsory</option>
                                            <option value="required">Required</option>
                                            <option value="elective">Elective</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500">LEVEL</label>
                                        <input type="number" step="100" className="w-full bg-slate-800 text-white border-none rounded-lg p-3 text-sm" value={deptSettings.level} onChange={e => setDeptSettings({ ...deptSettings, level: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="flex items-end">
                                        <Button type="submit" className="w-full bg-indigo-500 text-white h-11"><Plus className="w-4 h-4 mr-1" /> Link Dept</Button>
                                    </div>
                                </form>
                                <div className="flex justify-between">
                                    <p className="text-sm text-slate-500 italic">
                                        {isK12 ? "You can link this subject to multiple departments or levels with different rules." : "You can link this course to multiple departments with different rules."}
                                    </p>
                                    <Button onClick={() => setStep(3)} className="bg-white text-slate-900 font-bold px-8">Complete Linkings <ChevronRight className="ml-2 w-4 h-4" /></Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8">
                                <form onSubmit={handleAddPrereq} className="flex gap-4 bg-slate-800/30 p-6 rounded-2xl border border-slate-800">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] font-black text-slate-500">{isK12 ? "SELECT PREREQUISITE SUBJECT" : "SELECT PREREQUISITE COURSE"}</label>
                                        <select className="w-full bg-slate-800 text-white border-none rounded-lg p-3 text-sm" value={prereqId} onChange={e => setPrereqId(e.target.value)}>
                                            <option value="">Select Prerequisite</option>
                                            {courses.filter(c => c.id !== newCourseId).map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <Button type="submit" className="bg-indigo-500 text-white h-11 px-8"><LinkIcon className="w-4 h-4 mr-2" /> Add Prerequisite</Button>
                                    </div>
                                </form>
                                <div className="flex justify-center">
                                    <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-12 rounded-xl text-lg">
                                        {isK12 ? "Finalize & Publish Subject" : "Finalize & Publish Course"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {enrollingCourse && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 bg-white">
                        <CardHeader className="bg-slate-900 text-white p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">{isK12 ? "Subject Assignment" : "Course Enrollment"}</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{enrollingCourse.code}: {enrollingCourse.name}</p>
                                </div>
                                <button onClick={() => setEnrollingCourse(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setEnrollType("individual")}
                                    className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", enrollType === 'individual' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
                                >
                                    Individual
                                </button>
                                <button
                                    onClick={() => setEnrollType("cohort")}
                                    className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", enrollType === 'cohort' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
                                >
                                    Cohort
                                </button>
                            </div>

                            {enrollType === 'individual' ? (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Select Student</label>
                                        <select
                                            className="w-full bg-slate-50 border-none rounded-xl h-11 px-4 text-sm font-medium"
                                            value={enrollData.studentId}
                                            onChange={e => setEnrollData({ ...enrollData, studentId: e.target.value })}
                                        >
                                            <option value="">Choose a student...</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.user?.name} ({s.matricNumber || 'No ID'})</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Session</label>
                                            <Input className="bg-slate-50 border-none h-11 rounded-xl" value={enrollData.session} onChange={e => setEnrollData({ ...enrollData, session: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">{isK12 ? "Term" : "Semester"}</label>
                                            <select className="w-full bg-slate-50 border-none rounded-xl h-11 px-4 text-sm" value={enrollData.semester} onChange={e => setEnrollData({ ...enrollData, semester: e.target.value })}>
                                                {isK12 ? (
                                                    <>
                                                        <option value="1">1st Term</option>
                                                        <option value="2">2nd Term</option>
                                                        <option value="3">3rd Term</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="1">1st Semester</option>
                                                        <option value="2">2nd Semester</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={async () => {
                                            const res = await enrollStudentInCourse(Number(enrollData.studentId), enrollingCourse.id, enrollData.session, Number(enrollData.semester));
                                            if (res.success) { alert(isK12 ? "Assigned successfully!" : "Enrolled successfully!"); setEnrollingCourse(null); }
                                            else alert(res.error);
                                        }}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest text-white"
                                    >
                                        {isK12 ? "Complete Assignment" : "Complete Enrollment"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Select Cohort</label>
                                        <select
                                            className="w-full bg-slate-50 border-none rounded-xl h-11 px-4 text-sm font-medium"
                                            value={enrollData.cohortId}
                                            onChange={e => setEnrollData({ ...enrollData, cohortId: e.target.value })}
                                        >
                                            <option value="">Choose a cohort...</option>
                                            {cohorts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.userCount} members)</option>)}
                                        </select>
                                    </div>
                                    <Button
                                        onClick={async () => {
                                            const res = await enrollCohortInCourse(Number(enrollData.cohortId), enrollingCourse.id);
                                            if (res.success) { alert(isK12 ? "Cohort assigned successfully!" : "Cohort enrolled successfully!"); setEnrollingCourse(null); }
                                            else alert(res.error);
                                        }}
                                        className="w-full bg-slate-900 hover:bg-black h-12 rounded-xl text-[11px] font-black uppercase tracking-widest text-white"
                                    >
                                        {isK12 ? "Assign Cohort Group" : "Enroll Cohort Group"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 gap-6">
                    {[1,2,3].map(i => (
                        <Card key={i} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/40 backdrop-blur-3xl rounded-[3rem] overflow-hidden animate-pulse">
                            <CardHeader className="h-24 bg-slate-200/50" />
                            <CardContent className="h-40" />
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {courses.map((course) => (
                        <Card key={course.id} className="group border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden hover:-translate-y-2 transition-all duration-500">
                            <CardHeader className="bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10 w-full">
                                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        <BookOpen className="w-8 h-8 text-indigo-300" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <CardTitle className="text-2xl font-black text-white italic tracking-tighter">
                                                {course.code}
                                            </CardTitle>
                                            <div className="h-4 w-px bg-white/20 hidden md:block" />
                                            <span className="text-xl font-bold text-slate-300 tracking-tight">{course.name}</span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">{course.creditUnits} {isK12 ? "Periods" : "Units"}</span>
                                            {course.isUniversityRequired && !isK12 && <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[9px] font-black uppercase rounded-full">GST Requirement</span>}
                                            {!course.countsForCgpa && <span className="px-3 py-1 bg-slate-500/30 border border-slate-400/30 text-slate-300 text-[9px] font-black uppercase rounded-full">{isK12 ? "Non-Cumulative" : "Non-CGPA"}</span>}
                                            {course.isGroupSubject && <span className="px-3 py-1 bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-[9px] font-black uppercase rounded-full">Group Category</span>}
                                            {course.parentCourseId && (
                                                <span className="px-3 py-1 bg-blue-500/30 border border-blue-400/30 text-blue-200 text-[9px] font-black uppercase rounded-full">
                                                    Group: {courses.find(c => c.id === course.parentCourseId)?.code || "N/A"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 relative z-10 bg-white/5 p-2 rounded-2xl backdrop-blur-md border border-white/10">
                                        <button onClick={() => setEditingCourse(course)} className="p-3 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                            <Settings2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEnrollingCourse(course);
                                                setEnrollData({ ...enrollData, studentId: "", cohortId: "" });
                                            }}
                                            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2"
                                        >
                                            <UserPlus className="w-4 h-4" /> Enroll
                                        </button>
                                        <button onClick={() => deleteCourse(course.id).then(fetchData)} className="p-3 text-rose-300 hover:text-white hover:bg-rose-500/50 rounded-xl transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-200/50">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                            <Settings2 className="w-4 h-4 text-indigo-500" /> {isK12 ? "Class Allocations" : "Department Configs"}
                                        </h4>
                                        <div className="space-y-3">
                                            {course.departmentSettings.length === 0 ? (
                                                <p className="text-sm font-bold text-slate-400 italic">No allocations mapped yet.</p>
                                            ) : course.departmentSettings.map((set: any, idx: number) => (
                                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm gap-4">
                                                    <span className="text-sm font-black text-slate-800">{set.department.name}</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest">
                                                            {isK12 ? `Term ${set.semester}` : `Sem ${set.semester}`}
                                                        </span>
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                            set.status === 'compulsory' ? "bg-rose-100 text-rose-700" :
                                                                set.status === 'required' ? "bg-amber-100 text-amber-700" :
                                                                    "bg-emerald-100 text-emerald-700"
                                                        )}>{set.status}</span>
                                                        <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                                                            {isK12 ? "Class " : "Lvl "}{set.level}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-200/50">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                            <LinkIcon className="w-4 h-4 text-indigo-500" /> Prerequisites
                                        </h4>
                                        <div className="flex flex-wrap gap-3">
                                            {course.prerequisites.map((p: any, idx: number) => (
                                                <span key={idx} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm">
                                                    {p.prerequisite.code}
                                                </span>
                                            ))}
                                            {course.prerequisites.length === 0 && <span className="text-sm font-bold text-slate-400 italic">No prerequisites required</span>}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {editingCourse && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase tracking-tight">
                                {isK12 ? "Modify Subject Rules" : "Modify Course Rules"}
                            </CardTitle>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{editingCourse.code}</p>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 bg-white">
                            <form onSubmit={handleUpdateCourse} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">{isK12 ? "Subject Name" : "Course Name"}</label>
                                    <Input value={editingCourse.name} onChange={e => setEditingCourse({ ...editingCourse, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">{isK12 ? "Periods / Credits" : "Credit Units"}</label>
                                        <Input type="number" value={editingCourse.creditUnits} onChange={e => setEditingCourse({ ...editingCourse, creditUnits: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="flex flex-col gap-4 pt-6">
                                        {!isK12 && (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={editingCourse.isUniversityRequired} onChange={e => setEditingCourse({ ...editingCourse, isUniversityRequired: e.target.checked })} />
                                                <span className="text-xs font-bold text-slate-600">Univ. Required (GST)</span>
                                            </label>
                                        )}
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={editingCourse.countsForCgpa} onChange={e => setEditingCourse({ ...editingCourse, countsForCgpa: e.target.checked })} />
                                            <span className="text-xs font-bold text-slate-600">{isK12 ? "Counts for Cumulative Score" : "Counts for CGPA"}</span>
                                        </label>
                                    </div>
                                </div>

                                {isK12 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={editingCourse.isGroupSubject || false} onChange={e => setEditingCourse({ ...editingCourse, isGroupSubject: e.target.checked, parentCourseId: e.target.checked ? null : editingCourse.parentCourseId })} />
                                            <div>
                                                <span className="text-xs font-bold text-slate-700 block">Is Group Subject (Parent)</span>
                                            </div>
                                        </label>
                                        {!editingCourse.isGroupSubject && (
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Belongs to Group Subject</label>
                                                <select 
                                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs" 
                                                    value={editingCourse.parentCourseId || ""} 
                                                    onChange={e => setEditingCourse({ ...editingCourse, parentCourseId: e.target.value ? parseInt(e.target.value) : null })}
                                                >
                                                    <option value="">None (Independent Subject)</option>
                                                    {courses.filter(c => c.isGroupSubject && c.id !== editingCourse.id).map(c => (
                                                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="ghost" className="flex-1 font-black py-6 rounded-2xl" onClick={() => setEditingCourse(null)}>Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-2xl shadow-lg shadow-indigo-100">Update Base Info</Button>
                                </div>
                            </form>

                            <div className="border-t border-slate-100 pt-6 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isK12 ? "Class / Level Linkages" : "Department Linkages"}</h4>
                                <div className="space-y-3">
                                    {editingCourse.departmentSettings.map((set: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-700">{set.department.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                    onClick={() => handleRemoveDeptInEdit(set.deptId)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <select
                                                    className="bg-white border-slate-200 rounded-lg p-2 text-[10px] font-bold"
                                                    value={set.semester}
                                                    onChange={(e) => handleUpdateDeptInEdit(set.deptId, { semester: e.target.value })}
                                                >
                                                    {isK12 ? (
                                                        <>
                                                            <option value="1">Term 1</option>
                                                            <option value="2">Term 2</option>
                                                            <option value="3">Term 3</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="1">Sem 1</option>
                                                            <option value="2">Sem 2</option>
                                                        </>
                                                    )}
                                                </select>
                                                <select
                                                    className="bg-white border-slate-200 rounded-lg p-2 text-[10px] font-bold"
                                                    value={set.status}
                                                    onChange={(e) => handleUpdateDeptInEdit(set.deptId, { status: e.target.value })}
                                                >
                                                    <option value="compulsory">Compulsory</option>
                                                    <option value="required">Required</option>
                                                    <option value="elective">Elective</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    className="bg-white border-slate-200 rounded-lg p-2 text-[10px] font-bold"
                                                    value={set.level}
                                                    onChange={(e) => handleUpdateDeptInEdit(set.deptId, { level: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Add New Linkage</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                className="bg-white border-slate-200 rounded-lg p-2 text-xs"
                                                value={deptSettings.deptId}
                                                onChange={e => setDeptSettings({ ...deptSettings, deptId: e.target.value })}
                                            >
                                                <option value="">Select Dept</option>
                                                {depts.filter(d => !editingCourse.departmentSettings.some((s: any) => s.deptId === d.id)).map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                            <Button
                                                onClick={handleAddDeptInEdit}
                                                disabled={!deptSettings.deptId}
                                                className="bg-indigo-600 text-white h-9 text-[10px] font-bold rounded-lg"
                                            >
                                                Add Link
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
        </div>
    );
}
