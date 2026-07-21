"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { verifyDeveloperFee } from "@/actions/paystack-developer-subscription";
import { toast } from "sonner";

export default function DeveloperVerifyPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const reference = searchParams.get("reference") || searchParams.get("trxref") || "";
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [message, setMessage] = useState("Verifying your payment with Paystack...");
    const [appId, setAppId] = useState<number | null>(null);

    useEffect(() => {
        if (!reference) {
            setStatus('failed');
            setMessage("Invalid payment reference. Return to your dashboard.");
            return;
        }

        async function verify() {
            try {
                const res = await verifyDeveloperFee(reference);
                if (res.success) {
                    setStatus('success');
                    setMessage("Payment verified successfully! Redirecting...");
                    toast.success("Payment verified successfully!");
                    if (res.applicationId) {
                        setAppId(res.applicationId);
                        setTimeout(() => router.push(`/applicant/application/${res.applicationId}`), 3000);
                    } else if (reference.startsWith('DEV-ADM-')) {
                        setTimeout(() => router.push('/applicant'), 3000);
                    } else {
                        setTimeout(() => router.push('/student/finance'), 3000);
                    }
                } else {
                    setStatus('failed');
                    setMessage(res.error || "Verification failed. Please try again or contact support.");
                }
            } catch (err: any) {
                setStatus('failed');
                setMessage("An unexpected error occurred during verification.");
            }
        }

        verify();
    }, [reference, router]);

    const handleReturn = () => {
        if (appId) {
            router.push(`/applicant/application/${appId}`);
        } else if (reference.startsWith('DEV-ADM-')) {
            router.push('/applicant');
        } else {
            router.push('/student/finance');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Payment Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    {status === 'verifying' && (
                        <div className="py-8 flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                            <p className="text-slate-400">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-8 flex flex-col items-center gap-4">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                            <p className="text-emerald-400 font-medium">{message}</p>
                        </div>
                    )}

                    {status === 'failed' && (
                        <div className="py-8 flex flex-col items-center gap-4">
                            <XCircle className="w-16 h-16 text-rose-500" />
                            <p className="text-rose-400 font-medium">{message}</p>
                        </div>
                    )}

                    {status !== 'verifying' && (
                        <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-500"
                            onClick={handleReturn}
                        >
                            {reference.startsWith('DEV-ADM-') ? "Return to Applicant Dashboard" : "Return to Dashboard"}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
