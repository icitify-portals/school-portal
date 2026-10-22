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
    bulkUpdatePrintStatus, getPrintQueueStats, issueBatchIDCards
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
                    currentLevel: first.currentLevel ? `HND ${first.currentLevel}` : "HND 2",
                    photoUrl: first.photoUrl,
                    phoneNumber: first.phoneNumber || "0803 000 0000",
                    bloodGroup: "O+",
                    genotype: "AA",
                    barcode: first.matricNumber || "DPP/HND/BAM/FSS/IB/2025/3841",
                    verificationCode: first.issueId || "ID-2026-FSS-3841",
                });
            }
        }
        setLoading(false);
    }, [filterStatus, search, page]);

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
                            <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status Filter</Label>
                            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                                <SelectTrigger className="w-40 h-10 rounded-xl">
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
                                                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden shrink-0 border border-slate-300">
                                                    {card.photoUrl ? (
                                                        <img src={card.photoUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        (card.studentName || "?").charAt(0)
                                                    )}
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{card.studentName}</span>
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
                                                        currentLevel: card.currentLevel ? `Level ${card.currentLevel}` : "Level 1",
                                                        programmeName: `${card.programmeType || "ND"} ${card.deptName || ""}`,
                                                        photoUrl: card.photoUrl,
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
