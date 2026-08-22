"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText, Search, Loader2, User, Calendar, CheckCircle2,
    XCircle, AlertCircle, Activity, Filter, ExternalLink, ChevronLeft, ChevronRight,
    CheckSquare, Square, Download, FileSpreadsheet, Printer, Trash2
} from "lucide-react";
import { getAdminV2Applications, bulkUpdateAdmissionStatus, getAdmissionTemplates, exportAdminV2Applications, deleteAdmissionApplication, bulkDeleteAdmissionApplications, getAdmissionAcademicUnits, generateBulkApplicantFilesZip } from "@/actions/admission_v2";
import * as xlsx from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AdminV2ApplicationsContent() {
    const searchParams = useSearchParams();
    const urlSearchParam = searchParams.get("search") || "";
    const urlStatusParam = searchParams.get("status") || "all";
    const urlPaymentParam = searchParams.get("paymentStatus") || "all";
    const urlLevelParam = searchParams.get("level") || "all";
    const urlDeptParam = searchParams.get("departmentId") ? Number(searchParams.get("departmentId")) : undefined;
    const urlProgParam = searchParams.get("programmeId") ? Number(searchParams.get("programmeId")) : undefined;
    
    const [data, setData] = useState<any>({ applications: [], total: 0, page: 1, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(urlSearchParam);
    const [statusFilter, setStatusFilter] = useState(urlStatusParam);
    const [paymentFilter, setPaymentFilter] = useState(urlPaymentParam);

    const [templateFilter, setTemplateFilter] = useState<number | undefined>(undefined);
    const [facultyFilter, setFacultyFilter] = useState<number | undefined>(undefined);
    const [departmentFilter, setDepartmentFilter] = useState<number | undefined>(urlDeptParam);
    const [programmeFilter, setProgrammeFilter] = useState<number | undefined>(urlProgParam);
    const [levelFilter, setLevelFilter] = useState<string>(urlLevelParam);
    const [modeFilter, setModeFilter] = useState<string>("all");

    const [faculties, setFaculties] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [programmes, setProgrammes] = useState<any[]>([]);

    const [templates, setTemplates] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkAction, setBulkAction] = useState("");

    useEffect(() => {
        setSearch(searchParams.get("search") || "");
        setStatusFilter(searchParams.get("status") || "all");
        setPaymentFilter(searchParams.get("paymentStatus") || "all");
        setLevelFilter(searchParams.get("level") || "all");
        setDepartmentFilter(searchParams.get("departmentId") ? Number(searchParams.get("departmentId")) : undefined);
        setProgrammeFilter(searchParams.get("programmeId") ? Number(searchParams.get("programmeId")) : undefined);
    }, [searchParams]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const result = await getAdminV2Applications({
            search: search || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
            templateId: templateFilter,
            facultyId: facultyFilter,
            departmentId: departmentFilter,
            programmeId: programmeFilter,
            level: levelFilter !== 'all' ? levelFilter : undefined,
            applicationMode: modeFilter !== 'all' ? modeFilter : undefined,
            page,
            pageSize: 10,
        });
        setData(result);
        setLoading(false);
    }, [search, statusFilter, paymentFilter, templateFilter, facultyFilter, departmentFilter, programmeFilter, levelFilter, modeFilter, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        getAdmissionTemplates().then(setTemplates).catch(() => {});
        getAdmissionAcademicUnits().then((res) => {
            if (res.success) {
                setFaculties(res.faculties || []);
                setDepartments(res.departments || []);
                setProgrammes(res.programmes || []);
            }
        }).catch(() => {});
    }, []);

    const filteredDepartments = facultyFilter
        ? departments.filter((d: any) => d.facultyId === facultyFilter)
        : departments;

    const filteredProgrammes = departmentFilter
        ? programmes.filter((p: any) => p.departmentId === departmentFilter || p.deptId === departmentFilter)
        : facultyFilter
        ? programmes.filter((p: any) => {
            const d = departments.find((dept: any) => dept.id === (p.departmentId || p.deptId));
            return d?.facultyId === facultyFilter;
        })
        : programmes;

    const handleBulkAction = async (action: string) => {
        if (selectedIds.size === 0) { toast.error("No applications selected"); return; }
        const ids = Array.from(selectedIds);
        const notes = action === 'rejected' ? prompt("Enter rejection reason:") : undefined;
        if (action === 'rejected' && !notes) { toast.error("Rejection reason is required"); return; }
        const res = await bulkUpdateAdmissionStatus(ids, action, notes || undefined);
        if (res.success) {
            toast.success(`${res.count} application(s) ${action === 'admitted' ? 'admitted' : 'rejected'}`);
            setSelectedIds(new Set());
            fetchData();
        } else {
            toast.error(res.error || "Action failed");
        }
        setBulkAction("");
    };

    const handleSingleDelete = async (appId: number) => {
        if (!confirm("Are you sure you want to delete this application record?")) return;
        setLoading(true);
        const res = await deleteAdmissionApplication(appId);
        setLoading(false);
        if (res.success) {
            toast.success("Application deleted successfully");
            fetchData();
        } else {
            toast.error(res.error || "Failed to delete application");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected application(s)? This action cannot be undone.`)) return;
        setLoading(true);
        const res = await bulkDeleteAdmissionApplications(Array.from(selectedIds));
        setLoading(false);
        if (res.success) {
            toast.success("Selected applications deleted successfully");
            setSelectedIds(new Set());
            fetchData();
        } else {
            toast.error(res.error || "Failed to delete selected applications");
        }
    };

    const selectNaRecords = () => {
        const naIds = (data?.applications || [])
            .filter((app: any) => app.applicantName === 'N/A' || app.templateName === 'N/A' || !app.formNumber || app.formNumber === '—')
            .map((app: any) => app.id);
        if (naIds.length === 0) {
            toast.info("No N/A records found on current page");
            return;
        }
        setSelectedIds(new Set(naIds));
        toast.success(`Selected ${naIds.length} N/A record(s)`);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === (data?.applications?.length || 0)) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(data?.applications?.map((a: any) => a.id) || []));
        }
    };

    const handleExportExcel = async () => {
        setLoading(true);
        try {
            const result = await exportAdminV2Applications({
                search: search || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
                templateId: templateFilter,
                facultyId: facultyFilter,
                departmentId: departmentFilter,
                programmeId: programmeFilter,
                level: levelFilter !== 'all' ? levelFilter : undefined,
                applicationMode: modeFilter !== 'all' ? modeFilter : undefined,
            });
            if (result.success && result.applications.length > 0) {
                const exportData = result.applications.map((app: any) => ({
                    'Application Date': app.appliedAt ? format(new Date(app.appliedAt), 'yyyy-MM-dd HH:mm') : 'N/A',
                    'Form Number': app.formNumber || 'N/A',
                    'Applicant Name': app.applicantName || 'N/A',
                    'Email': app.applicantEmail || 'N/A',
                    'Phone': app.applicantPhone || 'N/A',
                    'Faculty': app.facultyName || 'N/A',
                    'Department': app.departmentName || 'N/A',
                    'Programme': app.programmeName || 'Pending Course Selection',
                    'Mode of Study': app.applicationMode === 'full_time' ? 'Full Time' : app.applicationMode === 'part_time' ? 'Part Time' : 'N/A',
                    'Level': app.academicLevel || 'N/A',
                    'Status': app.status ? String(app.status).toUpperCase() : 'N/A',
                    'Payment Status': app.paymentStatus ? String(app.paymentStatus).toUpperCase() : 'N/A',
                    'Template': app.templateName || 'N/A'
                }));
                const worksheet = xlsx.utils.json_to_sheet(exportData);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "Filtered Applications");
                xlsx.writeFile(workbook, `admission_applications_filtered_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
                toast.success(`Exported ${exportData.length} matching application(s) to Excel`);
            } else {
                toast.error("No applications match the currently selected filters");
            }
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Export failed");
        }
        setLoading(false);
    };

    const handleBulkDownloadPDFs = async () => {
        if (selectedIds.size === 0) { toast.error("No applications selected"); return; }
        setLoading(true);
        try {
            const selectedApps = (data?.applications || []).filter((a: any) => selectedIds.has(a.id));
            const doc = new jsPDF();
            
            doc.setFontSize(20);
            doc.text("Admission Applications Report", 14, 22);
            doc.setFontSize(11);
            doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 30);
            
            const tableData = selectedApps.map((app: any) => [
                app.formNumber || 'N/A',
                app.applicantName,
                app.parsedData?.email || 'N/A',
                app.templateName,
                app.status.toUpperCase(),
                app.paymentStatus.toUpperCase()
            ]);

            autoTable(doc, {
                startY: 40,
                head: [['Form No', 'Applicant Name', 'Email', 'Template', 'Status', 'Payment']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] }
            });

            doc.save("Applications_Report.pdf");
        } catch (err: any) {
            console.error("PDF Export Error:", err);
            toast.error("Failed to generate PDF");
        }
    };

    const handleBulkDownloadFilesZip = async () => {
        const targetIds = selectedIds.size > 0 
            ? Array.from(selectedIds) 
            : (data?.applications || []).map((a: any) => a.id);

        if (!targetIds || targetIds.length === 0) {
            toast.error("No applications available for file download.");
            return;
        }

        setLoading(true);
        toast.loading(`Preparing ZIP archive for ${targetIds.length} candidate credentials...`, { id: "zip-toast" });
        try {
            const res = await generateBulkApplicantFilesZip(targetIds);
            if (res.success && res.zipBase64) {
                const link = document.createElement("a");
                link.href = `data:application/zip;base64,${res.zipBase64}`;
                link.download = res.filename || "Applicant_Files.zip";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("ZIP Archive downloaded successfully!", { id: "zip-toast" });
            } else {
                toast.error(res.error || "Failed to generate ZIP archive", { id: "zip-toast" });
            }
        } catch (err: any) {
            console.error("ZIP Generation Error:", err);
            toast.error("An error occurred while building the ZIP file", { id: "zip-toast" });
        }
        setLoading(false);
    };

    const statusColors: Record<string, string> = {
        draft: "bg-slate-100 text-slate-600 border-slate-200",
        submitted: "bg-blue-100 text-blue-700 border-blue-200",
        paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
        screened: "bg-purple-100 text-purple-700 border-purple-200",
        admitted: "bg-emerald-100 text-emerald-700 border-emerald-200",
        rejected: "bg-rose-100 text-rose-700 border-rose-200",
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 pb-24 sm:pb-24 lg:pb-24 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-emerald-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-12 h-12 text-indigo-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    2026/2027 ADMISSION APPLICATIONS
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Review, screen, and manage submitted admission applications
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 bg-white/5 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10">
                            <Activity className="w-4 h-4" />
                            <span className="font-bold">{data.total} total applications</span>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Controls Block */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-[2.5rem] border border-white/50 p-6 shadow-xl space-y-5">
                    {/* Top Search & Actions Row */}
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                            <input
                                className="w-full pl-12 pr-20 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white text-base font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
                                placeholder="Search by applicant name, form number, email, or programme..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                            {search && (
                                <button
                                    onClick={() => { setSearch(""); setPage(1); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-1.5 transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 justify-between lg:justify-end">
                            <Button
                                onClick={selectNaRecords}
                                variant="outline"
                                className="px-4 py-4 rounded-2xl border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs shadow-sm flex items-center"
                                title="Select all records on current page that display N/A or missing information"
                            >
                                <AlertCircle className="w-4 h-4 mr-2" /> Select N/A
                            </Button>

                            <Button 
                                onClick={handleExportExcel}
                                className="px-5 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center"
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
                            </Button>

                            <Button
                                onClick={handleBulkDownloadFilesZip}
                                className="px-5 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center shadow-purple-100"
                                title="Download candidate photographs, signatures, birth certs, O-level & JAMB result slips in ZIP format"
                            >
                                <Download className="w-4 h-4 mr-2" /> Bulk Download Files (ZIP)
                            </Button>

                            {(search || statusFilter !== 'all' || paymentFilter !== 'all' || facultyFilter || departmentFilter || programmeFilter || levelFilter !== 'all' || modeFilter !== 'all' || templateFilter) && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearch("");
                                        setStatusFilter("all");
                                        setPaymentFilter("all");
                                        setFacultyFilter(undefined);
                                        setDepartmentFilter(undefined);
                                        setProgrammeFilter(undefined);
                                        setLevelFilter("all");
                                        setModeFilter("all");
                                        setTemplateFilter(undefined);
                                        setPage(1);
                                    }}
                                    className="text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-2xl px-3 py-4"
                                >
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Bottom Filter Dropdowns Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 pt-4 border-t border-slate-100">
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="paid">Paid</option>
                            <option value="screened">Screened</option>
                            <option value="admitted">Admitted</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <select
                            value={paymentFilter}
                            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
                            className="px-3 py-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Payments</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                        </select>

                        <select
                            value={facultyFilter || ""}
                            onChange={(e) => { setFacultyFilter(e.target.value ? Number(e.target.value) : undefined); setDepartmentFilter(undefined); setProgrammeFilter(undefined); setPage(1); }}
                            className="px-3 py-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Faculties</option>
                            {faculties.map((f: any) => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>

                        <select
                            value={departmentFilter || ""}
                            onChange={(e) => { setDepartmentFilter(e.target.value ? Number(e.target.value) : undefined); setProgrammeFilter(undefined); setPage(1); }}
                            className="px-3 py-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Departments</option>
                            {filteredDepartments.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>

                        <select
                            value={programmeFilter || ""}
                            onChange={(e) => { setProgrammeFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                            className="px-3 py-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Programmes</option>
                            <option value="-1">Pending Course Selection</option>
                            {filteredProgrammes.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>

                        <select
                            value={levelFilter}
                            onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
                            className="px-3 py-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Entry Levels</option>
                            <option value="ND 1">ND 1</option>
                            <option value="HND 1">HND 1</option>
                        </select>

                        <select
                            value={modeFilter}
                            onChange={(e) => { setModeFilter(e.target.value); setPage(1); }}
                            className="px-3 py-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Modes</option>
                            <option value="full_time">Full Time</option>
                            <option value="part_time">Part Time</option>
                        </select>

                        <select
                            value={templateFilter || ""}
                            onChange={(e) => { setTemplateFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                            className="px-3 py-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Templates</option>
                            {templates.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedIds.size > 0 && (
                    <div className="flex flex-wrap items-center gap-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
                        <span className="text-sm font-bold text-indigo-700">{selectedIds.size} selected</span>
                        <Button
                            onClick={() => handleBulkAction('admitted')}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Admit Selected
                        </Button>
                        <Button
                            onClick={() => handleBulkAction('submitted')}
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3"
                        >
                            Force Submit
                        </Button>
                        <Button
                            onClick={() => handleBulkAction('rejected')}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3"
                        >
                            <XCircle className="w-3.5 h-3.5 mr-2" /> Reject Selected
                        </Button>
                        <Button
                            onClick={handleBulkDelete}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 shadow-md shadow-red-200"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Selected
                        </Button>
                        <Button
                            onClick={handleBulkDownloadFilesZip}
                            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 shadow-md shadow-purple-100"
                        >
                            <Download className="w-3.5 h-3.5 mr-2" /> Bulk Download Files (ZIP)
                        </Button>
                        <Button
                            onClick={handleBulkDownloadPDFs}
                            className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3"
                        >
                            <Printer className="w-3.5 h-3.5 mr-2" /> Bulk PDF Report
                        </Button>
                        <Button
                            onClick={() => setSelectedIds(new Set())}
                            variant="ghost"
                            className="rounded-xl text-slate-500 font-bold text-xs"
                        >
                            Clear Selection
                        </Button>
                    </div>
                )}

                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="px-6 py-5 w-12">
                                        <button onClick={toggleSelectAll} className="text-white/80 hover:text-white">
                                            {selectedIds.size === (data?.applications?.length || 0) && (data?.applications?.length || 0) > 0
                                                ? <CheckSquare className="w-4 h-4" />
                                                : <Square className="w-4 h-4" />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Applicant</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Form #</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Faculty</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Department</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Programme</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Mode</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Level</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Payment</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="px-8 py-20 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
                                        </td>
                                    </tr>
                                ) : (data?.applications || []).length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-8 py-20 text-center">
                                            <div className="max-w-xs mx-auto space-y-4">
                                                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                                                    No applications found
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    (data?.applications || []).map((app: any) => (
                                        <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <button onClick={() => toggleSelect(app.id)} className="text-slate-300 hover:text-slate-500">
                                                    {selectedIds.has(app.id)
                                                        ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                                                        : <Square className="w-4 h-4" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    {app.applicantPhoto ? (
                                                        <img src={app.applicantPhoto} alt="" className="w-10 h-10 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 uppercase italic">{app.applicantName}</p>
                                                        {app.parsedData?.email && (
                                                            <p className="text-[10px] font-bold text-slate-400">{app.parsedData.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                             <td className="px-6 py-5">
                                                 <div className="flex flex-col gap-1">
                                                     <span className="font-mono text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 w-fit">
                                                         {app.formNumber || '—'}
                                                     </span>
                                                     {app.studentMatricNumber || app.parsedData?.matricNumber ? (
                                                         <span className="font-mono text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 w-fit italic">
                                                             Matric: {app.studentMatricNumber || app.parsedData?.matricNumber}
                                                         </span>
                                                     ) : null}
                                                 </div>
                                             </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-slate-700">{app.facultyName}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-slate-700">{app.departmentName}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-black text-indigo-600">{app.programmeName}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wider inline-block">
                                                    {app.applicationMode === 'part_time' ? 'Part-Time' : 'Full-Time'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block">
                                                    {app.academicLevel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5",
                                                    statusColors[app.status] || "bg-slate-100 text-slate-600"
                                                )}>
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        app.status === 'admitted' ? 'bg-emerald-500' :
                                                        app.status === 'rejected' ? 'bg-rose-500' :
                                                        app.status === 'paid' ? 'bg-emerald-500' :
                                                        app.status === 'submitted' ? 'bg-blue-500' : 'bg-slate-400'
                                                    )} />
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5",
                                                    app.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                    app.paymentStatus === 'failed' ? "bg-rose-100 text-rose-700 border-rose-200" :
                                                    "bg-amber-100 text-amber-700 border-amber-200"
                                                )}>
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        app.paymentStatus === 'paid' ? "bg-emerald-500" :
                                                        app.paymentStatus === 'failed' ? "bg-rose-500" : "bg-amber-500"
                                                    )} />
                                                    {app.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-bold text-slate-500">
                                                {app.appliedAt ? format(new Date(app.appliedAt), 'MMM dd, yyyy') : '—'}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/admin/admission/v2/${app.id}`}>
                                                        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2 shadow-lg shadow-indigo-100">
                                                            <ExternalLink className="w-3 h-3 mr-1.5" /> Review
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        onClick={() => handleSingleDelete(app.id)}
                                                        variant="outline"
                                                        className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-black text-[9px] uppercase tracking-widest px-3 py-2"
                                                        title="Delete Application Record"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 font-bold">
                            Page {data.page} of {data.totalPages} ({data.total} total)
                        </span>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs px-5 py-3"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                            </Button>
                            <Button
                                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                disabled={page >= data.totalPages}
                                className="rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs px-5 py-3"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminV2ApplicationsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>}>
            <AdminV2ApplicationsContent />
        </Suspense>
    );
}
