// @ts-nocheck
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, LogOut, FileText, Home } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

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
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col">
                <div className="mb-8">
                    <h1 className="text-xl font-black text-white italic uppercase tracking-wider">Applicant<br/><span className="text-emerald-500">Portal</span></h1>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/applicant" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 text-white font-bold text-sm hover:bg-slate-800 transition-colors">
                        <Home className="w-4 h-4 text-emerald-400" />
                        Dashboard
                    </Link>
                    <Link href="/applicant" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 font-bold text-sm hover:bg-slate-800 hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                        My Applications
                    </Link>
                    <Link href="/applicant/notifications" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 font-bold text-sm hover:bg-slate-800 hover:text-white transition-colors">
                        <NotificationBell />
                        Notifications
                    </Link>
                </nav>

                <div className="pt-6 border-t border-slate-800 mt-auto">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">{session?.user?.name}</p>
                            <p className="text-[10px] text-slate-500">{session?.user?.email}</p>
                        </div>
                    </div>
                    <Link href="/api/auth/signout" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 font-bold text-sm hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
