"use client";

import { useState, useEffect, useCallback } from "react";
import {
    AlertTriangle, Ban, Trash2, RotateCcw, RefreshCw,
    Users, CheckCircle2, ShieldAlert, Search
} from "lucide-react";
import { toast } from "sonner";
import {
    getOrphanStudents, blockOrphanStudents,
    deleteOrphanStudents, enableOrphanStudents
} from "@/actions/orphan-students";

type Orphan = {
    id: number;
    userId: number | null;
    matricNumber: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    userName: string | null;
    programmeType: string;
    currentLevel: number;
    studyMode: string;
    status: string;
    admissionYear: number | null;
    createdAt: string;
    dependentCounts: {
        bills: number; enrollments: number; idCards: number;
        medical: number; conduct: number;
    };
    totalDependents: number;
};

export default function OrphanStudentsPage() {
    const [rows, setRows] = useState<Orphan[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [query, setQuery] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getOrphanStudents();
            setRows(data);
            setSelected(new Set());
        } catch (e: any) {
            toast.error(e?.message || "Failed to load records");
        } finally {
            setLoading(false);
        }
    }, []);

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

    const run = async (
        label: string,
        fn: (ids: number[]) => Promise<{ success: boolean; message?: string; error?: string }>,
        selectedIds: number[]
    ) => {
        if (!selectedIds.length) { toast.error("Select at least one record"); return; }
        setBusy(true);
        try {
            const res = await fn(selectedIds);
            res.success ? toast.success(res.message || `${label} complete`) : toast.error(res.error || "Action failed");
            if (res.success) await load();
        } catch (e: any) {
            toast.error(e?.message || "Action failed");
        } finally {
            setBusy(false);
        }
    };

    const visible = rows.filter((r) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return [r.matricNumber, r.firstName, r.lastName, r.email, r.userName]
            .some((v) => (v || "").toLowerCase().includes(q));
    });

    const blockedCount = rows.filter((r) => r.status === "pending_review").length;

    return (
        <div className="space-y-6">
            <div className="bg-amber-500 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-wider">Incomplete Admission Records</h1>
                        <p className="text-amber-50 text-sm mt-1 leading-relaxed">
                            These records were auto-generated as placeholders with an invalid level of 100.
                            They are blocked from portal access. For each record you may remove it, or reset it
                            so the student can be re-processed through the admission flow.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Records" value={rows.length} tone="slate" />
                <StatCard icon={ShieldAlert} label="Blocked" value={blockedCount} tone="amber" />
                <StatCard icon={CheckCircle2} label="Awaiting Decision" value={rows.length - blockedCount} tone="blue" />
                <StatCard icon={AlertTriangle} label="Selected" value={selected.size} tone="emerald" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by matric, name or email..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <ActionBtn icon={Ban} label="Block Access" tone="amber" disabled={busy}
                        onClick={() => run("Block", blockOrphanStudents, [...selected])} />
                    <ActionBtn icon={RotateCcw} label="Reset for Admission" tone="blue" disabled={busy}
                        onClick={() => run("Reset", enableOrphanStudents, [...selected])} />
                    <ActionBtn icon={Trash2} label="Delete" tone="rose" disabled={busy}
                        onClick={() => run("Delete", deleteOrphanStudents, [...selected])} />
                    <button onClick={load} disabled={loading}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 text-sm font-semibold">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-16 text-center text-slate-400 font-semibold">Loading records...</div>
            ) : visible.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-black text-slate-700 uppercase tracking-wider">No Incomplete Records</p>
                    <p className="text-sm text-slate-400 mt-1">All placeholder admission records have been resolved.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-black">
                                <tr>
                                    <th className="p-3 w-10">
                                        <input type="checkbox" checked={selected.size === rows.length && rows.length > 0}
                                            onChange={toggleAll} className="w-4 h-4 accent-emerald-600" />
                                    </th>
                                    <th className="p-3 text-left">ID</th>
                                    <th className="p-3 text-left">Matric No</th>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Email</th>
                                    <th className="p-3 text-left">Level</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-left">Linked Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {visible.map((r) => (
                                    <tr key={r.id} className={`hover:bg-slate-50 ${selected.has(r.id) ? "bg-emerald-50/40" : ""}`}>
                                        <td className="p-3">
                                            <input type="checkbox" checked={selected.has(r.id)}
                                                onChange={() => toggle(r.id)} className="w-4 h-4 accent-emerald-600" />
                                        </td>
                                        <td className="p-3 font-mono text-xs text-slate-500">{r.id}</td>
                                        <td className="p-3 font-mono text-xs font-bold text-slate-700">{r.matricNumber || "—"}</td>
                                        <td className="p-3">
                                            <div className="font-semibold text-slate-800">
                                                {[r.firstName, r.lastName].filter(Boolean).join(" ") || <span className="text-amber-600 italic">No name</span>}
                                            </div>
                                            {r.userName && (
                                                <div className="text-[11px] text-slate-400">{r.userName}</div>
                                            )}
                                        </td>
                                        <td className="p-3 text-xs text-slate-500">{r.email || "—"}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-black">{r.currentLevel}</span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                                                r.status === "pending_review" ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"
                                            }`}>
                                                {r.status === "pending_review" ? "Blocked" : "Active"}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {r.totalDependents === 0 ? (
                                                <span className="text-xs text-emerald-600 font-semibold">None</span>
                                            ) : (
                                                <span className="text-xs text-amber-600 font-semibold">
                                                    {r.totalDependents} record(s)
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
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

function ActionBtn({ icon: Icon, label, tone, disabled, onClick }: any) {
    const tones: Record<string, string> = {
        amber: "bg-amber-500 hover:bg-amber-600 text-white",
        blue: "bg-blue-600 hover:bg-blue-700 text-white",
        rose: "bg-rose-600 hover:bg-rose-700 text-white"
    };
    return (
        <button onClick={onClick} disabled={disabled}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center gap-2 ${tones[tone]}`}>
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}
