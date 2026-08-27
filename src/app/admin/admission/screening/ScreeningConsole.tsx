"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Search, Edit2, Loader2, PlayCircle, Save, X, Users,
    TrendingUp, UserX, ShieldCheck, Ban, UserCheck, Megaphone
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    updateExerciseCutoff, runSelection, sweepPendingAttendance, startNewExamRound,
    type ScreeningExercise, type ScreeningApplicant, type RunSelectionSummary,
} from "@/actions/admin-admission";
import BulkScoreUpload from "./BulkScoreUpload";

interface Props {
    exercises: ScreeningExercise[];
    applicants: ScreeningApplicant[];
}

function pctColour(app: ScreeningApplicant): string {
    if (app.screeningPercentage === null) return "text-slate-400";
    const pct = parseFloat(app.screeningPercentage);
    if (app.attendance === 'absent') return "text-rose-600";
    if (pct >= app.cutoffPercent) return "text-emerald-600";
    if (pct >= app.cutoffPercent - 5) return "text-amber-600";
    return "text-rose-600";
}

export default function ScreeningConsole({ exercises: initialExercises, applicants }: Props) {
    const router = useRouter();
    const [exercises, setExercises] = useState(initialExercises);
    const [activeTemplateId, setActiveTemplateId] = useState<number | 'all'>('all');
    const [search, setSearch] = useState("");
    const [editingCutoffFor, setEditingCutoffFor] = useState<number | null>(null);
    const [cutoffDraft, setCutoffDraft] = useState("");
    const [savingCutoff, setSavingCutoff] = useState(false);
    const [runningSelection, setRunningSelection] = useState(false);
    const [selectionSummary, setSelectionSummary] = useState<RunSelectionSummary | null>(null);
    const [sweeping, setSweeping] = useState<'present' | 'absent' | null>(null);

    useEffect(() => {
        setExercises(initialExercises);
        // If the active exercise disappeared after refresh, fall back to All
        if (activeTemplateId !== 'all' && !initialExercises.some(e => e.id === activeTemplateId)) {
            setActiveTemplateId('all');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialExercises]);

    // Strict per-exercise filtering
    const scopedApplicants = useMemo(
        () => activeTemplateId === 'all' ? applicants : applicants.filter(a => a.templateId === activeTemplateId),
        [applicants, activeTemplateId]
    );

    const visibleApplicants = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return scopedApplicants;
        return scopedApplicants.filter(a =>
            a.name.toLowerCase().includes(q) ||
            (a.formNumber || "").toLowerCase().includes(q) ||
            a.programmeName.toLowerCase().includes(q)
        );
    }, [scopedApplicants, search]);

    // ── Pagination ─────────────────────────────────────────────────────
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const totalFiltered = visibleApplicants.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const safePage = Math.min(page, totalPages);
    const pagedApplicants = useMemo(
        () => visibleApplicants.slice((safePage - 1) * pageSize, safePage * pageSize),
        [visibleApplicants, safePage, pageSize]
    );

    // Reset to first page whenever the filter context changes
    useEffect(() => { setPage(1); }, [activeTemplateId, search, pageSize]);

    const stats = useMemo(() => ({
        total: scopedApplicants.length,
        scored: scopedApplicants.filter(a => a.screeningPercentage !== null).length,
        offered: scopedApplicants.filter(a => a.status === 'admitted').length,
        absent: scopedApplicants.filter(a => a.attendance === 'absent').length,
        pendingAttendance: scopedApplicants.filter(a => a.attendance === 'pending').length,
        present: scopedApplicants.filter(a => a.attendance === 'present').length,
    }), [scopedApplicants]);

    const activeExercise = activeTemplateId === 'all' ? null : exercises.find(e => e.id === activeTemplateId);

    // ── Cut-off editing ────────────────────────────────────────────────
    const startEditCutoff = (exercise: ScreeningExercise) => {
        setEditingCutoffFor(exercise.id);
        setCutoffDraft(String(exercise.cutoffPercent));
    };

    const saveCutoff = async () => {
        if (!editingCutoffFor) return;
        const value = parseFloat(cutoffDraft);
        if (isNaN(value) || value < 0 || value > 100) {
            toast.error("Cut-off must be between 0 and 100");
            return;
        }
        setSavingCutoff(true);
        const res = await updateExerciseCutoff(editingCutoffFor, value);
        setSavingCutoff(false);
        if (res.success) {
            setExercises(prev => prev.map(e =>
                e.id === editingCutoffFor ? { ...e, cutoffPercent: value } : e
            ));
            toast.success(`Cut-off updated to ${value}% — use Run Selection to re-evaluate scored applicants`);
            setEditingCutoffFor(null);
            router.refresh();
        } else {
            toast.error(res.error || "Failed to update cut-off");
        }
    };

    // ── Run selection ──────────────────────────────────────────────────
    const handleRunSelection = async () => {
        setRunningSelection(true);
        setSelectionSummary(null);
        const res = await runSelection(activeTemplateId === 'all' ? undefined : activeTemplateId);
        setRunningSelection(false);
        if (res.success && res.summary) {
            setSelectionSummary(res.summary);
            const { newlyOffered, revoked, blockedPaid } = res.summary;
            if (newlyOffered === 0 && revoked === 0) {
                toast.info("No status changes — everyone already matches the current cut-off");
            } else {
                toast.success(`${newlyOffered} newly offered, ${revoked} revoked`);
            }
            if (blockedPaid > 0) toast.info(`${blockedPaid} applicant${blockedPaid !== 1 ? 's' : ''} protected (acceptance fee paid)`);
            router.refresh();
        } else {
            toast.error(res.error || "Failed to run selection");
        }
    };

    // ── Attendance sweep ───────────────────────────────────────────────
    const handleSweep = async (markAs: 'present' | 'absent') => {
        const label = activeTemplateId === 'all' ? 'ALL exercises' : (activeExercise?.name || 'this exercise');
        if (!window.confirm(`Mark every applicant with PENDING attendance in ${label} as ${markAs.toUpperCase()}?\n\nPending count: ${stats.pendingAttendance}\n\nTip: run Selection afterwards to revoke offers from absentees.`)) return;
        setSweeping(markAs);
        const res = await sweepPendingAttendance(activeTemplateId === 'all' ? undefined : activeTemplateId, markAs);
        setSweeping(null);
        if (res.success) {
            toast.success(`${res.count} applicant${res.count !== 1 ? 's' : ''} marked ${markAs}`);
            router.refresh();
        } else {
            toast.error(res.error || "Failed to update attendance");
        }
    };

    // ── New exam round reset ───────────────────────────────────────────
    const [resettingRound, setResettingRound] = useState(false);
    const handleNewExamRound = async () => {
        const label = activeTemplateId === 'all' ? 'ALL exercises' : (activeExercise?.name || 'this exercise');
        if (!window.confirm(`Start a NEW EXAMINATION ROUND for ${label}?\n\n• Every NON-ADMITTED applicant returns to "pending" so a fresh register can be taken.\n• Existing scores are KEPT until a candidate writes again and is re-uploaded.\n• Admitted applicants are not affected.\n\nBeing absent from one sitting never disqualifies — candidates can attend the next date.`)) return;
        setResettingRound(true);
        const res = await startNewExamRound(activeTemplateId === 'all' ? undefined : activeTemplateId);
        setResettingRound(false);
        if (res.success) {
            toast.success(`New exam round started — ${res.count} applicant${res.count !== 1 ? 's' : ''} reset to pending attendance`);
            router.refresh();
        } else {
            toast.error(res.error || "Failed to reset attendance");
        }
    };

    return (
        <div className="space-y-6">

            {/* Exercise tabs + cut-off editors */}
            <Card className="border border-white/40 shadow-xl bg-white/70 backdrop-blur rounded-[2rem] overflow-hidden">
                <CardContent className="p-5 space-y-4">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => { setActiveTemplateId('all'); setSelectionSummary(null); }}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                                activeTemplateId === 'all'
                                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                            )}
                        >
                            All Exercises ({applicants.length})
                        </button>
                        {exercises.map(ex => (
                            <button
                                key={ex.id}
                                onClick={() => { setActiveTemplateId(ex.id); setSelectionSummary(null); }}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                                    activeTemplateId === ex.id
                                        ? "bg-teal-600 text-white border-teal-600 shadow-md"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                                )}
                            >
                                {ex.name} ({ex.applicantCount})
                                <span className="opacity-70 font-bold">· cut-off {ex.cutoffPercent}%</span>
                            </button>
                        ))}
                    </div>

                    {/* Per-exercise controls */}
                    <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
                        {activeExercise ? (
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Cut-off for this exercise:
                                </span>
                                {editingCutoffFor === activeExercise.id ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number" min={0} max={100} step={0.5}
                                            className="w-24 h-9 rounded-lg font-black"
                                            value={cutoffDraft}
                                            onChange={(e) => setCutoffDraft(e.target.value)}
                                            autoFocus
                                        />
                                        <span className="text-xs font-bold text-slate-500">%</span>
                                        <Button size="sm" onClick={saveCutoff} disabled={savingCutoff}
                                            className="h-9 bg-teal-600 hover:bg-teal-700 text-white font-black text-[10px] uppercase tracking-widest">
                                            {savingCutoff ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" /> Save</>}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingCutoffFor(null)}
                                            className="h-9 text-slate-500">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => startEditCutoff(activeExercise)}
                                            className="text-lg font-black text-indigo-600 hover:text-indigo-800 underline decoration-dotted underline-offset-4"
                                            title="Click to change this exercise's cut-off"
                                        >
                                            {activeExercise.cutoffPercent}%
                                        </button>
                                        <span className="text-[10px] text-slate-400 font-bold">click to change up or down</span>
                                    </>
                                )}
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Select an exercise tab to edit its cut-off · each exercise keeps its own cut-off (ND and HND can differ)
                            </p>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                            {/* Attendance quick actions */}
                            <div className="flex items-center gap-1.5 mr-2 pl-3 border-l border-slate-200">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                                    {stats.pendingAttendance} pending
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={sweeping !== null || stats.pendingAttendance === 0}
                                    onClick={() => handleSweep('present')}
                                    className="h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-black text-[9px] uppercase tracking-widest"
                                    title={activeTemplateId === 'all' ? 'Mark all pending in ALL exercises present (physical attendance register)' : 'Mark all pending in this exercise present'}
                                >
                                    {sweeping === 'present'
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <><UserCheck className="w-3 h-3 mr-1" /> All Present</>}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={sweeping !== null || stats.pendingAttendance === 0}
                                    onClick={() => handleSweep('absent')}
                                    className="h-8 text-rose-600 border-rose-300 hover:bg-rose-50 font-black text-[9px] uppercase tracking-widest"
                                    title="Exam closed — mark everyone still pending as absent for THIS sitting (they may attend a later date)"
                                >
                                    {sweeping === 'absent'
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <><UserX className="w-3 h-3 mr-1" /> Sweep Absents</>}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={resettingRound}
                                    onClick={handleNewExamRound}
                                    className="h-8 text-indigo-600 border-indigo-300 hover:bg-indigo-50 font-black text-[9px] uppercase tracking-widest"
                                    title="A new exam date is scheduled — reset all non-admitted applicants to pending attendance so a fresh register can be taken. Scores are kept until overwritten."
                                >
                                    {resettingRound
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <><PlayCircle className="w-3 h-3 mr-1" /> New Exam Date</>}
                                </Button>
                            </div>

                            <Button
                                onClick={handleRunSelection}
                                disabled={runningSelection}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-10 px-5 rounded-xl uppercase tracking-widest text-[10px]"
                                title={activeTemplateId === 'all' ? "Re-evaluate every exercise against its own current cut-off" : `Re-evaluate ${activeExercise?.name} against its current cut-off`}
                            >
                                {runningSelection
                                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                                    : <><PlayCircle className="w-4 h-4 mr-2" /> Run Selection{activeTemplateId === 'all' ? ' (All)' : ''}</>}
                            </Button>
                        </div>
                    </div>

                    {/* Group messaging shortcuts */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 pb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <Megaphone className="w-3.5 h-3.5" /> Message a group:
                        </span>
                        {[
                            { key: 'present', label: `Present (${stats.present})` },
                            { key: 'absent', label: `Absent (${stats.absent})` },
                            { key: 'admitted', label: `Offered (${stats.offered})`, admissionStatus: true },
                        ].map(g => (
                            <a
                                key={g.key}
                                href={`/admin/communications/broadcasts?target=applicants&${g.admissionStatus ? 'status=admitted' : `attendance=${g.key}`}${activeTemplateId === 'all' ? '' : `&template=${activeTemplateId}`}`}
                                className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 underline decoration-dotted underline-offset-4"
                                title={`Compose a broadcast to ${g.label}${activeTemplateId !== 'all' ? ' in this exercise' : ''}`}
                            >
                                {g.label}
                            </a>
                        ))}
                    </div>

                    {/* Run selection report */}
                    {selectionSummary && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                            {[
                                { label: "Processed", value: selectionSummary.processed, cls: "text-slate-700" },
                                { label: "Newly Offered", value: selectionSummary.newlyOffered, cls: "text-emerald-600" },
                                { label: "Confirmed", value: selectionSummary.confirmedKept, cls: "text-teal-600" },
                                { label: "Revoked", value: selectionSummary.revoked, cls: "text-rose-600" },
                                { label: "Fee-Protected", value: selectionSummary.blockedPaid, cls: "text-indigo-600" },
                                { label: "Absent-Blocked", value: selectionSummary.blockedAbsent, cls: "text-amber-600" },
                            ].map(s => (
                                <div key={s.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                    <p className={cn("text-2xl font-black", s.cls)}>{s.value}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                    { icon: Users, label: "Applicants", value: stats.total, cls: "bg-slate-100 text-slate-700" },
                    { icon: UserCheck, label: "Present", value: stats.present, cls: "bg-emerald-100 text-emerald-700" },
                    { icon: UserX, label: "Absent", value: stats.absent, cls: "bg-rose-100 text-rose-700" },
                    { icon: Edit2, label: "Pending Attendance", value: stats.pendingAttendance, cls: "bg-amber-100 text-amber-700" },
                    { icon: Edit2, label: "Scored", value: stats.scored, cls: "bg-cyan-100 text-cyan-700" },
                    { icon: TrendingUp, label: "Offered Admission", value: stats.offered, cls: "bg-indigo-100 text-indigo-700" },
                ].map(s => (
                    <Card key={s.label} className="border-none shadow-lg rounded-3xl bg-white">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", s.cls)}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 leading-none">{s.value}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Bulk upload */}
            <BulkScoreUpload applicants={scopedApplicants} />

            {/* Applicants table */}
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                <CardHeader className="bg-white/40 border-b border-white/20 p-8 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-widest">
                                {activeExercise ? activeExercise.name : "All Exercises"} ({visibleApplicants.length})
                            </CardTitle>
                            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">
                                Use the Form No. column as the ID in your Excel upload sheet
                            </p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search name, form no., programme..."
                                className="pl-9 h-10 rounded-xl bg-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200/60 bg-slate-50/50">
                                    {["Form No.", "Candidate", "Programme", "Attendance", "Maths / English", "Total (/200)", "% vs Cut-off", "Status", ""].map(h => (
                                        <th key={h} className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {visibleApplicants.length === 0 && (
                                    <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400 font-bold">No applicants found.</td></tr>
                                )}
                                {pagedApplicants.map((a) => (
                                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center justify-center bg-teal-100 text-teal-800 font-black text-xs rounded-lg px-2.5 py-1 min-w-[2.5rem]">
                                                {a.formNumber || `#${a.id}`}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-slate-800 whitespace-nowrap">{a.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{a.email || a.phone || "—"}</p>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 font-medium max-w-[180px] truncate" title={a.programmeName}>
                                            {a.programmeName}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={cn(
                                                "border-0 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest",
                                                a.attendance === 'present' ? "bg-emerald-100 text-emerald-700" :
                                                a.attendance === 'absent' ? "bg-rose-100 text-rose-700" :
                                                "bg-slate-100 text-slate-500"
                                            )}>
                                                {a.attendance}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {a.mathScore !== null && a.englishScore !== null ? (
                                                <span className="text-xs">
                                                    <span className="font-black text-slate-800">{Number(a.mathScore)}</span>
                                                    <span className="text-slate-400 mx-1">/</span>
                                                    <span className="font-black text-slate-800">{Number(a.englishScore)}</span>
                                                </span>
                                            ) : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {a.screeningScore !== null
                                                ? <span className={cn("font-black", pctColour(a))}>{Number(a.screeningScore)}/200</span>
                                                : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {a.screeningPercentage !== null ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn("font-black", pctColour(a))}>
                                                        {parseFloat(a.screeningPercentage).toFixed(1)}%
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold">vs {a.cutoffPercent}%</span>
                                                    {a.attendance === 'absent' && (
                                                        <span title="Absent — not offered regardless of score">
                                                            <Ban className="w-3 h-3 text-rose-500" />
                                                        </span>
                                                    )}
                                                </div>
                                            ) : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <Badge variant="outline" className={cn(
                                                    "border-0 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest",
                                                    a.status === 'admitted' ? "bg-emerald-100 text-emerald-700" :
                                                    a.status === 'rejected' ? "bg-rose-100 text-rose-700" :
                                                    a.status === 'screened' ? "bg-teal-100 text-teal-700" :
                                                    "bg-slate-100 text-slate-600"
                                                )}>
                                                    {a.status}
                                                </Badge>
                                                {a.decisionSource && (
                                                    <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest text-slate-400"
                                                        title={a.decisionSource === 'manual' ? "Set manually by an admission officer" : "Computed automatically from cut-off"}>
                                                        {a.decisionSource === 'manual' ? <><ShieldCheck className="w-2.5 h-2.5" /> manual</> : "auto"}
                                                    </span>
                                                )}
                                                {a.acceptancePaymentStatus === 'paid' && (
                                                    <Badge className="bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase">fee paid</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/admin/admission/screening/${a.id}`}>
                                                <Button size="sm" variant="ghost" className="text-indigo-600 hover:bg-indigo-50 font-bold text-xs">
                                                    <Edit2 className="h-4 w-4 mr-1" /> Score
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalFiltered > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/40">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Showing {((safePage - 1) * pageSize) + 1}–{Math.min(safePage * pageSize, totalFiltered)} of {totalFiltered}
                                {search.trim() && ` (filtered from ${stats.total})`}
                            </p>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    Rows
                                    <select
                                        value={pageSize}
                                        onChange={(e) => setPageSize(Number(e.target.value))}
                                        className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </label>
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage(1)} className="h-8 w-8 p-0 rounded-lg" title="First page">«</Button>
                                    <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0 rounded-lg" title="Previous">‹</Button>
                                    <span className="px-3 text-xs font-black text-slate-600 whitespace-nowrap">
                                        Page <span className="text-indigo-600">{safePage}</span> / {totalPages}
                                    </span>
                                    <Button size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0 rounded-lg" title="Next">›</Button>
                                    <Button size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage(totalPages)} className="h-8 w-8 p-0 rounded-lg" title="Last page">»</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
