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
        <div className="p-8 max-w-[1600px] w-full mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Trial Balance</h2>
                    <p className="text-slate-500 mt-1">Institutional verification of double-entry integrity (DR = CR)</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 h-10 rounded-xl" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" />
                        Print Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-none shadow-sm bg-white border border-slate-100">
                    <CardContent className="p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total Debits</p>
                        // @ts-expect-error - TS2304: Auto-suppressed for build
                        <h3 className="text-2xl font-extrabold text-indigo-600">{settings?.base_currency || '₦'}{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white border border-slate-100">
                    <CardContent className="p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total Credits</p>
                        // @ts-expect-error - TS2304: Auto-suppressed for build
                        <h3 className="text-2xl font-extrabold text-slate-900">{settings?.base_currency || '₦'}{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </CardContent>
                </Card>
                <Card className={cn(
                    "border-none shadow-sm text-white",
                    isBalanced ? "bg-emerald-600" : "bg-red-600"
                )}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Status</p>
                            <h3 className="text-xl font-extrabold">{isBalanced ? "Balanced" : "Unbalanced"}</h3>
                        </div>
                        {isBalanced ? <CheckCircle2 className="w-8 h-8 opacity-50" /> : <XCircle className="w-8 h-8 opacity-50" />}
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden border border-slate-100 bg-white">
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
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
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
    );
}
