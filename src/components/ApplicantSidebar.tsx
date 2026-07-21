"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LogOut, FileText, Home, HelpCircle, Receipt } from "lucide-react";
import { NotificationBell } from "@/app/applicant/NotificationBell";
import { useSession, signOut } from "next-auth/react";

export function ApplicantSidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/applicant" && pathname !== "/applicant") return false;
        return pathname?.startsWith(path);
    };

    return (
        <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col shrink-0">
            <div className="mb-8">
                <h1 className="text-xl font-black text-white italic uppercase tracking-wider">Applicant<br/><span className="text-emerald-500">Portal</span></h1>
            </div>

            <nav className="flex-1 space-y-2">
                <Link href="/applicant" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${isActive("/applicant") && pathname === "/applicant" ? "bg-slate-800/50 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                    <Home className={`w-4 h-4 ${isActive("/applicant") && pathname === "/applicant" ? "text-emerald-400" : ""}`} />
                    Dashboard
                </Link>
                <Link href="/applicant/receipts" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${isActive("/applicant/receipts") ? "bg-slate-800/50 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                    <Receipt className="w-4 h-4" />
                    Receipts
                </Link>
                <Link href="/guide/applicants" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${pathname === "/guide/applicants" ? "bg-slate-800/50 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                    <HelpCircle className={`w-4 h-4 ${pathname === "/guide/applicants" ? "text-emerald-400" : ""}`} />
                    Application Instructions
                </Link>
                <Link href="/applicant/notifications" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${isActive("/applicant/notifications") ? "bg-slate-800/50 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                    <NotificationBell />
                    Notifications
                </Link>
            </nav>

            {session?.user && (
                <div className="pt-6 border-t border-slate-800 mt-auto">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">{session.user.name}</p>
                            <p className="text-[10px] text-slate-500">{session.user.email}</p>
                        </div>
                    </div>
                    <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 font-bold text-sm hover:bg-red-500/10 transition-colors text-left">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </aside>
    );
}
