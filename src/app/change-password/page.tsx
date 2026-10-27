"use client";

import { useState, useMemo } from "react";
import { changePasswordForced } from "@/actions/auth-actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertCircle, CheckCircle2, Loader2, Lock, Eye, EyeOff, Check, X, AlertTriangle } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { validatePasswordStrength } from "@/lib/password-validator";

export default function ChangePasswordPage() {
    const { data: session, update } = useSession();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [dob, setDob] = useState("");
    const [requireDob, setRequireDob] = useState(false);
    const [status, setStatus] = useState<{ success?: boolean; message?: string; error?: string; requireDob?: boolean } | null>(null);
    const [loading, setLoading] = useState(false);

    const strength = useMemo(() => {
        return validatePasswordStrength(password);
    }, [password]);

    const isNumbersOnly = password.length > 0 && /^[0-9]+$/.test(password.trim());
    const passwordsMatch = !confirmPassword || password === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);

        const cleanPassword = password.trim();
        const cleanConfirm = confirmPassword.trim();

        if (cleanPassword !== cleanConfirm) {
            setStatus({ success: false, error: "Passwords do not match. Please re-enter identical passwords." });
            return;
        }

        const validation = validatePasswordStrength(cleanPassword);
        if (!validation.isValid) {
            setStatus({
                success: false,
                error: validation.firstError || "Password does not meet the required security standards."
            });
            return;
        }

        if (requireDob && !dob) {
            setStatus({ success: false, error: "Please enter your Date of Birth." });
            return;
        }

        setLoading(true);

        try {
            const result = await changePasswordForced(cleanPassword, requireDob ? dob : undefined);
            if (result.requireDob) {
                setRequireDob(true);
                setStatus({ success: false, error: result.error });
            } else if (result.success) {
                setStatus({ 
                    success: true, 
                    message: "Password updated successfully! Logging you in..." 
                });

                try {
                    await update({ requiresPasswordChange: false, user: { requiresPasswordChange: false } });
                } catch (updateErr) {
                    // non-blocking
                }

                // Re-authenticate with new credentials LAST so NextAuth issues a fresh session
                // cookie where requiresPasswordChange is false and it is not overwritten by update().
                const loginEmail = result.email || session?.user?.email;
                if (loginEmail) {
                    try {
                        await signIn("credentials", {
                            email: loginEmail,
                            password: cleanPassword,
                            redirect: false
                        });
                    } catch (signInErr) {
                        console.error("Re-authentication error:", signInErr);
                    }
                }

                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 800);
            } else {
                setStatus(result);
            }
        } catch (err: any) {
            setStatus({
                success: false,
                error: err?.message || "An unexpected error occurred. Please try again."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="text-center space-y-1 bg-slate-50/50 border-b border-slate-100 p-6">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-rose-600 rounded-2xl text-white shadow-lg shadow-rose-600/30">
                            <ShieldAlert className="w-10 h-10" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Security Update Required</CardTitle>
                    <CardDescription>You must update your default password to a secure personal password.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {status && (
                            <div className={`p-4 rounded-xl text-sm flex gap-3 ${status.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                {status.success ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />}
                                <span className="font-medium">{status.message || status.error}</span>
                            </div>
                        )}

                        {isNumbersOnly && (
                            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex gap-2.5 items-start">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="font-bold">Password cannot be numbers alone</p>
                                    <p className="text-amber-800 mt-0.5">Please combine letters and numbers (e.g. <strong>FSS12345</strong>). Using only numbers or phone numbers is not secure and will be rejected.</p>
                                </div>
                            </div>
                        )}
                        
                        {!status?.success && (
                            <>
                                {requireDob && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Date of Birth</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 bg-white"
                                                value={dob}
                                                onChange={(e) => setDob(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* New Password Field */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">New Password</label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 bg-white"
                                            placeholder="Min. 8 characters with letters & numbers"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Password Strength Meter */}
                                    {password.length > 0 && (
                                        <div className="space-y-2 pt-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-500">Password Strength:</span>
                                                <span className={`text-xs font-bold ${strength.color}`}>{strength.label}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                                                            i <= strength.score ? strength.barColor : 'bg-slate-200'
                                                        }`}
                                                    />
                                                ))}
                                            </div>

                                            {/* Requirement Checklist */}
                                            <div className="grid grid-cols-2 gap-1.5 pt-1 text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    {strength.checks.minLength ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                                                    ) : (
                                                        <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                                    )}
                                                    <span className={`text-[11px] ${strength.checks.minLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                                        At least 8 characters
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {strength.checks.notNumbersOnly && strength.checks.hasLetter ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                                                    ) : (
                                                        <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                    )}
                                                    <span className={`text-[11px] ${strength.checks.notNumbersOnly && strength.checks.hasLetter ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-medium'}`}>
                                                        Contains letters (a-z)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {strength.checks.hasNumber ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                                                    ) : (
                                                        <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                                    )}
                                                    <span className={`text-[11px] ${strength.checks.hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                                        Contains numbers (0-9)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {strength.checks.hasUppercase || strength.checks.hasSpecial ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                                                    ) : (
                                                        <span className="w-3.5 h-3.5 text-slate-300 text-center text-[10px]">•</span>
                                                    )}
                                                    <span className={`text-[11px] ${strength.checks.hasUppercase || strength.checks.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                                                        Uppercase / symbol (opt)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            className={`w-full pl-11 pr-11 py-3 rounded-xl border transition-all text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                                                !passwordsMatch ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                                            }`}
                                            placeholder="Re-enter your new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {!passwordsMatch && (
                                        <p className="text-xs text-rose-600 font-medium">Passwords do not match.</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || (password.length > 0 && !strength.isValid)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 rounded-xl text-lg h-auto shadow-lg shadow-indigo-500/20 font-bold transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Update Password"}
                                </Button>
                            </>
                        )}
                    </form>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={async () => { await signOut({ redirect: false }); window.location.href = '/login'; }}
                            className="w-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 py-4"
                        >
                            Cancel and Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
