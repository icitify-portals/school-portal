"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStudentProfileStatus } from "@/actions/student-profile";

export function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Skip check if already on the complete-profile page
        if (pathname === "/student/complete-profile") {
            setChecking(false);
            return;
        }

        getStudentProfileStatus().then((res) => {
            if (res.success && !res.isComplete) {
                router.replace("/student/complete-profile");
            } else {
                setChecking(false);
            }
        }).catch(() => setChecking(false));
    }, [pathname, router]);

    // Don't block rendering on the complete-profile page
    if (pathname === "/student/complete-profile") {
        return <>{children}</>;
    }

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}