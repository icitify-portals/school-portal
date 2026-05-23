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
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 text-center max-w-md">
                    <p className="text-red-500 font-bold mb-4">Record not found or access denied.</p>
                    <Button onClick={() => router.back()} variant="outline" className="rounded-xl">Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-[210mm] mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="hover:bg-white rounded-xl font-bold text-xs uppercase tracking-widest gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Portal
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => window.print()}
                            variant="outline"
                            className="bg-white border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Quick Print
                        </Button>
                        <TranscriptDownloader
                            fileName={`Transcript_${transcriptData.student.matricNumber.replace(/\//g, '_')}`}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 no-print">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 leading-none mb-1">Official Transcript Processing</h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                            Registry Verified Record for {transcriptData.student.name}
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
