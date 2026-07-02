"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    FileText,
    Send,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Plus,
    ChevronDown,
} from "lucide-react";
import { submitExcuse, getMyExcuses } from "@/actions/attendance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const excuseTypes = [
    { value: "medical", label: "Medical", icon: "🏥" },
    { value: "official_duty", label: "Official Duty", icon: "🏛️" },
    { value: "family_emergency", label: "Family Emergency", icon: "🏠" },
    { value: "other", label: "Other", icon: "📋" },
] as const;

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
};

const statusIcons: Record<string, any> = {
    pending: <Clock className="w-3 h-3" />,
    approved: <CheckCircle2 className="w-3 h-3" />,
    rejected: <XCircle className="w-3 h-3" />,
};

export default function StudentExcusesPage() {
    const [excuses, setExcuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        courseId: "",
        sessionId: "",
        reason: "",
        excuseType: "medical" as "medical" | "official_duty" | "family_emergency" | "other",
        documentUrl: "",
    });

    const fetchExcuses = async () => {
        const res = await getMyExcuses();
        if (res.success && res.excuses) {
            setExcuses(res.excuses);
        }
        setLoading(false);
    };

    useEffect(() => { fetchExcuses(); }, []);

    const handleSubmit = async () => {
        if (!form.courseId || !form.reason) {
            toast.error("Course ID and reason are required.");
            return;
        }
        setSubmitting(true);
        const res = await submitExcuse({
            courseId: parseInt(form.courseId),
            sessionId: form.sessionId ? parseInt(form.sessionId) : undefined,
            reason: form.reason,
            excuseType: form.excuseType,
            documentUrl: form.documentUrl || undefined,
        });
        if (res.success) {
            toast.success(res.message);
            setForm({ courseId: "", sessionId: "", reason: "", excuseType: "medical", documentUrl: "" });
            setShowForm(false);
            fetchExcuses();
        } else {
            toast.error(res.error || "Failed to submit excuse.");
        }
        setSubmitting(false);
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-2xl">
                        <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                            Attendance Excuses
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Submit and track your absence excuses.
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    className="h-12 px-6 rounded-2xl bg-purple-600 hover:bg-purple-700 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-purple-100"
                >
                    <Plus className="w-4 h-4" /> New Excuse
                </Button>
            </div>

            {/* Submit Form */}
            {showForm && (
                <Card className="-to-br from-purple-50 to-indigo-50 overflow-hidden animate-in slide-in-from-top-4 duration-300 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6 space-y-5">
                        <h3 className="font-black text-sm uppercase tracking-widest text-purple-700 flex items-center gap-2">
                            <Send className="w-4 h-4" /> Submit New Excuse
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Course ID *</label>
                                <Input
                                    placeholder="e.g. 1"
                                    type="number"
                                    value={form.courseId}
                                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                                    className="rounded-xl h-11 font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Session ID (optional)</label>
                                <Input
                                    placeholder="Leave blank for general excuse"
                                    type="number"
                                    value={form.sessionId}
                                    onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                                    className="rounded-xl h-11 font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Excuse Type *</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {excuseTypes.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => setForm({ ...form, excuseType: t.value })}
                                        className={cn(
                                            "p-3 rounded-xl border-2 text-center transition-all font-bold text-xs",
                                            form.excuseType === t.value
                                                ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md"
                                                : "border-slate-200 hover:border-purple-300 text-slate-600"
                                        )}
                                    >
                                        <div className="text-lg mb-1">{t.icon}</div>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Reason *</label>
                            <Textarea
                                placeholder="Describe your reason for absence..."
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                className="rounded-xl font-medium min-h-[100px]"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Supporting Document URL (optional)</label>
                            <Input
                                placeholder="https://drive.google.com/..."
                                value={form.documentUrl}
                                onChange={(e) => setForm({ ...form, documentUrl: e.target.value })}
                                className="rounded-xl h-11 font-medium"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-700 font-black uppercase tracking-widest text-[10px] gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Submit Excuse
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowForm(false)}
                                className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]"
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Excuse History */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : excuses.length > 0 ? (
                <div className="space-y-3">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Your Excuse History
                    </h2>
                    {excuses.map((excuse: any) => (
                        <Card key={excuse.id} className="border-none shadow-lg rounded-[1.5rem] bg-white overflow-hidden hover:shadow-xl transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-slate-900 text-white border-none font-black uppercase text-[9px] tracking-widest px-2">
                                                {excuse.courseCode}
                                            </Badge>
                                            <Badge className={cn("border-none font-black text-[8px] uppercase gap-1", statusColors[excuse.status])}>
                                                {statusIcons[excuse.status]} {excuse.status}
                                            </Badge>
                                        </div>
                                        <h3 className="font-bold text-sm text-slate-900">{excuse.courseName}</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                            <span className="capitalize">{excuse.excuseType?.replace('_', ' ')}</span>
                                            <span>•</span>
                                            <span>{excuse.createdAt ? new Date(excuse.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                                        </div>
                                    </div>
                                    {excuse.documentUrl && (
                                        <a href={excuse.documentUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-widest">
                                            View Doc →
                                        </a>
                                    )}
                                </div>
                                <p className="text-xs text-slate-600 mt-3 leading-relaxed bg-slate-50 rounded-xl p-3">{excuse.reason}</p>
                                {excuse.reviewNotes && (
                                    <div className="mt-2 text-xs bg-blue-50 rounded-xl p-3">
                                        <span className="font-black text-blue-700 text-[10px] uppercase">Reviewer Notes: </span>
                                        <span className="text-blue-600">{excuse.reviewNotes}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-10 text-center space-y-3">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                        <h3 className="text-lg font-black text-slate-900 uppercase">No Excuses Yet</h3>
                        <p className="text-sm text-slate-500 font-medium">
                            Click &quot;New Excuse&quot; to submit your first attendance excuse.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
