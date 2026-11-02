"use client";

import React, { useState, useEffect } from "react";
import { submitTranscriptApplication, getTranscriptFees, checkStudentGraduationClearance } from "@/actions/transcript-requests";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Send, Building, AlertTriangle, CheckCircle2, CheckSquare, Square, Layers, ListChecks, Check } from "lucide-react";
import Link from "next/link";

export default function TranscriptApplicationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [fees, setFees] = useState({ transcriptFee: 15000, incidentalFee: 5500, processingFee: 3000 });
    const [paymentMode, setPaymentMode] = useState<'all' | 'individual'>('all');
    const [selectedFeeKeys, setSelectedFeeKeys] = useState<string[]>(['transcript', 'incidental', 'processing']);
    
    const [clearanceChecking, setClearanceChecking] = useState(false);
    const [clearanceInfo, setClearanceInfo] = useState<{
        isGraduant: boolean;
        isCleared: boolean;
        totalOwed?: number;
        message?: string;
    } | null>(null);

    useEffect(() => {
        getTranscriptFees().then(setFees);
    }, []);
    
    const [formData, setFormData] = useState({
        applicantName: "",
        matricNumber: "",
        applicantEmail: "",
        applicantPhone: "",
        destinationName: "",
        destinationAddress: "",
        deliveryMethod: "email" as "email" | "courier" | "pickup"
    });

    const activeKeys = paymentMode === 'all' ? ['transcript', 'incidental', 'processing'] : selectedFeeKeys;
    const isTranscriptSelected = activeKeys.includes('transcript');
    const isIncidentalSelected = activeKeys.includes('incidental');
    const isProcessingSelected = activeKeys.includes('processing');

    const totalPayable = (isTranscriptSelected ? fees.transcriptFee : 0) +
        (isIncidentalSelected ? (fees.incidentalFee || 5500) : 0) +
        (isProcessingSelected ? fees.processingFee : 0);

    const toggleFeeKey = (key: string) => {
        setSelectedFeeKeys(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleMatricBlur = async () => {
        const matric = formData.matricNumber.trim();
        if (!matric || matric.length < 5) return;
        setClearanceChecking(true);
        try {
            const res = await checkStudentGraduationClearance(matric);
            if (res.success && res.found) {
                setClearanceInfo({
                    isGraduant: !!res.isGraduant,
                    isCleared: !!res.isCleared,
                    totalOwed: res.totalOwed,
                    message: res.message
                });
                if (res.studentName && !formData.applicantName) {
                    setFormData(prev => ({ ...prev, applicantName: res.studentName || prev.applicantName }));
                }
            } else {
                setClearanceInfo(null);
            }
        } catch (err) {
            console.error("Clearance check error:", err);
        } finally {
            setClearanceChecking(false);
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (paymentMode === 'individual' && activeKeys.length === 0) {
            setError("Please select at least one fee item to proceed with payment.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await submitTranscriptApplication({
                ...formData,
                selectedItems: activeKeys
            });
            if (res.success && res.url) {
                // Redirect to Alatpay/Paystack checkout
                router.push(res.url);
            } else {
                setError(res.error || "Application failed. Please try again.");
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-slate-900 text-white p-6 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="text-indigo-400 w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-wide">Transcript Application</h1>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">Official Academic Records</p>
                        </div>
                    </div>
                    <Link href="/" className="text-sm font-medium hover:text-indigo-300">Back to Portal</Link>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Apply for Official Transcript</h2>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Matriculation Number</label>
                                <div className="relative">
                                    <input 
                                        required 
                                        type="text" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase" 
                                        value={formData.matricNumber} 
                                        onChange={e => setFormData({...formData, matricNumber: e.target.value.toUpperCase()})} 
                                        onBlur={handleMatricBlur}
                                        placeholder="e.g. BAM/FSS/IB/2023/10929" 
                                    />
                                    {clearanceChecking && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-slate-400">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Verifying...</span>
                                        </div>
                                    )}
                                </div>
                                {clearanceInfo?.isGraduant && (
                                    <div className="mt-2">
                                        {clearanceInfo.isCleared ? (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                <span>Graduation Clearance Status: Cleared</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                                    <span>Compulsory Graduation Clearance Required</span>
                                                </div>
                                                <p className="text-[11px] text-rose-600">
                                                    Outstanding: <strong>₦{clearanceInfo.totalOwed?.toLocaleString()}</strong> (Convocation, Certificate & Incidental Fee).
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                <input required type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.applicantEmail} onChange={e => setFormData({...formData, applicantEmail: e.target.value})} placeholder="e.g. john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.applicantPhone} onChange={e => setFormData({...formData, applicantPhone: e.target.value})} placeholder="e.g. 08012345678" />
                            </div>
                        </div>

                        {clearanceInfo?.isGraduant && !clearanceInfo.isCleared && (
                            <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm sm:text-base">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <span>Compulsory Graduation Fees Must Be Settled</span>
                                </div>
                                <p className="text-xs sm:text-sm text-amber-800">
                                    Our records show outstanding graduation fees totaling <strong>₦{clearanceInfo.totalOwed?.toLocaleString()}</strong> for Convocation, Certificate, and Incidental Fee. All graduants must be financially cleared before their transcript can be approved and dispatched.
                                </p>
                                <div className="pt-2 flex flex-wrap gap-2">
                                    <Link 
                                        href="/login" 
                                        target="_blank"
                                        className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
                                    >
                                        Log In to Pay Graduation Fees →
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-slate-200 pt-6 mt-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <Building className="w-5 h-5 text-indigo-500" /> Destination Details
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Receiving Institution / Company Name</label>
                                    <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.destinationName} onChange={e => setFormData({...formData, destinationName: e.target.value})} placeholder="e.g. University of Lagos" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Destination Address or Email</label>
                                    <textarea required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]" value={formData.destinationAddress} onChange={e => setFormData({...formData, destinationAddress: e.target.value})} placeholder="Provide the exact physical address or the official receiving email address..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Delivery Method</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.deliveryMethod} onChange={e => setFormData({...formData, deliveryMethod: e.target.value as any})}>
                                        <option value="email">Electronic Email Delivery</option>
                                        <option value="courier">Physical Courier Dispatch</option>
                                        <option value="pickup">Self Pickup</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Payment Options: Pay All vs Pay Individual */}
                        <div className="bg-gradient-to-br from-indigo-50/90 to-slate-50 border border-indigo-100 p-6 md:p-8 rounded-3xl flex flex-col gap-6 mt-8 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-100 pb-5">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-indigo-600" />
                                        Payment Method & Fee Options
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Choose whether to pay all associated fees at once or select specific individual items to settle now.
                                    </p>
                                </div>

                                {/* Toggle Buttons */}
                                <div className="inline-flex p-1 bg-white border border-indigo-200/80 rounded-2xl shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaymentMode('all');
                                            setSelectedFeeKeys(['transcript', 'incidental', 'processing']);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            paymentMode === 'all'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Pay All Fees
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMode('individual')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            paymentMode === 'individual'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <ListChecks className="w-3.5 h-3.5" />
                                        Pay Individual Items
                                    </button>
                                </div>
                            </div>

                            {paymentMode === 'individual' && (
                                <div className="flex items-center justify-between bg-indigo-100/50 px-4 py-2.5 rounded-xl border border-indigo-200/60 text-xs">
                                    <span className="text-indigo-900 font-medium">
                                        Click any item below to check/uncheck it for payment.
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFeeKeys(['transcript', 'incidental', 'processing'])}
                                            className="text-[11px] font-bold text-indigo-700 hover:underline"
                                        >
                                            Select All
                                        </button>
                                        <span className="text-indigo-300">|</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFeeKeys([])}
                                            className="text-[11px] font-bold text-indigo-700 hover:underline"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Fee Item Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Item 1: Transcript Fee */}
                                <div
                                    onClick={() => paymentMode === 'individual' && toggleFeeKey('transcript')}
                                    className={`relative p-4 rounded-2xl border transition-all ${
                                        paymentMode === 'individual' ? 'cursor-pointer' : 'cursor-default'
                                    } ${
                                        isTranscriptSelected
                                            ? 'bg-white border-indigo-400 shadow-sm ring-2 ring-indigo-500/10'
                                            : 'bg-white/50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            {paymentMode === 'individual' ? (
                                                isTranscriptSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                                                )
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                                                    ✓
                                                </div>
                                            )}
                                            <h4 className="font-bold text-sm text-slate-800">Transcript Fee</h4>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">
                                            ₦{fees.transcriptFee.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed pl-7">
                                        Official student academic record search, compilation, and transcript issuance fee.
                                    </p>
                                </div>

                                {/* Item 2: Incidental Fee */}
                                <div
                                    onClick={() => paymentMode === 'individual' && toggleFeeKey('incidental')}
                                    className={`relative p-4 rounded-2xl border transition-all ${
                                        paymentMode === 'individual' ? 'cursor-pointer' : 'cursor-default'
                                    } ${
                                        isIncidentalSelected
                                            ? 'bg-white border-indigo-400 shadow-sm ring-2 ring-indigo-500/10'
                                            : 'bg-white/50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            {paymentMode === 'individual' ? (
                                                isIncidentalSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                                                )
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                                                    ✓
                                                </div>
                                            )}
                                            <h4 className="font-bold text-sm text-slate-800">Incidental Fee</h4>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">
                                            ₦{(fees.incidentalFee || 5500).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed pl-7">
                                        Statutory institutional clearance fee. Can be deselected if already settled previously.
                                    </p>
                                </div>

                                {/* Item 3: Processing Fee */}
                                <div
                                    onClick={() => paymentMode === 'individual' && toggleFeeKey('processing')}
                                    className={`relative p-4 rounded-2xl border transition-all ${
                                        paymentMode === 'individual' ? 'cursor-pointer' : 'cursor-default'
                                    } ${
                                        isProcessingSelected
                                            ? 'bg-white border-indigo-400 shadow-sm ring-2 ring-indigo-500/10'
                                            : 'bg-white/50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            {paymentMode === 'individual' ? (
                                                isProcessingSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                                                )
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                                                    ✓
                                                </div>
                                            )}
                                            <h4 className="font-bold text-sm text-slate-800">Processing Fee</h4>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">
                                            ₦{fees.processingFee.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed pl-7">
                                        Online transaction gateway verification, automated processing, and support levy.
                                    </p>
                                </div>
                            </div>

                            {paymentMode === 'individual' && activeKeys.length === 0 && (
                                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                                    <span>Please select at least one fee item to proceed with payment.</span>
                                </div>
                            )}

                            {/* Summary & Checkout Action */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-indigo-200/60">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-indigo-800 font-bold uppercase tracking-wider">
                                            {paymentMode === 'all'
                                                ? 'Total Amount (All Items Included)'
                                                : `Selected Items Total (${activeKeys.length} of 3 items)`}
                                        </p>
                                        {paymentMode === 'all' && (
                                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                                                Full Package
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-3xl font-black text-indigo-950 mt-1">
                                        {totalPayable === 0 ? "Free / Waived" : `₦${totalPayable.toLocaleString()}`}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                                        {activeKeys.length === 0
                                            ? "No items currently selected."
                                            : [
                                                  isTranscriptSelected && `Transcript (₦${fees.transcriptFee.toLocaleString()})`,
                                                  isIncidentalSelected && `Incidental (₦${(fees.incidentalFee || 5500).toLocaleString()})`,
                                                  isProcessingSelected && `Processing (₦${fees.processingFee.toLocaleString()})`
                                              ]
                                                  .filter(Boolean)
                                                  .join(" + ")}
                                    </p>
                                </div>

                                <button 
                                    disabled={loading || (clearanceInfo?.isGraduant && !clearanceInfo.isCleared) || (paymentMode === 'individual' && activeKeys.length === 0)} 
                                    type="submit" 
                                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                    {totalPayable === 0
                                        ? "Submit Application (Free)"
                                        : paymentMode === 'all'
                                        ? `Proceed to Pay All (₦${totalPayable.toLocaleString()})`
                                        : `Pay Selected (${activeKeys.length}) • ₦${totalPayable.toLocaleString()}`}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
