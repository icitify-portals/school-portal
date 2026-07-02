"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Printer,
    Download,
    TrendingUp,
    TrendingDown,
    LineChart,
    ArrowUpCircle,
    ArrowDownCircle,
    Scale,
    Loader2
} from "lucide-react";
import { getIncomeStatement } from "@/actions/accounting";
import { cn } from "@/lib/utils";

export default function PNLPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        const res = await getIncomeStatement();
        if (res.success) setReport(res.data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
                <p className="text-slate-500 font-medium">Generating Income Statement...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
          <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/30 to-rose-600/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <FileText className="w-12 h-12 text-orange-400 drop-shadow-md" />
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                            Income Statement
                        </h2>
                    </div>
                    <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                        Institutional Profit & Loss for the current fiscal period
                    </p>
                </div>
                <div className="relative z-10 flex gap-3">
                    <Button variant="outline" className="gap-2 h-12 px-6 rounded-2xl bg-white/10 border-white/20 hover:bg-white/20 text-white font-bold backdrop-blur-md transition-all shadow-lg">
                        <Download className="w-5 h-5" /> Export
                    </Button>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-12 px-6 rounded-2xl gap-2 shadow-lg shadow-orange-900/50 transition-all border border-orange-500/50">
                        <Printer className="w-5 h-5" /> Print Report
                    </Button>
                </div>
            </div>

            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] relative overflow-hidden group">
                    <CardContent className="p-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 drop-shadow-sm">Total Revenue</p>
                        <h3 className="text-4xl font-black text-emerald-600 drop-shadow-md">₦{report?.totalRevenue?.toLocaleString()}</h3>
                    </CardContent>
                </Card>
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] relative overflow-hidden group">
                    <CardContent className="p-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 drop-shadow-sm">Total Expenses</p>
                        <h3 className="text-4xl font-black text-rose-600 drop-shadow-md">₦{report?.totalExpenses?.toLocaleString()}</h3>
                    </CardContent>
                </Card>
                <Card className={cn(
                    "border border-white/40 shadow-xl shadow-slate-200/50 backdrop-blur-3xl rounded-[2.5rem] text-white relative overflow-hidden group",
                    (report?.netSurplus || 0) >= 0 ? "bg-slate-900" : "bg-rose-600"
                )}>
                    <CardContent className="p-8">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 drop-shadow-sm">Net Surplus / (Deficit)</p>
                        <h3 className="text-4xl font-black drop-shadow-md">₦{report?.netSurplus?.toLocaleString()}</h3>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                {/* Revenue Section */}
                <Card className="border-none shadow-sm overflow-hidden border border-slate-100 bg-white/60 backdrop-blur-3xl rounded-[3rem]">
                    <CardHeader className="bg-white/40 border-b border-slate-100 p-6">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                            Revenue Streams
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <tbody className="divide-y divide-slate-100">
                                {report?.revenue?.map((acc: any) => (
                                    <tr key={acc.id} className="group hover:bg-slate-50 transition-colors bg-white/20">
                                        <td className="py-4 px-6 text-sm font-bold text-slate-700">{acc.code} - {acc.name}</td>
                                        <td className="py-4 px-6 text-right font-mono text-emerald-600">₦{acc.balance.toLocaleString()}</td>
                                    </tr>
                                ))}
                                <tr className="bg-emerald-50/30">
                                    <td className="py-5 px-6 text-sm font-black text-slate-900 uppercase">Total Institutional Revenue</td>
                                    <td className="py-5 px-6 text-right font-black text-emerald-700 border-t-2 border-emerald-100">
                                        ₦{report?.totalRevenue?.toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Expenses Section */}
                <Card className="border-none shadow-sm overflow-hidden border border-slate-100 bg-white/60 backdrop-blur-3xl rounded-[3rem]">
                    <CardHeader className="bg-white/40 border-b border-slate-100 p-6">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <ArrowDownCircle className="w-4 h-4 text-rose-500" />
                            Expenditure Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <tbody className="divide-y divide-slate-100">
                                {report?.expenses?.map((acc: any) => (
                                    <tr key={acc.id} className="group hover:bg-slate-50 transition-colors bg-white/20">
                                        <td className="py-4 px-6 text-sm font-bold text-slate-700">{acc.code} - {acc.name}</td>
                                        <td className="py-4 px-6 text-right font-mono text-rose-600">₦{acc.balance.toLocaleString()}</td>
                                    </tr>
                                ))}
                                <tr className="bg-rose-50/30">
                                    <td className="py-5 px-6 text-sm font-black text-slate-900 uppercase">Total Operating Expenses</td>
                                    <td className="py-5 px-6 text-right font-black text-rose-700 border-t-2 border-rose-100">
                                        ₦{report?.totalExpenses?.toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Bottom Summary */}
                <div className="flex justify-end pt-4">
                    <div className="w-full md:w-1/2 space-y-4">
                        <div className="flex justify-between items-center py-4 border-b border-slate-200">
                            <p className="text-sm font-black uppercase tracking-widest text-slate-500">Gross Operating Result</p>
                            <p className="text-2xl font-black text-slate-900">₦{report?.netSurplus?.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center py-8 bg-slate-900 text-white px-10 rounded-[2.5rem] shadow-2xl border border-slate-800">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Net Institutional Position</p>
                                <h4 className="text-3xl font-black italic tracking-tighter">
                                    {(report?.netSurplus || 0) >= 0 ? "Surplus" : "Deficit"}
                                </h4>
                            </div>
                            <h4 className="text-4xl font-black drop-shadow-md">₦{report?.netSurplus?.toLocaleString()}</h4>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
