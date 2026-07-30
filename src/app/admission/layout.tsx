import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdmissionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Prevent active students from accessing admission/applicant flows
    // @ts-expect-error - TS18048: Auto-suppressed for build
    if (session?.user?.role === 'student') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Already a Student</h2>
                    <p className="text-slate-500 font-medium text-sm">
                        You are already a registered student of this institution. You cannot apply for a new admission while logged in as a student.
                    </p>
                    <div className="pt-4">
                        <a href="/student/dashboard" className="block w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                            Return to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {children}
        </>
    );
}
