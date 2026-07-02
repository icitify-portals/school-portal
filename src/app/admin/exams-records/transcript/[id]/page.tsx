"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, FileText, Printer, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { getTranscriptAction } from "@/actions/transcripts";
import { toast } from "sonner";
import { TranscriptDownloader } from "@/components/academics/TranscriptDownloader";
import { TranscriptVisual } from "@/components/academics/TranscriptVisual";

export default function ExamsRecordsTranscriptPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const studentId = params.id ? parseInt(params.id) : 0;
    const [transcriptData, setTranscriptData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTranscript();
    }, [studentId]);

    const fetchTranscript = async () => {
        setLoading(true);
        const res = await getTranscriptAction(studentId);
        if (res.success) {
            setTranscriptData(res.data);
        } else {
            toast.error(res.error || "Failed to fetch transcript");
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4 opacity-20" />
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Accessing Official Registry...</p>
            </div>
        );
    }

    if (!transcriptData) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center max-w-md">
                    <p className="text-red-500 font-bold mb-4">Record not found or access denied.</p>
                    <Button onClick={() => router.back()} variant="outline" className="rounded-xl">Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50">
            <div className="max-w-[210mm] mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print bg-slate-900 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 mix-blend-overlay" />
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest gap-2 relative z-10 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Portal
                    </Button>

                    <div className="flex items-center gap-3 relative z-10">
                        <Button
                            onClick={() => window.print()}
                            variant="outline"
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 gap-2 transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            Quick Print
                        </Button>
                        <div className="bg-emerald-600 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20">
                            <TranscriptDownloader
                                fileName={`Transcript_${transcriptData.student.matricNumber.replace(/\//g, '_')}`}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-3xl p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/40 flex items-center gap-6 no-print">
                    <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center shadow-inner border border-emerald-100">
                        <ShieldCheck className="w-8 h-8 text-emerald-600 drop-shadow-sm" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1.5 drop-shadow-sm">Official Transcript Processing</h1>
                        <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50 inline-block px-3 py-1 rounded-lg border border-emerald-100/50">
                            Registry Verified Record for <span className="text-slate-700">{transcriptData.student.name}</span>
                        </p>
                    </div>
                </div>

                <div className="overflow-visible">
                    <TranscriptVisual
                        data={transcriptData}
                    // Note: onEditResult is omitted to ensure Read-Only access as per unit requirements
                    />
                </div>
            </div>
        </div>
    );
}
