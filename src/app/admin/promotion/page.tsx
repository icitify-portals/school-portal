"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    ArrowUpCircle,
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
} from "lucide-react";
import {
    getPromotionPreview,
    runPromotion,
    getAcademicSessionsList,
    getPromotionLogs,
} from "@/actions/promotion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const decisionConfig: Record<string, { color: string; icon: any; label: string }> = {
    promoted: { color: "bg-emerald-100 text-emerald-700", icon: <ArrowUpCircle className="w-3 h-3" />, label: "PROMOTED" },
    graduated: { color: "bg-blue-100 text-blue-700", icon: <GraduationCap className="w-3 h-3" />, label: "GRADUATED" },
    withdrawn: { color: "bg-red-100 text-red-700", icon: <UserMinus className="w-3 h-3" />, label: "WITHDRAWN" },
    repeat: { color: "bg-amber-100 text-amber-700", icon: <RotateCcw className="w-3 h-3" />, label: "REPEAT" },
};

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
            <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: "Total", value: (result || preview.summary).total || 0, color: "bg-slate-100 text-slate-700" },
                        { label: "Promoted", value: (result || preview.summary).promoted || 0, color: "bg-emerald-100 text-emerald-700" },
                        { label: "Graduated", value: (result || preview.summary).graduated || 0, color: "bg-blue-100 text-blue-700" },
                        { label: "Withdrawn", value: (result || preview.summary).withdrawn || 0, color: "bg-red-100 text-red-700" },
                        { label: result ? "Repeated" : "Repeat", value: (result || preview.summary).repeat || (result || preview.summary).repeated || 0, color: "bg-amber-100 text-amber-700" },
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
                <Card className="border-none shadow-xl rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 overflow-hidden">
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
                            {["all", "promoted", "graduated", "withdrawn", "repeat"].map(f => (
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
                                                    <span className="font-black">{e.currentLevel}</span>
                                                    {e.decision === 'promoted' && (
                                                        <span className="text-emerald-600"> → {e.newLevel}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center font-bold">{e.cgpa.toFixed(2)}</td>
                                                <td className="p-4 text-center font-bold">{e.creditsEarned}</td>
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
        </div>
    );
}
