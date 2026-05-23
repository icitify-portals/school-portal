"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Loader2,
    User,
    BookOpen,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";
import { getPendingExcuses, reviewExcuse } from "@/actions/attendance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const excuseTypeLabels: Record<string, { label: string; icon: string }> = {
    medical: { label: "Medical", icon: "🏥" },
    official_duty: { label: "Official Duty", icon: "🏛️" },
    family_emergency: { label: "Family Emergency", icon: "🏠" },
    other: { label: "Other", icon: "📋" },
};

export default function StaffExcuseReviewPage() {
    const [excuses, setExcuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState<number | null>(null);
    const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
    const [processing, setProcessing] = useState<number | null>(null);

    const fetchExcuses = async () => {
        const res = await getPendingExcuses();
        if (res.success && res.excuses) {
            setExcuses(res.excuses);
        }
        setLoading(false);
    };

    useEffect(() => { fetchExcuses(); }, []);

    const handleReview = async (excuseId: number, status: 'approved' | 'rejected') => {
        setProcessing(excuseId);
        const res = await reviewExcuse(excuseId, status, reviewNotes[excuseId] || "");
        if (res.success) {
            toast.success(res.message);
            setExcuses(prev => prev.filter(e => e.id !== excuseId));
            setReviewingId(null);
        } else {
            toast.error(res.error || "Failed to review excuse.");
        }
        setProcessing(null);
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-2xl">
                    <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                        Excuse Review
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Review and approve or reject student attendance excuses.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3">
                <Badge className="bg-amber-100 text-amber-700 border-none font-black text-xs uppercase tracking-widest px-3 py-1.5 gap-1">
                    <Clock className="w-3.5 h-3.5" /> {excuses.length} Pending
                </Badge>
            </div>

            {/* Excuse Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : excuses.length > 0 ? (
                <div className="space-y-4">
                    {excuses.map((excuse: any) => {
                        const typeInfo = excuseTypeLabels[excuse.excuseType] || excuseTypeLabels.other;
                        const isReviewing = reviewingId === excuse.id;
                        const isProcessing = processing === excuse.id;

                        return (
                            <Card key={excuse.id} className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-slate-900 text-white border-none font-black uppercase text-[9px] tracking-widest px-2">
                                                    {excuse.courseCode}
                                                </Badge>
                                                <Badge className="bg-amber-100 text-amber-700 border-none font-black uppercase text-[8px] gap-1">
                                                    <Clock className="w-3 h-3" /> PENDING
                                                </Badge>
                                                <Badge className="bg-purple-100 text-purple-700 border-none font-bold text-[8px] gap-1">
                                                    {typeInfo.icon} {typeInfo.label}
                                                </Badge>
                                            </div>
                                            <h3 className="font-bold text-sm text-slate-900">{excuse.courseName}</h3>
                                        </div>
                                        <div className="text-right text-[10px] text-slate-400 font-bold">
                                            {excuse.createdAt ? new Date(excuse.createdAt).toLocaleDateString('en-GB', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            }) : '—'}
                                        </div>
                                    </div>

                                    {/* Student Info */}
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                            <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900">{excuse.studentName}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{excuse.matricNo || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Reason</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{excuse.reason}</p>
                                    </div>

                                    {excuse.documentUrl && (
                                        <a href={excuse.documentUrl} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-widest mb-4">
                                            📎 View Supporting Document →
                                        </a>
                                    )}

                                    {/* Review Section */}
                                    {isReviewing ? (
                                        <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
                                            <Textarea
                                                placeholder="Add review notes (optional)..."
                                                value={reviewNotes[excuse.id] || ""}
                                                onChange={(e) => setReviewNotes(prev => ({ ...prev, [excuse.id]: e.target.value }))}
                                                className="rounded-xl font-medium min-h-[80px]"
                                            />
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => handleReview(excuse.id, 'approved')}
                                                    disabled={isProcessing}
                                                    className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[10px] gap-2"
                                                >
                                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                                    Approve
                                                </Button>
                                                <Button
                                                    onClick={() => handleReview(excuse.id, 'rejected')}
                                                    disabled={isProcessing}
                                                    variant="destructive"
                                                    className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2"
                                                >
                                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                                                    Reject
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setReviewingId(null)}
                                                    className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => setReviewingId(excuse.id)}
                                            variant="outline"
                                            className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Review This Excuse
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="border-none shadow-xl rounded-[2rem] bg-slate-50">
                    <CardContent className="p-10 text-center space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto" />
                        <h3 className="text-lg font-black text-slate-900 uppercase">All Clear</h3>
                        <p className="text-sm text-slate-500 font-medium">
                            No pending excuses to review. Students&apos; submissions will appear here.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
