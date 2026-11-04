"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Printer, Users, CheckCircle2, Clock, Truck, Loader2,
    Search, Filter, ChevronDown, Download, FileText, UserPlus,
    Eye, Sparkles, ChevronUp
} from "lucide-react";
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
        const res = await getPrintQueue({
            status: filterStatus === "all" ? undefined : filterStatus,
            programmeType: filterProgramme === "all" ? undefined : filterProgramme,
            level: filterLevel === "all" ? undefined : filterLevel,
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
                    studentName: first.studentName || "OJUGBELE IGBABOSOWON ENIOLA",
                    matricNumber: first.matricNumber || "DPP/HND/BAM/FSS/IB/2025/3841",
                    department: first.deptName || "BUSINESS ADMINISTRATION",
                    programmeName: `${first.programmeType || "HND"} ${first.deptName || "Business Administration"}`,
                    currentLevel: first.currentLevel ? `${first.programmeType || "Level"} ${first.currentLevel}` : "ND 1",
                    photoUrl: first.photoUrl,
                    signatureUrl: first.signatureUrl,
                    phoneNumber: first.phoneNumber || "0803 000 0000",
                    bloodGroup: "O+",
                    genotype: "AA",
                    barcode: first.matricNumber || "DPP/HND/BAM/FSS/IB/2025/3841",
                    verificationCode: first.issueId || "ID-2026-FSS-3841",
                });
            }
        } else {
            toast.error(res.error || "Failed to load print queue");
        }
        setLoading(false);
    }, [filterStatus, filterProgramme, filterLevel, search, page]);

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
        if (!assignStaffId) return toast.error("Select a staff member");
        setAssigning(true);
        const res = await assignPrintJob(selected, parseInt(assignStaffId));
        setAssigning(false);
        if (res.success) {
            toast.success(res.message);
            setSelected([]);
            loadQueue();
        } else {
            toast.error(res.error);
        }
    }

    async function handleStatusUpdate(status: string) {
        if (!selected.length) return toast.error("Select cards first");
        setUpdating(true);
        const res = await bulkUpdatePrintStatus(selected, status);
        setUpdating(false);
        if (res.success) {
            toast.success(res.message);
            setSelected([]);
            loadQueue();
        } else {
            toast.error(res.error);
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

    const loadIssueList = useCallback(async () => {
        setIssueLoading(true);
        const res = await getStudentsWithoutCards({ search: issueSearch || undefined, levelFilter: issueLevelFilter, limit: 200 });
        if (res.success) setIssueList(res.data);
        else toast.error(res.error);
        setIssueLoading(false);
    }, [issueSearch, issueLevelFilter]);

    useEffect(() => {
        if (showIssue) loadIssueList();
    }, [showIssue, loadIssueList]);

    async function handleProcessAcceptancePaid() {
        if (!window.confirm("Process ID cards for all ND 1 & HND 1 students with confirmed acceptance fee payment?")) return;
        setProcessingFreshmen(true);
        const res = await processAcceptancePaidFreshmenIDCards();
        setProcessingFreshmen(false);
        if (res.success) {
            toast.success(res.message);
            loadIssueList();
            loadQueue();
            getPrintQueueStats().then((r) => r.success && setStats(r.data));
        } else {
            toast.error(res.error);
        }
    }

    async function handleIssue() {
        if (!issueSelected.length) return toast.error("Select students first");
        setIssuing(true);
        const res = await issueBatchIDCards(issueSelected);
        setIssuing(false);
        if (res.success) {
            toast.success(res.message);
            setIssueSelected([]);
            loadIssueList();
            loadQueue();
            getPrintQueueStats().then((r) => r.success && setStats(r.data));
        } else {
            toast.error(res.error);
        }
    }

    function handlePrintSelected() {
        if (!selected.length) return toast.error("Select cards first");
        window.open(`/admin/ict/print-queue/print?ids=${selected.join(",")}`, "_blank");
    }
    const statMap = Object.fromEntries(stats.map((s) => [s.status, s.count]));

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                            <Printer size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                ID Card Print &amp; Production Dashboard
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">
                                Real-time PVC card proofing, attendance barcode verification, and print queue management
                            </p>
                        </div>
                    </div>
                </div>

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
                                    className="h-10 rounded-xl max-w-sm"
                                />
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

                    {/* Bulk Actions */}
                    {selected.length > 0 && (
                        <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                            <span className="text-sm font-bold text-indigo-700">{selected.length} selected</span>
                            <div className="flex gap-2">
                                <Select value={assignStaffId} onValueChange={setAssignStaffId}>
                                    <SelectTrigger className="w-48 h-9 rounded-lg bg-white">
                                        <SelectValue placeholder="Assign to staff..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staff.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button size="sm" onClick={handleAssign} disabled={assigning} className="gap-1 rounded-lg">
                                    {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    Assign
                                </Button>
                                <Button size="sm" onClick={handlePrintSelected} className="gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white">
                                    <Printer className="w-4 h-4" /> Print Selected (PVC)
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("printing")} disabled={updating} className="gap-1 rounded-lg">
                                    <Printer className="w-4 h-4" /> Mark Printing
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("printed")} disabled={updating} className="gap-1 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4" /> Mark Printed
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("delivered")} disabled={updating} className="gap-1 rounded-lg">
                                    <Truck className="w-4 h-4" /> Mark Delivered
                                </Button>
                            </div>
                        </div>
                    )}
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
                                                        photoUrl: card.photoUrl,
                                                        signatureUrl: card.signatureUrl,
                                                        phoneNumber: card.phoneNumber || "0803 000 0000",
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
