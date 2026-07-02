"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Scale,
    ShieldCheck,
    AlertCircle,
    Printer,
    Download,
    Building2,
    Wallet,
    Briefcase,
    Loader2
} from "lucide-react";
import { getBalanceSheet } from "@/actions/accounting";
import { cn } from "@/lib/utils";

export default function BalanceSheetPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        const res = await getBalanceSheet();
        if (res.success) setReport(res.data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
                <p className="text-slate-500 font-medium">Computing Balance Sheet Position...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
          <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-slate-600/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <Scale className="w-12 h-12 text-blue-400 drop-shadow-md" />
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                            Statement of Financial Position
                        </h2>
                    </div>
                    <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                        Institutional Balance Sheet (Assets, Liabilities & Equity)
                    </p>
                </div>
                <div className="relative z-10 flex gap-3">
                    <Button variant="outline" className="gap-2 h-12 px-6 rounded-2xl bg-white/10 border-white/20 hover:bg-white/20 text-white font-bold backdrop-blur-md transition-all shadow-lg">
                        <Download className="w-5 h-5" /> Export
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-2xl gap-2 shadow-lg shadow-blue-900/50 transition-all border border-blue-500/50">
                        <Printer className="w-5 h-5" /> Print Statement
                    </Button>
                </div>
            </div>

            {/* Balancing Status Bar */}
            <div className={cn(
                "p-8 rounded-[2.5rem] border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-3xl shadow-xl mb-10",
                report?.isBalanced
                    ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-900 shadow-emerald-500/10"
                    : "bg-rose-600/10 border-rose-500/30 text-rose-900 shadow-rose-500/10"
            )}>
                <div className="flex items-center gap-4 relative z-10">
                    <div className={cn("p-4 rounded-[1.2rem] shadow-inner", report?.isBalanced ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                        {report?.isBalanced ? <ShieldCheck className="w-8 h-8 drop-shadow-sm" /> : <AlertCircle className="w-8 h-8 drop-shadow-sm" />}
                    </div>
                    <div>
                        <p className="text-xl font-black uppercase tracking-tight italic drop-shadow-sm">{report?.isBalanced ? "Equation Balanced" : "Balance Mismatch"}</p>
                        <p className="text-xs opacity-70 font-bold uppercase tracking-widest mt-1">Assets = Liabilities + Equity (Current status)</p>
                    </div>
                </div>
                <div className="text-left md:text-right relative z-10">
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">Variance</p>
                    <p className="text-3xl font-black drop-shadow-md">₦{Math.abs((report?.totalAssets || 0) - ((report?.totalLiabilities || 0) + (report?.totalEquity || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Assets Column */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden bg-slate-50/50">
                        <CardHeader className="bg-white border-b border-slate-100">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-600" />
                                ASSETS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full">
                                <tbody className="divide-y divide-slate-100">
                                    {report?.assets?.map((acc: any) => (
                                        <tr key={acc.id} className="bg-white">
                                            <td className="py-4 px-6 text-sm font-bold text-slate-700">{acc.code} - {acc.name}</td>
                                            <td className="py-4 px-6 text-right font-mono text-slate-900">₦{acc.balance.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {report?.assets?.length === 0 && (
                                        <tr><td colSpan={2} className="py-10 text-center text-xs text-slate-400 italic">No asset accounts found</td></tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-900 text-white">
                                        <td className="py-5 px-6 text-sm font-black uppercase tracking-widest">Total Assets</td>
                                        <td className="py-5 px-6 text-right font-black text-xl">₦{report?.totalAssets?.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                {/* Liabilities & Equity Column */}
                <div className="space-y-8">
                    {/* Liabilities */}
                    <Card className="border-none shadow-sm overflow-hidden bg-slate-50/50">
                        <CardHeader className="bg-white border-b border-slate-100">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-rose-600" />
                                LIABILITIES
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full">
                                <tbody className="divide-y divide-slate-100">
                                    {report?.liabilities?.map((acc: any) => (
                                        <tr key={acc.id} className="bg-white">
                                            <td className="py-4 px-6 text-sm font-bold text-slate-700">{acc.code} - {acc.name}</td>
                                            <td className="py-4 px-6 text-right font-mono text-slate-900">₦{acc.balance.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {report?.liabilities?.length === 0 && (
                                        <tr><td colSpan={2} className="py-10 text-center text-xs text-slate-400 italic">No liability accounts found</td></tr>
                                    )}
                                </tbody>
                                <tr className="bg-rose-50/30">
                                    <td className="py-4 px-6 text-xs font-black text-rose-900 uppercase">Subtotal Liabilities</td>
                                    <td className="py-4 px-6 text-right font-bold text-rose-900 font-mono">₦{report?.totalLiabilities?.toLocaleString()}</td>
                                </tr>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Equity */}
                    <Card className="border-none shadow-sm overflow-hidden bg-slate-50/50">
                        <CardHeader className="bg-white border-b border-slate-100">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-emerald-600" />
                                EQUITY
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full">
                                <tbody className="divide-y divide-slate-100">
                                    {report?.equity?.map((acc: any) => (
                                        <tr key={acc.id} className="bg-white">
                                            <td className="py-4 px-6 text-sm font-bold text-slate-700">{acc.code} - {acc.name}</td>
                                            <td className="py-4 px-6 text-right font-mono text-slate-900">₦{acc.balance.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {report?.equity?.length === 0 && (
                                        <tr><td colSpan={2} className="py-10 text-center text-xs text-slate-400 italic">No equity accounts found</td></tr>
                                    )}
                                </tbody>
                                <tr className="bg-emerald-50/30">
                                    <td className="py-4 px-6 text-xs font-black text-emerald-900 uppercase">Subtotal Equity</td>
                                    <td className="py-4 px-6 text-right font-bold text-emerald-900 font-mono">₦{report?.totalEquity?.toLocaleString()}</td>
                                </tr>
                                <tfoot>
                                    <tr className="bg-slate-800 text-white">
                                        <td className="py-5 px-6 text-sm font-black uppercase tracking-widest">Total Liabilities & Equity</td>
                                        <td className="py-5 px-6 text-right font-black text-xl">
                                            ₦{(report?.totalLiabilities + report?.totalEquity)?.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </div>
        </div>
    );
}
