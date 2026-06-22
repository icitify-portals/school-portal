"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateResultWithAudit, getResultAuditLogs } from "@/actions/results";
import { toast } from "sonner";
import { Loader2, History, Save, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface ResultEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    result: {
        id: number;
        code: string;
        title: string;
        caScore: string;
        examScore: string;
        totalScore: string;
    } | null;
}

export function ResultEditor({ isOpen, onClose, onSuccess, result }: ResultEditorProps) {
    const [caScore, setCaScore] = useState("");
    const [examScore, setExamScore] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [fetchingLogs, setFetchingLogs] = useState(false);

    useEffect(() => {
        if (result) {
            setCaScore(parseFloat(result.caScore || "0").toString());
            setExamScore(parseFloat(result.examScore || "0").toString());
            setReason("");
            setShowHistory(false);
        }
    }, [result]);

    const loadAuditLogs = async () => {
        if (!result) return;
        setFetchingLogs(true);
        const res = await getResultAuditLogs(result.id);
        if (res.success) setAuditLogs((res as any).data);
        setFetchingLogs(false);
    };

    const handleSave = async () => {
        if (!result) return;
        if (!reason.trim()) {
            toast.error("Please provide a reason for this result modification");
            return;
        }

        setLoading(true);
        const res = await updateResultWithAudit({
            resultId: result.id,
            caScore: parseFloat(caScore),
            examScore: parseFloat(examScore),
            reason
        });

        if (res.success) {
            toast.success("Result updated successfully with audit trail");
            onSuccess();
            onClose();
        } else {
            toast.error(res.error || "Failed to update result");
        }
        setLoading(false);
    };

    if (!result) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white rounded-2xl overflow-hidden border-none shadow-2xl p-0">
                <div className="bg-slate-900 p-8 text-white relative">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <AlertCircle className="w-6 h-6 text-indigo-400" />
                            </div>
                            Official Grade Revision
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium mt-2">
                            Amending academic record for <span className="text-white font-bold">{result.code} - {result.title}</span>.
                            All changes are permanently recorded in the audit registry.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">CA Score (40%)</Label>
                                <Input
                                    type="number"
                                    value={caScore}
                                    onChange={(e) => setCaScore(e.target.value)}
                                    className="font-black text-xl h-14 rounded-2xl bg-slate-50 border-slate-100 focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exam Score (60%)</Label>
                                <Input
                                    type="number"
                                    value={examScore}
                                    onChange={(e) => setExamScore(e.target.value)}
                                    className="font-black text-xl h-14 rounded-2xl bg-slate-50 border-slate-100 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="p-5 bg-indigo-600 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-indigo-100">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Weighted Score</span>
                            <span className="text-4xl font-black">{(parseFloat(caScore || "0") + parseFloat(examScore || "0")).toFixed(2)}</span>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amendment Justification</Label>
                            <Textarea
                                placeholder="E.g., Correction of script marking error identified during faculty review..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="min-h-[120px] rounded-2xl font-medium bg-slate-50 border-slate-100 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 border-l border-slate-100 p-8 flex flex-col h-full min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <History className="w-4 h-4" /> Modification Log
                            </h3>
                            {!showHistory && (
                                <Button
                                    variant="link"
                                    onClick={() => { setShowHistory(true); loadAuditLogs(); }}
                                    className="text-[10px] font-black uppercase tracking-widest p-0 h-auto text-indigo-600 hover:text-indigo-700"
                                >
                                    Reveal Logs
                                </Button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 max-h-[350px] pr-2 custom-scrollbar">
                            {showHistory ? (
                                fetchingLogs ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                                    </div>
                                ) : auditLogs.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <History className="w-6 h-6 text-slate-200" />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No previous revisions</p>
                                    </div>
                                ) : (
                                    auditLogs.map((log) => (
                                        <div key={log.audit.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:border-indigo-100 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{log.editor}</span>
                                                <span className="text-[9px] font-bold text-slate-400">{format(new Date(log.audit.createdAt), 'MMM d, HH:mm')}</span>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg italic">"{log.audit.reason}"</p>
                                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-rose-400 line-through">{log.audit.oldTotalScore}</span>
                                                <div className="h-[2px] w-4 bg-slate-200"></div>
                                                <span className="text-emerald-500">{log.audit.newTotalScore}</span>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                <div className="text-center py-12 opacity-40">
                                    <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed px-4">
                                        Audit integrity is a core requirement of the grading system.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="font-black uppercase text-[10px] tracking-widest h-12 px-6 hover:bg-white rounded-2xl transition-all">Discard</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-slate-900 border-none hover:bg-indigo-600 text-white rounded-2xl px-10 h-12 font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-slate-200">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Commit amendment
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
