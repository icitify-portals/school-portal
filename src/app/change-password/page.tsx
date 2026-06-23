"use client";

import { useState } from "react";
import { changePasswordForced } from "@/actions/auth-actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertCircle, CheckCircle2, Loader2, Lock } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ChangePasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setStatus({ success: false, error: "Passwords do not match." });
            return;
        }

        if (password.length < 8) {
            setStatus({ success: false, error: "Password must be at least 8 characters long." });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const result = await changePasswordForced(password);
            setStatus(result);
            if (result.success) {
                // Force logout so token refreshes with updated requiresPasswordChange flag
                setTimeout(() => {
                    signOut({ callbackUrl: '/login' });
                }, 2000);
            }
        } catch (err) {
            setStatus({ success: false, error: "An error occurred. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md border-none shadow-xl">
                <CardHeader className="text-center space-y-1">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-rose-600 rounded-2xl text-white">
                            <ShieldAlert className="w-10 h-10" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Security Update Required</CardTitle>
                    <CardDescription>You must change your default password before accessing your dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
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
                                    <label className="text-sm font-semibold text-slate-700">New Password</label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 bg-white"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 bg-white"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 rounded-xl text-lg h-auto shadow-lg shadow-indigo-500/20 font-bold"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Update Password"}
                                </Button>
                            </>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
