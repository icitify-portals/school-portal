"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Download, Search, AlertCircle, FileText } from "lucide-react";
import type { UnifiedReceiptItem } from "@/actions/bursary";

const KIND_LABELS: Record<string, string> = {
    student_transaction: "Student Payment",
    wallet_topup: "Wallet Top-up",
    online_payment: "Online Payment",
    application_fee: "Application Fee",
    processing_fee: "Processing Fee",
    acceptance_fee: "Acceptance Fee",
};

function pdfIdFor(item: UnifiedReceiptItem): number | null {
    const m = item.key.match(/^(?:tx|pt)-(\d+)$/);
    return m ? parseInt(m[1]) : null;
}

export default function ReceiptCenter({ items }: { items: UnifiedReceiptItem[] }) {
    const [query, setQuery] = useState("");
    const [kind, setKind] = useState<string>("all");

    const kinds = useMemo(() => Array.from(new Set(items.map(i => i.kind))), [items]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter(i => {
            if (kind !== "all" && i.kind !== kind) return false;
            if (!q) return true;
            return (
                i.purpose.toLowerCase().includes(q) ||
                i.reference.toLowerCase().includes(q) ||
                i.amount.toString().includes(q)
            );
        });
    }, [items, query, kind]);

    const total = useMemo(() => filtered.reduce((s, i) => s + (i.amount || 0), 0), [filtered]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search by purpose, reference or amount..."
                        className="pl-11 h-12 rounded-2xl border-slate-200"
                    />
                </div>
                <select
                    value={kind}
                    onChange={e => setKind(e.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold bg-white"
                >
                    <option value="all">All types ({items.length})</option>
                    {kinds.map(k => (
                        <option key={k} value={k}>{KIND_LABELS[k] || k}</option>
                    ))}
                </select>
            </div>

            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {filtered.length} receipt{filtered.length === 1 ? "" : "s"} • Total ₦{total.toLocaleString()}
            </p>

            {filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-700 italic uppercase">No Receipts Found</h3>
                    <p className="text-slate-400 text-sm font-medium max-w-md mx-auto mt-2">
                        {items.length === 0 ? "You haven't made any successful payments yet." : "No receipts match your search."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(item => {
                        const pdfId = pdfIdFor(item);
                        return (
                            <Card key={item.key} className="border border-slate-200 bg-white shadow-sm rounded-[1.5rem] overflow-hidden">
                                <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                    <div className="flex gap-4 items-center min-w-0">
                                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-extrabold text-sm text-slate-900 truncate">{item.purpose}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {KIND_LABELS[item.kind] || item.kind} • Ref: {item.reference}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <p className="font-black text-lg text-emerald-600">₦{item.amount.toLocaleString()}</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-1.5"
                                            onClick={() => window.open(item.receiptUrl, '_blank')}
                                        >
                                            <Printer className="w-3.5 h-3.5" /> Print
                                        </Button>
                                        {pdfId !== null && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-1.5"
                                                onClick={() => window.open(`/api/receipts/pdf?id=${pdfId}`, '_blank')}
                                            >
                                                <Download className="w-3.5 h-3.5" /> PDF
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
