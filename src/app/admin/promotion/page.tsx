"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Eye,
    Rocket,
    GraduationCap,
    UserMinus,
    RotateCcw,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Users,
    Filter,
    Search,
    ShieldAlert,
    History,
    X,
} from "lucide-react";
import {
    getPromotionPreview,
    runPromotion,
    getAcademicSessionsList,
    getPromotionLogs,
    searchLevelCandidates,
    bulkAdjustLevels,
    type LevelAdjustmentMode,
} from "@/actions/promotion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { levelLabel } from "@/lib/levels";

const decisionConfig: Record<string, { color: string; icon: any; label: string }> = {
    promoted: { color: "bg-emerald-100 text-emerald-700", icon: <ArrowUpCircle className="w-3 h-3" />, label: "PROMOTED" },
    graduated: { color: "bg-blue-100 text-blue-700", icon: <GraduationCap className="w-3 h-3" />, label: "GRADUATED" },
    withdrawn: { color: "bg-red-100 text-red-700", icon: <UserMinus className="w-3 h-3" />, label: "WITHDRAWN" },
    repeat: { color: "bg-amber-100 text-amber-700", icon: <RotateCcw className="w-3 h-3" />, label: "REPEAT" },
    pending_review: { color: "bg-slate-200 text-slate-700", icon: <ShieldAlert className="w-3 h-3" />, label: "PENDING REVIEW" },
    nd_graduant: { color: "bg-blue-100 text-blue-700", icon: <GraduationCap className="w-3 h-3" />, label: "GRADUANT" },
    hnd_graduant: { color: "bg-blue-100 text-blue-700", icon: <GraduationCap className="w-3 h-3" />, label: "GRADUANT" },
    // Legacy values kept while the graduant migration settles.
    nd_graduated: { color: "bg-blue-100 text-blue-700", icon: <GraduationCap className="w-3 h-3" />, label: "GRADUANT" },
    hnd_graduated: { color: "bg-blue-100 text-blue-700", icon: <GraduationCap className="w-3 h-3" />, label: "GRADUANT" },
};

interface Candidate {
    studentId: number;
    name: string;
    matricNumber: string | null;
    currentLevel: number | null;
    status: string | null;
    programmeType: string;
    deptName: string | null;
}

