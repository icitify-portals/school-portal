"use client";

import { useState, useEffect } from "react";
import { getBursaryStaffLoans, getBursaryCashAdvances } from "@/actions/bursary_loans";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, XCircle, Clock, Check, CreditCard, Wallet, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function HRLoansDashboard() {
    const [loans, setLoans] = useState<any[]>([]);
    const [advances, setAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [loansRes, advancesRes] = await Promise.all([
                getBursaryStaffLoans(),
                getBursaryCashAdvances()
            ]);
            
            if (loansRes.success) setLoans(loansRes.data || []);
            if (advancesRes.success) setAdvances(advancesRes.data || []);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'approved': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</span>;
            case 'disbursed': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"><Check className="w-3 h-3 mr-1" /> Disbursed</span>;
            case 'rejected': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-rose-100 text-rose-700"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
            case 'pending':
            case 'requested': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
            default: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    const filteredLoans = loans.filter(l => 
        l.staff?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.staff?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.staff?.staffId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAdvances = advances.filter(a => 
        a.staff?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.staff?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.staff?.staffId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-650/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Wallet className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Staff Financials
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Read-only tracking of staff loans and advances for HR records and payroll deductions
                </p>
            </div>
            
            <div className="relative z-10 w-full sm:w-80 shrink-0">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search staff by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/25 rounded-[1.2rem] text-sm font-bold text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 outline-none transition-all shadow-inner"
                />
            </div>
        </div>

        <Tabs defaultValue="loans" className="w-full space-y-8">
            <TabsList className="bg-white/60 backdrop-blur-3xl border border-white/60 p-2 rounded-[2rem] h-auto shadow-xl shadow-slate-200/40 inline-flex">
                <TabsTrigger 
                    value="loans" 
                    className="flex items-center gap-2 px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-wider text-slate-500 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                    <Wallet className="w-4 h-4" /> Staff Loans
                </TabsTrigger>
                <TabsTrigger 
                    value="advances" 
                    className="flex items-center gap-2 px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-wider text-slate-500 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                    <CreditCard className="w-4 h-4" /> Cash Advances
                </TabsTrigger>
            </TabsList>

            <TabsContent value="loans">
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="p-8 lg:p-10 border-b border-white/40 bg-white/40">
                        <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Staff Loan Applications</CardTitle>
                        <CardDescription className="text-slate-500 font-bold uppercase tracking-wider text-xs">Track the status of term loans across the organization.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-650" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-800">
                                            <th className="px-8 py-6">Date</th>
                                            <th className="px-8 py-6">Staff Member</th>
                                            <th className="px-8 py-6">Loan Type</th>
                                            <th className="px-8 py-6">Amount</th>
                                            <th className="px-8 py-6">Period</th>
                                            <th className="px-8 py-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/40 bg-white/20">
                                        {filteredLoans.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-16 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No loan applications found.</td>
                                            </tr>
                                        ) : (
                                            filteredLoans.map(loan => (
                                                <tr key={loan.id} className="hover:bg-white/40 transition-colors group">
                                                    <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-slate-500 font-mono">
                                                        {loan.createdAt ? format(new Date(loan.createdAt), 'MMM dd, yyyy') : '-'}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="font-black text-slate-900 text-base">
                                                            {loan.staff?.user?.firstName} {loan.staff?.user?.lastName}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider mt-0.5">{loan.staff?.staffId}</div>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm font-extrabold text-slate-700 uppercase tracking-wide">{loan.template?.name || "General Loan"}</td>
                                                    <td className="px-8 py-6 text-lg font-black text-slate-900">₦{Number(loan.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-8 py-6 text-sm font-bold text-slate-655">{loan.repaymentPeriodMonths} months</td>
                                                    <td className="px-8 py-6">{getStatusBadge(loan.status)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="advances">
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="p-8 lg:p-10 border-b border-white/40 bg-white/40">
                        <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Cash Advances</CardTitle>
                        <CardDescription className="text-slate-500 font-bold uppercase tracking-wider text-xs">Track short-term cash advances taken by staff for official purposes.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-655" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-800">
                                            <th className="px-8 py-6">Date</th>
                                            <th className="px-8 py-6">Staff Member</th>
                                            <th className="px-8 py-6">Purpose</th>
                                            <th className="px-8 py-6">Amount</th>
                                            <th className="px-8 py-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/40 bg-white/20">
                                        {filteredAdvances.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-16 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No cash advance requests found.</td>
                                            </tr>
                                        ) : (
                                            filteredAdvances.map(adv => (
                                                <tr key={adv.id} className="hover:bg-white/40 transition-colors group">
                                                    <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-slate-500 font-mono">
                                                        {adv.createdAt ? format(new Date(adv.createdAt), 'MMM dd, yyyy') : '-'}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="font-black text-slate-900 text-base">
                                                            {adv.staff?.user?.firstName} {adv.staff?.user?.lastName}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider mt-0.5">{adv.staff?.staffId}</div>
                                                    </td>
                                                    <td className="px-8 py-6 font-bold text-slate-700 max-w-xs truncate" title={adv.purpose}>{adv.purpose}</td>
                                                    <td className="px-8 py-6 text-lg font-black text-slate-900">₦{Number(adv.requestedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-8 py-6">{getStatusBadge(adv.status)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
