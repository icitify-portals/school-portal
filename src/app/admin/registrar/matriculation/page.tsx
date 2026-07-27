"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users, Search, Hash, ArrowLeft, Loader2, ChevronLeft, ChevronRight,
    ClipboardCheck, History, AlertCircle, CheckCircle2, RefreshCw,
    ArrowRightLeft, Eye, Download
} from "lucide-react";
import {
    getMatricStudents, previewNextMatricNumber, assignMatricNumber,
    changeMatricNumber, restoreMatricNumber, getMatricAuditLog, getStudentMatricHistory,
    batchAssignMatricNumbers
} from "@/actions/matric-admin";
import { getDepartments } from "@/actions/departments";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

type Tab = "list" | "assign" | "audit";

export default function MatricAdminPage() {
    const [tab, setTab] = useState<Tab>("list");
    const [loading, setLoading] = useState(true);
    
    // Batch Assign state
    const [showBatchAssign, setShowBatchAssign] = useState(false);
    const [batchYear, setBatchYear] = useState<number>(new Date().getFullYear());
    const [batchLoading, setBatchLoading] = useState(false);

    // List tab state
    const [students, setStudents] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [listLoading, setListLoading] = useState(false);
    const [departmentsList, setDepartmentsList] = useState<any[]>([]);

    // Assign tab state
    const [assignSearch, setAssignSearch] = useState("");
    const [assignResults, setAssignResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [nextMatric, setNextMatric] = useState<string>("");
    const [customMatric, setCustomMatric] = useState("");
    const [assignReason, setAssignReason] = useState("");
    const [assignLoading, setAssignLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [assignMode, setAssignMode] = useState<"assign" | "change">("assign");

    // Audit tab state
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [auditTotal, setAuditTotal] = useState(0);
    const [auditPage, setAuditPage] = useState(1);
    const [auditTotalPages, setAuditTotalPages] = useState(1);
    const [auditSearch, setAuditSearch] = useState("");
    const [auditAction, setAuditAction] = useState("all");
    const [auditLoading, setAuditLoading] = useState(false);

    // History modal
    const [historyStudent, setHistoryStudent] = useState<any>(null);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchStudents = useCallback(async () => {
        setListLoading(true);
        try {
            const res = await getMatricStudents({
                search,
                deptId: deptFilter ? Number(deptFilter) : undefined,
                programmeType: typeFilter || undefined,
                level: levelFilter ? Number(levelFilter) : undefined,
                admissionYear: yearFilter ? Number(yearFilter) : undefined,
                matricStatus: (statusFilter as any) || undefined,
                page,
                pageSize: 50,
            });
            setStudents(res.students);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch {
            toast.error("Failed to load students");
        }
        setListLoading(false);
    }, [search, deptFilter, typeFilter, levelFilter, yearFilter, statusFilter, page]);

    useEffect(() => {
        getDepartments().then(data => {
            if (data) setDepartmentsList(data);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchStudents().finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [page, deptFilter, typeFilter, levelFilter, yearFilter, statusFilter]);

    const handleSearch = () => {
        setPage(1);
        fetchStudents();
    };

    const fetchAuditLogs = useCallback(async () => {
        setAuditLoading(true);
        try {
            const res = await getMatricAuditLog({
                search: auditSearch,
                action: auditAction,
                page: auditPage,
                pageSize: 50,
            });
            setAuditLogs(res.logs);
            setAuditTotal(res.total);
            setAuditTotalPages(res.totalPages);
        } catch {
            toast.error("Failed to load audit log");
        }
        setAuditLoading(false);
    }, [auditSearch, auditAction, auditPage]);

    useEffect(() => {
        if (tab === "audit") fetchAuditLogs();
    }, [tab, auditPage, auditAction]);

    const searchAssignStudents = async () => {
        if (!assignSearch.trim()) return;
        setAssignLoading(true);
        try {
            const res = await getMatricStudents({ search: assignSearch, pageSize: 20 });
            setAssignResults(res.students);
        } catch {
            toast.error("Search failed");
        }
        setAssignLoading(false);
    };

    const handleBatchAssign = async () => {
        setBatchLoading(true);
        try {
            const res = await batchAssignMatricNumbers(batchYear);
            if (res.success) {
                toast.success(res.message);
                setShowBatchAssign(false);
                fetchStudents();
            } else {
                toast.error(res.error || "Failed to batch assign");
            }
        } catch {
            toast.error("Failed to run batch assignment");
        }
        setBatchLoading(false);
    };

    const [lastIssuedSerial, setLastIssuedSerial] = useState<number | null>(null);

    const selectStudentForAssign = async (student: any) => {
        setSelectedStudent(student);
        setAssignMode(student.matricNumber ? "change" : "assign");
        setCustomMatric("");
        setAssignReason("");
        setNextMatric("");
        setLastIssuedSerial(null);
        // Preview next number
        setPreviewLoading(true);
        try {
            const res = await previewNextMatricNumber({ 
                deptId: student.deptId,
                programmeType: student.programmeType,
                studyMode: student.studyMode
            });
            if (res.success && res.matricNumber) {
                setNextMatric(res.matricNumber);
                setCustomMatric(res.matricNumber);
                if (res.lastSerialNumber !== undefined) {
                    setLastIssuedSerial(res.lastSerialNumber);
                }
            }
        } catch {}
        setPreviewLoading(false);
    };

    const handleAssign = async () => {
        if (!selectedStudent) return;
        const matricToUse = customMatric.trim() || nextMatric;
        if (!matricToUse) {
            toast.error("No matriculation number to assign");
            return;
        }
        setAssignLoading(true);
        try {
            let res;
            if (assignMode === "assign") {
                res = await assignMatricNumber(selectedStudent.id, matricToUse, assignReason);
            } else {
                if (!assignReason.trim()) {
                    toast.error("Reason is required for changes");
                    setAssignLoading(false);
                    return;
                }
                res = await changeMatricNumber(selectedStudent.id, matricToUse, assignReason);
            }
            if (res.success) {
                toast.success(`Matriculation number ${assignMode === "assign" ? "assigned" : "changed"} successfully`);
                setSelectedStudent(null);
                setAssignSearch("");
                setAssignResults([]);
                fetchStudents();
            } else {
                toast.error(res.error);
            }
        } catch {
            toast.error("Operation failed");
        }
        setAssignLoading(false);
    };

    const showHistory = async (student: any) => {
        setHistoryLoading(true);
        setHistoryStudent(student);
        try {
            const res = await getStudentMatricHistory(student.id);
            if (res) {
                setHistoryStudent(res.student);
                setHistoryLogs(res.logs);
            }
        } catch {}
        setHistoryLoading(false);
    };

    const exportCSV = () => {
        const headers = ["Student Name", "Admission No", "Matric No", "Department", "Programme", "Year Entry", "Level", "Status"];
        const rows = students.map((s) => [
            `${s.lastName} ${s.firstName}`,
            s.admissionNumber || "",
            s.matricNumber || "PENDING",
            s.deptName || "",
            s.programmeName || "",
            s.admissionYear || "",
            s.currentLevel || "",
            s.status || "",
        ]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `matric-students-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported");
    };

    const exportAuditCSV = () => {
        const headers = ["Date", "Student", "Department", "Action", "Old Matric", "New Matric", "Performed By", "Reason"];
        const rows = auditLogs.map((l) => [
            l.createdAt ? format(new Date(l.createdAt), "yyyy-MM-dd HH:mm") : "",
            `${l.studentLastName || ""} ${l.studentFirstName || ""}`,
            l.deptName || "",
            l.action,
            l.oldMatric || "—",
            l.newMatric,
            l.performedByName || "",
            l.reason || "",
        ]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `matric-audit-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Audit log exported");
    };

    if (loading) {
        return (
            <div className="p-8 min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/registrar">
                        <Button variant="ghost" className="rounded-xl text-slate-500 font-bold">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Matriculation Administration</h1>
                        <p className="text-slate-500 mt-1">Manage student matriculation numbers, assignments, and revision history.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-200 pb-px">
                    {([
                        { key: "list", label: "Student List", icon: Users },
                        { key: "assign", label: "Assign / Change", icon: ArrowRightLeft },
                        { key: "audit", label: "Audit Log", icon: History },
                    ] as { key: Tab; label: string; icon: any }[]).map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-black uppercase tracking-wider transition-all",
                                tab === t.key
                                    ? "bg-white text-indigo-700 border border-b-0 border-slate-200 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Student List */}
                {tab === "list" && (
                    <div className="space-y-4">
                        <Card className="border border-slate-200 rounded-2xl shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                                placeholder="Search by name, matric no, admission no..."
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <select
                                        value={deptFilter}
                                        onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                                    >
                                        <option value="">All Departments</option>
                                        {departmentsList.map((d) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                                    >
                                        <option value="">All Types</option>
                                        <option value="ND">ND</option>
                                        <option value="HND">HND</option>
                                    </select>
                                    <select
                                        value={yearFilter}
                                        onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                                    >
                                        <option value="">All Years</option>
                                        {[2024, 2025, 2026, 2027].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={levelFilter}
                                        onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                                    >
                                        <option value="">All Levels</option>
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                    </select>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                                    >
                                        <option value="">All Status</option>
                                        <option value="assigned">Matric Assigned</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                    <Button
                                        onClick={handleSearch}
                                        className="rounded-xl bg-indigo-600 text-white font-bold text-sm px-5"
                                    >
                                        <Search className="w-4 h-4 mr-1" /> Search
                                    </Button>
                                    <Button
                                        onClick={exportCSV}
                                        variant="outline"
                                        className="rounded-xl border-slate-200 text-sm font-bold"
                                    >
                                        <Download className="w-4 h-4 mr-1" /> CSV
                                    </Button>
                                    <Button
                                        onClick={() => setShowBatchAssign(true)}
                                        className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-5 ml-auto"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-1" /> Batch Assign Pending
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">#</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Dept</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Programme</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Year Entry</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Level</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Matric Number</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {listLoading ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center">
                                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                                                </td>
                                            </tr>
                                        ) : students.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                                                    No students found
                                                </td>
                                            </tr>
                                        ) : (
                                            students.map((s, i) => (
                                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                                        {(page - 1) * 50 + i + 1}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-slate-800">{s.lastName} {s.firstName}</div>
                                                        {s.admissionNumber && (
                                                            <div className="text-[10px] font-mono text-slate-400">ADM: {s.admissionNumber}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{s.deptName || "—"}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                            {s.programmeType}
                                                        </span>
                                                        <span className="text-xs text-slate-500 ml-1">{s.programmeName}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-600">
                                                        {s.admissionYear || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-600">
                                                        {s.currentLevel === 1 ? "Year 1" : s.currentLevel === 2 ? "Year 2" : s.currentLevel}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {s.matricNumber ? (
                                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                                                                {s.matricNumber}
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">
                                                                PENDING
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1">
                                                            <Button
                                                                onClick={() => showHistory(s)}
                                                                variant="ghost"
                                                                className="h-8 px-2 text-[10px] font-bold text-slate-500"
                                                            >
                                                                <Eye className="w-3 h-3 mr-1" /> History
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    setTab("assign");
                                                                    selectStudentForAssign(s);
                                                                }}
                                                                variant="ghost"
                                                                className="h-8 px-2 text-[10px] font-bold text-indigo-600"
                                                            >
                                                                {s.matricNumber ? "Change" : "Assign"}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                                    <span className="text-xs text-slate-500">
                                        Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button
                                            onClick={() => setPage(Math.max(1, page - 1))}
                                            disabled={page === 1}
                                            variant="outline"
                                            className="h-8 w-8 p-0 rounded-lg"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="px-3 py-1 text-xs font-bold text-slate-600">{page}/{totalPages}</span>
                                        <Button
                                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                                            disabled={page === totalPages}
                                            variant="outline"
                                            className="h-8 w-8 p-0 rounded-lg"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* Tab: Assign / Change */}
                {tab === "assign" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Search & Results */}
                        <Card className="border border-slate-200 rounded-2xl shadow-sm">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                                <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <Search className="w-4 h-4" /> Find Student
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        value={assignSearch}
                                        onChange={(e) => setAssignSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && searchAssignStudents()}
                                        placeholder="Search by name, matric no, admission no..."
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <Button
                                        onClick={searchAssignStudents}
                                        disabled={assignLoading}
                                        className="rounded-xl bg-indigo-600 text-white font-bold text-sm"
                                    >
                                        {assignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto space-y-2">
                                    {assignResults.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => selectStudentForAssign(s)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-xl border transition-all",
                                                selectedStudent?.id === s.id
                                                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                                                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-sm text-slate-800">{s.lastName} {s.firstName}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        {s.deptName} · {s.programmeType} · {s.currentLevel === 1 ? "Year 1" : "Year 2"}
                                                    </div>
                                                </div>
                                                {s.matricNumber ? (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-black">
                                                        {s.matricNumber}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black">
                                                        PENDING
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Assign/Change Form */}
                        <Card className="border border-slate-200 rounded-2xl shadow-sm">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                                <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <ClipboardCheck className="w-4 h-4" />
                                    {selectedStudent?.matricNumber ? "Change Matriculation Number" : "Assign Matriculation Number"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                {!selectedStudent ? (
                                    <div className="py-12 text-center text-slate-400">
                                        <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-medium">Select a student from the search results</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Student Info */}
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="font-bold text-slate-800">{selectedStudent.lastName} {selectedStudent.firstName}</div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {selectedStudent.deptName} · {selectedStudent.programmeType} · ADM: {selectedStudent.admissionNumber || "N/A"}
                                                {selectedStudent.admissionYear && ` · Entry: ${selectedStudent.admissionYear}`}
                                            </div>
                                            {selectedStudent.matricNumber && (
                                                <div className="mt-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Matric:</span>
                                                    <span className="ml-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black">
                                                        {selectedStudent.matricNumber}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedStudent.previousMatricNumbers?.length > 0 && (
                                                <div className="mt-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previous:</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {selectedStudent.previousMatricNumbers.map((m: string) => (
                                                            <span key={m} className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-mono">{m}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Preview / Custom Input */}
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                                {selectedStudent.matricNumber ? "New Matriculation Number" : "Matriculation Number"}
                                            </label>
                                            {previewLoading ? (
                                                <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Generating preview...
                                                </div>
                                            ) : (
                                                <input
                                                    value={customMatric}
                                                    onChange={(e) => setCustomMatric(e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    placeholder="Enter or edit matriculation number"
                                                />
                                            )}
                                            {nextMatric && customMatric !== nextMatric && (
                                                <button
                                                    onClick={() => setCustomMatric(nextMatric)}
                                                    className="mt-1 text-[10px] text-indigo-600 font-bold hover:underline block"
                                                >
                                                    Use suggested: {nextMatric}
                                                </button>
                                            )}
                                            {lastIssuedSerial !== null && (
                                                <div className="mt-2 text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block font-medium">
                                                    Last Serial Number Issued: <span className="font-bold text-slate-700">{lastIssuedSerial}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Reason */}
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                                Reason {selectedStudent.matricNumber && <span className="text-rose-500">(required for changes)</span>}
                                            </label>
                                            <textarea
                                                value={assignReason}
                                                onChange={(e) => setAssignReason(e.target.value)}
                                                rows={2}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                                placeholder="e.g. Initial assignment, Correction from Bursary, etc."
                                            />
                                        </div>

                                        {/* Submit */}
                                        <Button
                                            onClick={handleAssign}
                                            disabled={assignLoading || !customMatric.trim()}
                                            className={cn(
                                                "w-full rounded-xl font-black text-sm uppercase tracking-wider py-4",
                                                selectedStudent.matricNumber
                                                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                            )}
                                        >
                                            {assignLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <ClipboardCheck className="w-4 h-4 mr-2" />
                                            )}
                                            {selectedStudent.matricNumber ? "Change Matric Number" : "Assign Matric Number"}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tab: Audit Log */}
                {tab === "audit" && (
                    <div className="space-y-4">
                        <Card className="border border-slate-200 rounded-2xl shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                value={auditSearch}
                                                onChange={(e) => setAuditSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && fetchAuditLogs()}
                                                placeholder="Search by student, matric number, admin name..."
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <select
                                        value={auditAction}
                                        onChange={(e) => { setAuditAction(e.target.value); setAuditPage(1); }}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                                    >
                                        <option value="all">All Actions</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="changed">Changed</option>
                                        <option value="restored">Restored</option>
                                    </select>
                                    <Button
                                        onClick={fetchAuditLogs}
                                        className="rounded-xl bg-indigo-600 text-white font-bold text-sm px-5"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                                    </Button>
                                    <Button
                                        onClick={exportAuditCSV}
                                        variant="outline"
                                        className="rounded-xl border-slate-200 text-sm font-bold"
                                    >
                                        <Download className="w-4 h-4 mr-1" /> CSV
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Dept</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Old Matric</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">New Matric</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">By</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {auditLoading ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center">
                                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                                                </td>
                                            </tr>
                                        ) : auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                                                    No audit records found
                                                </td>
                                            </tr>
                                        ) : (
                                            auditLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 text-xs text-slate-500">
                                                        {log.createdAt ? format(new Date(log.createdAt), "MMM dd, yyyy HH:mm") : "—"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-xs text-slate-800">
                                                            {log.studentLastName} {log.studentFirstName}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-600">{log.deptName || "—"}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                            log.action === "assigned" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                            log.action === "changed" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                            "bg-blue-100 text-blue-700 border-blue-200"
                                                        )}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.oldMatric || "—"}</td>
                                                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{log.newMatric}</td>
                                                    <td className="px-4 py-3 text-xs text-slate-600">{log.performedByName}</td>
                                                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">{log.reason || "—"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {auditTotalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                                    <span className="text-xs text-slate-500">
                                        Showing {(auditPage - 1) * 50 + 1}–{Math.min(auditPage * 50, auditTotal)} of {auditTotal}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button
                                            onClick={() => setAuditPage(Math.max(1, auditPage - 1))}
                                            disabled={auditPage === 1}
                                            variant="outline"
                                            className="h-8 w-8 p-0 rounded-lg"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="px-3 py-1 text-xs font-bold text-slate-600">{auditPage}/{auditTotalPages}</span>
                                        <Button
                                            onClick={() => setAuditPage(Math.min(auditTotalPages, auditPage + 1))}
                                            disabled={auditPage === auditTotalPages}
                                            variant="outline"
                                            className="h-8 w-8 p-0 rounded-lg"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* Batch Assign Modal */}
                {showBatchAssign && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !batchLoading && setShowBatchAssign(false)}>
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5 text-amber-500" />
                                    Batch Assign Matriculation Numbers
                                </h3>
                                <p className="text-sm text-slate-500 mt-2">
                                    This will generate and assign matriculation numbers to all <strong>active admitted students</strong> in the specified year who <strong>do not currently have one</strong>.
                                    Existing numbers will NOT be overwritten.
                                </p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1 block">Admission Year</label>
                                    <input
                                        type="number"
                                        value={batchYear}
                                        onChange={(e) => setBatchYear(Number(e.target.value))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-b-3xl flex justify-end gap-2 border-t border-slate-100">
                                <Button
                                    onClick={() => setShowBatchAssign(false)}
                                    disabled={batchLoading}
                                    variant="outline"
                                    className="rounded-xl font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleBatchAssign}
                                    disabled={batchLoading}
                                    className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                                >
                                    {batchLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    Run Batch Assign
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Modal */}
                {historyStudent && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setHistoryStudent(null)}>
                        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black text-lg text-slate-900">Matriculation History</h3>
                                    <button onClick={() => setHistoryStudent(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">
                                    {historyStudent.lastName} {historyStudent.firstName}
                                    {historyStudent.matricNumber && (
                                        <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black">
                                            {historyStudent.matricNumber}
                                        </span>
                                    )}
                                </p>
                                {historyStudent.previousMatricNumbers?.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {historyStudent.previousMatricNumbers.map((m: string) => (
                                            <span key={m} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-mono line-through">{m}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                {historyLoading ? (
                                    <div className="py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                                    </div>
                                ) : historyLogs.length === 0 ? (
                                    <p className="text-center text-slate-400 text-sm py-8">No matriculation history</p>
                                ) : (
                                    <div className="space-y-3">
                                        {historyLogs.map((log) => (
                                            <div key={log.id} className="p-3 rounded-xl border border-slate-200">
                                                <div className="flex items-center justify-between">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                        log.action === "assigned" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                        log.action === "changed" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                        "bg-blue-100 text-blue-700 border-blue-200"
                                                    )}>
                                                        {log.action}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {log.createdAt ? format(new Date(log.createdAt), "MMM dd, yyyy HH:mm") : ""}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2 text-xs font-mono">
                                                    {log.oldMatric && <span className="text-slate-400 line-through">{log.oldMatric}</span>}
                                                    {log.oldMatric && <span className="text-slate-300">→</span>}
                                                    <span className="font-bold text-slate-800">{log.newMatric}</span>
                                                </div>
                                                {log.reason && (
                                                    <p className="mt-1 text-[10px] text-slate-500 italic">{log.reason}</p>
                                                )}
                                                <p className="mt-1 text-[10px] text-slate-400">by {log.performedByName}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
