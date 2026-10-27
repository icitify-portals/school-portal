"use client";

import React, { useState, useEffect } from "react";
import { submitTranscriptApplication, getTranscriptFees, checkStudentGraduationClearance } from "@/actions/transcript-requests";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Send, Building, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function TranscriptApplicationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [fees, setFees] = useState({ transcriptFee: 15000, incidentalFee: 5500, processingFee: 4000 });
    
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
        setLoading(true);
        setError("");

        try {
            const res = await submitTranscriptApplication(formData);
            if (res.success && res.url) {
                // Redirect to Alatpay checkout
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

                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex flex-col gap-4 mt-8">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                <div className="bg-white p-3 rounded-xl border border-indigo-100 flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Transcript Fee:</span>
                                    <span className="font-bold text-slate-900">₦{fees.transcriptFee.toLocaleString()}</span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-indigo-100 flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Incidental Fee:</span>
                                    <span className="font-bold text-slate-900">₦{(fees.incidentalFee || 5500).toLocaleString()}</span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-indigo-100 flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Processing Fee:</span>
                                    <span className="font-bold text-slate-900">₦{fees.processingFee.toLocaleString()}</span>
                                </div>
                            </div>
                            <p className="text-xs text-indigo-700 font-medium">
                                Note: Incidental Payment (₦{(fees.incidentalFee || 5500).toLocaleString()}) is compulsory for all students, including those applying for certificates and transcripts.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-3 border-t border-indigo-200/60">
                                <div>
                                    <p className="text-sm text-indigo-800 font-semibold mb-1">Total Fee Required</p>
                                    <p className="text-2xl font-black text-indigo-900">
                                        {(fees.transcriptFee === 0 && (fees.incidentalFee || 0) === 0 && fees.processingFee === 0) ? "Free" : `₦${(fees.transcriptFee + (fees.incidentalFee || 5500) + fees.processingFee).toLocaleString()}`}
                                    </p>
                                    <p className="text-xs text-indigo-600 mt-1">
                                        Transcript Fee (₦{fees.transcriptFee.toLocaleString()}) + Incidental Fee (₦{(fees.incidentalFee || 5500).toLocaleString()}) + Processing Fee (₦{fees.processingFee.toLocaleString()})
                                    </p>
                                </div>
                                <button 
                                    disabled={loading || (clearanceInfo?.isGraduant && !clearanceInfo.isCleared)} 
                                    type="submit" 
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    {(fees.transcriptFee === 0 && (fees.incidentalFee || 0) === 0 && fees.processingFee === 0) ? "Submit Application" : "Proceed to Payment"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
