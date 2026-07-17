"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email address...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No verification token provided.");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch("/api/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus("success");
                    setMessage(data.message || "Email verified successfully!");
                } else {
                    setStatus("error");
                    setMessage(data.message || "Verification failed.");
                }
            } catch (err) {
                setStatus("error");
                setMessage("An error occurred during verification.");
            }
        };

        verify();
    }, [token]);

    return (
        <Card className="w-full max-w-md border-none shadow-xl rounded-[2rem] bg-white text-center p-6">
            <CardHeader>
                <div className="flex justify-center mb-4">
                    {status === "loading" && <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />}
                    {status === "success" && <CheckCircle2 className="w-16 h-16 text-green-500" />}
                    {status === "error" && <XCircle className="w-16 h-16 text-red-500" />}
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                    {status === "loading" && "Verifying Email"}
                    {status === "success" && "Email Verified!"}
                    {status === "error" && "Verification Failed"}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-slate-600">{message}</p>
                {status === "success" && (
                    <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 rounded-xl text-lg h-auto">
                        <Link href="/login">Continue to Login</Link>
                    </Button>
                )}
                {status === "error" && (
                    <Button asChild variant="outline" className="w-full py-6 rounded-xl text-lg h-auto">
                        <Link href="/register">Back to Registration</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Suspense fallback={<Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
