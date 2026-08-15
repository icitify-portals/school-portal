"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyCertificatePayment } from "@/actions/alumni-requests";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"verifying" | "success" | "error" | "redirecting">("verifying");
    const [message, setMessage] = useState("Verifying your payment...");

    useEffect(() => {
        const ref = searchParams.get("ref");
        if (!ref) {
            setStatus("error");
            setMessage("Invalid payment reference.");
            return;
        }

        verifyCertificatePayment(ref).then(res => {
            if (res.success) {
                if (res.nextPaymentUrl) {
                    setStatus("redirecting");
                    setMessage("Convocation fee paid successfully. Redirecting to pay processing fee...");
                    setTimeout(() => router.push(res.nextPaymentUrl!), 2000);
                } else if (res.fullyPaid) {
                    setStatus("success");
                    setMessage("All fees paid successfully! Your certificate request has been submitted and is pending approval.");
                } else {
                    setStatus("error");
                    setMessage("Payment verification incomplete.");
                }
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
            
            {status === "redirecting" && (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Almost Done...</h2>
                    <p className="text-slate-500">{message}</p>
                </div>
            )}

            {status === "success" && (
                <div className="flex flex-col items-center">
                    <CheckCircle className="w-20 h-20 text-emerald-500 mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Payment Successful!</h2>
                    <p className="text-slate-600 mb-8">{message}</p>
                    <Link href="/" className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors">
                        Return to Portal
                    </Link>
                </div>
            )}

            {status === "error" && (
                <div className="flex flex-col items-center">
                    <XCircle className="w-20 h-20 text-red-500 mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Verification Failed</h2>
                    <p className="text-slate-600 mb-8">{message}</p>
                    <Link href="/alumni/certificate" className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors">
                        Try Again
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
