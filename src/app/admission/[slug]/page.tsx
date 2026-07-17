"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, Loader2, ArrowRight, BookOpen, Eye, EyeOff, Check, X } from "lucide-react";
import { getPublicFormTemplate, registerApplicant } from "@/actions/admission_v2";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";

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
        color = "text-emerald-500";
    } else if (score >= 4) {
        label = "Strong";
        color = "text-emerald-400";
    } else if (score >= 3) {
        label = "Medium";
        color = "text-amber-500";
    } else if (score >= 2) {
        label = "Fair";
        color = "text-orange-500";
    }
    
    return { score, label, color, checks };
}

export default function PublicAdmissionPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { data: session } = useSession();
    
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        surname: "",
        firstName: "",
        middleName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
    const [passwordsMatch, setPasswordsMatch] = useState(true);

    useEffect(() => {
        fetchTemplate();
    }, [slug]);

    useEffect(() => {
        if (formData.password) {
            setPasswordStrength(checkPasswordStrength(formData.password));
        } else {
            setPasswordStrength(null);
        }
        // Check password match
        if (formData.confirmPassword) {
            setPasswordsMatch(formData.password === formData.confirmPassword);
        } else {
            setPasswordsMatch(true);
        }
    }, [formData.password, formData.confirmPassword]);

    const fetchTemplate = async () => {
        setLoading(true);
        try {
            const data = await getPublicFormTemplate(slug);
            if (data) {
                setTemplate(data);
            }
        } catch (error) {
            console.error("Failed to fetch template:", error);
        }
        setLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        
        // Validate password strength
        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters long.");
            return;
        }
        
        setSubmitting(true);
        
        // Register Applicant and Draft
        const res = await registerApplicant({
            surname: formData.surname,
            firstName: formData.firstName,
            middleName: formData.middleName,
            templateId: template.id,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
        });

        if (res.success) {
            if (res.requiresVerification) {
                setRegisteredEmail(formData.email);
                toast.success("Profile created! Check your email to verify your account.");
            } else {
                toast.success("Welcome back! Redirecting to instructions...");
                // Login user via NextAuth
                const loginRes = await signIn("credentials", {
                    email: formData.email,
                    password: formData.password,
                    redirect: false
                });

                if (loginRes?.ok) {
                    router.push(`/admission/${slug}/instructions?appId=${res.applicationId}`);
                } else {
                    toast.error("Auto-login failed. Please login manually.");
                    router.push("/login");
                }
                setSubmitting(false);
            }
        } else {
            toast.error(res.error || "Failed to create application profile.");
            setSubmitting(false);
        }
    };

    // Redirect logged-in users to their application dashboard
    useEffect(() => {
        if (!loading && session?.user) {
            router.push("/admission/status");
        }
    }, [loading, session, router]);

    if (loading) return <div className="min-h-screen bg-slate-950 flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>;
    if (session?.user) return null; // redirecting
    if (!template) return <div className="min-h-screen bg-slate-950 flex justify-center items-center font-black text-2xl italic uppercase text-slate-700">Form Not Found</div>;

    // Show verification prompt after registration
    if (registeredEmail) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center py-12 px-4">
                <div className="max-w-lg w-full text-center space-y-8">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                        <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">Verify Your Email</h1>
                    <p className="text-slate-400 font-bold text-sm leading-relaxed">
                        We sent a verification link to <span className="text-emerald-400">{registeredEmail}</span>.
                        Please check your inbox and click the link to activate your account.
                    </p>
                    <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 text-left space-y-4">
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-xs font-black text-slate-400 shrink-0 mt-0.5">1</span>
                            <p className="text-sm text-slate-300 font-bold">Open your email inbox</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-xs font-black text-slate-400 shrink-0 mt-0.5">2</span>
                            <p className="text-sm text-slate-300 font-bold">Click the verification link from FSS Ibadan</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-xs font-black text-slate-400 shrink-0 mt-0.5">3</span>
                            <p className="text-sm text-slate-300 font-bold">Log in and continue your application</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Didn't receive the email? Check your spam folder or <a href="/login" className="text-emerald-400 hover:underline">try logging in</a> to resend.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center py-12 px-4">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
                
                {/* Information Section */}
                <div className="space-y-8 flex flex-col justify-center">
                    <div className="space-y-4">
                        <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic">
                            {template.level} Direct Intake
                        </span>
                        <h1 className="text-5xl font-black italic uppercase leading-tight">{template.name}</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs leading-relaxed">
                            {template.description || "Start your journey by creating an application profile. You can save your progress and return anytime before the deadline."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
                            <div className="w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center text-emerald-500 border border-slate-800">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-wider">Secure Save & Resume</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Your progress is automatically saved to your profile.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
                            <div className="w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center text-emerald-500 border border-slate-800">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-wider">Dynamic Flow</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                    {template.flowType === 'payment_first' ? 'Pay application fee first, then fill the form.' : 'Fill the form, then pay securely at the end.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                <Card className="bg-slate-900 border-none shadow-2xl rounded-[3rem] p-8 md:p-10">
                    <CardHeader className="p-0 pb-8 text-center space-y-2">
                        <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800 text-emerald-400">
                            <User className="w-8 h-8" />
                        </div>
                        <CardTitle className="text-2xl font-black italic uppercase">Create Intake Profile</CardTitle>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enter basic details to start</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <form onSubmit={handleRegister} className="space-y-5">
                            {/* Surname */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Surname <span className="text-rose-500">*</span></label>
                                <input 
                                    type="text" required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Doe"
                                    value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})}
                                />
                            </div>
                            
                            {/* First Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">First Name <span className="text-rose-500">*</span></label>
                                <input 
                                    type="text" required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="John"
                                    value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
                                />
                            </div>
                            
                            {/* Middle Name (Optional) */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Middle Name <span className="text-slate-600">(Optional)</span></label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Michael"
                                    value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email Address <span className="text-rose-500">*</span></label>
                                <input 
                                    type="email" required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="john@example.com"
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Phone <span className="text-rose-500">*</span></label>
                                <input 
                                    type="text" required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="080..."
                                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Password <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} required minLength={8}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                                        placeholder="Min. 8 characters"
                                        value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                
                                {/* Password Strength Indicator */}
                                {passwordStrength && (
                                    <div className="space-y-2 mt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Password Strength</span>
                                            <span className={`text-[10px] font-black uppercase ${passwordStrength.color}`}>{passwordStrength.label}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div 
                                                    key={i} 
                                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                                        i <= passwordStrength.score 
                                                            ? passwordStrength.score >= 4 ? 'bg-emerald-500' : passwordStrength.score >= 3 ? 'bg-amber-500' : 'bg-rose-500'
                                                            : 'bg-slate-800'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="flex items-center gap-1.5">
                                                {passwordStrength.checks.length ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-600" />}
                                                <span className="text-[9px] text-slate-500">8+ characters</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {passwordStrength.checks.uppercase ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-600" />}
                                                <span className="text-[9px] text-slate-500">Uppercase letter</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {passwordStrength.checks.lowercase ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-600" />}
                                                <span className="text-[9px] text-slate-500">Lowercase letter</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {passwordStrength.checks.number ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-600" />}
                                                <span className="text-[9px] text-slate-500">Number</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {passwordStrength.checks.special ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-600" />}
                                                <span className="text-[9px] text-slate-500">Special character</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Confirm Password <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} required minLength={8}
                                        className={`w-full bg-slate-950 border rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 pr-12 ${
                                            !passwordsMatch && formData.confirmPassword 
                                                ? 'border-rose-500 focus:ring-rose-500' 
                                                : 'border-slate-800 focus:ring-emerald-500'
                                        }`}
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {!passwordsMatch && formData.confirmPassword && (
                                    <p className="text-[10px] text-rose-500 font-bold px-1">Passwords do not match</p>
                                )}
                            </div>

                            <Button 
                                type="submit" disabled={submitting || !passwordsMatch || (passwordStrength !== null && passwordStrength.score < 3)}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-8 rounded-2xl uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Start Application <ArrowRight className="w-5 h-5" /></>}
                            </Button>
                        </form>
                        
                        <div className="mt-6 text-center">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Already have an application? <a href="/login" className="text-emerald-400 hover:underline">Login here</a>
                            </p>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
