"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getApplicantStatusData, confirmAcceptancePayment, finalizeStudentAdmission, initiateAcceptancePaymentCheckout, uploadApplicantDocument, initiateSchoolFeesCheckout, confirmSchoolFeesPayment, initiateProcessingFeeCheckout, confirmProcessingFeePayment } from "@/actions/admission_v2";
import { AlatpayInlineCheckout } from "@/components/finance/AlatpayInlineCheckout";
import { RemitaInlineCheckout } from "@/components/finance/RemitaInlineCheckout";
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
    const [checkoutPayload, setCheckoutPayload] = useState<any>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const verifyCallback = async () => {
            if (typeof window === 'undefined') return;
            const ref = new URLSearchParams(window.location.search).get('reference');
            if (ref && ref.startsWith('PROC-')) {
                setVerifying(true);
                toast.loading("Verifying your processing fee payment...", { id: "verify-proc" });
                const confirmRes = await confirmProcessingFeePayment(id, ref);
                if (confirmRes && confirmRes.success) {
                    toast.success(`Processing fee confirmed! Matriculation Number: ${confirmRes.matricNumber}`, { id: "verify-proc" });
                    // Remove reference from URL so it doesn't trigger again
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    toast.error(confirmRes?.error || "Failed to confirm processing fee payment.", { id: "verify-proc" });
                }
                setVerifying(false);
            }
        };

        const load = async () => {
            await verifyCallback();
            await fetchData();
        };
        load();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getApplicantStatusData(id);
        setData(res);
        setLoading(false);
    };

    const handleProcessingFeePayment = async () => {
        setLoading(true);
        const res = await initiateProcessingFeeCheckout(id);
        setLoading(false);
        if (res && res.success && res.authorizationUrl) {
            window.location.href = res.authorizationUrl;
        } else {
            toast.error(res?.error || "Failed to initiate processing fee payment");
        }
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
        setLoading(true);
        const res = await initiateAcceptancePaymentCheckout(id);
        setLoading(false);
        if (res && res.success) {
            setCheckoutPayload({ ...res, isSchoolFees: false });
        } else {
            toast.error(res?.error || "Failed to initiate payment");
        }
    };

    const handleSchoolFeesPayment = () => {
        setShowInvoiceModal(true);
    };

    const handleProceedToPaySchoolFees = async () => {
        setShowInvoiceModal(false);
        setLoading(true);
        const res = await initiateSchoolFeesCheckout(id);
        setLoading(false);
        if (res && res.success) {
            setCheckoutPayload({ ...res, isSchoolFees: true });
        } else {
            toast.error(res?.error || "Failed to initiate school fees payment");
        }
    };

    const handlePaymentSuccess = async () => {
        setVerifying(true);
        toast.loading("Verifying your payment, please wait...", { id: "verify-toast" });
        if (checkoutPayload?.isSchoolFees) {
            const res = await confirmSchoolFeesPayment(id, checkoutPayload.reference, checkoutPayload.rrr);
            setVerifying(false);
            setCheckoutPayload(null);
            if (res && res.success) {
                toast.success(`School fees confirmed! Please proceed to pay your processing fee.`, { id: "verify-toast" });
                fetchData();
            } else {
                toast.error(res?.error || "Failed to confirm school fees payment.", { id: "verify-toast" });
            }
        } else {
            const res = await confirmAcceptancePayment(id, checkoutPayload.reference);
            setVerifying(false);
            setCheckoutPayload(null);
            if (res && res.success) {
                toast.success("Acceptance fee confirmed! Admission Letter is now unlocked.", { id: "verify-toast" });
                fetchData();
            } else {
                toast.error(res?.error || "Failed to confirm payment.", { id: "verify-toast" });
            }
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!data) return <div className="min-h-screen flex justify-center items-center font-black text-2xl text-slate-300">Application Not Found</div>;

    const exam = data.template.exams?.[0];
    const result = data.results?.[0];
    const showResult = exam?.resultsReleased || (exam?.showResultsInstantly && result?.status === 'completed');

    // Unified screening engine: officer-uploaded Math + English scores live on
    // the application row itself. Shown to the applicant once results are released.
    const cutoffPercent = parseFloat(data.template?.cutoffPercent || '') || 40;
    const hasUploadedScores = data.mathScore !== null && data.mathScore !== undefined
        && data.screeningPercentage !== null && data.screeningPercentage !== undefined;
    const showScreeningScores = (!!exam?.resultsReleased || data.status === 'admitted' || data.status === 'rejected') && hasUploadedScores;
    const screeningPct = hasUploadedScores ? parseFloat(data.screeningPercentage) : null;
    const total200 = hasUploadedScores ? parseFloat(data.screeningScore) : null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {showInvoiceModal && (
                <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col space-y-6">
                        <div className="flex items-center gap-3 border-b pb-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Payment Invoice</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">School Fees</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4 py-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-500">Academic Session</span>
                                <span className="font-black text-slate-900">2026/2027</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-500">Student Name</span>
                                <span className="font-black text-slate-900">
                                    {(() => {
                                        const d = typeof data.data === 'string' ? JSON.parse(data.data || '{}') : (data.data || {});
                                        return data.applicant?.name || d.fullName || d.name || `${d.firstName || d.first_name || ''} ${d.lastName || d.last_name || d.surname || ''}`.trim() || 'Applicant';
                                    })()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-500">Fee Category</span>
                                <span className="font-black text-slate-900">Tuition</span>
                            </div>
                            <div className="pt-4 border-t flex justify-between items-center">
                                <span className="font-black text-slate-900 uppercase">Total Amount</span>
                                <span className="text-2xl font-black text-indigo-600">₦{(data.schoolFeesAmount || 68500).toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                className="w-full py-4 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProceedToPaySchoolFees}
                                className="w-full py-4 rounded-xl font-black text-sm bg-indigo-600 text-white shadow-xl hover:-translate-y-0.5 hover:shadow-indigo-500/25 transition-all flex justify-center items-center gap-2"
                            >
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {checkoutPayload && checkoutPayload.isSchoolFees && (
                <RemitaInlineCheckout
                    rrr={checkoutPayload.rrr}
                    amount={checkoutPayload.amount}
                    email={checkoutPayload.email}
                    firstName={checkoutPayload.firstName}
                    lastName={checkoutPayload.lastName}
                    onSuccess={handlePaymentSuccess}
                    onClose={() => setCheckoutPayload(null)}
                    onError={(err) => {
                        console.error(err);
                        toast.error("Payment failed or was cancelled.");
                        setCheckoutPayload(null);
                    }}
                />
            )}
            {checkoutPayload && !checkoutPayload.isSchoolFees && (
                <AlatpayInlineCheckout
                    targetBusinessId={checkoutPayload.targetBusinessId}
                    publicKey={checkoutPayload.publicKey}
                    reference={checkoutPayload.reference}
                    amount={checkoutPayload.amount}
                    email={checkoutPayload.email}
                    firstName={checkoutPayload.firstName}
                    lastName={checkoutPayload.lastName}
                    phone={checkoutPayload.phone}
                    description={checkoutPayload.description}
                    onSuccess={handlePaymentSuccess}
                    onClose={() => setCheckoutPayload(null)}
                    onError={(err) => {
                        console.error(err);
                        toast.error("Payment failed or was cancelled.");
                        setCheckoutPayload(null);
                    }}
                />
            )}
            {/* Header */}
            <div className={cn(
                "py-10 sm:py-20 px-4 sm:px-8 text-white transition-colors duration-1000",
                data.status === 'admitted' ? "bg-emerald-600" : 
                data.status === 'rejected' ? "bg-rose-600" : "bg-slate-900"
            )}>
                <div className="max-w-4xl mx-auto space-y-4">
                    <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic">
                        Admission Status Portal
                    </span>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic uppercase leading-tight">
                        {data.status === 'admitted' ? "Congratulations!" : 
                         data.status === 'rejected' ? "Intake Decision" : "Application Status"}
                    </h1>
                    <p className="text-white/60 font-bold uppercase tracking-widest text-xs max-w-2xl leading-relaxed">
                        Track your academic journey and manage your admission requirements here.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto -mt-6 sm:-mt-10 px-4 sm:px-8 space-y-8">
                {/* Decision Card */}
                <Card className="border-none shadow-2xl rounded-3xl sm:rounded-[3rem] overflow-hidden bg-white">
                    <CardContent className="p-6 sm:p-8 md:p-12">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center text-center md:text-left">
                            <div className={cn(
                                "w-20 h-20 sm:w-32 sm:h-32 rounded-[2.5rem] flex items-center justify-center shrink-0 shadow-2xl",
                                data.status === 'admitted' ? "bg-emerald-100 text-emerald-600" : 
                                data.status === 'rejected' ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400"
                            )}>
                                {data.status === 'admitted' ? <GraduationCap className="w-10 h-10 sm:w-16 sm:h-16" /> : 
                                 data.status === 'rejected' ? <XCircle className="w-10 h-10 sm:w-16 sm:h-16" /> : <Clock className="w-10 h-10 sm:w-16 sm:h-16" />}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                                        <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-slate-900 italic uppercase">
                                            {data.status === 'admitted' && data.acceptancePaymentStatus === 'paid' ? "Admission Confirmed" : 
                                             data.status === 'admitted' ? "Provisional Admission Offered" : 
                                             data.status === 'rejected' ? "Admission Denied" : "Application Status: Pending"}
                                        </h2>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider italic border",
                                            data.applicationMode === 'part_time' 
                                                ? "bg-amber-50 text-amber-600 border-amber-200" 
                                                : "bg-indigo-50 text-indigo-600 border-indigo-200"
                                        )}>
                                            Mode: {data.applicationMode ? data.applicationMode.replace('_', '-').toUpperCase() : 'FULL-TIME'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">
                                        Ref: #{data.id.toString().padStart(6, '0')} • {data.template.name}
                                    </p>
                                </div>
                                
                                {data.applicationMode === 'part_time' && (
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-center text-amber-700">
                                        <Info className="w-5 h-5 shrink-0" />
                                        <p className="text-[11px] font-bold italic">
                                            You are currently placed on <strong>Part-Time</strong> study mode. Once all full-time entry conditions are met, your study mode can be upgraded to Full-Time by the Admission Officer.
                                        </p>
                                    </div>
                                )}
                                
                                {data.admissionNotes && (
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                                        <Info className="w-5 h-5 text-slate-400 shrink-0" />
                                        <p className="text-xs font-bold text-slate-500 leading-relaxed italic">{data.admissionNotes}</p>
                                    </div>
                                )}

                                {data.status === 'admitted' && (
                                    <div className="flex flex-col sm:flex-wrap gap-3 sm:gap-4 pt-4">
                                        {data.admissionNotes?.includes('Matric Number') ? (
                                            <Button 
                                                onClick={() => window.open(`/admission/letter/${id}`, '_blank')}
                                                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 sm:px-8 py-4 sm:py-6 flex gap-3 uppercase text-xs tracking-widest shadow-xl shadow-emerald-100"
                                            >
                                                <Download className="w-5 h-5" /> Download Official Admission Letter
                                            </Button>
                                        ) : (
                                            <Button 
                                                disabled
                                                className="rounded-2xl bg-slate-200 text-slate-400 font-black px-5 sm:px-8 py-4 sm:py-6 flex gap-3 uppercase text-xs tracking-widest cursor-not-allowed opacity-60"
                                            >
                                                <Download className="w-5 h-5 text-slate-300" /> Letter Locked (Pay School Fees to Unlock)
                                            </Button>
                                        )}
                                        {data.template.requireAcceptanceFee && data.acceptancePaymentStatus !== 'paid' && (
                                            <Button 
                                                onClick={handleAcceptancePayment}
                                                className="rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black px-5 sm:px-8 py-4 sm:py-6 flex gap-3 uppercase text-xs tracking-widest shadow-xl"
                                            >
                                                <CreditCard className="w-5 h-5 text-emerald-400" /> Pay Acceptance & ID Card Fee (₦{(parseFloat(data.template.acceptanceFee) + parseFloat(data.template.idCardFee || "0")).toLocaleString()})
                                            </Button>
                                        )}

                                        {(!data.template.requireAcceptanceFee || data.acceptancePaymentStatus === 'paid') && !data.admissionNotes?.includes('Matric Number') && (
                                            <div className="flex flex-col gap-4">
                                                <div className="px-6 py-4 bg-emerald-50 rounded-2xl flex items-center gap-3 text-emerald-600 font-black uppercase text-[10px] tracking-widest italic">
                                                    <CheckCircle2 className="w-4 h-4" /> {data.template.requireAcceptanceFee ? 'Acceptance & ID Card Fee Paid — Status: Confirmed Admitted' : 'Admitted — Acceptance Fee Not Required'}
                                                </div>
                                                
                                                {!data.hasPaidSchoolFees ? (
                                                    <Button 
                                                        onClick={handleSchoolFeesPayment}
                                                        className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 sm:px-8 py-4 sm:py-6 flex gap-3 uppercase text-xs tracking-widest shadow-xl shadow-indigo-100"
                                                    >
                                                        <CreditCard className="w-5 h-5" /> Pay School Fees (Remita)
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        onClick={handleProcessingFeePayment}
                                                        className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black px-5 sm:px-8 py-4 sm:py-6 flex gap-3 uppercase text-xs tracking-widest shadow-xl"
                                                    >
                                                        <CreditCard className="w-5 h-5 text-emerald-400" /> Pay Processing Fee (Paystack) to Obtain Matric Number
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {data.admissionNotes?.includes('Matric Number') && (
                                            <div className="px-6 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 font-black uppercase text-[10px] tracking-widest italic shadow-sm">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Admission Confirmed & Registered — Matric Number Assigned
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Screening / CBT Results Section */}
                <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white">
                    <CardHeader className="bg-slate-900 text-white p-10 flex flex-row justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <Trophy className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black italic uppercase">Entrance Examination Results</CardTitle>
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Mathematics & English Language • Pass Mark Cut-off: {cutoffPercent}%</p>
                            </div>
                        </div>
                        {showResult && (
                            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl px-4 py-2 flex gap-2" onClick={() => window.print()}>
                                <Printer className="w-4 h-4" /> Print Result
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-10">
                        {showScreeningScores ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 text-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Combined Score</p>
                                    <h4 className="text-5xl font-black text-indigo-900 italic">{total200}<span className="text-lg text-indigo-400">/200</span></h4>
                                </div>
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Percentage</p>
                                    <h4 className={`text-5xl font-black italic ${screeningPct !== null && screeningPct >= cutoffPercent ? 'text-emerald-600' : 'text-rose-500'}`}>{screeningPct}%</h4>
                                </div>
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Eligibility Status</p>
                                    {screeningPct !== null && screeningPct >= cutoffPercent ? (
                                        <h4 className="text-sm font-black text-emerald-600 uppercase italic mt-4 flex items-center justify-center gap-2 bg-emerald-50 py-2 px-4 rounded-xl border border-emerald-200">
                                            <CheckCircle2 className="w-5 h-5" /> Passed (≥{cutoffPercent}%)
                                        </h4>
                                    ) : (
                                        <h4 className="text-sm font-black text-rose-600 uppercase italic mt-4 flex items-center justify-center gap-2 bg-rose-50 py-2 px-4 rounded-xl border border-rose-200">
                                            <XCircle className="w-5 h-5" /> Below Cut-off (&lt;{cutoffPercent}%)
                                        </h4>
                                    )}
                                </div>
                                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-2xl p-6 flex justify-between items-center hover:bg-indigo-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                                            <span className="text-sm font-black text-slate-700 uppercase italic">Mathematics</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-900 italic">{parseFloat(data.mathScore).toFixed(1)} / 100</span>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-6 flex justify-between items-center hover:bg-indigo-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                                            <span className="text-sm font-black text-slate-700 uppercase italic">English Language</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-900 italic">{parseFloat(data.englishScore).toFixed(1)} / 100</span>
                                    </div>
                                </div>
                            </div>
                        ) : showResult ? (
                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 text-center space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total Exam Score</p>
                                        <h4 className="text-5xl font-black text-indigo-900 italic">{parseFloat(result.totalScore).toFixed(1)}%</h4>
                                    </div>
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exam Pass Cut-off</p>
                                        <h4 className="text-xl font-black text-slate-700 italic mt-2">{cutoffPercent.toFixed(1)}% Minimum</h4>
                                    </div>
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Eligibility Status</p>
                                        {parseFloat(result.totalScore) >= cutoffPercent ? (
                                            <h4 className="text-sm font-black text-emerald-600 uppercase italic mt-4 flex items-center justify-center gap-2 bg-emerald-50 py-2 px-4 rounded-xl border border-emerald-200">
                                                <CheckCircle2 className="w-5 h-5" /> Eligible (Passed ≥{cutoffPercent}%)
                                            </h4>
                                        ) : (
                                            <h4 className="text-sm font-black text-rose-600 uppercase italic mt-4 flex items-center justify-center gap-2 bg-rose-50 py-2 px-4 rounded-xl border border-rose-200">
                                                <XCircle className="w-5 h-5" /> Not Eligible (&lt;{cutoffPercent}% Cutoff)
                                            </h4>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 italic">Subject Performance Breakdown</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 rounded-2xl p-6 flex justify-between items-center group hover:bg-indigo-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                                                <span className="text-sm font-black text-slate-700 uppercase italic">Mathematics</span>
                                            </div>
                                            <span className="text-lg font-black text-slate-900 italic">
                                                {parseFloat(JSON.parse(result.subjectScores || "{}")['math'] || JSON.parse(result.subjectScores || "{}")['1'] || (parseFloat(result.totalScore) * 0.5)).toFixed(1)} / 50
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-6 flex justify-between items-center group hover:bg-indigo-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                                                <span className="text-sm font-black text-slate-700 uppercase italic">English Language</span>
                                            </div>
                                            <span className="text-lg font-black text-slate-900 italic">
                                                {parseFloat(JSON.parse(result.subjectScores || "{}")['english'] || JSON.parse(result.subjectScores || "{}")['2'] || (parseFloat(result.totalScore) * 0.5)).toFixed(1)} / 50
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-16 text-center space-y-6">
                                <div className="p-8 bg-slate-50 rounded-[3rem] w-fit mx-auto">
                                    <Clock className="w-16 h-16 text-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-slate-300 italic uppercase">Entrance Examination Scores Pending</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                        Examination scores for Mathematics and English Language are being compiled.<br />
                                        Applicants scoring {cutoffPercent}% and above will be recommended for Full-Time / Part-Time admission.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Mandatory Post-Admission Documents Upload Card */}
                {data.status === 'admitted' && (
                    <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white">
                        <CardHeader className="bg-emerald-950 text-white p-10 flex flex-row justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
                                    <GraduationCap className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black italic uppercase text-emerald-400">Post-Admission Document Upload Console</CardTitle>
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Required Credentials Verification</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 space-y-6">
                            <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                                All admitted candidates are required to upload legible PDF/Image copies of the following 3 documents before final clearance:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { key: 'birthCertificate', label: '1. Birth Certificate', desc: 'Official Birth Certificate or Declaration of Age' },
                                    { key: 'olevelResult', label: '2. O-Level Results', desc: 'WAEC / NECO / NABTEB Statement of Result' },
                                    { key: 'jambResult', label: '3. JAMB Result', desc: 'Official UTME / Direct Entry JAMB Result Slip' },
                                ].map((doc) => {
                                    const appDataJson = typeof data.data === 'string' ? JSON.parse(data.data || '{}') : (data.data || {});
                                    const isUploaded = !!appDataJson.uploadedDocuments?.[doc.key];
                                    return (
                                        <div key={doc.key} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 flex flex-col justify-between">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-slate-900 uppercase italic">{doc.label}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.desc}</p>
                                            </div>
                                            {isUploaded ? (
                                                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-700 text-xs font-black uppercase tracking-wider italic">
                                                    <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Uploaded</span>
                                                    <a href={appDataJson.uploadedDocuments[doc.key]} target="_blank" rel="noreferrer" className="text-[10px] underline">View</a>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-4 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest transition-colors">
                                                    <Download className="w-4 h-4 rotate-180" /> Upload File
                                                    <input 
                                                        type="file" 
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        className="hidden" 
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            toast.loading(`Uploading ${doc.label}...`, { id: `upload-${doc.key}` });
                                                            try {
                                                                const formData = new FormData();
                                                                formData.append('file', file);
                                                                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                                                                const uploadJson = await uploadRes.json();
                                                                if (uploadJson.url) {
                                                                    const saveRes = await uploadApplicantDocument(id, doc.key as any, uploadJson.url);
                                                                    if (saveRes.success) {
                                                                        toast.success(`${doc.label} uploaded successfully!`, { id: `upload-${doc.key}` });
                                                                        fetchData();
                                                                    } else {
                                                                        toast.error(saveRes.error || "Failed to save document link", { id: `upload-${doc.key}` });
                                                                    }
                                                                } else {
                                                                    toast.error("File upload failed", { id: `upload-${doc.key}` });
                                                                }
                                                            } catch (err: any) {
                                                                toast.error(err.message || "Upload error", { id: `upload-${doc.key}` });
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

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