"use client";

import { useState, useEffect, useCallback } from "react";
import { KeyRound, Search, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    searchUsersForReset, resetPasswordsCentral, getRecentPasswordResets,
} from "@/actions/password-reset-actions";

const ROLE_FILTERS = ["all", "student", "staff", "applicant", "admin", "registrar", "bursar", "hod", "dean", "ict_manager"];

export default function PasswordResetDashboard() {
    const [query, setQuery] = useState("");
    const [role, setRole] = useState("all");
    const [results, setResults] = useState<any[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [searching, setSearching] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [custom, setCustom] = useState("");
    const [recent, setRecent] = useState<any[]>([]);

    const loadRecent = useCallback(() => {
        getRecentPasswordResets(20).then((r) => r.success && setRecent(r.data));
    }, []);

    useEffect(() => { loadRecent(); }, [loadRecent]);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (query.trim().length < 2 && role === "all") { setResults([]); return; }
            setSearching(true);
            const res = await searchUsersForReset(query, role);
            setSearching(false);
            if (res.success) setResults(res.data);
            else toast.error(res.error);
        }, 350);
        return () => clearTimeout(t);
    }, [query, role]);

    const toggle = (id: number) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

    async function handleReset() {
        if (!selected.length) return;
        const pw = custom.trim() || "the default password (welcome123)";
        if (!window.confirm(`Reset password for ${selected.length} user(s) to ${custom.trim() ? "the custom password" : pw}? They will be forced to change it at next login.`)) return;
        setResetting(true);
        const res = await resetPasswordsCentral(selected, custom.trim() || undefined);
        setResetting(false);
        if (res.success) {
            toast.success(res.message);
            setSelected([]);
            setCustom("");
            loadRecent();
        } else {
            toast.error(res.error);
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <KeyRound size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Password Reset Centre</h1>
                        <p className="text-sm text-slate-500">
                            Reset any user&apos;s password. They are forced to choose a new one at next login. All resets are audited.
                        </p>
                    </div>
                </div>

                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-base">Find users</CardTitle>
                        <CardDescription>Search by name, email, matric or admission number (min. 2 characters).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3 flex-wrap">
                            <div className="relative flex-1 min-w-[240px]">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. bursar@fssibadan.edu.ng or DPP/HND/..." className="pl-9 h-10 rounded-xl" />
                            </div>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-xl border border-slate-300 px-3 text-sm capitalize">
                                {ROLE_FILTERS.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                            </select>
                        </div>

                        {selected.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200">
                                <span className="text-sm font-bold text-rose-700">{selected.length} selected</span>
                                <Input
                                    value={custom}
                                    onChange={(e) => setCustom(e.target.value)}
                                    placeholder="Custom password (optional, default welcome123)"
                                    className="h-9 w-72 rounded-lg bg-white"
                                />
                                <Button size="sm" onClick={handleReset} disabled={resetting} className="bg-rose-600 hover:bg-rose-700 text-white gap-1 rounded-lg">
                                    {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                    Reset Password
                                </Button>
                            </div>
                        )}

                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            {searching ? (
                                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
                            ) : results.length === 0 ? (
                                <p className="p-8 text-center text-sm text-slate-400">No users to show. Start typing to search.</p>
                            ) : (
                                results.map((u) => (
                                    <label key={u.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer text-sm">
                                        <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{u.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{u.email}{u.matricNumber ? ` • ${u.matricNumber}` : ""}</p>
                                        </div>
                                        <Badge variant="outline" className="capitalize text-xs">{String(u.role).replace("_", " ")}</Badge>
                                        {u.requiresPasswordChange && <Badge className="bg-amber-100 text-amber-700 text-[10px]">Change pending</Badge>}
                                        {u.status === "suspended" && <Badge className="bg-red-100 text-red-700 text-[10px]">Suspended</Badge>}
                                    </label>
                                ))
                            )}
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> You cannot reset your own account here, and only super-admins can reset super-admin accounts.
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl">
                    <CardHeader><CardTitle className="text-base">Recent resets</CardTitle></CardHeader>
                    <CardContent>
                        {recent.length === 0 ? (
                            <p className="text-sm text-slate-400">No resets recorded yet.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase text-slate-500">
                                        <th className="py-2">When</th><th>User</th><th>Reset by</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((r) => (
                                        <tr key={r.id} className="border-t border-slate-100">
                                            <td className="py-2 text-xs text-slate-600">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                                            <td><span className="font-semibold">{r.targetName || `#${r.targetId}`}</span> <span className="text-xs text-slate-500">{r.targetEmail}</span></td>
                                            <td className="text-xs">{r.actorName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
