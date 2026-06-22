"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, Loader2, ArrowRight, BookOpen } from "lucide-react";
import { getPublicFormTemplate, registerApplicant } from "@/actions/admission_v2";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export default function PublicAdmissionPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: ""
    });

    useEffect(() => {
        fetchTemplate();
    }, [slug]);

    const fetchTemplate = async () => {
        setLoading(true);
        const data = await getPublicFormTemplate(slug);
        if (data) {
            setTemplate(data);
        }
        setLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        // Register Applicant and Draft
        const res = await registerApplicant({
            ...formData,
            templateId: template.id
        });

        if (res.success) {
            toast.success("Profile created! Redirecting to application portal...");
            // Login user via NextAuth
            const loginRes = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false
            });

            if (loginRes?.ok) {
                // Redirect directly to the draft
                router.push(`/applicant/application/${res.applicationId}`);
            } else {
                toast.error("Auto-login failed. Please login manually.");
                router.push("/login");
            }
        } else {
            toast.error(res.error || "Failed to create application profile.");
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>;
    if (!template) return <div className="min-h-screen bg-slate-950 flex justify-center items-center font-black text-2xl italic uppercase text-slate-700">Form Not Found</div>;

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
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">First Name <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="John"
                                        value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Last Name <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Doe"
                                        value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email Address <span className="text-rose-500">*</span></label>
                                <input 
                                    type="email" required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="john@example.com"
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Phone <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="080..."
                                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Password <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="password" required minLength={6}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="******"
                                        value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            <Button 
                                type="submit" disabled={submitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-8 rounded-2xl uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3 mt-4"
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

