"use client";

import { useState } from "react";
import { forgotPassword } from "@/actions/auth-actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const result = await forgotPassword(email);
            setStatus(result);
        } catch (err) {
            setStatus({ success: false, message: "An error occurred. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="text-center space-y-1 bg-slate-50/50 border-b border-slate-100 p-6">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                            <GraduationCap className="w-10 h-10" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Forgot Password?</CardTitle>
                    <CardDescription>Enter your email address and we&apos;ll send you a link to reset your password.</CardDescription>
                </CardHeader>
                <CardContent className=" p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {status && (
                            <div className={`p-4 rounded-xl text-sm flex gap-3 ${status.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {status.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                                <span>{status.message || status.error}</span>
                            </div>
                        )}
                        
                        {!status?.success && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 bg-white"
                                        placeholder="name@school.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 rounded-xl text-lg h-auto shadow-lg shadow-indigo-500/20 font-bold"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Send Reset Link"}
                                </Button>
                            </>
                        )}

                        <div className="pt-4 text-center">
                            <Link href="/login" className="text-slate-500 hover:text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Back to Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
