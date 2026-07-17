"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrandingSettings } from "@/actions/settings";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, CheckCircle2, Eye, EyeOff, Check, X } from "lucide-react";
import Link from "next/link";

interface PasswordStrength {
    score: number;
    label: string;
    color: string;
    checks: {
        length: boolean;
        uppercase: boolean;
        lowercase: boolean;
        number: boolean;
        special: boolean;
    };
}

function checkPasswordStrength(password: string): PasswordStrength {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;

    let label = "Weak";
    let color = "text-rose-500";

    if (score >= 5) {
        label = "Very Strong";
        color = "text-emerald-600";
    } else if (score >= 4) {
        label = "Strong";
        color = "text-emerald-500";
    } else if (score >= 3) {
        label = "Medium";
        color = "text-amber-500";
    } else if (score >= 2) {
        label = "Fair";
        color = "text-orange-500";
    }

    return { score, label, color, checks };
}

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        surname: "",
        firstName: "",
        middleName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [branding, setBranding] = useState<any>(null);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const router = useRouter();

    useEffect(() => {
        getBrandingSettings()
            .then((data) => setBranding(data))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (formData.password) {
            setPasswordStrength(checkPasswordStrength(formData.password));
        } else {
            setPasswordStrength(null);
        }
        if (formData.confirmPassword) {
            setPasswordsMatch(formData.password === formData.confirmPassword);
        } else {
            setPasswordsMatch(true);
        }
    }, [formData.password, formData.confirmPassword]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!passwordStrength || passwordStrength.score < 3) {
            setError("Please choose a stronger password (at least 'Medium' strength).");
            return;
        }

        setLoading(true);

        const fullName = [formData.surname, formData.firstName, formData.middleName]
            .filter(Boolean)
            .join(" ")
            .trim();

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, name: fullName }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push("/login"), 2000);
            } else {
                const data = await res.json();
                setError(data.message || "Something went wrong");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-10">
            <Card className="w-full max-w-md border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="text-center space-y-1 bg-slate-50/50 border-b border-slate-100 p-6">
                    <div className="flex justify-center mb-4">
                        <img
                            src={branding?.INST_LOGO?.trim() && branding.INST_LOGO !== 'null' ? branding.INST_LOGO : "/logo.png"}
                            alt={branding?.INST_NAME || "School Logo"}
                            className="h-16 object-contain"
                            onError={(e) => { e.currentTarget.src = "/logo.png"; }}
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Create Profile</CardTitle>
                    <CardDescription>Start your admission journey with the FSS Portal</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex gap-2 items-center">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm flex gap-2 items-center">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                Profile created! Redirecting to login...
                            </div>
                        )}

                        {/* Name Fields - 2 cols for surname & first name */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Surname <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    suppressHydrationWarning
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 bg-white"
                                    placeholder="Doe"
                                    value={formData.surname}
                                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    suppressHydrationWarning
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 bg-white"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Middle Name - full width */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">
                                Middle Name <span className="text-slate-400 font-medium">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                suppressHydrationWarning
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 bg-white"
                                placeholder="Michael"
                                value={formData.middleName}
                                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                suppressHydrationWarning
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 bg-white"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    suppressHydrationWarning
                                    className="w-full px-4 py-2 pr-11 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 bg-white"
                                    placeholder="Min. 8 characters"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {passwordStrength && (
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-500">Password Strength</span>
                                        <span className={`text-xs font-bold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                                    i <= passwordStrength.score
                                                        ? passwordStrength.score >= 4 ? 'bg-emerald-500' : passwordStrength.score >= 3 ? 'bg-amber-500' : 'bg-red-400'
                                                        : 'bg-slate-200'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                        <div className="flex items-center gap-1.5">
                                            {passwordStrength.checks.length ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                                            <span className="text-[11px] text-slate-500">8+ characters</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {passwordStrength.checks.uppercase ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                                            <span className="text-[11px] text-slate-500">Uppercase letter</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {passwordStrength.checks.lowercase ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                                            <span className="text-[11px] text-slate-500">Lowercase letter</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {passwordStrength.checks.number ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                                            <span className="text-[11px] text-slate-500">Number</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {passwordStrength.checks.special ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                                            <span className="text-[11px] text-slate-500">Special character</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    suppressHydrationWarning
                                    className={`w-full px-4 py-2 pr-11 rounded-lg border focus:outline-none focus:ring-2 transition-all text-slate-900 bg-white ${
                                        !passwordsMatch && formData.confirmPassword
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-slate-200 focus:ring-blue-500'
                                    }`}
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {!passwordsMatch && formData.confirmPassword && (
                                <p className="text-xs text-red-500 font-medium px-1">Passwords do not match</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || success || !passwordsMatch || (passwordStrength !== null && passwordStrength.score < 3)}
                            className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-xl text-lg h-auto shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create Profile"}
                        </Button>

                        <p className="text-center text-sm text-slate-600 font-medium pt-1">
                            Already have an account?{" "}
                            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                                Sign In
                            </Link>
                        </p>

                        <p className="text-center text-xs text-slate-400 font-medium">
                            Looking to apply?{" "}
                            <Link href="/admission" className="text-slate-500 hover:text-slate-700 hover:underline">
                                Browse Admission Programmes
                            </Link>
                        </p>
                    </form>

                    {/* Back to Homepage Button */}
                    <div className="mt-6">
                        <Link href="/" className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all font-bold text-sm text-slate-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Homepage
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
