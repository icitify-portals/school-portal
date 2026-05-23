"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileText, HeartPulse, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
    { name: 'Dashboard', href: '/student/health', icon: Activity },
    { name: 'Appointments', href: '/student/health/appointments', icon: HeartPulse },
    { name: 'Registration', href: '/student/health/registration', icon: Settings },
    { name: 'Medical Records', href: '/student/health/records', icon: FileText },
    { name: 'Vitals History', href: '/student/health/vitals', icon: HeartPulse },
];

export default function StudentHealthLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 relative">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Health Services</h2>
                <p className="text-slate-500 mt-1">Manage your medical records and clinic history</p>
            </div>

            <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-px hide-scrollbar sticky top-0 bg-slate-50 z-10 p-1">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 text-sm font-bold capitalize transition-all whitespace-nowrap border-b-2 rounded-t-xl",
                                isActive
                                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                                    : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-slate-400")} />
                            {tab.name}
                        </Link>
                    )
                })}
            </div>

            <main className="animate-in fade-in duration-300">
                {children}
            </main>
        </div>
    );
}
