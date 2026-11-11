"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    History, Printer, CheckCircle2, Clock, AlertTriangle, ExternalLink, Loader2, RefreshCw
} from "lucide-react";
import { getPrintBatches, getPrintBatchDetails } from "@/actions/id-card-printer";
import { toast } from "sonner";

export default function PrintBatchHistoryDialog() {
    const [open, setOpen] = useState(false);
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
    const [batchDetails, setBatchDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const loadBatches = async () => {
        setLoading(true);
        try {
            const res = await getPrintBatches({ limit: 30 });
            if (res.success) {
                setBatches(res.data);
            } else {
                toast.error(res.error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadBatches();
        }
    }, [open]);

    const handleViewDetails = async (bId: number) => {
        setSelectedBatchId(bId);
        setLoadingDetails(true);
        try {
            const res = await getPrintBatchDetails(bId);
            if (res.success) {
                setBatchDetails(res);
            } else {
                toast.error(res.error);
            }
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs gap-1.5">
                    <History className="w-4 h-4 text-slate-600" />
                    Batch History &amp; Audit Trail
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-6">
                <DialogHeader className="border-b border-slate-100 pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <History className="w-5 h-5 text-indigo-600" />
                                ID Card Batch Production History &amp; Audit Log
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Permanent record of all printed ID card batches, operator assignments, and reprint tracking.
                            </DialogDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={loadBatches} disabled={loading} className="h-8 gap-1 text-xs">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                    </div>
                </DialogHeader>

                {selectedBatchId && batchDetails ? (
                    /* Detailed Batch Inspection View */
                    <div className="space-y-4 pt-3">
                        <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                            <div>
                                <h3 className="font-mono font-black text-sm text-slate-900">{batchDetails.batch.batchNumber}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Operator: <strong>{batchDetails.batch.operatorName || "ICT Staff"}</strong> &bull; Profile: <strong>{batchDetails.batch.profile?.name || "Canon PIXMA"}</strong>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        const cardIds = batchDetails.items.map((i: any) => i.idCardId).filter(Boolean);
                                        window.open(`/admin/ict/print-queue/print?ids=${cardIds.join(",")}`, "_blank");
                                    }}
                                    className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Re-open Print Engine
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setSelectedBatchId(null)} className="h-8 text-xs">
                                    &larr; Back to List
                                </Button>
                            </div>
                        </div>

                        {/* Batch Items List */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-2.5">Tray #</th>
                                        <th className="p-2.5">Slot</th>
                                        <th className="p-2.5">Student</th>
                                        <th className="p-2.5">Matric No</th>
                                        <th className="p-2.5">Level</th>
                                        <th className="p-2.5">Front</th>
                                        <th className="p-2.5">Back</th>
                                        <th className="p-2.5">Reprints</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {batchDetails.items.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="p-2.5 font-mono font-bold text-slate-600">Tray {item.trayNumber}</td>
                                            <td className="p-2.5 font-bold">Slot {item.slotNumber}</td>
                                            <td className="p-2.5 font-black text-slate-900">{item.studentName}</td>
                                            <td className="p-2.5 font-mono text-slate-700">{item.matricNumber}</td>
                                            <td className="p-2.5">{item.programmeType} {item.currentLevel}</td>
                                            <td className="p-2.5">
                                                {item.frontPrinted ? (
                                                    <span className="text-emerald-700 font-bold">✓ Printed</span>
                                                ) : (
                                                    <span className="text-amber-600">Pending</span>
                                                )}
                                            </td>
                                            <td className="p-2.5">
                                                {item.backPrinted ? (
                                                    <span className="text-emerald-700 font-bold">✓ Printed</span>
                                                ) : (
                                                    <span className="text-amber-600">Pending</span>
                                                )}
                                            </td>
                                            <td className="p-2.5 font-mono">
                                                {item.reprintCount > 0 ? (
                                                    <span className="text-rose-600 font-bold">{item.reprintCount} reprint(s)</span>
                                                ) : (
                                                    "0"
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Batches Summary List */
                    <div className="pt-2">
                        {loading ? (
                            <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
                        ) : batches.length === 0 ? (
                            <div className="text-center p-10 text-slate-400 text-xs">No batches recorded yet.</div>
                        ) : (
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="p-3">Batch Number</th>
                                            <th className="p-3">Operator</th>
                                            <th className="p-3">Profile</th>
                                            <th className="p-3">Cards</th>
                                            <th className="p-3">Trays</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {batches.map((b) => (
                                            <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-3 font-mono font-black text-indigo-700">{b.batchNumber}</td>
                                                <td className="p-3 font-bold text-slate-800">{b.operatorName || "ICT Staff"}</td>
                                                <td className="p-3 text-slate-600">{b.profileName || b.printerModel}</td>
                                                <td className="p-3 font-bold">{b.totalCards}</td>
                                                <td className="p-3 font-mono">{b.totalTrays} tray(s)</td>
                                                <td className="p-3 text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                                                <td className="p-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] font-bold capitalize ${
                                                            b.status === "completed"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                                                : b.status === "printing"
                                                                ? "bg-purple-50 text-purple-700 border-purple-300"
                                                                : "bg-amber-50 text-amber-700 border-amber-300"
                                                        }`}
                                                    >
                                                        {b.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleViewDetails(b.id)}
                                                        className="h-7 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                                    >
                                                        View Items &rarr;
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
