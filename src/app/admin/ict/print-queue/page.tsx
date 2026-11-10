"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Printer, Users, CheckCircle2, Clock, Truck, Loader2,
    Search, Filter, ChevronDown, Download, FileText, UserPlus,
    Eye, Sparkles, ChevronUp, BookOpen
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    getPrintQueue, getICTStaff, assignPrintJob,
    bulkUpdatePrintStatus, getPrintQueueStats, issueBatchIDCards, getStudentsWithoutCards, processAcceptancePaidFreshmenIDCards
} from "@/actions/ict-manager";
import { getDepartments } from "@/actions/departments";
import IDCardTemplate1 from "@/components/id-cards/IDCardTemplate1";

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-300",
    assigned: "bg-blue-100 text-blue-700 border-blue-300",
    printing: "bg-purple-100 text-purple-700 border-purple-300",
    printed: "bg-green-100 text-green-700 border-green-300",
    delivered: "bg-slate-100 text-slate-700 border-slate-300",
};

const STATUS_OPTIONS = ["all", "pending", "assigned", "printing", "printed", "delivered"];

export default function ICTPrintQueuePage() {
    const [cards, setCards] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number[]>([]);
    const [assignStaffId, setAssignStaffId] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState("pending");
    const [filterProgramme, setFilterProgramme] = useState("all");
    const [filterLevel, setFilterLevel] = useState("all");
    const [filterDept, setFilterDept] = useState("all");
    const [departmentsList, setDepartmentsList] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    // Interactive Sample / Proof State
    const [showProofPanel, setShowProofPanel] = useState(true);
    const [previewStudent, setPreviewStudent] = useState<any>({
        studentName: "OJUGBELE IGBABOSOWON ENIOLA",
        matricNumber: "DPP/HND/BAM/FSS/IB/2025/3841",
        department: "BUSINESS ADMINISTRATION",
        programmeName: "HND Business Administration",
        currentLevel: "HND 2",
        phoneNumber: "0803 000 0000",
        bloodGroup: "O+",
        genotype: "AA",
        barcode: "DPP/HND/BAM/FSS/IB/2025/3841",
        verificationCode: "ID-2026-FSS-3841",
        photoUrl: undefined,
        signatureUrl: undefined,
    });

    const loadQueue = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPrintQueue({
                status: filterStatus === "all" ? undefined : filterStatus,
                programmeType: filterProgramme === "all" ? undefined : filterProgramme,
                level: filterLevel === "all" ? undefined : filterLevel,
                departmentId: filterDept === "all" ? undefined : parseInt(filterDept),
                search: search || undefined,
                limit: pageSize,
                offset: (page - 1) * pageSize,
            });
            if (res.success) {
                setCards(res.data);
                setTotal(res.total);
                // If we have cards and haven't selected a specific one, populate preview with first card
                if (res.data.length > 0 && previewStudent.matricNumber === "DPP/HND/BAM/FSS/IB/2025/3841") {
                    const first = res.data[0];
                    setPreviewStudent({
                        studentName: first.studentName || "OLAWAYE EMMANUEL OLAOSEBIKAN",
                        matricNumber: first.matricNumber || "ACC/FSS/IB/2024/119920",
                        department: first.deptName || "ACCOUNTANCY",
                        programmeName: `${first.programmeType || "ND"} ${first.deptName || "Accountancy"}`,
                        programmeType: first.programmeType || "ND",
                        currentLevel: first.currentLevel ? `${first.programmeType || "ND"} ${first.currentLevel}` : "ND 1",
                        photoUrl: first.photoUrl,
                        signatureUrl: first.signatureUrl,
                        phoneNumber: first.phoneNumber || "07081808456",
                        bloodGroup: "O+",
                        genotype: "AA",
                        barcode: first.matricNumber || "ACC/FSS/IB/2024/119920",
                        verificationCode: first.issueId || "ID-2026-FSS-119920",
                    });
                }
            } else {
                toast.error(res.error || "Failed to load print queue");
            }
        } catch (err: any) {
            console.error("Load queue error:", err);
            const msg = err?.message || String(err);
            if (msg.includes("Failed to find Server Action") || msg.includes("deployment")) {
                toast.info("Updating to latest server version. Reloading...");
                setTimeout(() => window.location.reload(), 1000);
            }
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterProgramme, filterLevel, filterDept, search, page]);

    useEffect(() => {
        loadQueue();
    }, [loadQueue]);

    useEffect(() => {
        getICTStaff().then((res) => {
            if (res.success) setStaff(res.data);
        });
        getPrintQueueStats().then((res) => {
            if (res.success) setStats(res.data);
        });
        getDepartments().then((res) => {
            if (Array.isArray(res)) setDepartmentsList(res);
        });
    }, []);

    const toggleSelect = (id: number) => {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const selectAll = () => {
        if (selected.length === cards.length) {
            setSelected([]);
        } else {
            setSelected(cards.map((c) => c.id));
        }
    };

    async function handleAssign() {
        if (!selected.length) return toast.error("Select cards first");
        if (!assignStaffId) return toast.error("Select a staff member from the dropdown");
        setAssigning(true);
        try {
            const res = await assignPrintJob(selected, parseInt(assignStaffId));
            if (res.success) {
                toast.success(`${res.message} Moved to 'Assigned' tab.`);
                setSelected([]);
                setAssignStaffId("");
                await loadQueue();
                getPrintQueueStats().then((r) => r.success && setStats(r.data));
            } else {
                toast.error(res.error || "Failed to assign cards");
            }
        } catch (err: any) {
            console.error("Assign error:", err);
            const msg = err?.message || String(err);
            if (msg.includes("Failed to find Server Action") || msg.includes("deployment")) {
                toast.info("New server update detected. Refreshing page...");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast.error(msg || "Failed to assign cards. Please try again.");
            }
        } finally {
            setAssigning(false);
        }
    }

    async function handleStatusUpdate(status: string) {
        if (!selected.length) return toast.error("Select cards first");
        setUpdating(true);
        try {
            const res = await bulkUpdatePrintStatus(selected, status);
            if (res.success) {
                toast.success(`${res.message} Moved to '${status}' tab.`);
                setSelected([]);
                await loadQueue();
                getPrintQueueStats().then((r) => r.success && setStats(r.data));
            } else {
                toast.error(res.error || "Failed to update status");
            }
        } catch (err: any) {
            console.error("Status update error:", err);
            const msg = err?.message || String(err);
            if (msg.includes("Failed to find Server Action") || msg.includes("deployment")) {
                toast.info("New server update detected. Refreshing page...");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast.error(msg || "Failed to update status. Please try again.");
            }
        } finally {
            setUpdating(false);
        }
    }

    const totalPages = Math.ceil(total / pageSize);

    // ── Issue cards (students without an active card) ──
    const [showIssue, setShowIssue] = useState(false);
    const [issueSearch, setIssueSearch] = useState("");
    const [issueList, setIssueList] = useState<any[]>([]);
    const [issueSelected, setIssueSelected] = useState<number[]>([]);
    const [issueLoading, setIssueLoading] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [processingFreshmen, setProcessingFreshmen] = useState(false);
    const [issueLevelFilter, setIssueLevelFilter] = useState<'all' | 'freshmen' | 'returning_ready' | 'returning_incomplete'>('all');
    const [issueDeptFilter, setIssueDeptFilter] = useState("all");

    const loadIssueList = useCallback(async () => {
        setIssueLoading(true);
        try {
            const res = await getStudentsWithoutCards({
                search: issueSearch || undefined,
                levelFilter: issueLevelFilter,
                departmentId: issueDeptFilter === "all" ? undefined : parseInt(issueDeptFilter),
                limit: 200
            });
            if (res.success) setIssueList(res.data);
            else toast.error(res.error);
        } catch (err: any) {
            console.error("Load issue list error:", err);
            toast.error(err?.message || "Failed to load unissued student list");
        } finally {
            setIssueLoading(false);
        }
    }, [issueSearch, issueLevelFilter, issueDeptFilter]);

    useEffect(() => {
        if (showIssue) loadIssueList();
    }, [showIssue, loadIssueList]);

    async function handleProcessAcceptancePaid() {
        if (!window.confirm("Process ID cards for all ND 1 & HND 1 students with confirmed acceptance fee payment?")) return;
        setProcessingFreshmen(true);
        try {
            const res = await processAcceptancePaidFreshmenIDCards();
            if (res.success) {
                toast.success(res.message);
                loadIssueList();
                await loadQueue();
                getPrintQueueStats().then((r) => r.success && setStats(r.data));
            } else {
                toast.error(res.error || "Failed to process freshmen ID cards");
            }
        } catch (err: any) {
            console.error("Process freshmen error:", err);
            toast.error(err?.message || "An unexpected error occurred.");
        } finally {
            setProcessingFreshmen(false);
        }
    }

    async function handleIssue() {
        if (!issueSelected.length) return toast.error("Select students first");
        setIssuing(true);
        try {
            const res = await issueBatchIDCards(issueSelected);
            if (res.success) {
                toast.success(res.message);
                setIssueSelected([]);
                loadIssueList();
                await loadQueue();
                getPrintQueueStats().then((r) => r.success && setStats(r.data));
            } else {
                toast.error(res.error || "Failed to issue cards");
            }
        } catch (err: any) {
            console.error("Issue cards error:", err);
            toast.error(err?.message || "An unexpected error occurred.");
        } finally {
            setIssuing(false);
        }
    }

    function handlePrintSelected() {
        if (!selected.length) {
            if (cards.length > 0) {
                const allIds = cards.map((c) => c.id);
                window.open(`/admin/ict/print-queue/print?ids=${allIds.join(",")}`, "_blank");
                return;
            }
            return toast.error("No cards available to print");
        }
        window.open(`/admin/ict/print-queue/print?ids=${selected.join(",")}`, "_blank");
    }

    const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
    const statMap = Object.fromEntries(stats.map((s) => [s.status, s.count]));

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shrink-0">
                            <Printer size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                ID Card Print &amp; Production Dashboard
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">
                                Real-time PVC card proofing, attendance barcode verification, and batch print queue management
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/admin/ict/guide">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs gap-1.5"
                            >
                                <BookOpen className="w-4 h-4" />
                                Operational Guide
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
                            className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs gap-1.5"
                        >
                            <FileText className="w-4 h-4" />
                            {showWorkflowGuide ? "Hide Quick Guide" : "Quick Workflow"}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePrintSelected}
                            disabled={cards.length === 0}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md gap-2 px-4"
                        >
                            <Printer className="w-4 h-4" />
                            {selected.length > 0 ? `Print Selected (${selected.length})` : `Print All on Page (${cards.length})`}
                        </Button>
                    </div>
                </div>

                {/* WORKFLOW & PROCESS GUIDE ACCORDION */}
                {showWorkflowGuide && (
                    <Card className="rounded-2xl border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-emerald-50/40 shadow-sm overflow-hidden">
                        <CardHeader className="p-4 pb-2 border-b border-indigo-100">
                            <CardTitle className="text-sm font-black text-indigo-950 uppercase tracking-tight flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                End-to-End ICT Student Identity &amp; Bulk Card Printing Process
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">1</span>
                                <h4 className="font-bold text-slate-900 text-xs mt-1">Gating &amp; Auto-Queuing</h4>
                                <p className="text-slate-600 leading-relaxed text-[11px]">
                                    <strong>ND 1 / HND 1:</strong> Automatically queued once their acceptance fee is verified. Photos &amp; signatures are pulled from admission records.
                                    <br />
                                    <strong>ND 2 / HND 2:</strong> Queued via the Issue Panel below once photo &amp; signature are captured.
                                </p>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">2</span>
                                <h4 className="font-bold text-slate-900 text-xs mt-1">Filtering &amp; Batch Selection</h4>
                                <p className="text-slate-600 leading-relaxed text-[11px]">
                                    Filter by <strong>Status (Pending)</strong>, <strong>Level (ND 1 / HND 1 / ND 2 / HND 2)</strong>, or Department.
                                    Check individual cards or click <strong>&quot;Select All on Page&quot;</strong> to target the entire batch for immediate production.
                                </p>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">3</span>
                                <h4 className="font-bold text-slate-900 text-xs mt-1">Print Engine (CR80 / A4)</h4>
                                <p className="text-slate-600 leading-relaxed text-[11px]">
                                    Click <strong>&quot;Print Selected&quot;</strong>. Choose <strong>PVC Printer</strong> (CR80 85.6&times;54mm) or <strong>A4 Sheet (2-Column Cut &amp; Laminate)</strong>. In Chrome Print Dialog: set <strong>Margins: None</strong>, <strong>Scale: 100%</strong>, and check <strong>Background Graphics</strong>.
                                </p>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center">4</span>
                                <h4 className="font-bold text-slate-900 text-xs mt-1">Fulfillment &amp; Dispatch</h4>
                                <p className="text-slate-600 leading-relaxed text-[11px]">
                                    After the card hopper finishes printing, click <strong>&quot;Mark Printed&quot;</strong>. The portal updates the student&apos;s record, notifies them, and enables the barcode for electronic attendance scanning.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                        <Card key={s} className="cursor-pointer hover:shadow-md transition-shadow rounded-2xl border-slate-200" onClick={() => { setFilterStatus(s); setPage(1); }}>
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-black text-slate-900">{statMap[s] || 0}</p>
                                <p className="text-xs font-bold text-slate-500 capitalize">{s}</p>
                            </CardContent>
                        </Card>
                    ))}
                    <Card className="cursor-pointer hover:shadow-md transition-shadow rounded-2xl border-slate-200" onClick={() => { setFilterStatus("all"); setPage(1); }}>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-black text-indigo-600">{Object.values(statMap).reduce((a, b) => a + b, 0)}</p>
                            <p className="text-xs font-bold text-slate-500">Total Cards</p>
                        </CardContent>
                    </Card>
                </div>

                {/* LIVE SAMPLE & PROOF VIEWER SECTION */}
                <Card className="rounded-[2rem] border-slate-200 shadow-xl overflow-hidden bg-white">
                    <CardHeader className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 flex flex-row items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                                    <Sparkles className="w-4 h-4" />
                                </span>
                                <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                    Live PVC Card Proof &amp; Specimen Preview
                                </CardTitle>
                            </div>
                            <CardDescription className="text-xs text-slate-500 mt-1 font-medium">
                                Interactive CR80 card template with Front/Back 3D transition, Code-128 Attendance Barcode, and High-DPI Print Layout
                            </CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowProofPanel(!showProofPanel)}
                            className="text-slate-500 hover:text-slate-900 gap-1 text-xs font-bold"
                        >
                            {showProofPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {showProofPanel ? "Collapse Proof" : "Expand Proof"}
                        </Button>
                    </CardHeader>

                    {showProofPanel && (
                        <CardContent className="p-6 flex flex-col items-center bg-slate-50/50">
                            {/* Live ID Card Template Component */}
                            <IDCardTemplate1
                                studentName={previewStudent.studentName}
                                matricNumber={previewStudent.matricNumber}
                                department={previewStudent.department}
                                programmeName={previewStudent.programmeName}
                                programmeType={previewStudent.programmeType}
                                currentLevel={previewStudent.currentLevel}
                                phoneNumber={previewStudent.phoneNumber}
                                bloodGroup={previewStudent.bloodGroup}
                                genotype={previewStudent.genotype}
                                photoUrl={previewStudent.photoUrl}
                                signatureUrl={previewStudent.signatureUrl}
                                barcode={previewStudent.barcode}
                                verificationCode={previewStudent.verificationCode}
                                showControls={true}
                            />
                        </CardContent>
                    )}
                </Card>

                {/* Issue Cards Panel */}
                <Card className="rounded-2xl border-slate-200">
                    <CardHeader className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-black text-slate-900 uppercase">Issue & Queue ID Cards</CardTitle>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Automated Gating Active</span>
                            </div>
                            <CardDescription className="text-xs mt-1">
                                ND 1 &amp; HND 1 require acceptance fee payment. ND 2 &amp; HND 2 must have photograph &amp; signature captured before being queued.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={handleProcessAcceptancePaid}
                                disabled={processingFreshmen}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1.5 text-xs font-bold"
                            >
                                {processingFreshmen ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                Auto-Process ND 1 &amp; HND 1 (Acceptance Paid)
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowIssue(!showIssue)} className="rounded-lg gap-1 text-xs">
                                {showIssue ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {showIssue ? "Hide Panel" : "Select Students"}
                            </Button>
                        </div>
                    </CardHeader>
                    {showIssue && (
                        <CardContent className="p-4 pt-0 space-y-3">
                            {/* Filter Bar */}
                            <div className="flex gap-2 flex-wrap items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setIssueLevelFilter('all')}
                                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${issueLevelFilter === 'all' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIssueLevelFilter('freshmen')}
                                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${issueLevelFilter === 'freshmen' ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-600'}`}
                                    >
                                        ND 1 / HND 1 (Acceptance Paid)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIssueLevelFilter('returning_ready')}
                                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${issueLevelFilter === 'returning_ready' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600'}`}
                                    >
                                        ND 2 / HND 2 (Ready to Print)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIssueLevelFilter('returning_incomplete')}
                                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${issueLevelFilter === 'returning_incomplete' ? 'bg-white shadow-xs text-amber-700' : 'text-slate-600'}`}
                                    >
                                        ND 2 / HND 2 (Needs Photo/Signature)
                                    </button>
                                </div>
                                <a
                                    href="/admin/ict/photo-capture"
                                    target="_blank"
                                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    Open Photo &amp; Signature Capture Unit &rarr;
                                </a>
                            </div>

                            <div className="flex gap-3 items-center flex-wrap">
                                <Input
                                    placeholder="Search name or matric number..."
                                    value={issueSearch}
                                    onChange={(e) => setIssueSearch(e.target.value)}
                                    className="h-10 rounded-xl max-w-xs"
                                />
                                <Select value={issueDeptFilter} onValueChange={setIssueDeptFilter}>
                                    <SelectTrigger className="w-56 h-10 rounded-xl text-xs bg-white">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">All Departments</SelectItem>
                                        {departmentsList.map((d: any) => (
                                            <SelectItem key={d.id} value={String(d.id)} className="text-xs">{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button size="sm" variant="outline" className="rounded-lg text-xs"
                                    onClick={() => {
                                        const eligibleIds = issueList.filter(s => s.isEligible).map(s => s.userId);
                                        setIssueSelected(issueSelected.length === eligibleIds.length ? [] : eligibleIds);
                                    }}>
                                    {issueSelected.length > 0 ? "Clear Selection" : "Select All Eligible"}
                                </Button>
                                <Button size="sm" onClick={handleIssue} disabled={issuing || !issueSelected.length} className="rounded-lg gap-1 text-xs font-bold">
                                    {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Issue {issueSelected.length || ""} Selected Card(s)
                                </Button>
                            </div>

                            <div className="max-h-72 overflow-auto border border-slate-200 rounded-xl">
                                {issueLoading ? (
                                    <div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" /></div>
                                ) : issueList.length === 0 ? (
                                    <p className="p-6 text-center text-sm text-slate-400">No students matching this filter.</p>
                                ) : (
                                    issueList.map((s) => (
                                        <label
                                            key={s.userId}
                                            className={`flex items-center gap-3 px-3 py-2 border-b border-slate-100 text-sm ${s.isEligible ? 'cursor-pointer hover:bg-slate-50' : 'opacity-65 bg-slate-50/50 cursor-not-allowed'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                disabled={!s.isEligible}
                                                checked={issueSelected.includes(s.userId)}
                                                onChange={() => {
                                                    if (!s.isEligible) return;
                                                    setIssueSelected((p) => p.includes(s.userId) ? p.filter((x) => x !== s.userId) : [...p, s.userId]);
                                                }}
                                            />
                                            <span className="font-bold text-slate-900 flex-1">{s.studentName}</span>
                                            <Badge variant="outline" className="text-[10px] font-mono">{s.levelLabel}</Badge>
                                            <span className="font-mono text-xs text-slate-600">{s.matricNumber || "-"}</span>
                                            <span className="text-xs text-slate-500 w-36 truncate">{s.deptName || "-"}</span>
                                            
                                            {s.isFreshman ? (
                                                s.hasPaidAcceptance ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-emerald-200">Acceptance Paid</Badge>
                                                ) : (
                                                    <Badge className="bg-rose-100 text-rose-700 text-[10px] border-rose-200">Acceptance Pending</Badge>
                                                )
                                            ) : (
                                                s.isEligible ? (
                                                    <Badge className="bg-indigo-100 text-indigo-800 text-[10px] border-indigo-200">Verified</Badge>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-800 text-[10px] border-amber-200" title={s.eligibilityNote}>
                                                        Profile Incomplete
                                                    </Badge>
                                                )
                                            )}
                                        </label>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Filters & Actions Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
                    <div className="flex gap-4 items-end flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Search Cards</Label>
                            <Input
                                placeholder="Name, matric number, issue ID..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="h-10 rounded-xl"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Programme</Label>
                            <Select value={filterProgramme} onValueChange={(v) => { setFilterProgramme(v); setPage(1); }}>
                                <SelectTrigger className="w-32 h-10 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Programmes</SelectItem>
                                    <SelectItem value="ND">ND</SelectItem>
                                    <SelectItem value="HND">HND</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Department (Batch)</Label>
                            <Select value={filterDept} onValueChange={(v) => { setFilterDept(v); setPage(1); }}>
                                <SelectTrigger className="w-52 h-10 rounded-xl text-xs">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All Departments</SelectItem>
                                    {departmentsList.map((d: any) => (
                                        <SelectItem key={d.id} value={String(d.id)} className="text-xs">{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Level</Label>
                            <Select value={filterLevel} onValueChange={(v) => { setFilterLevel(v); setPage(1); }}>
                                <SelectTrigger className="w-40 h-10 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="1">Level 1 (Freshmen)</SelectItem>
                                    <SelectItem value="2">Level 2 (Returning)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status Filter</Label>
                            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                                <SelectTrigger className="w-36 h-10 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Permanent Bulk Production & Print Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 rounded-2xl border border-emerald-200 shadow-2xs">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={selectAll}
                                className="h-9 text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-100 rounded-xl shadow-2xs"
                            >
                                {selected.length === cards.length && cards.length > 0 ? "Deselect All" : `Select All on Page (${cards.length})`}
                            </Button>
                            <span className="text-xs font-black text-emerald-950 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-200">
                                {selected.length} of {cards.length} cards selected
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Primary Bulk PVC Print Button */}
                            <Button
                                size="sm"
                                onClick={handlePrintSelected}
                                disabled={cards.length === 0}
                                className="h-9 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-sm gap-2 text-xs"
                                title="Opens standard ISO CR80 PVC batch printing layout"
                            >
                                <Printer className="w-4 h-4" />
                                {selected.length > 0 ? `Print Selected Cards (${selected.length})` : `Print All on Page (${cards.length})`}
                            </Button>

                            {selected.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 pl-2 border-l border-emerald-300">
                                    <Select value={assignStaffId} onValueChange={setAssignStaffId}>
                                        <SelectTrigger className="w-36 h-9 rounded-xl bg-white text-xs border-slate-300">
                                            <SelectValue placeholder="Assign Staff..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {staff.map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button size="sm" onClick={handleAssign} disabled={assigning || !assignStaffId} className="h-9 rounded-xl gap-1 text-xs">
                                        {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                                        Assign
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("printing")} disabled={updating} className="h-9 rounded-xl gap-1 text-xs bg-white text-purple-700 border-purple-200 hover:bg-purple-50">
                                        <Clock className="w-3.5 h-3.5" /> Mark Printing
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("printed")} disabled={updating} className="h-9 rounded-xl gap-1 text-xs bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Printed
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("delivered")} disabled={updating} className="h-9 rounded-xl gap-1 text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50">
                                        <Truck className="w-3.5 h-3.5" /> Delivered
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-3 text-left">
                                    <input type="checkbox" checked={selected.length === cards.length && cards.length > 0} onChange={selectAll} />
                                </th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Matric No.</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Department</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Assigned To</th>
                                <th className="p-3 text-right text-xs font-bold text-slate-500 uppercase">Live Proof</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></td></tr>
                            ) : cards.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No cards found in queue</td></tr>
                            ) : (
                                cards.map((card) => (
                                    <tr key={card.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3">
                                            <input type="checkbox" checked={selected.includes(card.id)} onChange={() => toggleSelect(card.id)} />
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden shrink-0 border border-slate-300">
                                                    {card.photoUrl ? (
                                                        <img src={card.photoUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        (card.studentName || "?").charAt(0)
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{card.studentName}</span>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${card.photoUrl ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                                                            {card.photoUrl ? "Photo ✓" : "No Photo"}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${card.signatureUrl ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                                                            {card.signatureUrl ? "Signature ✓" : "No Signature"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-xs font-mono font-bold text-slate-700">{card.matricNumber}</td>
                                        <td className="p-3 text-xs text-slate-600 font-medium">{card.deptName || "-"}</td>
                                        <td className="p-3">
                                            <Badge className={`${STATUS_COLORS[card.printStatus] || ""} text-xs font-bold capitalize`}>
                                                {card.printStatus}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-xs text-slate-600 font-medium">{card.assignedStaffName || "-"}</td>
                                        <td className="p-3 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 gap-1.5 rounded-lg"
                                                onClick={() => {
                                                    setPreviewStudent({
                                                        studentName: card.studentName || "STUDENT NAME",
                                                        matricNumber: card.matricNumber || "MATRIC NUMBER",
                                                        department: card.deptName || "DEPARTMENT",
                                                        currentLevel: card.currentLevel ? `${card.programmeType || "Level"} ${card.currentLevel}` : "ND 1",
                                                        programmeName: `${card.programmeType || "ND"} ${card.deptName || ""}`,
                                                        programmeType: card.programmeType || "ND",
                                                        photoUrl: card.photoUrl,
                                                        signatureUrl: card.signatureUrl,
                                                        phoneNumber: card.phoneNumber || "07081808456",
                                                        barcode: card.matricNumber || "BARCODE",
                                                        verificationCode: card.issueId || "VERIFY",
                                                    });
                                                    setShowProofPanel(true);
                                                    window.scrollTo({ top: 140, behavior: "smooth" });
                                                    toast.info(`Loaded live proof for ${card.studentName}`);
                                                }}
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Inspect Proof
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <span className="text-xs text-slate-500 font-medium">Page {page} of {totalPages} ({total} total cards)</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg text-xs">Previous</Button>
                                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg text-xs">Next</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
