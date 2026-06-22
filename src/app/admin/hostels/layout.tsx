"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building, Users, Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
    { name: 'Dashboard', href: '/admin/hostels', icon: Activity },
    { name: 'Buildings & Rooms', href: '/admin/hostels/buildings', icon: Building },
    { name: 'Allocations', href: '/admin/hostels/allocations', icon: Users },
    { name: 'Settings', href: '/admin/hostels/settings', icon: Settings },
];

export default function HostelAdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="p-4 md:p-8 max-w-[1600px] w-full mx-auto space-y-8 relative">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Hostel Management</h2>
                <p className="text-slate-500 mt-1">Manage campus accommodations and student bed allocations</p>
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
                                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                                    : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
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
