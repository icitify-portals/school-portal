"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    AlertTriangle, RefreshCw, Search, Users, ShieldAlert,
    CheckCircle2, PencilLine, GraduationCap, Layers, Link2Off, Info
} from "lucide-react";
import { toast } from "sonner";
import {
    getPlacementIssues, getPlacementProgrammes, correctStudentPlacement
} from "@/actions/student-placement";
import { resolveLevel } from "@/lib/levels";

const ISSUE_LABELS: Record<string, string> = {
    programme_type_mismatch: "Programme type disagrees with programme",
    no_programme: "No programme assigned",
    legacy_level: "Level stored as 100-500 instead of 1-2",
    graduant_status_on_hnd: "Marked ND graduant but on an HND programme"
};

const placementIssueLabel = (t: string) => ISSUE_LABELS[t] ?? t;

type Programme = {
    id: number; name: string; programmeType: string; code: string | null;
    deptId: number | null; deptName: string | null; durationYears: number | null;
};

type Issue = {
    id: number; matricNumber: string | null; name: string; email: string | null;
    deptId: number | null; deptName: string | null;
    programmeId: number | null; programmeName: string | null;
    storedProgrammeType: string | null; actualProgrammeType: string | null;
    currentLevel: number; status: string; admissionYear: number | null;
    issues: string[]; displayLabel: string;
    dependentCounts: { bills: number; registrations: number }; totalDependents: number;
};

const STATUSES = [
    "active", "nd_graduant", "hnd_graduant", "nd_graduated", "hnd_graduated",
    "withdrawn", "suspended", "rusticated", "pending_review"
];

const TONE: Record<string, string> = {
    programme_type_mismatch: "bg-rose-50 text-rose-700",
    no_programme: "bg-amber-50 text-amber-700",
    legacy_level: "bg-purple-50 text-purple-700",
    graduant_status_on_hnd: "bg-blue-50 text-blue-700"
};

