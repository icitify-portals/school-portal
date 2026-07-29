"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyTranscriptAlatpay, verifyTranscriptPaystack } from "@/actions/transcript-requests";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TranscriptVerifyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reference = searchParams.get("ref");

    const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'partial'>('verifying');
    const [message, setMessage] = useState("Verifying your payment, please wait...");

    useEffect(() => {
        if (!reference) {
            setStatus('failed');
            setMessage("Invalid payment reference.");
            return;
        }

        async function verify() {
            try {
                if (reference?.startsWith('TR-ALAT-')) {
                    const res = await verifyTranscriptAlatpay(reference);
                    if (res.success && res.nextStep === 'paystack') {
                        setStatus('partial');
                        setMessage("Transcript Fee (ALATPay) successful. Redirecting to Paystack for Processing Fee...");
                        setTimeout(() => router.push(res.url), 2000);
                    } else {
                        setStatus('failed');
                        setMessage(res.error || "Verification failed");
                    }
                } else if (reference?.startsWith('TR-PAY-')) {
                    const res = await verifyTranscriptPaystack(reference);
                    if (res.success) {
                        setStatus('success');
                        setMessage("Payment fully completed! Your transcript request has been queued for processing.");
                    } else {
                        setStatus('failed');
                        setMessage(res.error || "Verification failed");
                    }
                } else if (reference === 'FREE-BYPASS') {
                    setStatus('success');
                    setMessage("Request submitted successfully (Fee waived). Your transcript request has been queued for processing.");
                } else {
                    setStatus('failed');
                    setMessage("Unknown transaction reference.");
                }
            } catch (err: any) {
                setStatus('failed');
                setMessage(err.message || "An error occurred.");
            }
        }

        verify();
    }, [reference, router]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">Verifying Payment</h2>
                        <p className="text-slate-500 mt-2">{message}</p>
                    </div>
                )}
                {status === 'partial' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">Step 1 Complete</h2>
                        <p className="text-slate-500 mt-2">{message}</p>
                    </div>
                )}
                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800">Application Successful</h2>
                        <p className="text-slate-500 mt-2">{message}</p>
                        <Link href="/" className="mt-8 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
                            Return to Homepage
                        </Link>
                    </div>
                )}
                {status === 'failed' && (
                    <div className="flex flex-col items-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800">Verification Failed</h2>
                        <p className="text-slate-500 mt-2">{message}</p>
                        <Link href="/transcript-application" className="mt-8 bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-900">
                            Try Again
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
