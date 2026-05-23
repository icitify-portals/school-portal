"use client";

import { useState } from "react";
import { linkChildToParent } from "@/actions/parent";
import { GraduationCap, ArrowLeft, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddChildPage() {
    const [matricNumber, setMatricNumber] = useState("");
    const [relationship, setRelationship] = useState<'father' | 'mother' | 'guardian' | 'other'>("father");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await linkChildToParent(matricNumber, relationship);
        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else {
            router.push("/parent/dashboard");
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-slate-50/50 animate-in fade-in zoom-in duration-500">
            <div className="w-full max-w-xl">
                <Link 
                    href="/parent/dashboard"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 font-black text-sm group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                </Link>

                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-white p-12 space-y-8 relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                        <GraduationCap className="w-64 h-64" />
                    </div>

                    <div className="relative">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 mb-6">
                            <PlusIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Link a <span className="text-indigo-600">Child</span></h1>
                        <p className="text-slate-500 font-medium mt-2">Enter your child's matriculation number to link them to your portal.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Matric Number</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    required
                                    type="text"
                                    value={matricNumber}
                                    onChange={(e) => setMatricNumber(e.target.value)}
                                    placeholder="e.g. CSC/2024/001"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Your Relationship</label>
                            <select 
                                value={relationship}
                                onChange={(e: any) => setRelationship(e.target.value)}
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 appearance-none"
                            >
                                <option value="father">Father</option>
                                <option value="mother">Mother</option>
                                <option value="guardian">Guardian</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold animate-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <button 
                            disabled={loading}
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white py-5 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Link Student Account</span>
                                    <ArrowLeft className="w-5 h-5 rotate-180" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
    );
}
