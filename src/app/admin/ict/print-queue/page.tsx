"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Printer, Users, CheckCircle2, Clock, Truck, Loader2,
    Search, Filter, ChevronDown, Download, FileText, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
                            <h1 className="text-2xl font-bold text-slate-900">ID Card Print Queue</h1>
                            <p className="text-sm text-slate-500">Manage and assign ID card printing tasks</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4">
                    {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                        <Card key={s} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setFilterStatus(s); setPage(1); }}>
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold text-slate-900">{statMap[s] || 0}</p>
                                <p className="text-xs font-medium text-slate-500 capitalize">{s}</p>
                            </CardContent>
                        </Card>
                    ))}
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setFilterStatus("all"); setPage(1); }}>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900">{Object.values(statMap).reduce((a, b) => a + b, 0)}</p>
                            <p className="text-xs font-medium text-slate-500">Total</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Actions Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
                    <div className="flex gap-4 items-end flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Search</Label>
                            <Input
                                placeholder="Name, matric number, issue ID..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="h-10"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</Label>
                            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                                <SelectTrigger className="w-40 h-10">
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
                            <span className="text-sm font-medium text-indigo-700">{selected.length} selected</span>
                            <div className="flex gap-2">
                                <Select value={assignStaffId} onValueChange={setAssignStaffId}>
                                    <SelectTrigger className="w-48 h-9">
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
                                <Button size="sm" onClick={handleAssign} disabled={assigning} className="gap-1">
                                    {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    Assign
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("printing")} disabled={updating} className="gap-1">
                                    <Printer className="w-4 h-4" /> Mark Printing
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("printed")} disabled={updating} className="gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Mark Printed
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("delivered")} disabled={updating} className="gap-1">
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
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Matric</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Dept</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Assigned To</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Issued</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></td></tr>
                            ) : cards.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No cards found</td></tr>
                            ) : (
                                cards.map((card) => (
                                    <tr key={card.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-3">
                                            <input type="checkbox" checked={selected.includes(card.id)} onChange={() => toggleSelect(card.id)} />
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden">
                                                    {card.photoUrl ? (
                                                        <img src={card.photoUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        (card.studentName || "?").charAt(0)
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-slate-900">{card.studentName}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm font-mono text-slate-700">{card.matricNumber}</td>
                                        <td className="p-3 text-sm text-slate-600">{card.deptName || "-"}</td>
                                        <td className="p-3">
                                            <Badge className={`${STATUS_COLORS[card.printStatus] || ""} text-xs capitalize`}>
                                                {card.printStatus}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-sm text-slate-600">{card.assignedStaffName || "-"}</td>
                                        <td className="p-3 text-xs text-slate-400">{card.issuedAt ? new Date(card.issuedAt).toLocaleDateString("en-GB") : "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <span className="text-sm text-slate-500">Page {page} of {totalPages} ({total} total)</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}