"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyCertificatePayment, createOrActivateStudentAccount } from "@/actions/alumni-requests";
import { Loader2, CheckCircle, XCircle, ArrowRight, Printer, KeyRound, UserCheck, ShieldCheck, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [message, setMessage] = useState("Verifying your payment with gateway...");
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [allPaid, setAllPaid] = useState(false);

    // Account creation state
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [accountLoading, setAccountLoading] = useState(false);
    const [accountSuccess, setAccountSuccess] = useState("");
    const [accountError, setAccountError] = useState("");

    const ref = searchParams.get("ref");

    useEffect(() => {
        if (!ref) {
            setStatus("error");
            setMessage("Invalid payment reference.");
            return;
        }

        if (ref === 'FREE-BYPASS') {
            setStatus("success");
            setMessage("Application submitted successfully (Fees waived). Your certificate request is pending approval.");
            setAllPaid(true);
            return;
        }

        verifyCertificatePayment(ref).then(res => {
            if (res.success) {
                setStatus("success");
                setMessage(res.message || "Payment verified successfully!");
                setPaymentDetails(res);
                setAllPaid(!!res.allCompulsoryPaid);
            } else {
                setStatus("error");
                setMessage(res.error || "Failed to verify payment.");
            }
        }).catch((err) => {
            setStatus("error");
            setMessage("An unexpected error occurred during verification: " + (err?.message || ""));
        });
    }, [ref]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || password.length < 6) {
            setAccountError("Password must be at least 6 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setAccountError("Passwords do not match.");
            return;
        }

        setAccountLoading(true);
        setAccountError("");

        try {
            const res = await createOrActivateStudentAccount({
                matricNumber: paymentDetails?.matricNumber || "",
                email: paymentDetails?.email || "",
                password,
                name: paymentDetails?.applicantName || ""
            });

            if (res.success) {
                setAccountSuccess(res.message || "Account activated! You can now log into your student dashboard.");
            } else {
                setAccountError(res.error || "Failed to create account.");
            }
        } catch (err: any) {
            setAccountError(err.message || "An error occurred.");
        } finally {
            setAccountLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-xl w-full border border-slate-100">
            {status === "verifying" && (
                <div className="flex flex-col items-center text-center">
                    <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifying Payment</h2>
                    <p className="text-slate-500 text-sm">{message}</p>
                </div>
            )}
            
            {status === "success" && (
                <div className="flex flex-col items-center text-center">
                    <CheckCircle className="w-20 h-20 text-emerald-500 mb-4" />
                    <h2 className="text-2xl font-black text-slate-800 mb-1">Payment Confirmed!</h2>
                    <p className="text-xs uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-4">
                        Credited to {paymentDetails?.categoryPaidName || "Bursary Account"}
                    </p>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">{message}</p>
                    
                    {/* Primary Actions: Print Receipt & Settle Remainder */}
                    <div className="flex flex-col w-full gap-3 mb-8">
                        <Link 
                            href={`/alumni/certificate/receipt?ref=${encodeURIComponent(ref || '')}`}
                            className="bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-md text-sm"
                        >
                            <Printer className="w-4 h-4 text-amber-400" />
                            <span>View & Print Official Receipt</span>
                        </Link>

                        {!allPaid ? (
                            <Link 
                                href={`/alumni/certificate?matric=${encodeURIComponent(paymentDetails?.matricNumber || '')}`} 
                                className="bg-amber-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 text-sm shadow"
                            >
                                <span>Settle Remaining Clearance Items</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                                ✓ All Graduation Clearance Categories Cleared!
                            </div>
                        )}
                    </div>

                    {/* Account Activation / Login Section */}
                    <div className="w-full text-left bg-gradient-to-br from-slate-50 to-amber-50/30 p-6 rounded-2xl border border-amber-200/60">
                        <div className="flex items-center gap-2 mb-2">
                            <KeyRound className="w-5 h-5 text-amber-600" />
                            <h3 className="text-sm font-black uppercase text-slate-800 tracking-wide">
                                Student Portal Account
                            </h3>
                        </div>
                        <p className="text-xs text-slate-600 mb-4 leading-snug">
                            Activate your student portal login so you can make subsequent payments, check clearance approval, and view all your receipts at any time.
                        </p>

                        {accountSuccess ? (
                            <div className="bg-emerald-100/80 border border-emerald-300 p-4 rounded-xl text-xs text-emerald-900 mb-2">
                                <p className="font-bold mb-2 flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-700" /> {accountSuccess}
                                </p>
                                <Link
                                    href={`/login?loginId=${encodeURIComponent(paymentDetails?.matricNumber || '')}`}
                                    className="bg-emerald-800 text-white px-4 py-2 rounded-lg font-bold inline-block hover:bg-emerald-900 text-xs"
                                >
                                    Log In with Matric Number ({paymentDetails?.matricNumber})
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateAccount} className="space-y-3">
                                {accountError && (
                                    <div className="bg-red-50 text-red-600 p-2.5 rounded-lg text-xs font-semibold">
                                        {accountError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Login ID (Your Matric Number)
                                    </label>
                                    <input 
                                        type="text" 
                                        disabled 
                                        value={paymentDetails?.matricNumber || ""} 
                                        className="w-full p-2.5 bg-slate-200 text-slate-700 font-mono font-bold text-xs rounded-lg cursor-not-allowed" 
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Create Password *
                                        </label>
                                        <input 
                                            required 
                                            type="password" 
                                            placeholder="Min 6 characters" 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Confirm Password *
                                        </label>
                                        <input 
                                            required 
                                            type="password" 
                                            placeholder="Repeat password" 
                                            value={confirmPassword} 
                                            onChange={e => setConfirmPassword(e.target.value)} 
                                            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={accountLoading}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
                                >
                                    {accountLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                                    ) : (
                                        <>
                                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Set Password & Activate Portal Account</span>
                                        </>
                                    )}
                                </button>
                                <div className="text-center pt-1">
                                    <Link 
                                        href={`/login?loginId=${encodeURIComponent(paymentDetails?.matricNumber || '')}`} 
                                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                                    >
                                        Already have an active password? Log in here →
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {status === "error" && (
                <div className="flex flex-col items-center text-center">
                    <XCircle className="w-20 h-20 text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Verification Incomplete</h2>
                    <p className="text-slate-600 text-sm mb-8">{message}</p>
                    <Link href="/alumni/certificate" className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors text-sm">
                        Return to Certificate Portal
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function CertificateVerifyPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <Suspense fallback={
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                    <p className="text-slate-500 text-sm">Loading verification...</p>
                </div>
            }>
                <VerifyContent />
            </Suspense>
        </div>
    );
}
