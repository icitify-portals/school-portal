"use client";

import React, { useState } from "react";
import { submitTranscriptApplication } from "@/actions/transcript-requests";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Send, Building } from "lucide-react";
import Link from "next/link";

export default function TranscriptApplicationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [formData, setFormData] = useState({
        applicantName: "",
        matricNumber: "",
        applicantEmail: "",
        applicantPhone: "",
        destinationName: "",
        destinationAddress: "",
        deliveryMethod: "email" as "email" | "courier" | "pickup"
    });

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
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Matriculation Number</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.matricNumber} onChange={e => setFormData({...formData, matricNumber: e.target.value})} placeholder="e.g. FSS/19/1234" />
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

                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                            <div>
                                <p className="text-sm text-indigo-800 font-semibold mb-1">Total Fee Required</p>
                                <p className="text-2xl font-black text-indigo-900">₦20,000</p>
                                <p className="text-xs text-indigo-600 mt-1">Transcript Fee (₦15k) + Processing (₦5k)</p>
                            </div>
                            <button disabled={loading} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-70 disabled:cursor-not-allowed">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                Proceed to Payment
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
