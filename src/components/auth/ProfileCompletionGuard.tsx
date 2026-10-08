"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStudentProfileStatus } from "@/actions/student-profile";
import { AlertCircle, ArrowRight, X, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [pendingForm, setPendingForm] = useState<string | null>(null);
    const [showReminderToast, setShowReminderToast] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initial check on mount
    useEffect(() => {
        getStudentProfileStatus().then((res) => {
            if (res.success && !res.isComplete) {
                setPendingForm("complete-profile");
                
                // If the student just logged in and lands on root student dashboard or home,
                // present the form directly to them without blocking other critical pages (finance/results).
                const hasShownDirectForm = sessionStorage.getItem("fss_profile_form_shown");
                if (!hasShownDirectForm && (pathname === "/student" || pathname === "/dashboard")) {
                    sessionStorage.setItem("fss_profile_form_shown", "true");
                    router.replace("/student/complete-profile");
                }
            } else {
                setPendingForm(null);
            }
        }).catch((err) => console.error("Profile guard status error:", err));
    }, [pathname, router]);

    // Setup the 10-minute recurring reminder when navigated away from the form
    useEffect(() => {
        if (!pendingForm) return;

        // If the user is currently on the form page, don't show the reminder popup
        const isCurrentlyOnForm = pathname === "/student/complete-profile" ||
                                  pathname === "/student/matriculation" ||
                                  pathname === "/student/medical";

        if (isCurrentlyOnForm) {
            setShowReminderToast(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // When navigating away, check if 10 mins have elapsed or setup the 10 min reminder timer
        if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
                setShowReminderToast(true);
            }, TEN_MINUTES_MS);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [pathname, pendingForm]);

    return (
        <>
            {children}

            {/* Non-intrusive 10-Minute Profile Completion Reminder Modal / Toast */}
            {showReminderToast && pendingForm && (
                <div className="fixed bottom-6 right-6 z-[9999] max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border border-slate-700/80 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black tracking-tight text-white uppercase">Profile Update Reminder</h4>
                                    <p className="text-xs text-slate-300 mt-0.5">
                                        Your student record profile form is still incomplete.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReminderToast(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                                title="Dismiss reminder"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Link
                                href="/student/complete-profile"
                                onClick={() => setShowReminderToast(false)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all shadow-md"
                            >
                                Complete Form Now <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <button
                                onClick={() => setShowReminderToast(false)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all border border-slate-700"
                            >
                                Remind Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}