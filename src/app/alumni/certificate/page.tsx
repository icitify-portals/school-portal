"use client";

import React, { useState, useEffect } from "react";
import { getDynamicAlumniFees, submitCertificateApplication } from "@/actions/alumni-requests";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap, MapPin } from "lucide-react";
import Link from "next/link";

export default function CertificateApplicationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [fees, setFees] = useState({ convocationFee: 0, processingFee: 0 });
    
    useEffect(() => {
        getDynamicAlumniFees().then(setFees);
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

    const totalFee = fees.convocationFee + fees.processingFee;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-slate-900 text-white p-6 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="text-amber-400 w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-wide">Certificate Request</h1>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">Alumni Services</p>
                        </div>
                    </div>
                    <Link href="/" className="text-sm font-medium hover:text-amber-300">Back to Portal</Link>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Apply for Official Certificate</h2>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Matriculation Number</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.matricNumber} onChange={e => setFormData({...formData, matricNumber: e.target.value})} placeholder="e.g. FSS/19/1234" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                <input required type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. 08012345678" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Programme Type</label>
                                <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.programmeType} onChange={e => setFormData({...formData, programmeType: e.target.value as "ND"|"HND"})}>
                                    <option value="ND">National Diploma (ND)</option>
                                    <option value="HND">Higher National Diploma (HND)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Computer Science" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Year of Graduation</label>
                                <input required type="text" maxLength={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.yearOfGraduation} onChange={e => setFormData({...formData, yearOfGraduation: e.target.value})} placeholder="e.g. 2021" />
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
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Full Delivery Address (Courier Only)</label>
                                        <textarea required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" rows={3} value={formData.deliveryAddress} onChange={e => setFormData({...formData, deliveryAddress: e.target.value})} placeholder="Enter the exact physical address for courier delivery..."></textarea>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Convocation Fee: ₦{fees.convocationFee.toLocaleString()}</p>
                                <p className="text-sm text-slate-500 font-medium">Processing Fee: ₦{fees.processingFee.toLocaleString()}</p>
                                <p className="text-xl font-bold text-slate-800 mt-2">Total: ₦{totalFee.toLocaleString()}</p>
                            </div>
                            <button type="submit" disabled={loading} className="w-full md:w-auto bg-amber-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Payment'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
