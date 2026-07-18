"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewApplicationRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Create a form and submit it programmatically to trigger the API route
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/api/applicant/start-application";
        form.style.display = "none";
        document.body.appendChild(form);
        form.submit();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-500">Preparing your application...</p>
            </div>
        </div>
    );
}
