"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    LayoutDashboard,
    FolderTree,
    BookOpen,
    PieChart,
    TrendingUp,
    ArrowRight,
    Users,
    ShieldCheck,
    BarChart3,
    Truck,
    ShieldAlert,
    Scale,
    Hammer,
    Settings2,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getBursarySettings, updateBursarySetting } from "@/actions/bursary";
import { Button } from "@/components/ui/button";

const modules = [
    {
        name: "Chart of Accounts",
        description: "Manage accounting codes and institutional ledger heads",
        href: "/admin/accounting/coa",
        icon: FolderTree,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
        category: "Core"
    },
    {
        name: "Vendors & AP",
        description: "Institutional supplier directory and payment profiles",
        href: "/admin/accounting/vendors",
        icon: Truck,
        color: "text-rose-600",
        bg: "bg-rose-50",
        category: "Core"
    },
    {
        name: "Budgets & Control",
        description: "Departmental expenditure limits and utilization tracking",
        href: "/admin/accounting/budgets",
        icon: TrendingUp,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        category: "Core"
    },
    {
        name: "General Ledger",
        description: "View and filter all double-entry accounting transactions",
        href: "/admin/accounting/ledger",
        icon: BookOpen,
        color: "text-blue-600",
        bg: "bg-blue-50",
        category: "Core"
    },
    {
        name: "Trial Balance",
        description: "Verify institutional financial integrity (DR = CR)",
        href: "/admin/accounting/reports/trial-balance",
        icon: ShieldCheck,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        category: "Reporting"
    },
    {
        name: "Fraud Sentinel",
        description: "AI-driven anomaly detection and institutional security audit",
        href: "/admin/accounting/fraud",
        icon: ShieldAlert,
        color: "text-rose-600",
        bg: "bg-rose-50",
        category: "Security",
        setting: "module_fraud_enabled"
    },
    {
        name: "Liquidity Forecasting",
        description: "AI-driven 6-month cash flow projections and liquidity health",
        href: "/admin/accounting/forecasting",
        icon: TrendingUp,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
        category: "Advanced",
        setting: "module_forecasting_enabled"
    },
    {
        name: "Profit & Loss",
        description: "Institutional income and expense state for current term",
        href: "/admin/accounting/reports/pnl",
        icon: PieChart,
        color: "text-orange-600",
        bg: "bg-orange-50",
        category: "Reporting"
    },
    {
        name: "Balance Sheet",
        description: "Statement of financial position (Assets, Liabilities & Equity)",
        href: "/admin/accounting/reports/balance-sheet",
        icon: Scale,
        color: "text-slate-600",
        bg: "bg-slate-50",
        category: "Reporting"
    },
    {
        name: "Fixed Assets",
        description: "Track institutional assets and automated depreciation",
        href: "/admin/accounting/assets",
        icon: Hammer,
        color: "text-amber-600",
        bg: "bg-amber-50",
        category: "Advanced",
        setting: "module_assets_enabled"
    },
];

export default function AccountingDashboard() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const s = await getBursarySettings();
        setSettings(s);
        setLoading(false);
    };

    const toggleModule = async (key: string) => {
        setUpdating(key);
        const currentValue = settings[key] === "enabled" ? "disabled" : "enabled";
        const res = await updateBursarySetting(key, currentValue);
        if (res.success) {
            setSettings(prev => ({ ...prev, [key]: currentValue }));
        }
        setUpdating(null);
    };

    const filteredModules = modules.filter(m => {
        if (!m.setting) return true;
        return settings[m.setting] === "enabled";
    });
    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Institutional Accounting</h2>
                <p className="text-slate-500 mt-1">Core financial infrastructure and regulatory reporting</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="border-none shadow-sm bg-indigo-600 text-white">
                    <CardContent className="p-6">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total Assets</p>
                        <h3 className="text-3xl font-extrabold mb-1">₦0.00</h3>
                        <p className="text-[10px] opacity-70">Aggregated from Asset COA codes</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-slate-900 text-white">
                    <CardContent className="p-6">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total Liabilities</p>
                        <h3 className="text-3xl font-extrabold mb-1">₦0.00</h3>
                        <p className="text-[10px] opacity-70">Aggregated from Liability COA codes</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm border border-slate-100">
                    <CardContent className="p-6">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Net Equity</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 mb-1">₦0.00</h3>
                        <p className="text-[10px] text-slate-400">Assets minus Liabilities</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {filteredModules.map((module) => (
                    <Link key={module.name} href={module.href}>
                        <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden border border-slate-50">
                            <CardContent className="p-6">
                                <div className={cn("p-3 rounded-2xl w-fit mb-4 transition-colors", module.bg)}>
                                    <module.icon className={cn("w-6 h-6", module.color)} />
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                        {module.name}
                                    </h4>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                    {module.description}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Module Configuration Section */}
            <div className="pt-10 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-slate-900 rounded-lg text-white">
                        <Settings2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Institutional Modules</h3>
                        <p className="text-xs text-slate-500 font-medium">Activate or deactivate advanced institutional ERP suites</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {modules.filter(m => m.setting).map(m => (
                        <Card key={m.name} className="border-none shadow-sm bg-slate-50/50">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-xl", m.bg)}>
                                        <m.icon className={cn("w-4 h-4", m.color)} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{m.name}</span>
                                </div>
                                <Button
                                    variant={settings[m.setting!] === "enabled" ? "default" : "outline"}
                                    className={cn(
                                        "font-bold rounded-lg h-8 px-4",
                                        settings[m.setting!] === "enabled" ? "bg-slate-900 hover:bg-slate-800" : "text-slate-400"
                                    )}
                                    onClick={() => toggleModule(m.setting!)}
                                    disabled={updating === m.setting}
                                >
                                    {updating === m.setting ? <Loader2 className="w-3 h-3 animate-spin" /> : (settings[m.setting!] === "enabled" ? "Enabled" : "Disabled")}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