export default function PromotionPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [sourceSession, setSourceSession] = useState("");
    const [targetSession, setTargetSession] = useState("");
    const [loading, setLoading] = useState(true);
    const [previewing, setPreviewing] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [preview, setPreview] = useState<any>(null);
    const [result, setResult] = useState<any>(null);
    const [filterDecision, setFilterDecision] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Manual / bulk level adjustment
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [adjustQuery, setAdjustQuery] = useState("");
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<Candidate[]>([]);
    const [targetLevel, setTargetLevel] = useState("1");
    const [mode, setMode] = useState<LevelAdjustmentMode>("promote");
    const [adjustReason, setAdjustReason] = useState("");
    const [activateStudents, setActivateStudents] = useState(false);
    const [adjustPlan, setAdjustPlan] = useState<any>(null);
    const [adjustBusy, setAdjustBusy] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [logsOpen, setLogsOpen] = useState(false);

    useEffect(() => {
        if (adjustQuery.trim().length < 2) { setCandidates([]); return; }
        const t = setTimeout(async () => {
            setSearching(true);
            const res = await searchLevelCandidates(adjustQuery);
            if (res.success) setCandidates(res.candidates || []);
            setSearching(false);
        }, 300);
        return () => clearTimeout(t);
    }, [adjustQuery]);

    const loadLogs = async () => {
        const res = await getPromotionLogs();
        if (res.success) setLogs(res.logs || []);
    };

    const toggleCandidate = (c: Candidate) => {
        setSelected(prev => prev.some(p => p.studentId === c.studentId)
            ? prev.filter(p => p.studentId !== c.studentId)
            : [...prev, c]);
    };

    const runAdjust = async (dryRun: boolean) => {
        if (selected.length === 0) { toast.error("Select at least one student."); return; }
        if (adjustReason.trim().length < 10) { toast.error("A reason of at least 10 characters is required."); return; }
        setAdjustBusy(true);
        const res = await bulkAdjustLevels({
            studentIds: selected.map(s => s.studentId),
            targetLevel: parseInt(targetLevel),
            mode,
            reason: adjustReason.trim(),
            fromSessionId: sourceSession ? parseInt(sourceSession) : null,
            toSessionId: targetSession ? parseInt(targetSession) : null,
            activateStudents,
            dryRun,
        });
        setAdjustBusy(false);
        if (!res.success) { toast.error((res as any).error || "Adjustment failed."); return; }
        if (dryRun) {
            setAdjustPlan(res);
            toast.success(`Dry run: ${(res as any).summary.applicable} change(s), ${(res as any).summary.skipped} skipped.`);
        } else {
            toast.success((res as any).message);
            setAdjustPlan(null);
            setSelected([]);
            setAdjustReason("");
            loadLogs();
        }
    };

    useEffect(() => {
        getAcademicSessionsList().then(res => {
            if (res.success && res.sessions) {
                setSessions(res.sessions);
                const current = res.sessions.find((s: any) => s.isCurrent);
                if (current) setSourceSession(current.id.toString());
                const planned = res.sessions.find((s: any) => s.status === 'planned');
                if (planned) setTargetSession(planned.id.toString());
            }
            setLoading(false);
        });
    }, []);

    const handlePreview = async () => {
        if (!sourceSession) { toast.error("Select a source session."); return; }
        setPreviewing(true);
        setPreview(null);
        setResult(null);
        const res = await getPromotionPreview(parseInt(sourceSession));
        if (res.success) {
            setPreview(res);
        } else {
            toast.error(res.error || "Failed to generate preview.");
        }
        setPreviewing(false);
    };

    const handleRunPromotion = async () => {
        if (!sourceSession || !targetSession) {
            toast.error("Select both source and target sessions.");
            return;
        }
        if (!confirm("⚠️ This action will permanently update student levels and statuses. Continue?")) return;
        setPromoting(true);
        const res = await runPromotion(parseInt(sourceSession), parseInt(targetSession));
        if (res.success) {
            toast.success(res.message);
            setResult(res.summary);
            setPreview(null);
        } else {
            toast.error(res.error || "Promotion failed.");
        }
        setPromoting(false);
    };

    const filteredEvaluations = preview?.evaluations?.filter((e: any) => {
        const matchesDecision = filterDecision === "all" || e.decision === filterDecision;
        const matchesSearch = !searchTerm ||
            e.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.matricNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDecision && matchesSearch;
    }) || [];

    return (
        <div className="p-6 md:p-10 max-w-[1600px] w-full mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200">
                    <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                        Student Promotion
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Evaluate and promote students to the next level/session
                    </p>
                </div>
            </div>

            {/* Session Selectors */}
            <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                Promote From (Source Session)
                            </label>
                            <select
                                value={sourceSession}
                                onChange={e => setSourceSession(e.target.value)}
                                className="w-full h-12 rounded-xl border-2 border-slate-200 px-4 font-bold text-sm focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="">Select session...</option>
                                {sessions.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.isCurrent ? "(Current)" : ""} — {s.status}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                Promote To (Target Session)
                            </label>
                            <select
                                value={targetSession}
                                onChange={e => setTargetSession(e.target.value)}
                                className="w-full h-12 rounded-xl border-2 border-slate-200 px-4 font-bold text-sm focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="">Select target session...</option>
                                {sessions.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} — {s.status}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <Button
                            onClick={handlePreview}
                            disabled={previewing || !sourceSession}
                            className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-indigo-100"
                        >
                            {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                            Preview Promotion
                        </Button>
                        <Button
                            onClick={handleRunPromotion}
                            disabled={promoting || !sourceSession || !targetSession || !preview}
                            className="h-12 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-emerald-100"
                        >
                            {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                            Run Promotion
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Result Summary */}
            {(result || preview?.summary) && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {[
                        { label: "Total", value: (result || preview.summary).total || 0, color: "bg-slate-100 text-slate-700" },
                        { label: "Promoted", value: (result || preview.summary).promoted || 0, color: "bg-emerald-100 text-emerald-700" },
                        { label: "Graduated", value: (result || preview.summary).graduated || 0, color: "bg-blue-100 text-blue-700" },
                        { label: "Withdrawn", value: (result || preview.summary).withdrawn || 0, color: "bg-red-100 text-red-700" },
                        { label: result ? "Repeated" : "Repeat", value: (result || preview.summary).repeat || (result || preview.summary).repeated || 0, color: "bg-amber-100 text-amber-700" },
                        { label: "Pending Review", value: (result || preview.summary).pendingReview || 0, color: "bg-slate-200 text-slate-700" },
                    ].map((s, i) => (
                        <Card key={i} className="border-none shadow-lg rounded-[1.5rem] bg-white">
                            <CardContent className="p-4 text-center">
                                <p className="text-3xl font-black">{s.value}</p>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-full inline-block", s.color)}>{s.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Result Banner */}
            {result && (
                <Card className="-to-r from-emerald-50 to-green-50 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6 flex items-center gap-4">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                        <div>
                            <h3 className="font-black text-emerald-900 uppercase text-sm">Promotion Complete</h3>
                            <p className="text-xs text-emerald-700 font-medium">
                                {result.promoted} promoted, {result.graduated} graduated, {result.withdrawn} withdrawn, {result.repeated} repeating.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Preview Table */}
            {preview?.evaluations && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Student Evaluation
                        </h2>
                        <div className="flex gap-2 ml-auto flex-wrap">
                            {["all", "promoted", "graduated", "withdrawn", "repeat", "pending_review"].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilterDecision(f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                        filterDecision === f
                                            ? "bg-indigo-600 text-white shadow-md"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <Input
                            placeholder="Search student..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-60 h-9 rounded-xl text-xs font-bold"
                        />
                    </div>

                    <div className="bg-white rounded-[1.5rem] shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="text-left p-4 font-black uppercase tracking-widest text-[9px] text-slate-500">Student</th>
                                        <th className="text-left p-4 font-black uppercase tracking-widest text-[9px] text-slate-500">Department</th>
                                        <th className="text-center p-4 font-black uppercase tracking-widest text-[9px] text-slate-500">Level</th>
                                        <th className="text-center p-4 font-black uppercase tracking-widest text-[9px] text-slate-500">CGPA</th>
                                        <th className="text-center p-4 font-black uppercase tracking-widest text-[9px] text-slate-500">Credits</th>
                                        <th className="text-center p-4 font-black uppercase tracking-widest text-[9px] text-slate-500">Decision</th>
                                        <th className="text-left p-4 font-black uppercase tracking-widest text-[9px] text-slate-500">Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEvaluations.map((e: any, i: number) => {
                                        const config = decisionConfig[e.decision] || decisionConfig.repeat;
                                        return (
                                            <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-900">{e.studentName}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{e.matricNumber || '—'}</p>
                                                </td>
                                                <td className="p-4 text-slate-600 font-medium">{e.deptName}</td>
                                                <td className="p-4 text-center">
                                                    <span className="font-black">{levelLabel(e.currentLevel, e.studentProgrammeType)}</span>
                                                    {e.decision === 'promoted' && (
                                                        <span className="text-emerald-600"> → {levelLabel(e.newLevel, e.studentProgrammeType)}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center font-bold">
                                                    {e.hasSummary === false ? <span className="text-slate-300">—</span> : e.cgpa.toFixed(2)}
                                                </td>
                                                <td className="p-4 text-center font-bold">
                                                    {e.hasSummary === false ? <span className="text-slate-300">—</span> : e.creditsEarned}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Badge className={cn("border-none font-black text-[8px] uppercase gap-1", config.color)}>
                                                        {config.icon} {config.label}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-slate-500 max-w-[250px]">
                                                    {e.reasons.map((r: string, j: number) => (
                                                        <p key={j} className="text-[10px] leading-relaxed">{r}</p>
                                                    ))}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {filteredEvaluations.length === 0 && (
                            <div className="p-10 text-center text-slate-400 text-sm font-medium">
                                No students match the current filter.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Manual / Bulk Level Adjustment */}
            <Card className="border-none shadow-xl rounded-[2rem] bg-white">
                <CardHeader className="p-6 pb-0">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-900 rounded-xl">
                                <ArrowDownCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest">Manual Level Adjustment</CardTitle>
                                <p className="text-[11px] text-slate-500 font-medium">
                                    Promote, demote or assign students to a level. Every change is recorded in the audit log.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => { setAdjustOpen(!adjustOpen); if (!adjustOpen) loadLogs(); }}
                            className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase tracking-widest text-[10px]"
                        >
                            {adjustOpen ? "Close" : "Open"}
                        </Button>
                    </div>
                </CardHeader>

                {adjustOpen && (
                    <CardContent className="p-6 space-y-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Student picker */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                    1. Find students (matric or name)
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input
                                        value={adjustQuery}
                                        onChange={e => setAdjustQuery(e.target.value)}
                                        placeholder="e.g. STU/2026/1026 or surname"
                                        className="w-full h-11 pl-9 rounded-xl text-xs font-bold"
                                    />
                                </div>
                                {searching && <p className="text-[10px] text-slate-400 font-bold">Searching…</p>}
                                <div className="max-h-56 overflow-y-auto border-2 border-slate-100 rounded-xl divide-y divide-slate-50">
                                    {candidates.map(c => {
                                        const isSel = selected.some(s => s.studentId === c.studentId);
                                        return (
                                            <button
                                                key={c.studentId}
                                                onClick={() => toggleCandidate(c)}
                                                className={cn(
                                                    "w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2",
                                                    isSel && "bg-indigo-50"
                                                )}
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold truncate">
                                                        {c.matricNumber || '—'} · L{c.currentLevel} · {c.status}
                                                    </p>
                                                </div>
                                                {isSel && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                    {!searching && candidates.length === 0 && adjustQuery.length >= 2 && (
                                        <p className="p-4 text-center text-[11px] text-slate-400 font-medium">No matches.</p>
                                    )}
                                </div>
                                {selected.length > 0 && (
                                    <div className="flex items-center gap-2 pt-1">
                                        <Badge className="border-none bg-indigo-100 text-indigo-700 font-black text-[9px]">
                                            {selected.length} selected
                                        </Badge>
                                        <button onClick={() => setSelected([])} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600">
                                            Clear
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Action config */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                        2. Action
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {([
                                            { v: 'promote', l: 'Promote', ic: <ArrowUpCircle className="w-4 h-4" /> },
                                            { v: 'demote', l: 'Demote', ic: <ArrowDownCircle className="w-4 h-4" /> },
                                            { v: 'assign', l: 'Assign', ic: <Users className="w-4 h-4" /> },
                                        ] as const).map(o => (
                                            <button
                                                key={o.v}
                                                onClick={() => setMode(o.v)}
                                                className={cn(
                                                    "h-11 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all",
                                                    mode === o.v
                                                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                                        : "border-slate-200 text-slate-400 hover:border-slate-300"
                                                )}
                                            >
                                                {o.ic} {o.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                        3. Target level
                                    </label>
                                    <select
                                        value={targetLevel}
                                        onChange={e => setTargetLevel(e.target.value)}
                                        className="w-full h-11 rounded-xl border-2 border-slate-200 px-4 font-bold text-sm focus:border-indigo-500 focus:outline-none"
                                    >
                                        {[1, 2].map(l => {
                                            const nd = levelLabel(l, 'ND');
                                            const hnd = levelLabel(l, 'HND');
                                            return (
                                                <option key={l} value={l}>
                                                    {nd} / {hnd}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                                        A student's programme type is fixed, so level 1 reads as ND 1 or HND 1 depending on the programme. Demotion below level 1 is refused.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                        4. Reason (required, recorded permanently)
                                    </label>
                                    <textarea
                                        value={adjustReason}
                                        onChange={e => setAdjustReason(e.target.value)}
                                        rows={3}
                                        placeholder="e.g. 2025/2026 results not available — administrative rollover to next level"
                                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={activateStudents}
                                        onChange={e => setActivateStudents(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <span className="text-[11px] font-bold text-slate-600">Also set student status to active</span>
                                </label>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => runAdjust(true)}
                                        disabled={adjustBusy || selected.length === 0}
                                        className="h-11 flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black uppercase tracking-widest text-[10px]"
                                    >
                                        {adjustBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                                        Dry Run
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (!adjustPlan) { toast.error("Run a dry run first."); return; }
                                            if (confirm(`Apply ${adjustPlan.summary.applicable} level change(s)? This is written to the audit log.`)) runAdjust(false);
                                        }}
                                        disabled={adjustBusy || !adjustPlan || adjustPlan.summary.applicable === 0}
                                        className="h-11 flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px]"
                                    >
                                        {adjustBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Dry-run plan */}
                        {adjustPlan && (
                            <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/40 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-3">
                                    Dry run — {adjustPlan.summary.applicable} to apply, {adjustPlan.summary.skipped} skipped
                                    {adjustPlan.summary.missing ? `, ${adjustPlan.summary.missing} not found` : ""}
                                </p>
                                <div className="max-h-64 overflow-y-auto space-y-1">
                                    {adjustPlan.plan.map((p: any) => (
                                        <div key={p.studentId} className="flex items-center justify-between gap-2 text-[11px] bg-white rounded-lg px-3 py-1.5">
                                            <span className="font-bold text-slate-700 truncate">
                                                {p.name} <span className="text-slate-400 font-medium">{p.matricNumber}</span>
                                            </span>
                                            <span className="flex items-center gap-2 shrink-0">
                                                {p.warning && <span className="text-[10px] text-amber-600 font-bold">{p.warning}</span>}
                                                <span className={cn(
                                                    "font-black",
                                                    p.action === 'skipped' ? "text-slate-300" : "text-indigo-700"
                                                )}>
                                                    {p.action === 'skipped' ? 'SKIP' : `${levelLabel(p.fromLevel)} → ${levelLabel(p.toLevel)}`}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Audit log */}
                        <div className="border-t-2 border-slate-100 pt-4">
                            <button
                                onClick={() => { if (!logsOpen) loadLogs(); setLogsOpen(!logsOpen); }}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800"
                            >
                                <History className="w-4 h-4" /> Audit log ({logs.length})
                            </button>
                            {logsOpen && (
                                <div className="mt-3 max-h-72 overflow-y-auto space-y-1">
                                    {logs.length === 0 && <p className="text-[11px] text-slate-400 font-medium">No promotion activity recorded yet.</p>}
                                    {logs.map(l => (
                                        <div key={l.id} className="text-[11px] bg-slate-50 rounded-lg px-3 py-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-slate-700 truncate">
                                                    {l.studentName} <span className="text-slate-400 font-medium">{l.matricNumber}</span>
                                                </span>
                                                <Badge className={cn("border-none font-black text-[8px] uppercase", (decisionConfig[l.decision] || decisionConfig.repeat).color)}>
                                                    {l.decision}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                {levelLabel(l.fromLevel)} → {levelLabel(l.toLevel)} · {l.reason}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
