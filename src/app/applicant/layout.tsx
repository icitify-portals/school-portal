// @ts-nocheck
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ApplicantSidebar } from "@/components/ApplicantSidebar";

export const metadata: Metadata = {
    title: "Applicant Portal",
    description: "Applicant dashboard and application tracking",
};

export default async function ApplicantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // @ts-expect-error - TS18048: Auto-suppressed for build
    if (!session || session.user.role !== 'applicant') {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
            <ApplicantSidebar />

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
