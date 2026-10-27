"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Loader2, Search, FileUp, X, FileText, ShieldAlert, QrCode, Trash2, AlertTriangle, Lock, Unlock, CreditCard } from "lucide-react";
import { getDepartments } from "@/actions/departments";
import { getStudents, approveStudent, bulkImportStudents, toggleFinancialLock, togglePaymentLock, bulkTogglePaymentLock, getStudentSessionOptions, deleteStudentAccount, bulkDeleteStudentAccounts } from "@/actions/students";
import { impersonateUser } from "@/actions/impersonation";
import { generateIdentityQRCodeAction } from "@/actions/utility-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { UniversalImporter } from "@/components/UniversalImporter";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Suspense } from "react";
import { AccountManagementModal } from "@/components/admin/AccountManagementModal";
import { BulkPlacementModal } from "@/components/admin/BulkPlacementModal";
import Link from "next/link";

import { useBranch } from "@/providers/BranchProvider";

function StudentsPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isK12 } = useBranch();
    const settings = { base_currency: "\u20A6" };

    const [students, setStudents] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<any[]>([]);
    const [departmentsList, setDepartmentsList] = useState<any[]>([]);
    const [unassignedCount, setUnassignedCount] = useState(0);
    const [graduationYears, setGraduationYears] = useState<number[]>([]);
    const [showImporter, setShowImporter] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [showBulkPlacement, setShowBulkPlacement] = useState(false);

    const [qrStudent, setQrStudent] = useState<any | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<any | null>(null);
    const [deletePermanent, setDeletePermanent] = useState(false);
    const [deletingStudent, setDeletingStudent] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const levelParam = searchParams.get("level");
    const level = levelParam || undefined;
    const sessionParam = searchParams.get("session") || undefined;
    const semesterParam = searchParams.get("semester") || undefined;
    const deptIdParam = searchParams.get("deptId") || undefined;
    const statusParam = searchParams.get("status") || "all";
    const gradYearParam = searchParams.get("gradYear") || undefined;

    const [statusCounts, setStatusCounts] = useState<{
        all: number;
        active: number;
        nd_graduant: number;
        hnd_graduant: number;
        suspended: number;
        pending_review: number;
    } | null>(null);

    const [searchInput, setSearchInput] = useState(search);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync input when search query param changes externally (e.g. browser back/forward or reset)
    useEffect(() => {
        setSearchInput(search);
    }, [search]);

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const graduantLevels = ["ND_GRADUANT", "ND_GRADUATED", "ND Graduant", "ND Graduated", "HND_GRADUANT", "HND_GRADUATED", "HND Graduant", "HND Graduated"];
    const levelIsGraduant = !!level && graduantLevels.includes(level);
    const statusOptions = [
        { value: "all", label: "All Statuses" },
        { value: "active", label: "Active" },
        { value: "nd_graduant", label: "ND Graduant" },
        { value: "hnd_graduant", label: "HND Graduant" },
        { value: "graduant", label: "All Graduants (ND & HND)" },
        { value: "suspended", label: "Suspended" },
        { value: "pending_review", label: "Pending Review" },
    ];

    const levels = isK12 
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(l => ({ value: String(l), label: `Grade ${l}` }))
        : [
            { value: "ND 1", label: "ND 1" },
            { value: "ND 2", label: "ND 2" },
            { value: "ND_GRADUANT", label: "ND Graduant" },
            { value: "HND 1", label: "HND 1" },
            { value: "HND 2", label: "HND 2" },
            { value: "HND_GRADUANT", label: "HND Graduant" },
          ];

    const hasExplicitStatus = searchParams.has("status");
    const effectiveStatus = levelIsGraduant ? undefined : (search.trim() && !hasExplicitStatus ? "all" : statusParam);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const res = await getStudents({ search, page, pageSize, level, sessionId: sessionParam, semester: semesterParam, departmentId: deptIdParam ? parseInt(deptIdParam) : undefined, status: effectiveStatus, graduationYear: gradYearParam });
        if (res.success) {
            setStudents(res.data);
            setTotalCount(res.totalCount);
        }
        setLoading(false);
    }, [search, page, pageSize, level, sessionParam, semesterParam, deptIdParam, effectiveStatus, gradYearParam]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {
        (async () => {
            const [res, deptRes] = await Promise.all([getStudentSessionOptions(), getDepartments()]);
            if (deptRes.success) { setDepartmentsList(deptRes.data); }
            if (res.success) {
                setSessions(res.sessions);
                setUnassignedCount(res.unassignedCount);
                setGraduationYears(res.graduationYears || []);
                if (res.statusCounts) {
                    setStatusCounts(res.statusCounts);
                }
            }
        })();
    }, []);

    const handleSearch = useCallback((value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const trimmed = value.trim();
        if (trimmed) {
            params.set("search", trimmed);
        } else {
            params.delete("search");
        }
        params.set("page", "1");
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
    }, [searchParams, pathname, router]);

    const handleSearchChange = (val: string) => {
        setSearchInput(val);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // When content is erased from the search box, IMMEDIATELY load the entire data!
        if (val.trim() === "") {
            handleSearch("");
            return;
        }

        // Live debounce (350ms) so typing naturally updates search without waiting for enter
        searchTimeoutRef.current = setTimeout(() => {
            handleSearch(val);
        }, 350);
    };

    const handleClearSearch = () => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        setSearchInput("");
        handleSearch("");
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            handleSearch(searchInput);
        }
    };

    const hasActiveFilters = Boolean(
        search ||
        levelParam ||
        sessionParam ||
        semesterParam ||
        deptIdParam ||
        gradYearParam ||
        (searchParams.has("status") && statusParam !== "all")
    );

    const handleResetAllFilters = () => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        setSearchInput("");
        router.push(pathname);
    };

    const handleLevelChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set("level", value);
        } else {
            params.delete("level");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSessionChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set("session", value);
        } else {
            params.delete("session");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleDepartmentChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set("deptId", value);
        } else {
            params.delete("deptId");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSemesterChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set("semester", value);
        } else {
            params.delete("semester");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleStatusChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            params.set("status", value);
        } else {
            params.delete("status");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleGradYearChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set("gradYear", value);
        } else {
            params.delete("gradYear");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleApprove = async (userId: number) => {
        const matric = prompt("Enter Matric Number for this student:");
        if (!matric) return;
        const res = await approveStudent(userId, matric);
        if (res.success) fetchStudents();
    };

    const handleToggleLock = async (studentId: number, currentStatus: boolean, name: string) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'unlock' : 'lock'} the financial status for ${name}?`)) {
            const res = await toggleFinancialLock(studentId, !currentStatus);
            if (res.success) {
                fetchStudents();
            } else {
                alert(res.error);
            }
        }
    };

    const handleTogglePaymentLock = async (studentId: number, currentStatus: boolean, name: string) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'unlock' : 'lock'} payment for ${name}? When locked, the student cannot pay online, but administrators can post payments on their behalf.`)) {
            const res = await togglePaymentLock(studentId, !currentStatus);
            if (res.success) {
                fetchStudents();
            } else {
                alert(res.error || "Failed to update payment lock");
            }
        }
    };

    const handleBulkPaymentLock = async (status: boolean) => {
        if (selectedStudentIds.length === 0) return;
        const actionLabel = status ? "lock payment for" : "unlock payment for";
        if (confirm(`Are you sure you want to ${actionLabel} ${selectedStudentIds.length} selected student(s)?`)) {
            const res = await bulkTogglePaymentLock(selectedStudentIds, status);
            if (res.success) {
                setSelectedStudentIds([]);
                fetchStudents();
            } else {
                alert(res.error || "Failed to update payment locks");
            }
        }
    };

    const handleDeleteStudent = async () => {
        if (!studentToDelete) return;
        setDeletingStudent(true);
        try {
            const res = await deleteStudentAccount(studentToDelete.id, { permanent: deletePermanent });
            if (res.success) {
                setStudentToDelete(null);
                setDeletePermanent(false);
                fetchStudents();
            } else {
                alert(res.error || "Failed to delete student account");
            }
        } catch (err: any) {
            alert(err?.message || "An error occurred while deleting the student");
        } finally {
            setDeletingStudent(false);
        }
    };

    const handleBulkDeleteStudents = async () => {
        if (selectedStudentIds.length === 0) return;
        setBulkDeleting(true);
        try {
            const res = await bulkDeleteStudentAccounts(selectedStudentIds, { permanent: deletePermanent });
            if (res.success) {
                setShowBulkDeleteModal(false);
                setSelectedStudentIds([]);
                setDeletePermanent(false);
                fetchStudents();
            } else {
                alert(res.error || "Failed to delete selected students");
            }
        } catch (err: any) {
            alert(err?.message || "An error occurred during bulk deletion");
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleViewQR = async (student: any) => {
        setQrStudent(student);
        setQrLoading(true);
        setQrDataUrl(null);
        try {
            // Student ID QR format: std:<matricNumber || admissionNumber || studentId>
            const idVal = student.matricNumber || student.admissionNumber || student.id;
            const res = await generateIdentityQRCodeAction(`std:${idVal}`);
            if (res.success && res.dataUrl) {
                setQrDataUrl(res.dataUrl);
            } else {
                alert(res.error || "Failed to generate ID QR");
                setQrStudent(null);
            }
        } catch (error: any) {
            alert(error.message || "An unexpected error occurred");
            setQrStudent(null);
        } finally {
            setQrLoading(false);
        }
    };

    return (
        <div className="p-8 pb-32 max-w-[1600px] w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Student Management</h2>
                    <p className="text-slate-500 mt-1">Review and manage student records</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    <Button
                        onClick={() => setShowImporter(!showImporter)}
                        variant="outline"
                        className="rounded-xl font-bold text-xs uppercase tracking-widest h-10 border-slate-200 bg-white gap-2"
                    >
                        {showImporter ? <X className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                        {showImporter ? "Close Importer" : "Import Students"}
                    </Button>
                    
                    <select
                        className="px-3 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                        value={levelParam || ""}
                        onChange={(e) => handleLevelChange(e.target.value)}
                    >
                        <option value="">All Levels</option>
                        {levels.map((lvl) => (
                            <option key={lvl.value} value={lvl.value}>
                                {lvl.label}
                            </option>
                        ))}
                    </select>
                    <select
                        className="px-3 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                        value={statusParam}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        title="Filter by student status"
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.value === "all" ? "All Statuses" : `Status: ${opt.label}`}
                            </option>
                        ))}
                    </select>
                    <select
                        className="px-3 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                        value={gradYearParam || ""}
                        onChange={(e) => handleGradYearChange(e.target.value)}
                        title="Filter graduants by year of graduation"
                    >
                        <option value="">All Graduation Years</option>
                        {graduationYears.map((y) => (
                            <option key={y} value={y.toString()}>{`Graduated ${y}`}</option>
                        ))}
                    </select>
                    <select
                        className="px-3 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                        value={sessionParam || ""}
                        onChange={(e) => handleSessionChange(e.target.value)}
                    >
                        <option value="">All Sessions</option>
                        <option value="unassigned">
                            No Session Assigned ({unassignedCount.toLocaleString()})
                        </option>
                        {sessions.map((s) => (
                            <option key={s.id} value={s.id.toString()}>
                                {s.name}
                                {s.isCurrent ? " (Current)" : s.status === "archived" ? " (Archived)" : ""}
                                {` - ${(s.studentCount || 0).toLocaleString()}`}
                            </option>
                        ))}
                    </select>
                    
                    <select
                        className="px-3 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                        value={semesterParam || ""}
                        onChange={(e) => handleSemesterChange(e.target.value)}
                    >
                        <option value="">All Semesters</option>
                        <option value="1">1st Semester</option>
                        <option value="2">2nd Semester</option>
                    </select>

                    <select
                        className="px-3 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                        value={deptIdParam || ""}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {departmentsList.map((d) => (
                            <option key={d.id} value={d.id.toString()}>{d.name}</option>
                        ))}
                    </select>

                      <div className="relative w-full md:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                              className="w-full pl-10 pr-16 py-2 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-sm"
                              placeholder="Search students..."
                              value={searchInput}
                              onChange={(e) => handleSearchChange(e.target.value)}
                              onKeyDown={handleSearchKeyDown}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              {searchInput && (
                                  <button
                                      type="button"
                                      onClick={handleClearSearch}
                                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                      title="Clear search"
                                  >
                                      <X className="w-3.5 h-3.5" />
                                  </button>
                              )}
                              {search && (
                                  <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md pointer-events-none">
                                      {totalCount.toLocaleString()}
                                  </div>
                              )}
                          </div>
                      </div>

                      {hasActiveFilters && (
                          <Button
                              variant="outline"
                              onClick={handleResetAllFilters}
                              className="rounded-xl font-bold text-xs uppercase tracking-wider h-10 border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 gap-1.5 shadow-sm"
                              title="Reset all filters and search"
                          >
                              <X className="w-3.5 h-3.5" />
                              Reset Filters
                          </Button>
                      )}
                </div>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                {[
                    { id: "all", label: "All Students", count: statusCounts?.all },
                    { id: "active", label: "Active", count: statusCounts?.active },
                    { id: "nd_graduant", label: "ND Graduants", count: statusCounts?.nd_graduant },
                    { id: "hnd_graduant", label: "HND Graduants", count: statusCounts?.hnd_graduant },
                    { id: "suspended", label: "Suspended", count: statusCounts?.suspended },
                    { id: "pending_review", label: "Pending Review", count: statusCounts?.pending_review },
                ].map((tab) => {
                    const isSelected = (!searchParams.get("status") && tab.id === "all") || searchParams.get("status") === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleStatusChange(tab.id)}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                isSelected
                                    ? "bg-indigo-600 text-white shadow-indigo-200"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <span>{tab.label}</span>
                            {typeof tab.count === "number" && (
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                        isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                                    }`}
                                >
                                    {tab.count.toLocaleString()}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {showImporter && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <UniversalImporter
                        title="Bulk Student Import"
                        description="Upload an Excel or CSV file containing student names, emails, matriculation numbers, entry modes (Full Time/Part Time), and admission years."
                        templateColumns={["name", "email", "matricNumber", "level", "programmeId", "modeOfEntry", "admissionYear"]}
                        onImport={bulkImportStudents}
                        onComplete={() => {
                            fetchStudents();
                            setShowImporter(false);
                        }}
                    />
                </div>
            )}



            <Card className="border-none shadow-sm overflow-hidden flex flex-col">
                {selectedStudentIds.length > 0 && (
                    <div className="mx-6 mt-6 mb-2 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-bold text-indigo-700">{selectedStudentIds.length} student(s) selected</span>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setSelectedStudentIds([])}
                                variant="outline"
                                className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-white"
                            >
                                Clear
                            </Button>
                            <Button
                                onClick={() => handleBulkPaymentLock(true)}
                                variant="outline"
                                className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 gap-1.5"
                                title="Lock self-service payment for selected students"
                            >
                                <Lock className="w-3.5 h-3.5" />
                                Lock Payment
                            </Button>
                            <Button
                                onClick={() => handleBulkPaymentLock(false)}
                                variant="outline"
                                className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 gap-1.5"
                                title="Unlock self-service payment for selected students"
                            >
                                <Unlock className="w-3.5 h-3.5" />
                                Unlock Payment
                            </Button>
                            <Button
                                onClick={() => setShowBulkPlacement(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider"
                            >
                                Bulk Placement
                            </Button>
                            <Button
                                onClick={() => setShowBulkDeleteModal(true)}
                                variant="outline"
                                className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 gap-1.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove Selected
                            </Button>
                        </div>
                    </div>
                )}
                <DataTablePagination
                    totalItems={totalCount}
                    pageSize={pageSize}
                    currentPage={page}
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        checked={students.length > 0 && selectedStudentIds.length === students.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedStudentIds(students.map(s => s.id));
                                            } else {
                                                setSelectedStudentIds([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Matric No.</th>
                                <th className="px-6 py-4">Level</th>
                                <th className="px-6 py-4">Session</th>
                                <th className="px-6 py-4">Programme</th>
                                <th className="px-6 py-4">Wallet</th>
                                <th className="px-6 py-4">Fin Status</th>
                                <th className="px-4 py-4 text-center">Pay Lock</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-10 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-10 text-center text-slate-500">
                                        No students found.
                                    </td>
                                </tr>
                            ) : (
                                students.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                checked={selectedStudentIds.includes(s.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedStudentIds(prev => [...prev, s.id]);
                                                    } else {
                                                        setSelectedStudentIds(prev => prev.filter(id => id !== s.id));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <Link href={`/admin/students/${s.id}`} className="text-sm font-bold text-indigo-600 hover:underline hover:text-indigo-800 transition-colors cursor-pointer">
                                                    {s.user?.name}
                                                </Link>
                                                <span className="text-xs text-slate-400">{s.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.matricNumber ? (
                                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold font-mono">
                                                    {s.matricNumber}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-orange-500 font-medium italic">Pending Approval</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.status === 'nd_graduant' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
                                                    ND Graduant
                                                </span>
                                            ) : s.status === 'nd_graduated' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
                                                    ND Graduated
                                                </span>
                                            ) : s.status === 'hnd_graduant' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-sm">
                                                    HND Graduant
                                                </span>
                                            ) : s.status === 'hnd_graduated' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-sm">
                                                    HND Graduated
                                                </span>
                                            ) : s.status === 'suspended' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-sm">
                                                    Suspended
                                                </span>
                                            ) : s.status === 'pending_review' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-sm">
                                                    Pending Review
                                                </span>
                                            ) : (
                                                <span className="text-sm font-bold text-slate-700">
                                                    {isK12 ? `Grade ${s.currentLevel}` : `${s.programme?.programmeType || ''} ${s.currentLevel}`.trim()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.currentSession ? (
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold ${s.currentSession.isCurrent ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                        {s.currentSession.name}
                                                    </span>
                                                    {s.currentSession.isCurrent && (
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500">Current</span>
                                                    )}
                                                    {s.admissionSession && (
                                                        <span className="text-[10px] text-slate-400">
                                                            Admitted: {s.admissionSession.name}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Not assigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600">{s.programme?.name || 'Not Assigned'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700">{settings?.base_currency || "\u20A6"}{parseFloat(s.digitalWalletBalance || '0').toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleLock(s.id, s.isFinanciallyLocked, s.user?.name)}
                                                className={`h-8 px-2 text-xs gap-1 rounded-lg border font-bold ${s.isFinanciallyLocked ? 'border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100' : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                                            >
                                                {s.isFinanciallyLocked ? 'Locked' : 'Clear'}
                                            </Button>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTogglePaymentLock(s.id, Boolean(s.isPaymentLocked), s.user?.name)}
                                                className={`h-7 px-2.5 text-[11px] gap-1 rounded-lg border font-bold ${s.isPaymentLocked ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' : 'border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100'}`}
                                                title={s.isPaymentLocked ? 'Online payment locked: student cannot pay, admin can pay' : 'Online payment allowed'}
                                            >
                                                {s.isPaymentLocked ? (
                                                    <>
                                                        <Lock className="w-3 h-3 text-amber-600" />
                                                        Locked
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock className="w-3 h-3 text-slate-400" />
                                                        Unlocked
                                                    </>
                                                )}
                                            </Button>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    if (confirm(`Do you want to log in as ${s.user?.name}?`)) {
                                                        const res = await impersonateUser(s.userId);
                                                        if (res.success) {
                                                            window.location.href = "/";
                                                        } else {
                                                            alert(res.error);
                                                        }
                                                    }
                                                }}
                                                className="h-8 w-8 p-0 rounded-lg text-amber-600 hover:bg-amber-50"
                                                title="Login As Student"
                                            >
                                                <ShieldAlert className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewQR(s)}
                                                className="h-8 w-8 p-0 rounded-lg text-indigo-600 hover:bg-indigo-50"
                                                title="View Student QR ID"
                                            >
                                                <QrCode className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedUser({ user: s.user, student: s })}
                                                className="h-8 px-3 text-xs gap-1 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100"
                                                title="Account Management"
                                            >
                                                <Users className="w-3 h-3" />
                                                Account
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/admin/bursary/ledger/${s.id}`)}
                                                className="h-8 px-3 text-xs gap-1 rounded-lg border-slate-200 text-indigo-600 hover:bg-indigo-50"
                                            >
                                                <FileText className="w-3 h-3" />
                                                Ledger
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setStudentToDelete(s);
                                                    setDeletePermanent(false);
                                                }}
                                                className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                title="Remove Student Account"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            {!s.matricNumber && (
                                                <Button
                                                    onClick={() => handleApprove(s.userId)}
                                                    className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs gap-1 rounded-lg"
                                                >
                                                    <CheckCircle className="w-3 h-3" />
                                                    Approve
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <DataTablePagination
                    totalItems={totalCount}
                    pageSize={pageSize}
                    currentPage={page}
                />
            </Card>

            <AccountManagementModal 
                user={selectedUser?.user} 
                student={selectedUser?.student}
                onClose={() => setSelectedUser(null)}
                onUpdate={fetchStudents}
            />

            <BulkPlacementModal
                open={showBulkPlacement}
                onClose={() => setShowBulkPlacement(false)}
                selectedStudentIds={selectedStudentIds}
                sessions={sessions}
                onComplete={() => {
                    setSelectedStudentIds([]);
                    fetchStudents();
                }}
            />

            {/* Student ID QR Modal */}
            <Dialog open={!!qrStudent} onOpenChange={(open) => {
                if (!open) {
                    setQrStudent(null);
                    setQrDataUrl(null);
                }
            }}>
                <DialogContent className="border-none shadow-2xl rounded-[2.5rem] bg-white max-w-sm p-8">
                    <DialogHeader className="text-center space-y-3">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                            <QrCode className="w-6 h-6 animate-pulse" />
                        </div>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
                            Student QR ID
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium text-xs">
                            Verify student identity using this secure QR code.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        {qrLoading ? (
                            <div className="flex flex-col items-center justify-center space-y-2 h-48">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generating ID Code...</span>
                            </div>
                        ) : qrDataUrl ? (
                            <>
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrDataUrl} alt="Student QR ID Card" className="w-48 h-48 mix-blend-multiply" />
                                </div>
                                {qrStudent && (
                                    <div className="text-center space-y-1">
                                        <p className="font-black text-slate-900 uppercase italic text-sm">{qrStudent.user?.name}</p>
                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                                            {qrStudent.matricNumber ? `MATRIC: ${qrStudent.matricNumber}` : `ID: ${qrStudent.id}`}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{qrStudent.programme?.name || "Not Assigned"}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center text-rose-500 py-6 text-sm font-bold flex flex-col items-center gap-2">
                                <ShieldAlert className="w-8 h-8" />
                                Failed to generate QR code.
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            onClick={() => {
                                setQrStudent(null);
                                setQrDataUrl(null);
                            }}
                            className="w-full bg-slate-900 hover:bg-black text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-slate-100"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Single Student Delete Confirmation Dialog */}
            <Dialog open={!!studentToDelete} onOpenChange={(open) => {
                if (!open) {
                    setStudentToDelete(null);
                    setDeletePermanent(false);
                }
            }}>
                <DialogContent className="border-none shadow-2xl rounded-2xl bg-white max-w-md p-6">
                    <DialogHeader className="space-y-2">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-slate-900">
                            Remove Student Account
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                            Are you sure you want to remove <strong className="text-slate-800">{studentToDelete?.user?.name || studentToDelete?.matricNumber}</strong>?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                            <p className="font-semibold">Notice:</p>
                            <p className="mt-0.5">
                                Soft delete releases the email and matric number so they can be re-registered, while keeping audit logs intact. Permanent delete completely wipes all bills, records, and login credentials.
                            </p>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <input
                                type="checkbox"
                                checked={deletePermanent}
                                onChange={(e) => setDeletePermanent(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                            />
                            <div className="text-xs">
                                <span className="font-bold text-slate-900 block">Permanent Deletion</span>
                                <span className="text-slate-500">Purge student record and associated fee bills completely</span>
                            </div>
                        </label>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStudentToDelete(null);
                                setDeletePermanent(false);
                            }}
                            className="rounded-xl font-bold text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteStudent}
                            disabled={deletingStudent}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs gap-1.5"
                        >
                            {deletingStudent && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {deletePermanent ? "Permanently Delete" : "Remove Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Student Delete Confirmation Dialog */}
            <Dialog open={showBulkDeleteModal} onOpenChange={(open) => {
                if (!open) {
                    setShowBulkDeleteModal(false);
                    setDeletePermanent(false);
                }
            }}>
                <DialogContent className="border-none shadow-2xl rounded-2xl bg-white max-w-md p-6">
                    <DialogHeader className="space-y-2">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-slate-900">
                            Remove Selected Students
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                            You are about to remove <strong className="text-slate-900">{selectedStudentIds.length}</strong> selected student account(s).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                            <p className="font-semibold">Bulk Operation Warning:</p>
                            <p className="mt-0.5">
                                This will apply to all {selectedStudentIds.length} chosen students. Make sure you have reviewed the selection carefully before proceeding.
                            </p>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <input
                                type="checkbox"
                                checked={deletePermanent}
                                onChange={(e) => setDeletePermanent(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                            />
                            <div className="text-xs">
                                <span className="font-bold text-slate-900 block">Permanent Deletion</span>
                                <span className="text-slate-500">Purge records and associated student bills completely</span>
                            </div>
                        </label>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowBulkDeleteModal(false);
                                setDeletePermanent(false);
                            }}
                            className="rounded-xl font-bold text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkDeleteStudents}
                            disabled={bulkDeleting}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs gap-1.5"
                        >
                            {bulkDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {deletePermanent ? `Permanently Delete (${selectedStudentIds.length})` : `Remove (${selectedStudentIds.length})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function StudentsPage() {
    return (
        <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>}>
            <StudentsPageContent />
        </Suspense>
    );
}
