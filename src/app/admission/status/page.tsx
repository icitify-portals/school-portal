"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, ShieldCheck, Hash } from "lucide-react";
import { toast } from "sonner";

export default function AdmissionStatusLookupPage() {
    const router = useRouter();
    const [applicationId, setApplicationId] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = applicationId.trim();
        const id = parseInt(trimmed, 10);

        if (!trimmed || isNaN(id) || id <= 0) {
            toast.error("Please enter a valid numeric Application ID.");
            return;
        }

        router.push(`/admission/status/${id}`);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center py-12 px-4">
            <div className="max-w-lg w-full space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Admission Status Portal
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Track Your Application</h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                        Enter your Application ID to check your admission status
                    </p>
                </div>

                <Card className="bg-slate-900 border-none shadow-2xl rounded-[3rem] p-8 md:p-10">
                    <CardHeader className="p-0 pb-8 text-center space-y-2">
                        <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800 text-emerald-400">
                            <Search className="w-8 h-8" />
                        </div>
                        <CardTitle className="text-2xl font-black italic uppercase">Look Up Application</CardTitle>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Found in your confirmation email or applicant dashboard
                        </p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                                    Application ID <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g. 1024"
                                        value={applicationId}
                                        onChange={(e) => setApplicationId(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-8 rounded-2xl uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3 mt-4"
                            >
                                Check Status <ArrowRight className="w-5 h-5" />
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-3 justify-center">
                            <ShieldCheck className="w-4 h-4 text-slate-600" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Already logged in? <a href="/applicant" className="text-emerald-400 hover:underline">Go to your dashboard</a>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
