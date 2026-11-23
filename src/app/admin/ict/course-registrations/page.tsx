"use client";

import { useState, useEffect, useCallback } from "react";
import {
    FileText, Printer, Loader2, Search, Filter, ChevronDown,
    CheckCircle2, Download, Users, BookOpen, Edit3, Plus, Trash2, Save, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getCourseRegistrationPrintQueue } from "@/actions/ict-manager";
import {
    adminGetStudentRegistrationDetailAction,
    adminUpdateStudentCoursesAction
} from "@/actions/course-registration";
import { printOfficialCourseForms, type CourseFormData } from "@/components/documents/CourseFormPrintable";

const DEPARTMENTS = [
    { id: 54, name: "Computer Science", code: "COM" },
    { id: 55, name: "Artificial Intelligence", code: "ART" },
    { id: 56, name: "Networking & Cloud Computing", code: "NET" },
    { id: 57, name: "Statistics", code: "STA" },
    { id: 58, name: "Business Administration", code: "BUS" },
    { id: 59, name: "Accountancy", code: "ACC" },
];

export default function CourseRegistrationPrintPage() {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number[]>([]);
    const [filterDept, setFilterDept] = useState<string>("all");
    const [filterProgramme, setFilterProgramme] = useState<string>("all");
    const [filterSemester, setFilterSemester] = useState<string>("1");
    const [submittedOnly, setSubmittedOnly] = useState<boolean>(true);
    const [search, setSearch] = useState("");
    const [printing, setPrinting] = useState(false);

    // Quick Edit Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingReg, setEditingReg] = useState<any>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalSaving, setModalSaving] = useState(false);
    const [modalRegisteredCourses, setModalRegisteredCourses] = useState<any[]>([]);
    const [modalAvailableCourses, setModalAvailableCourses] = useState<any[]>([]);
    const [modalAllCourses, setModalAllCourses] = useState<any[]>([]);
    const [modalSelectedCourseIds, setModalSelectedCourseIds] = useState<number[]>([]);
    const [modalCourseSearch, setModalCourseSearch] = useState("");

    const loadRegistrations = useCallback(async () => {
        setLoading(true);
        const res = await getCourseRegistrationPrintQueue({
            departmentId: filterDept !== "all" ? parseInt(filterDept) : undefined,
            programmeType: filterProgramme !== "all" ? filterProgramme : undefined,
            search: search || undefined,
            semester: filterSemester,
            submittedOnly,
            limit: 2000,
        });
        if (res.success) setRegistrations(res.data);
        setLoading(false);
    }, [filterDept, filterProgramme, filterSemester, submittedOnly, search]);

    useEffect(() => {
        loadRegistrations();
    }, [loadRegistrations]);

    const toggleSelect = (id: number) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const selectAll = () => {
        setSelected(selected.length === registrations.length ? [] : registrations.map(r => r.studentId));
    };

    function printSingle(studentId: number) {
        const reg = registrations.find(r => r.studentId === studentId);
        if (!reg) return;
        generatePrintHTML([reg]);
    }

    function printSelected() {
        if (!selected.length) return toast.error("Select students first");
        const regs = registrations.filter(r => selected.includes(r.studentId));
        generatePrintHTML(regs);
    }

    function printAllSubmitted() {
        const submitted = registrations.filter(r => (r.courseCount || 0) > 0);
        if (!submitted.length) return toast.error("No submitted course forms found to download.");
        setPrinting(true);
        generatePrintHTML(submitted);
    }

    function generatePrintHTML(regs: any[]) {
        const forms: CourseFormData[] = regs.map((reg) => ({
            matricNumber: reg.matricNumber || '',
            fullName: reg.fullName || (reg.studentName || '').toUpperCase(),
            levelLabel: reg.levelLabel || `${reg.programmeType || ''} ${reg.currentLevel || ''}`.trim(),
            program: reg.program || 'FULL-TIME',
            sessionSemester: reg.sessionSemester || '2026-2027 First Semester',
            departmentName: reg.deptName || '',
            imageUrl: reg.imageUrl || null,
            signatureUrl: reg.signatureUrl || null,
            courses: (reg.courses || []).map((c: any) => ({
                id: c.courseId || c.id,
                code: c.courseCode || c.code || '',
                title: c.courseName || c.name || '',
                units: Number(c.creditUnits || c.units) || 0,
                statusCode: c.statusCode || (c.status === 'elective' ? 'E' : c.status === 'required' ? 'R' : 'C'),
                isCarryOver: Boolean(c.isCarryOver),
            })),
        }));
        printOfficialCourseForms(forms);
        setPrinting(false);
    }

    async function openEditModal(reg: any) {
        setEditingReg(reg);
        setEditModalOpen(true);
        setModalLoading(true);
        setModalCourseSearch("");
        const sessId = reg.sessionId || 6;
        const sem = (filterSemester as "1" | "2") || "1";
        const res = await adminGetStudentRegistrationDetailAction(reg.studentId, sessId, sem);
        setModalLoading(false);
        if (res.success) {
            setModalRegisteredCourses(res.registeredCourses || []);
            setModalAvailableCourses(res.availableCourses || []);
            setModalAllCourses(res.allCourses || []);
            setModalSelectedCourseIds((res.registeredCourses || []).map((c: any) => c.id));
        } else {
            toast.error(res.error || "Failed to load student course details");
        }
    }

    function handleModalAddCourse(courseId: number) {
        setModalSelectedCourseIds(prev => prev.includes(courseId) ? prev : [...prev, courseId]);
    }

    function handleModalRemoveCourse(courseId: number) {
        setModalSelectedCourseIds(prev => prev.filter(id => id !== courseId));
    }

    async function handleModalSave() {
        if (!editingReg) return;
        setModalSaving(true);
        const sessId = editingReg.sessionId || 6;
        const sem = (filterSemester as "1" | "2") || "1";
        const res = await adminUpdateStudentCoursesAction(
            editingReg.studentId,
            sessId,
            sem,
            modalSelectedCourseIds
        );
        setModalSaving(false);
        if (res.success) {
            toast.success(`Course registration updated (${res.totalUnits} units).`);
            await loadRegistrations();
            // Refresh modal state
            const refreshRes = await adminGetStudentRegistrationDetailAction(editingReg.studentId, sessId, sem);
            if (refreshRes.success) {
                setModalRegisteredCourses(refreshRes.registeredCourses || []);
                setModalSelectedCourseIds((refreshRes.registeredCourses || []).map((c: any) => c.id));
            }
        } else {
            toast.error(res.error || "Failed to save courses");
        }
    }

    function handleModalPrint() {
        if (!editingReg || modalSelectedCourseObjects.length === 0) {
            toast.error("No registered courses to print.");
            return;
        }
        const updatedReg = {
            ...editingReg,
            courses: modalSelectedCourseObjects.map(c => ({
                courseId: c.id,
                courseCode: c.code,
                courseName: c.name,
                creditUnits: c.units,
                statusCode: c.statusCode,
                isCarryOver: c.isCarryOver,
            })),
        };
        generatePrintHTML([updatedReg]);
    }

    // Modal courses lookup
    const modalCourseLookup = new Map<number, any>();
    for (const c of modalAllCourses) modalCourseLookup.set(c.id, c);
    for (const c of modalAvailableCourses) modalCourseLookup.set(c.id, c);
    for (const c of modalRegisteredCourses) modalCourseLookup.set(c.id, c);

    const modalSelectedCourseObjects = modalSelectedCourseIds
        .map(id => modalCourseLookup.get(id))
        .filter(Boolean);
    const modalTotalUnits = modalSelectedCourseObjects.reduce(
        (sum, c) => sum + Number(c.units || 0),
        0
    );

    const modalCandidatePool = [
        ...modalAvailableCourses,
        ...modalAllCourses.filter(ac => !modalAvailableCourses.some(av => av.id === ac.id)),
    ].filter(c => !modalSelectedCourseIds.includes(c.id));

    const modalFilteredCandidates = modalCandidatePool.filter(c => {
        if (!modalCourseSearch.trim()) return true;
        const q = modalCourseSearch.toLowerCase();
        return (c.code || "").toLowerCase().includes(q) || (c.name || "").toLowerCase().includes(q);
    }).slice(0, 50);

    const totalPaid = registrations.filter(r => r.isPrintFeePaid).length;
    const totalWithCourses = registrations.filter(r => r.courseCount > 0).length;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Course Registration Print Queue</h1>
                            <p className="text-sm text-slate-500">View, print, and edit student course registration forms</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/registration/manage"
                            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-sm transition"
                        >
                            <BookOpen className="w-4 h-4" /> Full Registration Editor
                        </Link>
                        <Button
                            onClick={printAllSubmitted}
                            disabled={printing || loading || totalWithCourses === 0}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-5 rounded-xl font-bold shadow-md"
                        >
                            <Download className="w-4 h-4" />
                            Download All Submitted Forms ({totalWithCourses})
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-slate-900">{registrations.length}</p>
                        <p className="text-xs text-slate-500">Total Students</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{totalPaid}</p>
                        <p className="text-xs text-slate-500">Print Fee Paid</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{totalWithCourses}</p>
                        <p className="text-xs text-slate-500">With Courses</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-indigo-600">{selected.length}</p>
                        <p className="text-xs text-slate-500">Selected</p>
                    </CardContent></Card>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Search</Label>
                        <Input placeholder="Name or matric number..." value={search} onChange={e => setSearch(e.target.value)} className="h-10" />
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Department</Label>
                        <Select value={filterDept} onValueChange={setFilterDept}>
                            <SelectTrigger className="w-48 h-10"><SelectValue placeholder="All" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {DEPARTMENTS.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Programme</Label>
                        <Select value={filterProgramme} onValueChange={setFilterProgramme}>
                            <SelectTrigger className="w-32 h-10"><SelectValue placeholder="All" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="ND">ND</SelectItem>
                                <SelectItem value="HND">HND</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Semester</Label>
                        <Select value={filterSemester} onValueChange={setFilterSemester}>
                            <SelectTrigger className="w-40 h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">First Semester</SelectItem>
                                <SelectItem value="2">Second Semester</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Filter</Label>
                        <Select value={submittedOnly ? "submitted" : "all"} onValueChange={(v) => setSubmittedOnly(v === "submitted")}>
                            <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="submitted">Submitted Forms Only</SelectItem>
                                <SelectItem value="all">All Active Students</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {selected.length > 0 && (
                        <Button onClick={printSelected} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Printer className="w-4 h-4" /> Print Selected ({selected.length})
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-3 text-left"><input type="checkbox" checked={selected.length === registrations.length && registrations.length > 0} onChange={selectAll} /></th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Matric</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Dept</th>
                                <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Courses</th>
                                <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Units</th>
                                <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Print Fee</th>
                                <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></td></tr>
                            ) : registrations.length === 0 ? (
                                <tr><td colSpan={8} className="p-12 text-center text-slate-400">No registrations found</td></tr>
                            ) : (
                                registrations.map((reg) => (
                                    <tr key={reg.studentId} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-3">
                                            <input type="checkbox" checked={selected.includes(reg.studentId)} onChange={() => toggleSelect(reg.studentId)} />
                                        </td>
                                        <td className="p-3 text-sm font-medium text-slate-900">{reg.studentName}</td>
                                        <td className="p-3 text-sm font-mono text-slate-700">{reg.matricNumber || '-'}</td>
                                        <td className="p-3 text-sm text-slate-600">{reg.deptName || '-'}</td>
                                        <td className="p-3 text-sm text-center font-medium">{reg.courseCount || 0}</td>
                                        <td className="p-3 text-sm text-center font-medium">{reg.totalUnits || 0}</td>
                                        <td className="p-3 text-center">
                                            {reg.isPrintFeePaid ? (
                                                <Badge className="bg-green-100 text-green-700 text-xs">Paid</Badge>
                                            ) : (
                                                <Badge className="bg-slate-100 text-slate-500 text-xs">Unpaid</Badge>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button size="sm" variant="outline" onClick={() => printSingle(reg.studentId)} className="gap-1 h-8 px-2.5">
                                                    <Printer className="w-3.5 h-3.5" /> Print
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => openEditModal(reg)}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 h-8 px-2.5 font-semibold text-xs shadow-sm"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" /> Edit Courses
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Edit Course Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-start justify-between">
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Edit3 className="w-5 h-5 text-indigo-600" />
                                    Edit Course Form — {editingReg?.studentName}
                                </DialogTitle>
                                <DialogDescription className="text-xs font-mono text-slate-500 mt-1">
                                    {editingReg?.matricNumber} • {editingReg?.deptName} • {editingReg?.programmeType} {editingReg?.currentLevel || ""}
                                </DialogDescription>
                            </div>
                            {editingReg && (
                                <Link
                                    href={`/admin/registration/manage?studentId=${editingReg.studentId}&sessionId=${editingReg.sessionId || 6}&semester=${filterSemester}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold mr-6"
                                >
                                    Full Editor <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            )}
                        </div>
                    </DialogHeader>

                    {modalLoading ? (
                        <div className="p-16 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                            <p className="text-xs text-slate-500 mt-2">Loading student registration details...</p>
                        </div>
                    ) : (
                        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                            {/* Current Registered Courses */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                                        Registered Courses ({modalSelectedCourseObjects.length})
                                    </h3>
                                    <Badge className="bg-indigo-100 text-indigo-800 text-xs font-bold">
                                        {modalTotalUnits} Credit Units
                                    </Badge>
                                </div>

                                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                    {modalSelectedCourseObjects.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                                            No courses selected. Add courses from the right panel.
                                        </div>
                                    ) : (
                                        modalSelectedCourseObjects.map(c => (
                                            <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition">
                                                <div>
                                                    <div className="font-bold text-xs text-slate-900">{c.code} — {c.name}</div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                                        <span className="font-semibold text-slate-700">{c.units} Units</span>
                                                        {c.isCarryOver && <Badge className="ml-2 bg-amber-100 text-amber-800 text-[9px]">Carry-over</Badge>}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleModalRemoveCourse(c.id)}
                                                    className="h-7 px-2 text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-semibold gap-1"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Remove
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Add Courses */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Add Courses</h3>
                                <Input
                                    placeholder="Search by code or title (e.g. COM 111)..."
                                    value={modalCourseSearch}
                                    onChange={e => setModalCourseSearch(e.target.value)}
                                    className="h-9 text-xs"
                                />

                                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                                    {modalFilteredCandidates.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                                            No matching courses available to add.
                                        </div>
                                    ) : (
                                        modalFilteredCandidates.map(c => {
                                            const isDept = modalAvailableCourses.some(av => av.id === c.id);
                                            return (
                                                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition">
                                                    <div>
                                                        <div className="font-bold text-xs text-slate-900">{c.code} — {c.name}</div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                            <span className="font-semibold text-slate-700">{c.units} Units</span>
                                                            {isDept && <Badge className="bg-emerald-50 text-emerald-700 text-[9px]">Dept</Badge>}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleModalAddCourse(c.id)}
                                                        className="h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" /> Add
                                                    </Button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleModalPrint}
                            disabled={modalSelectedCourseObjects.length === 0}
                            className="gap-2 border-slate-300 text-slate-700 font-semibold"
                        >
                            <Printer className="w-4 h-4" /> Print Course Form
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditModalOpen(false)}
                                disabled={modalSaving}
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                onClick={handleModalSave}
                                disabled={modalSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold shadow-sm"
                            >
                                {modalSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save & Apply Courses
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
