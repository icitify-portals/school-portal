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
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Bursary Management</h2>
                    <p className="text-slate-500 mt-1">Centralized control for institutional finances and student accounts</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Viewing Data For:</span>
                    <SessionSelector onSessionChange={setSelectedSession} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allowedModules.map((module) => (
                    <Link key={module.name} href={module.href}>
                        <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                            <CardContent className="pt-6 h-full flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("p-3 rounded-xl", module.bg)}>
                                        <module.icon className={cn("w-6 h-6", module.color)} />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{module.name}</h3>
                                <p className="text-slate-500 text-sm flex-1">{module.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
