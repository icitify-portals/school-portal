"use client";

import { useState, useEffect } from "react";
import {
    Printer, CheckCircle2, Clock, Truck, Loader2, FileText, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getMyAssignedPrintJobs, bulkUpdatePrintStatus } from "@/actions/ict-manager";

const STATUS_COLORS: Record<string, string> = {
    assigned: "bg-blue-100 text-blue-700 border-blue-300",
    printing: "bg-purple-100 text-purple-700 border-purple-300",
    printed: "bg-green-100 text-green-700 border-green-300",
    delivered: "bg-slate-100 text-slate-700 border-slate-300",
};

export default function StaffPrintTasksPage() {
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number[]>([]);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadTasks();
    }, []);

    async function loadTasks() {
        setLoading(true);
        const res = await getMyAssignedPrintJobs();
        if (res.success) setCards(res.data);
        setLoading(false);
    }

    const toggleSelect = (id: number) => {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    async function handleStatusUpdate(status: string) {
        if (!selected.length) return toast.error("Select cards first");
        setUpdating(true);
        const res = await bulkUpdatePrintStatus(selected, status);
        setUpdating(false);
        if (res.success) {
            toast.success(res.message);
            setSelected([]);
            loadTasks();
        } else {
            toast.error(res.error);
        }
    }

    const pendingCount = cards.filter((c) => c.printStatus === "assigned").length;
    const printingCount = cards.filter((c) => c.printStatus === "printing").length;
    const printedCount = cards.filter((c) => c.printStatus === "printed").length;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <Printer size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Print Tasks</h1>
                        <p className="text-sm text-slate-500">ID cards assigned to you for printing</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
                            <p className="text-xs font-medium text-slate-500">Assigned (Pending)</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-purple-600">{printingCount}</p>
                            <p className="text-xs font-medium text-slate-500">In Progress</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{printedCount}</p>
                            <p className="text-xs font-medium text-slate-500">Ready for Delivery</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                {selected.length > 0 && (
                    <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                        <span className="text-sm font-medium text-indigo-700">{selected.length} selected</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("printing")} disabled={updating} className="gap-1">
                                <Printer className="w-4 h-4" /> Start Printing
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

                {/* Task List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                        </div>
                    ) : cards.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Printer className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-medium">No print tasks assigned to you</p>
                            <p className="text-sm">Tasks will appear here when assigned by the ICT Manager</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selected.length === cards.length && cards.length > 0}
                                            onChange={() => setSelected(selected.length === cards.length ? [] : cards.map((c) => c.id))}
                                        />
                                    </th>
                                    <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
                                    <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Matric</th>
                                    <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Dept</th>
                                    <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Assigned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cards.map((card) => (
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
                                        <td className="p-3 text-xs text-slate-400">
                                            {card.assignedAt ? new Date(card.assignedAt).toLocaleDateString("en-GB") : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}