export default function StudentPlacementPage() {
    const [rows, setRows] = useState<Issue[]>([]);
    const [programmes, setProgrammes] = useState<Programme[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [only, setOnly] = useState<string>("");

    const [target, setTarget] = useState<Issue | null>(null);
    const [programmeId, setProgrammeId] = useState<string>("");
    const [level, setLevel] = useState<"1" | "2">("2");
    const [status, setStatus] = useState<string>("active");
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [issues, progs] = await Promise.all([getPlacementIssues(), getPlacementProgrammes()]);
            setRows(issues as Issue[]);
            setProgrammes(progs as Programme[]);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load placement issues");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const open = (r: Issue) => {
        setTarget(r);
        setProgrammeId(r.programmeId != null ? String(r.programmeId) : "");
        setLevel(r.currentLevel === 1 ? "1" : "2");
        setStatus(r.status || "active");
        setReason("");
    };

    const chosen = useMemo(
        () => programmes.find((p) => String(p.id) === programmeId) || null,
        [programmes, programmeId]
    );

    // The label is programme + level, so show exactly what the student will see
    // before they commit. resolveLevel is the canonical bridge to the 100-400
    // course levels, so the preview cannot drift from what registration does.
    const newResolved = resolveLevel(level, chosen?.programmeType ?? null);
    const newLabel = newResolved?.label ?? String(level);
    const newCourseLevel = newResolved?.numeric ?? null;

    const save = async () => {
        if (!target) return;
        setSaving(true);
        try {
            const res = await correctStudentPlacement({
                studentId: target.id,
                programmeId: programmeId ? Number(programmeId) : null,
                currentLevel: Number(level),
                status,
                reason
            });
            if (res.success) { toast.success(res.message); setTarget(null); await load(); }
            else toast.error(res.error || "Could not apply the correction");
        } catch (e: any) {
            toast.error(e?.message || "Could not apply the correction");
        } finally {
            setSaving(false);
        }
    };

    const counts = useMemo(() => {
        const c: Record<string, number> = {};
        for (const r of rows) for (const i of r.issues) c[i] = (c[i] || 0) + 1;
        return c;
    }, [rows]);

    const visible = rows.filter((r) => {
        if (only && !r.issues.includes(only)) return false;
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return [r.matricNumber, r.name, r.email, r.programmeName].some((v) => (v || "").toLowerCase().includes(q));
    });

    return (
        <div className="space-y-6">
            <div className="bg-rose-500 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-wider">Student Placement Corrections</h1>
                        <p className="text-rose-50 text-sm mt-1 leading-relaxed">
                            Records whose stored programme or level is self-inconsistent. Promotion can only move a
                            level within a programme, so an ND student who should now be HND has to be corrected here.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 leading-relaxed">
                    A student level is <strong>1</strong> or <strong>2</strong> only. The ND/HND half of the label comes
                    from the programme, so <strong>100/200/300/400 are never valid here</strong> &mdash; those are course
                    levels. The programme type and department are taken from the programme you pick, so they cannot
                    drift apart again.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard icon={Users} label="Records" value={rows.length} tone="slate" />
                <StatCard icon={Link2Off} label="Type mismatch" value={counts.programme_type_mismatch || 0} tone="rose" />
                <StatCard icon={AlertTriangle} label="No programme" value={counts.no_programme || 0} tone="amber" />
                <StatCard icon={Layers} label="Legacy level" value={counts.legacy_level || 0} tone="purple" />
                <StatCard icon={GraduationCap} label="Status conflict" value={counts.graduant_status_on_hnd || 0} tone="blue" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by matric, name, email or programme..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:rose-500"
                    />
                </div>
                <select
                    value={only}
                    onChange={(e) => setOnly(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:rose-500"
                >
                    <option value="">All issue types</option>
                    {Object.keys(TONE).map((k) => (
                        <option key={k} value={k}>{placementIssueLabel(k as any)} ({counts[k] || 0})</option>
                    ))}
                </select>
                <button onClick={load} disabled={loading}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 text-sm font-semibold">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="py-16 text-center text-slate-400 font-semibold">Checking student records...</div>
            ) : visible.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-black text-slate-700 uppercase tracking-wider">No Placement Issues</p>
                    <p className="text-sm text-slate-400 mt-1">Every student has a programme and a level of 1 or 2.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-black">
                                <tr>
                                    <th className="p-3 text-left">ID</th>
                                    <th className="p-3 text-left">Matric No</th>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Shows As</th>
                                    <th className="p-3 text-left">Programme Row</th>
                                    <th className="p-3 text-left">Issues</th>
                                    <th className="p-3 text-left">Linked</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {visible.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-mono text-xs text-slate-500">{r.id}</td>
                                        <td className="p-3 font-mono text-xs font-bold text-slate-700">{r.matricNumber || "—"}</td>
                                        <td className="p-3">
                                            <div className="font-semibold text-slate-800">{r.name}</div>
                                            {r.email && <div className="text-[11px] text-slate-400">{r.email}</div>}
                                        </td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-black">
                                                {r.displayLabel}
                                            </span>
                                            <div className="text-[10px] text-slate-400 mt-1">level {r.currentLevel} · {r.status}</div>
                                        </td>
                                        <td className="p-3 text-xs text-slate-600">
                                            {r.programmeName || <span className="text-amber-600 italic">none</span>}
                                            {r.actualProgrammeType && (
                                                <div className="text-[10px] text-slate-400">{r.actualProgrammeType}</div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1">
                                                {r.issues.map((i) => (
                                                    <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold ${TONE[i] || "bg-slate-100 text-slate-600"}`}>
                                                        {placementIssueLabel(i as any)}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3 text-xs">
                                            {r.totalDependents === 0 ? (
                                                <span className="text-emerald-600 font-semibold">None</span>
                                            ) : (
                                                <span className="text-amber-600 font-semibold">{r.totalDependents} row(s)</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <button onClick={() => open(r)}
                                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5">
                                                <PencilLine className="w-3.5 h-3.5" /> Correct
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {target && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900">Correct Placement</h2>
                            <p className="text-xs text-slate-500 mt-1">
                                {target.matricNumber || `ID ${target.id}`} · {target.name}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-slate-50">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Currently shows</p>
                                    <p className="font-black text-slate-800 mt-1">{target.displayLabel}</p>
                                    <p className="text-slate-500">{target.programmeName || "no programme"}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-50">
                                    <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">Will show</p>
                                    <p className="font-black text-emerald-800 mt-1">{newLabel}</p>
                                    <p className="text-emerald-700">{chosen?.name || "no programme"}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Programme</label>
                                <select value={programmeId} onChange={(e) => setProgrammeId(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:rose-500">
                                    <option value="">— none —</option>
                                    {["ND", "HND"].map((t) => (
                                        <optgroup key={t} label={t}>
                                            {programmes.filter((p) => p.programmeType === t).map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}{p.deptName ? ` (${p.deptName})` : ""}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Type and department follow this programme automatically.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Level</label>
                                    <select value={level} onChange={(e) => setLevel(e.target.value as "1" | "2")}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:rose-500">
                                        <option value="1">1 (first year)</option>
                                        <option value="2">2 (second year)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Status</label>
                                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:rose-500">
                                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-blue-50 text-[11px] text-blue-900 leading-relaxed">
                                This student's course list resolves to level <strong>{newCourseLevel ?? "unknown"}</strong>
                                {chosen && target.programmeId != null && Number(programmeId) !== target.programmeId ? (
                                    <> &mdash; <strong>their course list will change</strong>, since it follows the programme half of the label.</>
                                ) : null}
                                {target.totalDependents > 0 && (
                                    <>. Linked records: {target.dependentCounts.registrations} registration(s), {target.dependentCounts.bills} bill(s) &mdash; these are not changed.</>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Reason (required)</label>
                                <input value={reason} onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Admitted to HND after completing ND; programme and level corrected"
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:rose-500" />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setTarget(null)} disabled={saving}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={save} disabled={saving || reason.trim().length < 5}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm disabled:opacity-50">
                                {saving ? "Applying..." : "Apply Correction"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, tone }: any) {
    const tones: Record<string, string> = {
        slate: "bg-slate-50 text-slate-700", rose: "bg-rose-50 text-rose-700",
        amber: "bg-amber-50 text-amber-700", purple: "bg-purple-50 text-purple-700",
        blue: "bg-blue-50 text-blue-700"
    };
    return (
        <div className={`rounded-2xl p-5 ${tones[tone] || tones.slate}`}>
            <Icon className="w-5 h-5 mb-2 opacity-70" />
            <p className="text-2xl font-black">{value}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-80">{label}</p>
        </div>
    );
}