"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    GraduationCap,
    Search,
    ArrowRight,
    CheckCircle2,
    UserCheck,
    ShieldCheck,
    Loader2,
    AlertCircle,
    ChevronLeft,
    XCircle
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { verifyJambCandidate, claimAdmissionProfile } from "@/actions/admission";
import { getCandidateValidationStatus } from "@/actions/admission-validation";
import { cn } from "@/lib/utils";

export default function ClaimAdmissionPage() {
    const { data: session } = useSession();
    const [step, setStep] = useState(1); // 1: Verify, 2: Review, 3: Account Setup, 4: Success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form States
    const [regNo, setRegNo] = useState("");
    const [dob, setDob] = useState(""); // YYYY-MM-DD
    const [candidate, setCandidate] = useState<any>(null);
    const [validationStatus, setValidationStatus] = useState<any>(null);
    const [accountData, setAccountData] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await verifyJambCandidate(regNo, dob) as any;
        if (res.success) {
            setCandidate(res.candidate);
            
            // Get validation status
            const validationRes = await getCandidateValidationStatus(regNo);
            if (validationRes.success) {
                setValidationStatus(validationRes);
            }
            
            setStep(2);
        } else {
            setError(res.error || "Verification failed");
        }
        setLoading(false);
    };

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session && accountData.password !== accountData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        // If logged in, we don't need email/password
        const res = await claimAdmissionProfile(
            regNo,
            dob,
            session ? undefined : accountData.email,
            session ? undefined : accountData.password
        ) as any;

        if (res.success) {
            setStep(4);
        } else {
            setError(res.error || "Failed to claim profile");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="max-w-xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 mb-6">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 italic uppercase">Institutional Intake</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Claim your institutional identity via JAMB verification</p>
                </div>

                <div className="flex justify-between items-center px-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                                step === s ? "bg-indigo-600 text-white shadow-xl scale-110" :
                                    step > s ? "bg-emerald-500 text-white" : "bg-white text-slate-300 border border-slate-200"
                            )}>
                                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                            </div>
                            <div className={cn(
                                "h-1 w-12 rounded-full hidden sm:block",
                                step > s ? "bg-emerald-500" : "bg-slate-200"
                            )} />
                        </div>
                    ))}
                </div>

                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    <CardContent className="p-10">
                        {error && (
                            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-xs font-black uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleVerify} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">JAMB Registration Number</label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <Input
                                                placeholder="e.g. 202612345678AB"
                                                className="pl-12 py-7 rounded-2xl border-slate-100 bg-slate-50 font-black text-lg uppercase tracking-widest focus:ring-indigo-500"
                                                value={regNo}
                                                onChange={(e) => setRegNo(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Date of Birth</label>
                                        <Input
                                            type="date"
                                            className="py-7 rounded-2xl border-slate-100 bg-slate-50 font-black text-lg focus:ring-indigo-500"
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-8 rounded-[2rem] text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 transition-all active:scale-95 flex gap-3"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Credentials <ArrowRight className="w-5 h-5" /></>}
                                </Button>
                            </form>
                        )}

                        {step === 2 && candidate && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Admission Details Confirmed</h3>
                                    <div className="p-8 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden">
                                        <GraduationCap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />
                                        <div className="relative z-10 space-y-4">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Full Legal Name</p>
                                                <p className="text-xl font-black italic">{candidate.surname}, {candidate.firstname} {candidate.middlename}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">JAMB REG NO</p>
                                                    <p className="text-sm font-black">{candidate.jambRegNo}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Quota Dept</p>
                                                    <p className="text-sm font-black">Level 100</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Validation Status */}
                                {validationStatus && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Requirements Validation</h3>
                                        <div className="p-6 bg-white rounded-[2rem] border border-slate-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center",
                                                        validationStatus.utmeSubjectsValid ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                                    )}>
                                                        {validationStatus.utmeSubjectsValid ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">UTME Subjects</p>
                                                        <p className="text-xs text-slate-500">
                                                            {validationStatus.utmeSubjectsValid ? "Valid combination" : "Invalid combination"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center",
                                                        validationStatus.oLevelValid ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                                    )}>
                                                        {validationStatus.oLevelValid ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">O-Level Results</p>
                                                        <p className="text-xs text-slate-500">
                                                            {validationStatus.oLevelValid ? "Meets requirements" : "Does not meet requirements"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {validationStatus.validationDetails && (
                                                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                                                    <p className="text-xs font-bold text-slate-600 mb-2">Validation Details:</p>
                                                    <div className="text-xs text-slate-500 space-y-1">
                                                        {validationStatus.validationDetails.utme && (
                                                            <div>
                                                                <span className="font-semibold">UTME:</span> {JSON.stringify(validationStatus.validationDetails.utme)}
                                                            </div>
                                                        )}
                                                        {validationStatus.validationDetails.oLevel && (
                                                            <div>
                                                                <span className="font-semibold">O-Level:</span> {JSON.stringify(validationStatus.validationDetails.oLevel)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-7 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>
                                    <Button
                                        onClick={() => setStep(3)}
                                        className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-7 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                                    >
                                        {session ? "Proceed to Link Profile" : "Proceed to Setup Account"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleClaim} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                {session ? (
                                    <div className="space-y-4 text-center py-6">
                                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <UserCheck className="w-8 h-8 text-indigo-600" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 uppercase italic">Confirm Profile Link</h3>
                                        <p className="text-sm text-slate-500 font-medium">
                                            You are currently logged in as <span className="text-indigo-600 font-bold">{session.user?.email}</span>.
                                            Would you like to link this JAMB profile to your current account?
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Official Email Address</label>
                                            <Input
                                                type="email"
                                                placeholder="institutional@university.edu"
                                                className="py-7 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                                                value={accountData.email}
                                                onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Portal Password</label>
                                                <Input
                                                    type="password"
                                                    className="py-7 rounded-2xl border-slate-100 bg-slate-50"
                                                    value={accountData.password}
                                                    onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Confirm Password</label>
                                                <Input
                                                    type="password"
                                                    className="py-7 rounded-2xl border-slate-100 bg-slate-50"
                                                    value={accountData.confirmPassword}
                                                    onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setStep(2)}
                                        className="flex-1 py-7 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-7 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : session ? "Confirm & Complete" : "Complete Enrollment"}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === 4 && (
                            <div className="text-center space-y-8 py-4 animate-in zoom-in duration-500">
                                <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-600">
                                    <ShieldCheck className="w-12 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900 italic uppercase">Welcome Aboard</h2>
                                    <p className="text-slate-500 font-bold max-w-sm mx-auto">Your institutional profile has been successfully claimed and initialized.</p>
                                </div>
                                <Link href="/login" className="block">
                                    <Button className="w-full bg-slate-900 hover:bg-black text-white py-8 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95">
                                        Launch Student Portal
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Secured by Institutional Identity Management System
                </p>
            </div>
        </div>
    );
}
