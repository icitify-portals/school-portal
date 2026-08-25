"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateSubjectScoresV2, decideApplicantManual } from "@/actions/admin-admission";
import { useRouter } from "next/navigation";
import {
    Loader2, Save, Send, XCircle, CheckCircle2, PenLine, ShieldCheck, Lock
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
    applicationId: number;
    applicantName: string;
    cutoffPercent: number;
    currentStatus: string;
    decisionSource: string | null;
    attendance: string;
    acceptancePaymentStatus: string;
    existingMathScore: string | null;
    existingEnglishScore: string | null;
}

export default function ScoringPanelV2({
    applicationId,
    applicantName,
    cutoffPercent,
    currentStatus,
    decisionSource,
    attendance,
    acceptancePaymentStatus,
    existingMathScore,
    existingEnglishScore,
}: Props) {
    const [mathScore, setMathScore] = useState<string>(existingMathScore ?? "");
    const [englishScore, setEnglishScore] = useState<string>(existingEnglishScore ?? "");
    const [loading, setLoading] = useState(false);
    const [admitting, setAdmitting] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const router = useRouter();

    const mathVal = parseFloat(mathScore) || 0;
    const englishVal = parseFloat(englishScore) || 0;
    const total = mathVal + englishVal;
    const percentage = parseFloat(((total / 200) * 100).toFixed(2));

    const hasSavedScores = existingMathScore !== null && existingEnglishScore !== null;
    const isFinalized = currentStatus === 'admitted' || currentStatus === 'rejected';
    const isFeePaid = acceptancePaymentStatus === 'paid';
    const isValid = mathScore !== "" && englishScore !== ""
        && mathVal >= 0 && mathVal <= 100 && englishVal >= 0 && englishVal <= 100;

    // Live verdict (what saving WOULD produce)
    const liveOffered = attendance !== 'absent' && percentage >= cutoffPercent;

    const handleSaveScores = async () => {
        if (!isValid) {
            toast.error("Each score must be a number between 0 and 100");
            return;
        }
        setLoading(true);
        const res = await updateSubjectScoresV2(applicationId, mathVal, englishVal);
        setLoading(false);
        if (res.success) {
            toast.success(
                `Scores saved — Total ${res.total}/200 (${res.percentage}%) · ${res.status === 'admitted' ? 'ADMISSION OFFERED' : 'below cut-off'}`,
                { duration: 6000 }
            );
            router.refresh();
        } else {
            toast.error(res.error || "Failed to save scores");
        }
    };

    const handleDecision = async (decision: 'admitted' | 'rejected') => {
        if (decision === 'admitted') setAdmitting(true); else setRejecting(true);
        const res = await decideApplicantManual(applicationId, decision);
        if (decision === 'admitted') setAdmitting(false); else setRejecting(false);
        if (res.success) {
            toast.success(decision === 'admitted' ? "Candidate admitted (manual)" : "Candidate rejected (manual)");
            router.refresh();
        } else {
            toast.error(res.error || "Failed to save decision");
        }
    };

    return (
        <div className="space-y-8">

            {/* Cut-off reference */}
            <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Exercise Cut-off</p>
                    <p className="text-2xl font-black text-indigo-600">{cutoffPercent}%</p>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Scoring Formula</p>
                    <p className="text-sm font-bold text-slate-700">(Maths + English) ÷ 200 × 100</p>
                </div>
                {isFeePaid && (
                    <Badge className="ml-auto bg-indigo-600 text-white gap-1">
                        <Lock className="w-3 h-3" /> ACCEPTANCE FEE PAID — LOCKED
                    </Badge>
                )}
            </div>

            {/* Subject Score Entry */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <PenLine className="w-5 h-5 text-teal-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Entrance Exam Results</h3>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="mathScore" className="text-xs font-black uppercase tracking-widest text-slate-600">Mathematics</Label>
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
                                disabled={loading || isFinalized || isFeePaid}
                                className="h-14 text-xl font-black rounded-xl pr-16 border-2 focus:border-teal-500"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">/100</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="englishScore" className="text-xs font-black uppercase tracking-widest text-slate-600">English Language</Label>
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
                                disabled={loading || isFinalized || isFeePaid}
                                className="h-14 text-xl font-black rounded-xl pr-16 border-2 focus:border-teal-500"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">/100</span>
                        </div>
                    </div>
                </div>

                {/* Live total + percentage + verdict */}
                <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                    total > 0
                        ? liveOffered ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'
                        : 'bg-slate-50 border-slate-200'
                }`}>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Combined Total</p>
                        <p className={cn("text-4xl font-black tracking-tight mt-1",
                            total > 0 ? (liveOffered ? 'text-emerald-700' : 'text-rose-700') : 'text-slate-400')}>
                            {total > 0 ? total : '—'}
                            <span className="text-lg font-bold ml-1 opacity-60">/200</span>
                        </p>
                    </div>
                    {total > 0 && (
                        <div className="text-right space-y-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Percentage</p>
                            <p className={cn("text-3xl font-black", liveOffered ? 'text-emerald-700' : 'text-rose-700')}>
                                {percentage.toFixed(1)}%
                            </p>
                            <p className={cn("text-[10px] font-black uppercase tracking-widest", liveOffered ? 'text-emerald-600' : 'text-rose-600')}>
                                {attendance === 'absent'
                                    ? 'ABSENT — will NOT be offered'
                                    : liveOffered ? '≥ cut-off — will be OFFERED' : 'below cut-off'}
                            </p>
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleSaveScores}
                    disabled={loading || !isValid || isFinalized || isFeePaid}
                    className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl uppercase tracking-widest text-xs"
                >
                    {loading
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Scores...</>
                        : <><Save className="h-4 w-4 mr-2" /> Save Exam Scores{total > 0 ? ` & ${liveOffered ? 'Offer Admission' : 'Apply Cut-off'}` : ''}</>
                    }
                </Button>
            </div>

            {/* Decision Actions */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Manual Override</p>
                        <p className="text-sm text-slate-500">
                            Manual decisions are preserved when the selection is re-run.
                        </p>
                    </div>
                    {decisionSource && (
                        <Badge variant="outline" className="gap-1 text-[9px] font-black uppercase tracking-widest">
                            <ShieldCheck className="w-3 h-3" /> {decisionSource}
                        </Badge>
                    )}
                </div>

                {currentStatus === 'admitted' ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                            <p className="font-black text-emerald-800 text-sm">{applicantName} is ADMITTED</p>
                            <p className="text-xs text-emerald-600">
                                Decision source: {decisionSource || 'unknown'}{isFeePaid ? ' · acceptance fee paid' : ''}
                            </p>
                        </div>
                        <Badge className="ml-auto bg-emerald-600 text-white">ADMITTED</Badge>
                    </div>
                ) : currentStatus === 'rejected' ? (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <div>
                            <p className="font-black text-rose-800 text-sm">{applicantName} is REJECTED</p>
                            <p className="text-xs text-rose-600">Decision source: {decisionSource || 'unknown'}</p>
                        </div>
                        <Badge className="ml-auto bg-rose-600 text-white">REJECTED</Badge>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-4">
                        <Button
                            onClick={() => handleDecision('admitted')}
                            disabled={admitting || rejecting || !hasSavedScores || isFeePaid}
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl uppercase tracking-widest text-xs"
                        >
                            {admitting
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                                : <><Send className="h-4 w-4 mr-2" /> Admit Manually</>}
                        </Button>
                        <Button
                            onClick={() => handleDecision('rejected')}
                            disabled={admitting || rejecting || !hasSavedScores || isFeePaid}
                            variant="outline"
                            className="flex-1 h-12 text-rose-600 border-rose-300 hover:bg-rose-50 font-black rounded-xl uppercase tracking-widest text-xs"
                        >
                            {rejecting
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                                : <><XCircle className="h-4 w-4 mr-2" /> Reject</>}
                        </Button>
                    </div>
                )}

                {!hasSavedScores && !isFinalized && (
                    <p className="text-xs text-amber-600 font-medium">
                        ⚠ Save the exam scores before making a manual decision.
                    </p>
                )}
                {!isFinalized && !isFeePaid && hasSavedScores && (
                    <p className="text-xs text-slate-400 font-medium">
                        Tip: normal offers happen automatically on save/upload — manual admit is only for exceptions.
                    </p>
                )}
            </div>
        </div>
    );
}
