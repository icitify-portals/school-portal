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
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
          <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <FolderTree className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                            Institutional Accounting
                        </h2>
                    </div>
                    <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                        Core financial infrastructure and regulatory reporting
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-indigo-600 text-white backdrop-blur-3xl rounded-[2.5rem] hover:shadow-2xl transition-all relative overflow-hidden group">
                    <CardContent className="p-8">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 drop-shadow-sm">Total Assets</p>
                        <h3 className="text-4xl font-black mb-1 drop-shadow-md">₦0.00</h3>
                        <p className="text-xs font-bold opacity-70">Aggregated from Asset COA codes</p>
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                            <BarChart3 className="w-16 h-16" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-slate-900 text-white backdrop-blur-3xl rounded-[2.5rem] hover:shadow-2xl transition-all relative overflow-hidden group">
                    <CardContent className="p-8">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 drop-shadow-sm">Total Liabilities</p>
                        <h3 className="text-4xl font-black mb-1 drop-shadow-md">₦0.00</h3>
                        <p className="text-xs font-bold opacity-70">Aggregated from Liability COA codes</p>
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                            <BarChart3 className="w-16 h-16" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 text-slate-900 backdrop-blur-3xl rounded-[2.5rem] hover:shadow-2xl transition-all relative overflow-hidden group">
                    <CardContent className="p-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 drop-shadow-sm">Net Equity</p>
                        <h3 className="text-4xl font-black mb-1 drop-shadow-md">₦0.00</h3>
                        <p className="text-xs font-bold text-slate-500">Assets minus Liabilities</p>
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-slate-900">
                            <Scale className="w-16 h-16" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {filteredModules.map((module) => (
                    <Link key={module.name} href={module.href}>
                        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] hover:shadow-2xl transition-all cursor-pointer group overflow-hidden h-full">
                            <CardContent className="p-8">
                                <div className={cn("p-4 rounded-2xl w-fit mb-6 transition-colors shadow-inner", module.bg)}>
                                    <module.icon className={cn("w-8 h-8 drop-shadow-sm", module.color)} />
                                </div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                        {module.name}
                                    </h4>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">
                                    {module.description}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Module Configuration Section */}
            <div className="pt-10 border-t border-slate-200/50">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-slate-900 rounded-[1.5rem] text-white shadow-md">
                        <Settings2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic drop-shadow-sm">Institutional Modules</h3>
                        <p className="text-sm text-slate-500 font-bold opacity-80 uppercase tracking-widest mt-1">Activate or deactivate advanced institutional ERP suites</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {modules.filter(m => m.setting).map(m => (
                        <Card key={m.name} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:shadow-2xl transition-all relative overflow-hidden group">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-3 rounded-[1.2rem] shadow-inner", m.bg)}>
                                        <m.icon className={cn("w-5 h-5 drop-shadow-sm", m.color)} />
                                    </div>
                                    <span className="text-base font-black uppercase text-slate-800 tracking-tight">{m.name}</span>
                                </div>
                                <Button
                                    variant={settings[m.setting!] === "enabled" ? "default" : "outline"}
                                    className={cn(
                                        "font-black uppercase tracking-widest rounded-xl h-10 px-5 transition-all shadow-md active:scale-95",
                                        settings[m.setting!] === "enabled" ? "bg-slate-900 hover:bg-slate-800 text-white" : "text-slate-400 hover:text-slate-600 bg-white"
                                    )}
                                    onClick={() => toggleModule(m.setting!)}
                                    disabled={updating === m.setting}
                                >
                                    {updating === m.setting ? <Loader2 className="w-4 h-4 animate-spin" /> : (settings[m.setting!] === "enabled" ? "Enabled" : "Disabled")}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
       </div>
    );
}
