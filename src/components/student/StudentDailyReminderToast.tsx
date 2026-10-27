"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Stethoscope, BookOpen } from "lucide-react";

export function StudentDailyReminderToast() {
    const router = useRouter();

    useEffect(() => {
        try {
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
            const lastShown = localStorage.getItem("fss_student_daily_reminder_date");

            // Show once per calendar day
            if (lastShown !== today) {
                // Short timeout to ensure UI is mounted and not jarring
                const timer = setTimeout(() => {
                    toast.custom(
                        (t) => (
                            <div className="w-full max-w-md bg-white border border-indigo-100 rounded-2xl shadow-2xl p-4 space-y-3 pointer-events-auto">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                                        <ClipboardCheck className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-slate-900">Daily Academic Reminder</h4>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                            Please ensure your <strong>Student Dossier</strong>, <strong>Health Form</strong>, and <strong>Course Registration</strong> are completely updated for the 2026/2027 academic session.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            toast.dismiss(t);
                                            router.push("/student/dossier");
                                        }}
                                        className="px-2 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                                    >
                                        <ClipboardCheck className="w-3.5 h-3.5" /> Dossier
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            toast.dismiss(t);
                                            router.push("/student/medical");
                                        }}
                                        className="px-2 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Stethoscope className="w-3.5 h-3.5" /> Health Form
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            toast.dismiss(t);
                                            router.push("/student/courses/registration");
                                        }}
                                        className="px-2 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                                    >
                                        <BookOpen className="w-3.5 h-3.5" /> Course Reg
                                    </button>
                                </div>
                            </div>
                        ),
                        {
                            duration: 12000,
                            position: "top-right",
                        }
                    );

                    localStorage.setItem("fss_student_daily_reminder_date", today);
                }, 1500);

                return () => clearTimeout(timer);
            }
        } catch (e) {
            // Silently ignore localStorage errors if disabled
        }
    }, [router]);

    return null;
}
