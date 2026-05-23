"use client";

import { useState, useEffect } from "react";
import { getAccountsReceivableAging } from "@/actions/bursary";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, AlertTriangle, AlertCircle, Clock, Search, ArrowUpRight, Loader2, Download } from "lucide-react";

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
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-amber-600" />
                        A/R Aging Analysis
                    </h2>
                    <p className="text-slate-500 mt-1">Monitor outstanding student debts by aging brackets</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 border-slate-200">
                        <Download className="w-4 h-4" /> Export Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-slate-50/50">
                    <CardContent className="p-6 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-2">Current (0-30 Days)</p>
                        <h3 className="text-3xl font-black text-slate-800">₦{analysis.current.amount.toLocaleString()}</h3>
                        <p className="text-xs font-bold text-slate-500 mt-2">{analysis.current.count} Bills</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-amber-50">
                    <CardContent className="p-6 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 mt-2">31-60 Days Late</p>
                        <h3 className="text-3xl font-black text-amber-700">₦{analysis.days30.amount.toLocaleString()}</h3>
                        <p className="text-xs font-bold text-amber-600/70 mt-2">{analysis.days30.count} Bills</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-orange-50">
                    <CardContent className="p-6 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2 mt-2">61-90 Days Late</p>
                        <h3 className="text-3xl font-black text-orange-700">₦{analysis.days60.amount.toLocaleString()}</h3>
                        <p className="text-xs font-bold text-orange-600/70 mt-2">{analysis.days60.count} Bills</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-rose-50 border border-rose-100">
                    <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center gap-1 mb-2 mt-2 text-rose-600">
                            <AlertTriangle className="w-3 h-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest">90+ Days Severe</p>
                        </div>
                        <h3 className="text-3xl font-black text-rose-700">₦{analysis.days90Plus.amount.toLocaleString()}</h3>
                        <p className="text-xs font-bold text-rose-600/70 mt-2">{analysis.days90Plus.count} Bills</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-600">Delinquent Accounts Details</CardTitle>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 w-64"
                                placeholder="Search matric number..."
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="p-4">Student</th>
                                <th className="p-4">Matric No.</th>
                                <th className="p-4">Bill Date</th>
                                <th className="p-4">Age / Bracket</th>
                                <th className="p-4">Outstanding (₦)</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {details.map((bill: any) => (
                                <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 font-bold text-sm text-slate-700 whitespace-nowrap">
                                        {bill.student.firstName} {bill.student.lastName}
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-500">
                                        {bill.student.matricNumber}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {new Date(bill.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-900">{bill.ageDays}d</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${bill.ageDays > 90 ? 'bg-rose-100 text-rose-700' :
                                                    bill.ageDays > 60 ? 'bg-orange-100 text-orange-700' :
                                                        bill.ageDays > 30 ? 'bg-amber-100 text-amber-700' :
                                                            'bg-slate-100 text-slate-600'
                                                }`}>
                                                {bill.bracket}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-extrabold text-slate-900">
                                        ₦{bill.outstanding.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50">
                                            View Student
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
