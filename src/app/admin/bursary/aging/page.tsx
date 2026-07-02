"use client";

import { useState, useEffect } from "react";
import { getAccountsReceivableAging } from "@/actions/bursary";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, AlertTriangle, AlertCircle, Clock, Search, ArrowUpRight, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AgingAnalysisPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const res = await getAccountsReceivableAging();
        if (res.success) {
            setData(res);
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
        </div>
    );

    if (!data) return null;

    const { analysis, details } = data;

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/30 to-slate-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <BarChart3 className="w-12 h-12 text-amber-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        A/R Aging Analysis
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Monitor outstanding student debts by aging brackets
                </p>
            </div>
            
            <Button
                variant="outline"
                className="relative z-10 h-12 px-6 rounded-[1.5rem] font-black uppercase text-xs tracking-wider border-white/20 text-white bg-white/10 hover:bg-white hover:text-slate-900 transition-all gap-2"
            >
                <Download className="w-4 h-4" /> Export Report
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] overflow-hidden relative group hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-2">Current (0-30 Days)</p>
                    <h3 className="text-2xl lg:text-3xl font-black text-slate-800">₦{analysis.current.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-wider">{analysis.current.count} Bills</p>
                </CardContent>
            </Card>
            <Card className="border border-amber-200/40 shadow-xl shadow-amber-200/20 bg-amber-500/10 backdrop-blur-3xl rounded-[2rem] overflow-hidden relative group hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 mt-2">31-60 Days Late</p>
                    <h3 className="text-2xl lg:text-3xl font-black text-amber-700">₦{analysis.days30.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs font-bold text-amber-600/70 mt-2 uppercase tracking-wider">{analysis.days30.count} Bills</p>
                </CardContent>
            </Card>
            <Card className="border border-orange-200/40 shadow-xl shadow-orange-200/20 bg-orange-500/10 backdrop-blur-3xl rounded-[2rem] overflow-hidden relative group hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2 mt-2">61-90 Days Late</p>
                    <h3 className="text-2xl lg:text-3xl font-black text-orange-700">₦{analysis.days60.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs font-bold text-orange-600/70 mt-2 uppercase tracking-wider">{analysis.days60.count} Bills</p>
                </CardContent>
            </Card>
            <Card className="border border-rose-200/40 shadow-xl shadow-rose-200/20 bg-rose-500/10 backdrop-blur-3xl rounded-[2rem] overflow-hidden relative group hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-2 mt-2 text-rose-600">
                        <AlertTriangle className="w-4 h-4 text-rose-500 drop-shadow-sm" />
                        <p className="text-[10px] font-black uppercase tracking-widest">90+ Days Severe</p>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-black text-rose-700">₦{analysis.days90Plus.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs font-bold text-rose-600/70 mt-2 uppercase tracking-wider">{analysis.days90Plus.count} Bills</p>
                </CardContent>
            </Card>
        </div>

        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 lg:p-10 border-b border-white/40 bg-white/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Delinquent Accounts Details</CardTitle>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="w-full pl-12 pr-4 py-3 bg-white/60 border border-white/60 rounded-[1.2rem] text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white outline-none transition-all shadow-inner"
                            placeholder="Search matric number..."
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-800">
                                <th className="px-8 py-6">Student</th>
                                <th className="px-8 py-6">Matric No.</th>
                                <th className="px-8 py-6">Bill Date</th>
                                <th className="px-8 py-6">Age / Bracket</th>
                                <th className="px-8 py-6">Outstanding</th>
                                <th className="px-8 py-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/40 bg-white/20">
                            {details.map((bill: any) => (
                                <tr key={bill.id} className="hover:bg-white/40 transition-colors group">
                                    <td className="px-8 py-6 font-black text-base text-slate-800 whitespace-nowrap">
                                        {bill.student.firstName} {bill.student.lastName}
                                    </td>
                                    <td className="px-8 py-6 font-mono text-sm text-slate-500 font-bold">
                                        {bill.student.matricNumber}
                                    </td>
                                    <td className="px-8 py-6 text-sm text-slate-500 font-bold">
                                        {new Date(bill.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-base font-black text-slate-850">{bill.ageDays}d</span>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border shadow-sm",
                                                bill.ageDays > 90 ? "bg-rose-100 text-rose-700 border-rose-200" :
                                                bill.ageDays > 60 ? "bg-orange-100 text-orange-700 border-orange-200" :
                                                bill.ageDays > 30 ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                "bg-slate-100 text-slate-600 border-slate-200"
                                            )}>
                                                {bill.bracket}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-black text-slate-800 text-base">
                                        ₦{bill.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Button variant="ghost" size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 rounded-xl transition-all shadow-sm">
                                            View Student
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
    );
}
