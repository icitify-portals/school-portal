"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyCertificatePayment } from "@/actions/alumni-requests";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"verifying" | "success" | "error" | "redirecting">("verifying");
    const [message, setMessage] = useState("Verifying your payment with gateway...");
    const [allPaid, setAllPaid] = useState(false);

    useEffect(() => {
        const ref = searchParams.get("ref");
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
                setAllPaid(!!res.allCompulsoryPaid);
            } else {
                setStatus("error");
                setMessage(res.error || "Failed to verify payment.");
            }
        }).catch(() => {
            setStatus("error");
            setMessage("An unexpected error occurred during verification.");
        });
    }, [searchParams, router]);

    return (
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center border border-slate-100">
            {status === "verifying" && (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifying Payment</h2>
                    <p className="text-slate-500">{message}</p>
                </div>
            )}
            
            {status === "success" && (
                <div className="flex flex-col items-center">
                    <CheckCircle className="w-20 h-20 text-emerald-500 mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Verified!</h2>
                    <p className="text-slate-600 mb-6 leading-relaxed">{message}</p>
                    
                    <div className="flex flex-col w-full gap-3">
                        {!allPaid ? (
                            <>
                                <Link href="/alumni/certificate" className="bg-amber-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2">
                                    <span>Settle Remaining Clearance Category</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-2">
                                    Return to Home Page
                                </Link>
                            </>
                        ) : (
                            <Link href="/" className="bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                                Return to Portal
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {status === "error" && (
                <div className="flex flex-col items-center">
                    <XCircle className="w-20 h-20 text-red-500 mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Verification Incomplete</h2>
                    <p className="text-slate-600 mb-8">{message}</p>
                    <Link href="/alumni/certificate" className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors">
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
            <Suspense fallback={<div className="flex flex-col items-center"><Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" /><p className="text-slate-500">Loading...</p></div>}>
                <VerifyContent />
            </Suspense>
        </div>
    );
}
