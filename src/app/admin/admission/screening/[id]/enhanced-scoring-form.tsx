"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateSubjectScores, updateAdmissionStatus } from "@/actions/admin-admission";
import { useRouter } from "next/navigation";
import {
    Loader2, Save, Send, XCircle, CheckCircle2, BookOpen, PenLine
} from "lucide-react";
import { toast } from "sonner";

interface Props {
    applicationId: number;
    jambRegNo: string;
    programmeId: number;
    utmeScore: number;
    currentStatus: string;
    scoringStrategy: string;
    cutOffMark: number;
    existingMathScore?: string | null;
    existingEnglishScore?: string | null;
}

export default function EnhancedScoringForm({
    applicationId,
    utmeScore,
    currentStatus,
    existingMathScore,
    existingEnglishScore,
}: Props) {
    const [mathScore, setMathScore] = useState<string>(existingMathScore ?? "");
    const [englishScore, setEnglishScore] = useState<string>(existingEnglishScore ?? "");
    const [loading, setLoading] = useState(false);
    const [admitting, setAdmitting] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [savedResult, setSavedResult] = useState<{ total: number; aggregate: number } | null>(null);
    const router = useRouter();

    const mathVal = parseFloat(mathScore) || 0;
    const englishVal = parseFloat(englishScore) || 0;
    const total = mathVal + englishVal;
    const isAlreadyScored = currentStatus === 'screened' || currentStatus === 'admitted' || currentStatus === 'rejected';
    const isFinalized = currentStatus === 'admitted' || currentStatus === 'rejected';
    const isValid = mathScore !== "" && englishScore !== "" && mathVal >= 0 && mathVal <= 100 && englishVal >= 0 && englishVal <= 100;

    const handleSaveScores = async () => {
        if (!isValid) {
            toast.error("Each score must be a number between 0 and 100");
            return;
        }
        setLoading(true);
        const res = await updateSubjectScores(applicationId, mathVal, englishVal);
        if (res.success && 'aggregate' in res) {
            toast.success(`Scores saved. Total: ${res.total}/200 | Aggregate: ${res.aggregate?.toFixed(2)}%`);
            setSavedResult({ total: res.total as number, aggregate: res.aggregate as number });
            router.refresh();
        } else {
            toast.error((res as any).error || "Failed to save scores");
        }
        setLoading(false);
    };

    const handleAdmit = async () => {
        setAdmitting(true);
        const res = await updateAdmissionStatus(applicationId, 'admitted');
        if (res.success) {
            toast.success("Candidate admitted successfully");
            router.refresh();
        } else {
            toast.error((res as any).error || "Failed to admit candidate");
        }
        setAdmitting(false);
    };

    const handleReject = async () => {
        setRejecting(true);
        const res = await updateAdmissionStatus(applicationId, 'rejected');
        if (res.success) {
            toast.success("Candidate rejected");
            router.refresh();
        } else {
            toast.error((res as any).error || "Failed to reject candidate");
        }
        setRejecting(false);
    };

    return (
        <div className="space-y-8">

            {/* UTME Context */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">UTME Score (Reference)</p>
                    <p className="text-2xl font-black text-slate-900">{utmeScore}<span className="text-sm text-slate-400 ml-1">/400</span></p>
                </div>
            </div>

            {/* Subject Score Entry */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <PenLine className="w-5 h-5 text-teal-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Entrance Exam Results</h3>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    {/* Mathematics */}
                    <div className="space-y-2">
                        <Label htmlFor="mathScore" className="text-xs font-black uppercase tracking-widest text-slate-600">
                            Mathematics
                        </Label>
                        <div className="relative">
                            <Input
                                id="mathScore"
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                value={mathScore}
                                onChange={(e) => setMathScore(e.target.value)}
                                placeholder="0 – 100"
                                disabled={loading || isFinalized}
                                className="h-14 text-xl font-black rounded-xl pr-16 border-2 focus:border-teal-500"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">/100</span>
                        </div>
                    </div>

                    {/* English Language */}
                    <div className="space-y-2">
                        <Label htmlFor="englishScore" className="text-xs font-black uppercase tracking-widest text-slate-600">
                            English Language
                        </Label>
                        <div className="relative">
                            <Input
                                id="englishScore"
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                value={englishScore}
                                onChange={(e) => setEnglishScore(e.target.value)}
                                placeholder="0 – 100"
                                disabled={loading || isFinalized}
                                className="h-14 text-xl font-black rounded-xl pr-16 border-2 focus:border-teal-500"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">/100</span>
                        </div>
                    </div>
                </div>

                {/* Live Total Display */}
                <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                    total >= 120 ? 'bg-emerald-50 border-emerald-300' :
                    total >= 80  ? 'bg-amber-50 border-amber-300' :
                    total > 0    ? 'bg-rose-50 border-rose-300' :
                                   'bg-slate-50 border-slate-200'
                }`}>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Combined Total</p>
                        <p className={`text-4xl font-black tracking-tight mt-1 ${
                            total >= 120 ? 'text-emerald-700' :
                            total >= 80  ? 'text-amber-700'  :
                            total > 0    ? 'text-rose-700'   :
                                           'text-slate-400'
                        }`}>
                            {total > 0 ? `${total.toFixed(total % 1 === 0 ? 0 : 1)}` : '—'}
                            <span className="text-lg font-bold ml-1 opacity-60">/200</span>
                        </p>
                    </div>
                    {total > 0 && (
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Percentage</p>
                            <p className={`text-2xl font-black ${
                                total >= 120 ? 'text-emerald-700' : total >= 80 ? 'text-amber-700' : 'text-rose-700'
                            }`}>{((total / 200) * 100).toFixed(1)}%</p>
                        </div>
                    )}
                </div>

                {/* Score breakdown pill */}
                {total > 0 && (
                    <div className="flex gap-3 text-xs">
                        <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-full">
                            Maths: <strong>{mathScore || 0}</strong>
                        </span>
                        <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-full">
                            English: <strong>{englishScore || 0}</strong>
                        </span>
                    </div>
                )}

                {/* Saved Result Display */}
                {savedResult && (
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-teal-800">Scores Saved Successfully</p>
                            <p className="text-xs text-teal-600">
                                Total: {savedResult.total}/200 &nbsp;·&nbsp; Aggregate: {savedResult.aggregate.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                )}

                <Button
                    onClick={handleSaveScores}
                    disabled={loading || !isValid || isFinalized}
                    className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl uppercase tracking-widest text-xs"
                >
                    {loading
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Scores...</>
                        : <><Save className="h-4 w-4 mr-2" /> Save Exam Scores</>
                    }
                </Button>
            </div>

            {/* Decision Actions */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Admission Decision</p>
                    <p className="text-sm text-slate-500">
                        Scores must be saved before making an admission decision.
                    </p>
                </div>

                {currentStatus === 'admitted' ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                            <p className="font-black text-emerald-800 text-sm">Candidate Admitted</p>
                            <p className="text-xs text-emerald-600">This decision has been finalized.</p>
                        </div>
                        <Badge className="ml-auto bg-emerald-600 text-white">ADMITTED</Badge>
                    </div>
                ) : currentStatus === 'rejected' ? (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <div>
                            <p className="font-black text-rose-800 text-sm">Candidate Rejected</p>
                            <p className="text-xs text-rose-600">This decision has been finalized.</p>
                        </div>
                        <Badge className="ml-auto bg-rose-600 text-white">REJECTED</Badge>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-4">
                        <Button
                            onClick={handleAdmit}
                            disabled={admitting || rejecting || !isAlreadyScored}
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl uppercase tracking-widest text-xs"
                        >
                            {admitting
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                                : <><Send className="h-4 w-4 mr-2" /> Admit Candidate</>
                            }
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={admitting || rejecting || !isAlreadyScored}
                            variant="outline"
                            className="flex-1 h-12 text-rose-600 border-rose-300 hover:bg-rose-50 font-black rounded-xl uppercase tracking-widest text-xs"
                        >
                            {rejecting
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                                : <><XCircle className="h-4 w-4 mr-2" /> Reject Candidate</>
                            }
                        </Button>
                    </div>
                )}

                {!isAlreadyScored && currentStatus !== 'admitted' && currentStatus !== 'rejected' && (
                    <p className="text-xs text-amber-600 font-medium">
                        ⚠ Save the exam scores above before admitting or rejecting.
                    </p>
                )}
            </div>
        </div>
    );
}
