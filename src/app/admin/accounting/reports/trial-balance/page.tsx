"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    ShieldCheck,
    Loader2,
    Printer,
    Download,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { getTrialBalance } from "@/actions/accounting";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function TrialBalancePage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const res = await getTrialBalance();
        if (res.success) {
            setReport(res.data);
        }
        setLoading(false);
    };

    const totalDebit = report?.totalDebits || 0;
    const totalCredit = report?.totalCredits || 0;
    const isBalanced = report?.isBalanced ?? false;
    const entries = report?.entries || [];

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
          <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <ShieldCheck className="w-12 h-12 text-emerald-400 drop-shadow-md" />
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                            Trial Balance
                        </h2>
                    </div>
                    <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                        Institutional verification of double-entry integrity (DR = CR)
                    </p>
                </div>
                <div className="relative z-10 flex gap-3">
                    <Button variant="outline" className="gap-2 h-12 px-6 rounded-2xl bg-white/10 border-white/20 hover:bg-white/20 text-white font-bold backdrop-blur-md transition-all shadow-lg" onClick={() => window.print()}>
                        <Printer className="w-5 h-5" /> Print Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] relative overflow-hidden group">
                    <CardContent className="p-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 drop-shadow-sm">Total Debits</p>
                        <h3 className="text-4xl font-black text-indigo-600 drop-shadow-md">₦{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </CardContent>
                </Card>
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] relative overflow-hidden group">
                    <CardContent className="p-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 drop-shadow-sm">Total Credits</p>
                        <h3 className="text-4xl font-black text-slate-900 drop-shadow-md">₦{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </CardContent>
                </Card>
                <Card className={cn(
                    "border border-white/40 shadow-xl shadow-slate-200/50 backdrop-blur-3xl rounded-[2.5rem] text-white relative overflow-hidden group",
                    isBalanced ? "bg-emerald-600" : "bg-red-600"
                )}>
                    <CardContent className="p-8 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 drop-shadow-sm">Status</p>
                            <h3 className="text-3xl font-black drop-shadow-md uppercase italic tracking-tight">{isBalanced ? "Balanced" : "Unbalanced"}</h3>
                        </div>
                        {isBalanced ? <CheckCircle2 className="w-16 h-16 opacity-20 absolute top-4 right-4" /> : <XCircle className="w-16 h-16 opacity-20 absolute top-4 right-4" />}
                    </CardContent>
                </Card>
            </div>

            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100">
                            <th className="px-8 py-5">Account Code</th>
                            <th className="px-8 py-5">Account Name</th>
                            <th className="px-8 py-5 text-right">Debit (NGN)</th>
                            <th className="px-8 py-5 text-right">Credit (NGN)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-20 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                                </td>
                            </tr>
                        ) : entries.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-mono text-sm">No ledger data found yet.</td>
                            </tr>
                        ) : (
                            <>
                                {entries.map((row: any) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors bg-white/20">
                                        <td className="px-8 py-4 font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">{row.code}</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-800">{row.name}</td>
                                        <td className="px-8 py-4 text-right text-sm font-mono text-indigo-600 font-bold">
                                            {row.debit > 0 ? row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                                        </td>
                                        <td className="px-8 py-4 text-right text-sm font-mono text-slate-900 font-bold">
                                            {row.credit > 0 ? row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50/80 font-extrabold">
                                    <td colSpan={2} className="px-8 py-5 text-sm uppercase tracking-widest text-slate-500">Totals</td>
                                    <td className="px-8 py-5 text-right text-sm font-mono text-indigo-700">
                                        {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-5 text-right text-sm font-mono text-slate-900">
                                        {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </Card>
          </div>
        </div>
    );
}
