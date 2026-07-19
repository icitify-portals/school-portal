"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewApplicationRedirect() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startApp = async () => {
            try {
                const res = await fetch("/api/applicant/start-application", {
                    method: "POST",
                });
                if (res.redirected) {
                    router.push(res.url);
                } else if (res.ok) {
                    const data = await res.json();
                    if (data.redirectUrl) {
                        router.push(data.redirectUrl);
                    }
                } else {
                    const text = await res.text();
                    console.error("Failed to start application:", text);
                    setError(text);
                }
            } catch (err: any) {
                console.error("Error starting application:", err);
                setError(err.message || String(err));
            }
        };
        startApp();
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md w-full p-6">
                {!error ? (
                    <>
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-bold text-slate-500">Preparing your application...</p>
                    </>
                ) : (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-600">
                        <p className="font-bold">Failed to start application</p>
                        <p className="text-sm mt-2">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
