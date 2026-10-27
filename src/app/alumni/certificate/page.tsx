"use client";

import React, { useState, useEffect } from "react";
import { getDynamicAlumniFees, submitCertificateApplication } from "@/actions/alumni-requests";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap, MapPin, CreditCard, Info } from "lucide-react";
import Link from "next/link";

export default function CertificateApplicationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [fees, setFees] = useState({
        certificateFeeND: 18500,
        certificateFeeHND: 28500,
        convocationFee: 15500,
        incidentalFee: 5500,
        processingFee: 4000,
    });
    
    useEffect(() => {
        getDynamicAlumniFees().then((res) => {
            if (res) setFees(res);
        });
    }, []);
    
    const [formData, setFormData] = useState({
        applicantName: "",
        matricNumber: "",
        email: "",
        phone: "",
        programmeType: "ND" as "ND" | "HND",
        department: "",
        yearOfGraduation: "",
        deliveryMethod: "pickup" as "email" | "courier" | "pickup",
        deliveryAddress: ""
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await submitCertificateApplication(formData);
            if (res.success && res.url) {
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

    const certificateFee = formData.programmeType === "HND" ? fees.certificateFeeHND : fees.certificateFeeND;
    const institutionalSubtotal = certificateFee + fees.convocationFee + fees.incidentalFee;
    const totalFee = institutionalSubtotal + fees.processingFee;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-slate-900 text-white p-6 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="text-amber-400 w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-wide">Certificate Request</h1>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">Federal School of Statistics • Alumni Services</p>
                        </div>
                    </div>
                    <Link href="/" className="text-sm font-medium hover:text-amber-300">Back to Portal</Link>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Apply for Official Certificate</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Complete the form below to apply for your National Diploma (ND) or Higher National Diploma (HND) certificate. Note that the compulsory Incidental Fee applies to all students and graduants.
                    </p>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Matriculation Number *</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase" value={formData.matricNumber} onChange={e => setFormData({...formData, matricNumber: e.target.value.toUpperCase()})} placeholder="e.g. COM/FSS/IB/2023/10234" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                                <input required type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. 08012345678" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Programme Type *</label>
                                <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold" value={formData.programmeType} onChange={e => setFormData({...formData, programmeType: e.target.value as "ND"|"HND"})}>
                                    <option value="ND">National Diploma (ND)</option>
                                    <option value="HND">Higher National Diploma (HND)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Department *</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Computer Science" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Year of Graduation *</label>
                                <input required type="text" maxLength={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.yearOfGraduation} onChange={e => setFormData({...formData, yearOfGraduation: e.target.value})} placeholder="e.g. 2025" />
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-6 mt-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <MapPin className="w-5 h-5 text-amber-500" /> Collection Details
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Method</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.deliveryMethod} onChange={e => setFormData({...formData, deliveryMethod: e.target.value as any})}>
                                        <option value="pickup">Physical Pickup (School Campus)</option>
                                        <option value="courier">Courier Delivery (Physical)</option>
                                        <option value="email">Email Copy (Digital)</option>
                                    </select>
                                </div>

                                {formData.deliveryMethod === 'courier' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Full Delivery Address (Courier Only) *</label>
                                        <textarea required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" rows={3} value={formData.deliveryAddress} onChange={e => setFormData({...formData, deliveryAddress: e.target.value})} placeholder="Enter the exact physical address for courier delivery..."></textarea>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Updated Payment Breakdown */}
                        <div className="bg-amber-50/60 rounded-2xl p-6 border border-amber-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-amber-200/70 pb-3">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-amber-600" /> Payment Breakdown ({formData.programmeType})
                                </h3>
                                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                                    Compulsory Graduation & Certificate Fees
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100">
                                    <span className="text-slate-600 font-medium">Certificate Fee ({formData.programmeType}):</span>
                                    <span className="font-bold text-slate-900">₦{certificateFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100">
                                    <span className="text-slate-600 font-medium">Convocation Fee:</span>
                                    <span className="font-bold text-slate-900">₦{fees.convocationFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100">
                                    <span className="text-slate-600 font-medium">Incidental Fee (All Students):</span>
                                    <span className="font-bold text-slate-900">₦{fees.incidentalFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100">
                                    <span className="text-slate-600 font-medium">Portal Processing Fee:</span>
                                    <span className="font-bold text-slate-900">₦{fees.processingFee.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-100/60 p-3 rounded-xl">
                                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                <span>
                                    Note: Incidental Fee (₦{fees.incidentalFee.toLocaleString()}) is compulsory for all students, including graduants applying for certificates and transcripts.
                                </span>
                            </div>

                            <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-amber-200/70">
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Total Amount Payable</p>
                                    <p className="text-2xl font-black text-slate-900">₦{totalFee.toLocaleString()}</p>
                                </div>
                                <button type="submit" disabled={loading} className="w-full md:w-auto bg-amber-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-md">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Payment'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
