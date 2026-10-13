"use client";

import { useState, useEffect, useCallback } from "react";
import {
    AlertTriangle, Trash2, RefreshCw, Search, Users, CheckCircle2,
    ShieldAlert, Save, History, Undo2, GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import {
    getStudentResolutionIssues, resolveStudentIssues, getStudentResolutionHistory,
    type ResolveAction
} from "@/actions/student-resolutions";
import { DataTablePagination } from "@/components/DataTablePagination";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type Row = {
    id: number;
    userId: number | null;
    matricNumber: string | null;
    status: string;
    currentLevel: number;
    programmeType: string;
    admissionYear: number | null;
    graduatedYear: number | null;
    name: string | null;
    email: string | null;
    enrollments: number;
    results: number;
    appId: number | null;
    appStatus: string | null;
};

const STATUS_OPTIONS = [
    'active', 'suspended', 'withdrawn', 'pending_review', 'rusticated',
    'nd_graduant', 'hnd_graduant', 'nd_graduated', 'hnd_graduated'
];

export default function StudentResolutionsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [rows, setRows] = useState<Row[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [drafts, setDrafts] = useState<Record<number, { status: string; gradYear: string }>>({});
    const [history, setHistory] = useState<any[]>([]);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const scope = searchParams.get("scope") || "applicant_graduant";
    const historyFilter = searchParams.get("history") || "all";
    const statusFilter = searchParams.get("status") || "all";

    const [bulkStatus, setBulkStatus] = useState("nd_graduant");
    const [bulkYear, setBulkYear] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getStudentResolutionIssues({
                search, scope: scope as any, history: historyFilter as any,
                status: statusFilter, page, pageSize
            });
            if (res.success) {
                setLoadError(null);
                setRows(res.data as Row[]);
                setTotalCount(res.totalCount);
                const d: Record<number, { status: string; gradYear: string }> = {};
                for (const r of res.data as Row[]) {
                    d[r.id] = { status: r.status, gradYear: r.graduatedYear ? String(r.graduatedYear) : "" };
                }
                setDrafts(d);
                setSelected(new Set());
            } else {
                setLoadError(res.error || "Failed to load");
                setRows([]);
            }
            const hist = await getStudentResolutionHistory(25);
            if (hist.success) setHistory(hist.data);
        } catch (e: any) {
            setLoadError(e?.message || "Failed to load records");
        } finally {
            setLoading(false);
        }
    }, [search, scope, historyFilter, statusFilter, page, pageSize]);

    useEffect(() => { load(); }, [load]);

    const toggle = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected((prev) => prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)));
    };

    const run = async (label: string, action: ResolveAction, ids: number[], extra: any = {}) => {
        if (!ids.length) { toast.error("Select at least one record"); return; }
        setBusy(true);
        try {
            const res = await resolveStudentIssues({ ids, action, ...extra });
            res.success ? toast.success(res.message || `${label} complete`) : toast.error(res.error || "Action failed");
            if (res.success) await load();
        } catch (e: any) {
            toast.error(e?.message || "Action failed");
        } finally {
            setBusy(false);
        }
    };

    const saveRow = (row: Row) => {
        const d = drafts[row.id];
        if (!d) return;
        const gradYear = d.gradYear.trim() === "" ? null : Number(d.gradYear);
        run("Save", "update", [row.id], { status: d.status, graduationYear: gradYear });
    };

    const pushParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value); else params.delete(key);
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const noHistoryCount = rows.filter((r) => r.enrollments === 0 && r.results === 0).length;

    return (
        <div className="p-8 pb-32 max-w-[1600px] w-full mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-wider">Student Record Resolutions</h1>
                        <p className="text-indigo-100 text-sm mt-1 leading-relaxed">
                            Students who also hold an admission application and carry a graduant status. Some genuinely
                            graduated &mdash; an <strong>ND graduant can apply for HND</strong> &mdash; while others were
                            marked graduant without ever enrolling. Review each record and set the correct status and
                            graduation year, individually or in bulk.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Flagged Records" value={rows.length} tone="slate" />
                <StatCard icon={AlertTriangle} label="No Academic History" value={noHistoryCount} tone="amber" />
                <StatCard icon={CheckCircle2} label="Selected" value={selected.size} tone="emerald" />
                <StatCard icon={History} label="Recent Actions" value={history.length} tone="blue" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col xl:flex-row gap-3 xl:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        defaultValue={search}
                        onKeyDown={(e) => { if (e.key === "Enter") pushParam("search", (e.target as HTMLInputElement).value); }}
                        placeholder="Search name, email or matric..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <select value={scope} onChange={(e) => pushParam("scope", e.target.value)}
                    className="px-3 h-10 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white">
                    <option value="applicant_graduant">Applicant + Graduant</option>
                    <option value="graduant">All Graduants</option>
                    <option value="all">All Students</option>
                </select>
                <select value={historyFilter} onChange={(e) => pushParam("history", e.target.value)}
                    className="px-3 h-10 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white">
                    <option value="all">Any History</option>
                    <option value="none">No History</option>
                    <option value="some">Has History</option>
                </select>
                <select value={statusFilter} onChange={(e) => pushParam("status", e.target.value)}
                    className="px-3 h-10 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white">
                    <option value="all">All Statuses</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col lg:flex-row gap-3 lg:items-end">
                <div className="flex flex-wrap items-end gap-3">
                    <Field label="Set status to">
                        <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
                            className="px-3 h-10 rounded-xl border border-slate-200 text-xs font-bold bg-white">
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                    </Field>
                    <ActionBtn label="Apply Status" tone="indigo" disabled={busy}
                        onClick={() => run("Status", "set_status", [...selected], { status: bulkStatus })} />
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <Field label="Graduation year">
                        <input type="number" value={bulkYear} onChange={(e) => setBulkYear(e.target.value)}
                            placeholder="e.g. 2026"
                            className="px-3 h-10 rounded-xl border border-slate-200 text-sm bg-white w-32" />
                    </Field>
                    <ActionBtn label="Apply Year" tone="blue" disabled={busy}
                        onClick={() => run("Year", "set_graduation_year", [...selected], { graduationYear: bulkYear ? Number(bulkYear) : null })} />
                    <ActionBtn label="Clear Year" tone="slate" disabled={busy}
                        onClick={() => run("Clear year", "clear_graduation_year", [...selected])} />
                </div>
                <div className="flex flex-wrap gap-3 lg:ml-auto">
                    <ActionBtn icon={Undo2} label="Restore" tone="emerald" disabled={busy}
                        onClick={() => run("Restore", "restore", [...selected])} />
                    <ActionBtn icon={Trash2} label="Delete" tone="rose" disabled={busy}
                        onClick={() => {
                            if (confirm(`Soft-delete ${selected.size} record(s)? This is reversible.`)) {
                                run("Delete", "soft_delete", [...selected]);
                            }
                        }} />
                    <button onClick={load} disabled={loading}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 text-sm font-semibold">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {loadError ? (
                <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center">
                    <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                    <p className="font-black text-slate-800 uppercase tracking-wider">Cannot Load Records</p>
                    <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">{loadError}</p>
                    <button onClick={load}
                        className="mt-5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
                        Try again
                    </button>
                </div>
            ) : loading ? (
                <div className="py-16 text-center text-slate-400 font-semibold">Loading records...</div>
            ) : rows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-black text-slate-700 uppercase tracking-wider">Nothing To Resolve</p>
                    <p className="text-sm text-slate-400 mt-1">No records match the current filters.</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-black">
                                    <tr>
                                        <th className="p-3 w-10">
                                            <input type="checkbox" className="w-4 h-4 accent-indigo-600"
                                                checked={selected.size === rows.length && rows.length > 0}
                                                onChange={toggleAll} />
                                        </th>
                                        <th className="p-3 text-left">Student</th>
                                        <th className="p-3 text-left">Matric</th>
                                        <th className="p-3 text-left">Status</th>
                                        <th className="p-3 text-left">Grad. Year</th>
                                        <th className="p-3 text-left">History</th>
                                        <th className="p-3 text-left">Application</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rows.map((r) => {
                                        const d = drafts[r.id] || { status: r.status, gradYear: "" };
                                        const noHistory = r.enrollments === 0 && r.results === 0;
                                        return (
                                            <tr key={r.id} className={`hover:bg-slate-50 ${selected.has(r.id) ? "bg-indigo-50/40" : ""}`}>
                                                <td className="p-3">
                                                    <input type="checkbox" className="w-4 h-4 accent-indigo-600"
                                                        checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-semibold text-slate-800">{r.name || "—"}</div>
                                                    <div className="text-[11px] text-slate-400">{r.email || "—"}</div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {r.programmeType} · Level {r.currentLevel}
                                                        {r.programmeType === "ND" && r.status === "nd_graduant" && (
                                                            <span className="ml-1 text-indigo-500 font-bold">· can apply for HND</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 font-mono text-xs font-bold text-slate-700">{r.matricNumber || "—"}</td>
                                                <td className="p-3">
                                                    <select value={d.status}
                                                        onChange={(e) => setDrafts((p) => ({ ...p, [r.id]: { ...d, status: e.target.value } }))}
                                                        className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white">
                                                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-3">
                                                    <input type="number" value={d.gradYear}
                                                        onChange={(e) => setDrafts((p) => ({ ...p, [r.id]: { ...d, gradYear: e.target.value } }))}
                                                        placeholder="Year"
                                                        className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white w-24" />
                                                </td>
                                                <td className="p-3">
                                                    {noHistory ? (
                                                        <span className="text-xs text-amber-600 font-semibold">None</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-600 font-semibold">
                                                            {r.enrollments} enr · {r.results} res
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {r.appId ? (
                                                        <span className="text-xs text-slate-500 font-semibold">
                                                            #{r.appId} · {r.appStatus}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-300">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button onClick={() => saveRow(r)} disabled={busy}
                                                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1">
                                                        <Save className="w-3 h-3" /> Save
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <DataTablePagination totalItems={totalCount} pageSize={pageSize} currentPage={page} />
                </>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, tone }: any) {
    const tones: Record<string, string> = {
        slate: "bg-slate-50 text-slate-700", amber: "bg-amber-50 text-amber-700",
        blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700"
    };
    return (
        <div className={`rounded-2xl p-5 ${tones[tone]}`}>
            <Icon className="w-5 h-5 mb-2 opacity-70" />
            <p className="text-2xl font-black">{value}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-80">{label}</p>
        </div>
    );
}

function Field({ label, children }: any) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
            {children}
        </label>
    );
}

function ActionBtn({ icon: Icon, label, tone, disabled, onClick }: any) {
    const tones: Record<string, string> = {
        indigo: "bg-indigo-600 hover:bg-indigo-700 text-white",
        blue: "bg-blue-600 hover:bg-blue-700 text-white",
        slate: "bg-slate-600 hover:bg-slate-700 text-white",
        emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
        rose: "bg-rose-600 hover:bg-rose-700 text-white"
    };
    return (
        <button onClick={onClick} disabled={disabled}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center gap-2 ${tones[tone]}`}>
            {Icon && <Icon className="w-4 h-4" />}
            {label}
        </button>
    );
}
