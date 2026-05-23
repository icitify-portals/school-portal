"use client";

import { useState } from "react";
import { submitInquiry } from "@/actions/crm";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function InquiryForm({ programmes, units }: { programmes: any[], units: any[] }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            programmeId: formData.get("programmeId") ? parseInt(formData.get("programmeId") as string) : undefined,
            unitId: formData.get("unitId") ? parseInt(formData.get("unitId") as string) : undefined,
            source: "website"
        };

        const res = await submitInquiry(data);
        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-indigo-500/10 text-center space-y-6 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Thank You!</h3>
                    <p className="text-slate-500 font-medium">Your inquiry has been received. Our admission team will contact you shortly.</p>
                </div>
                <button 
                    onClick={() => setSuccess(false)}
                    className="text-indigo-600 font-black hover:underline"
                >
                    Send another inquiry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-indigo-500/10 space-y-8 relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Start Your <span className="text-indigo-600">Journey</span></h3>
                <p className="text-slate-500 font-medium mt-2">Have questions? Send us an inquiry and we'll get back to you within 24 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                        <input 
                            required
                            name="name"
                            placeholder="Enter your name"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                        <input 
                            required
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                        <input 
                            name="phone"
                            placeholder="+234..."
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Interest</label>
                        <select 
                            name="programmeId"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 appearance-none"
                        >
                            <option value="">General Inquiry</option>
                            {programmes.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <button 
                    disabled={loading}
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-5 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <>
                            <span>Send Inquiry</span>
                            <Send className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
