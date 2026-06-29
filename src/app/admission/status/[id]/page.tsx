"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getApplicantStatusData, confirmAcceptancePayment, finalizeStudentAdmission } from "@/actions/admission_v2";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Trophy, 
    GraduationCap, 
    AlertCircle, 
    CheckCircle2, 
    Printer, 
    Download, 
    CreditCard,
    Loader2,
    Calendar,
    ChevronRight,
    XCircle,
    Info,
    Clock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ApplicantStatusPage() {
    const params = useParams();
    const id = parseInt(params.id as string);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getApplicantStatusData(id);
        setData(res);
        setLoading(false);
    };

    const handleAcceptAdmission = async () => {
        if (!confirm("Are you sure you want to accept this admission? This will finalize your enrollment.")) return;
        setLoading(true);
        const res = await finalizeStudentAdmission(id);
        if (res.success) {
            toast.success(`Welcome! Your Matric Number is ${res.matricNumber}`);
            fetchData();
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    const handleAcceptancePayment = async () => {
        const ref = prompt("Enter Acceptance Fee Payment Reference:");
        if (!ref) return;
        const res = await confirmAcceptancePayment(id, ref);
        if (res && res.success) {
            toast.success("Acceptance fee confirmed! Welcome to the school.");
            fetchData();
        } else {
            toast.error(res?.error || "Failed to confirm payment");
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!data) return <div className="min-h-screen flex justify-center items-center font-black text-2xl text-slate-300">Application Not Found</div>;

    const exam = data.template.exams?.[0];
    const result = data.results?.[0];
    const showResult = exam?.resultsReleased || (exam?.showResultsInstantly && result?.status === 'completed');

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className={cn(
                "py-20 px-8 text-white transition-colors duration-1000",
                data.status === 'admitted' ? "bg-emerald-600" : 
                data.status === 'rejected' ? "bg-rose-600" : "bg-slate-900"
            )}>
                <div className="max-w-4xl mx-auto space-y-4">
                    <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic">
                        Admission Status Portal
                    </span>
                    <h1 className="text-6xl font-black italic uppercase leading-tight">
                        {data.status === 'admitted' ? "Congratulations!" : 
                         data.status === 'rejected' ? "Intake Decision" : "Application Status"}
                    </h1>
                    <p className="text-white/60 font-bold uppercase tracking-widest text-xs max-w-2xl leading-relaxed">
                        Track your academic journey and manage your admission requirements here.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto -mt-10 px-8 space-y-8">
                {/* Decision Card */}
                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    <CardContent className="p-12">
                        <div className="flex flex-col md:flex-row gap-10 items-center text-center md:text-left">
                            <div className={cn(
                                "w-32 h-32 rounded-[2.5rem] flex items-center justify-center shrink-0 shadow-2xl",
                                data.status === 'admitted' ? "bg-emerald-100 text-emerald-600" : 
                                data.status === 'rejected' ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400"
                            )}>
                                {data.status === 'admitted' ? <GraduationCap className="w-16 h-16" /> : 
                                 data.status === 'rejected' ? <XCircle className="w-16 h-16" /> : <Clock className="w-16 h-16" />}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <h2 className="text-4xl font-black text-slate-900 italic uppercase">
                                        {data.status === 'admitted' ? "Admission Granted" : 
                                         data.status === 'rejected' ? "Admission Denied" : "Processing Status"}
                                    </h2>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">
                                        Ref: #{data.id.toString().padStart(6, '0')} • {data.template.name}
                                    </p>
                                </div>
                                
                                {data.admissionNotes && (
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                                        <Info className="w-5 h-5 text-slate-400 shrink-0" />
                                        <p className="text-xs font-bold text-slate-500 leading-relaxed italic">{data.admissionNotes}</p>
                                    </div>
                                )}

                                {data.status === 'admitted' && (
                                    <div className="flex flex-wrap gap-4 pt-4">
                                        {(!data.template.requireAcceptanceFee || data.acceptancePaymentStatus === 'paid') ? (
                                            <Button 
                                                onClick={() => window.open(`/admission/letter/${id}`, '_blank')}
                                                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-6 flex gap-3 uppercase text-xs tracking-widest shadow-xl shadow-emerald-100"
                                            >
                                                <Download className="w-5 h-5" /> Download Admission Letter
                                            </Button>
                                        ) : (
                                            <Button 
                                                disabled
                                                className="rounded-2xl bg-slate-200 text-slate-400 font-black px-8 py-6 flex gap-3 uppercase text-xs tracking-widest cursor-not-allowed opacity-60"
                                            >
                                                <Download className="w-5 h-5 text-slate-300" /> Letter Locked (Acceptance Fee Required)
                                            </Button>
                                        )}
                                        {data.template.requireAcceptanceFee && data.acceptancePaymentStatus !== 'paid' ? (
                                            <Button 
                                                onClick={handleAcceptancePayment}
                                                className="rounded-2xl bg-slate-900 text-white font-black px-8 py-6 flex gap-3 uppercase text-xs tracking-widest shadow-xl"
                                            >
                                                // @ts-expect-error - TS2304: Auto-suppressed for build
                                                <CreditCard className="w-5 h-5" /> Pay Acceptance Fee ({settings?.base_currency || '₦'}{parseFloat(data.template.acceptanceFee).toLocaleString()})
                                            </Button>
                                        ) : data.template.requireAcceptanceFee && data.acceptancePaymentStatus === 'paid' && !data.admissionNotes?.includes('Matric Number') ? (
                                            <div className="flex flex-col gap-4">
                                                <div className="px-6 py-4 bg-emerald-50 rounded-2xl flex items-center gap-3 text-emerald-600 font-black uppercase text-[10px] tracking-widest italic">
                                                    <CheckCircle2 className="w-4 h-4" /> Acceptance Fee Paid
                                                </div>
                                                <Button 
                                                    onClick={handleAcceptAdmission}
                                                    className="rounded-2xl bg-slate-900 text-white font-black px-8 py-6 flex gap-3 uppercase text-xs tracking-widest shadow-xl animate-bounce"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" /> Accept Admission & Finalize Registration
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="px-6 py-4 bg-emerald-50 rounded-2xl flex items-center gap-3 text-emerald-600 font-black uppercase text-[10px] tracking-widest italic">
                                                <CheckCircle2 className="w-4 h-4" /> Admission Accepted & Registered
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CBT Results Section */}
                <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white">
                    <CardHeader className="bg-slate-900 text-white p-10 flex flex-row justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <Trophy className="w-6 h-6 text-indigo-400" />
                            </div>
                            <CardTitle className="text-xl font-black italic uppercase">CBT Entrance Results</CardTitle>
                        </div>
                        {showResult && (
                            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl px-4 py-2 flex gap-2">
                                <Printer className="w-4 h-4" /> Print Result
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-10">
                        {showResult ? (
                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 text-center space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total Score</p>
                                        <h4 className="text-5xl font-black text-indigo-900 italic">{parseFloat(result.totalScore).toFixed(1)}</h4>
                                    </div>
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completion Time</p>
                                        <h4 className="text-2xl font-black text-slate-700 italic mt-2">
                                            {result.endTime ? format(new Date(result.endTime), 'hh:mm a') : 'N/A'}
                                        </h4>
                                    </div>
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                                        <h4 className="text-sm font-black text-emerald-600 uppercase italic mt-4 flex items-center justify-center gap-2">
                                            <CheckCircle2 className="w-5 h-5" /> {result.status}
                                        </h4>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 italic">Subject Performance Breakdown</h5>
                                    <div className="grid grid-cols-1 gap-4">
                                        {Object.entries(JSON.parse(result.subjectScores || "{}")).map(([subjectId, score]: [string, any]) => (
                                            <div key={subjectId} className="bg-slate-50 rounded-2xl p-6 flex justify-between items-center group hover:bg-indigo-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-2 h-8 bg-indigo-200 rounded-full group-hover:bg-indigo-500 transition-colors" />
                                                    <span className="text-sm font-black text-slate-700 uppercase italic">Subject ID: {subjectId}</span>
                                                </div>
                                                <span className="text-lg font-black text-slate-900 italic">{parseFloat(score).toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center space-y-6">
                                <div className="p-8 bg-slate-50 rounded-[3rem] w-fit mx-auto">
                                    <Clock className="w-16 h-16 text-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-slate-300 italic uppercase">Results Pending</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                        The examination board is currently reviewing the scores. <br />
                                        Please check back later once the results are formally released.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Secure Badge */}
                <div className="flex justify-center items-center gap-6 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <div className="h-[1px] w-12 bg-slate-300" />
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Decision Portal</span>
                    </div>
                    <div className="h-[1px] w-12 bg-slate-300" />
                </div>
            </div>
        </div>
    );
}
