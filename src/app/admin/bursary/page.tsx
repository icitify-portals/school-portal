"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Wallet,
    Settings,
    Percent,
    Layers,
    ListChecks,
    ArrowRight,
    GraduationCap,
    Landmark,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SessionSelector } from "@/components/SessionSelector";
import { useState } from "react";
import { BursarySummaryCards } from "./BursarySummaryCards";

import { useSession } from "next-auth/react";

const bursaryModules = [
    {
        name: "Fee Items",
        description: "Create and manage individual fee types (Tuition, Medical, etc.)",
        href: "/admin/bursary/fees",
        icon: ListChecks,
        color: "text-blue-600",
        bg: "bg-blue-50",
        permission: "finance.view_detailed"
    },
    {
        name: "Fee Structures",
        description: "Group fee items into structures for levels and academic years",
        href: "/admin/bursary/fees?tab=structures",
        icon: Layers,
        color: "text-purple-600",
        bg: "bg-purple-50",
        permission: "finance.view_detailed"
    },
    {
        name: "Allocations",
        description: "Assign fee structures to Faculties, Departments, or Programmes",
        href: "/admin/bursary/allocations",
        icon: Wallet,
        color: "text-green-600",
        bg: "bg-green-50",
        permission: "finance.view_detailed"
    },
    {
        name: "Discounts",
        description: "Manage student discount requests and approvals",
        href: "/admin/bursary/discounts",
        icon: Percent,
        color: "text-orange-600",
        bg: "bg-orange-50",
        permission: "finance.view_detailed"
    },
    {
        name: "Fund Outflow",
        description: "Manage expenditure requests from HODs and DEANs",
        href: "/admin/bursary/expenditure",
        icon: ArrowRight,
        color: "text-red-600",
        bg: "bg-red-50",
        permission: "finance.view_detailed"
    },
    {
        name: "External Inflows",
        description: "Record funds received from external sources",
        href: "/admin/bursary/inflows",
        icon: Wallet,
        color: "text-blue-600",
        bg: "bg-blue-50",
        permission: "finance.view_detailed"
    },
    {
        name: "Scholarships & Sponsorships",
        description: "Manage internal and external student scholarships",
        href: "/admin/bursary/scholarships",
        icon: GraduationCap,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        permission: "finance.view_detailed"
    },
    {
        name: "NELFUND",
        description: "Process government student loans and bulk disbursements",
        href: "/admin/bursary/nelfund",
        icon: Landmark,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
        permission: "finance.view_detailed"
    },
    {
        name: "Aging Analysis & AR",
        description: "View outstanding student debts by aging brackets",
        href: "/admin/bursary/aging",
        icon: BarChart3,
        color: "text-amber-600",
        bg: "bg-amber-50",
        permission: "finance.view_summary"
    },
    {
        name: "Settings",
        description: "Configure payment modes, late fees, and approval workflows",
        href: "/admin/bursary/settings",
        icon: Settings,
        color: "text-slate-600",
        bg: "bg-slate-50",
        permission: "finance.view_detailed"
    }
];

export default function BursaryDashboardPage() {
    const [selectedSession, setSelectedSession] = useState("");
    const { data: session } = useSession();
    const permissions = (session?.user as any)?.permissions || [];
    const isSuperAdmin = (session?.user as any)?.role === "superadmin";

    const allowedModules = bursaryModules.filter(m => 
        isSuperAdmin || permissions.includes(m.permission) || !m.permission
    );

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-slate-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Landmark className="w-12 h-12 text-emerald-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Bursary Operations
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Centralized control for institutional finances and student accounts
                </p>
            </div>
            
            <div className="relative z-10 flex flex-col items-end gap-2 bg-white/15 p-4 rounded-[1.5rem] border border-white/10 shadow-inner">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Viewing Session:</span>
                <SessionSelector onSessionChange={setSelectedSession} />
            </div>
        </div>

        <BursarySummaryCards session={selectedSession} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[200px]">
            {allowedModules.map((module, idx) => {
                const isLarge = idx === 0 || idx === 1; // Make the first two items larger
                return (
                    <Link key={module.name} href={module.href} className={cn("block group active:scale-[0.98] transition-transform", isLarge ? "md:col-span-2" : "col-span-1")}>
                        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden relative group hover:shadow-2xl transition-all h-full flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                            <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("p-4 rounded-2xl border shadow-sm group-hover:scale-110 transition-transform", 
                                        module.bg === "bg-blue-50" ? "bg-blue-100/80 text-blue-700 border-blue-200" :
                                        module.bg === "bg-purple-50" ? "bg-purple-100/80 text-purple-700 border-purple-200" :
                                        module.bg === "bg-green-50" ? "bg-green-100/80 text-green-700 border-green-200" :
                                        module.bg === "bg-orange-50" ? "bg-orange-100/80 text-orange-700 border-orange-200" :
                                        module.bg === "bg-red-50" ? "bg-red-100/80 text-red-700 border-red-200" :
                                        module.bg === "bg-emerald-50" ? "bg-emerald-100/80 text-emerald-700 border-emerald-200" :
                                        module.bg === "bg-indigo-50" ? "bg-indigo-100/80 text-indigo-700 border-indigo-200" :
                                        module.bg === "bg-amber-50" ? "bg-amber-100/80 text-amber-700 border-amber-200" :
                                        "bg-slate-100/80 text-slate-700 border-slate-200"
                                    )}>
                                        <module.icon className={isLarge ? "w-7 h-7" : "w-6 h-6"} />
                                    </div>
                                    <div className="p-2 bg-white/80 rounded-xl border border-white/60 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shadow-sm">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className={cn("font-black text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight", isLarge ? "text-2xl" : "text-lg")}>{module.name}</h3>
                                    <p className="text-slate-500 font-bold leading-snug mt-1.5 text-xs uppercase tracking-wide opacity-80">{module.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                );
            })}
        </div>
      </div>
    </div>
    );
}
