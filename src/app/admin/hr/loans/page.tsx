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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Financials Tracking</h1>
                <p className="text-slate-500">Read-only view of staff loans and advances for HR records and payroll deductions tracking.</p>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search staff by name or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
            </div>

            <Tabs defaultValue="loans" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="loans" className="flex items-center"><Wallet className="w-4 h-4 mr-2" /> Staff Loans</TabsTrigger>
                    <TabsTrigger value="advances" className="flex items-center"><CreditCard className="w-4 h-4 mr-2" /> Cash Advances</TabsTrigger>
                </TabsList>

                <TabsContent value="loans">
                    <Card>
                        <CardHeader>
                            <CardTitle>Staff Loan Applications</CardTitle>
                            <CardDescription>Track the status of term loans across the organization.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Staff Member</th>
                                                <th className="px-6 py-4">Loan Type</th>
                                                <th className="px-6 py-4">Amount (₦)</th>
                                                <th className="px-6 py-4">Period</th>
                                                <th className="px-6 py-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLoans.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">No loan applications found.</td>
                                                </tr>
                                            ) : (
                                                filteredLoans.map(loan => (
                                                    <tr key={loan.id} className="border-b last:border-0 hover:bg-slate-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                            {loan.createdAt ? format(new Date(loan.createdAt), 'MMM dd, yyyy') : '-'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-slate-900">
                                                                {loan.staff?.user?.firstName} {loan.staff?.user?.lastName}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{loan.staff?.staffId}</div>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-slate-700">{loan.template?.name || "General Loan"}</td>
                                                        <td className="px-6 py-4 font-medium text-slate-900">{Number(loan.amount).toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-slate-600">{loan.repaymentPeriodMonths} months</td>
                                                        <td className="px-6 py-4">{getStatusBadge(loan.status)}</td>
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Cash Advances</CardTitle>
                            <CardDescription>Track short-term cash advances taken by staff for official purposes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Staff Member</th>
                                                <th className="px-6 py-4">Purpose</th>
                                                <th className="px-6 py-4">Amount (₦)</th>
                                                <th className="px-6 py-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAdvances.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No cash advance requests found.</td>
                                                </tr>
                                            ) : (
                                                filteredAdvances.map(adv => (
                                                    <tr key={adv.id} className="border-b last:border-0 hover:bg-slate-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                            {adv.createdAt ? format(new Date(adv.createdAt), 'MMM dd, yyyy') : '-'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-slate-900">
                                                                {adv.staff?.user?.firstName} {adv.staff?.user?.lastName}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{adv.staff?.staffId}</div>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-slate-700 max-w-xs truncate" title={adv.purpose}>{adv.purpose}</td>
                                                        <td className="px-6 py-4 font-medium text-slate-900">{Number(adv.requestedAmount).toLocaleString()}</td>
                                                        <td className="px-6 py-4">{getStatusBadge(adv.status)}</td>
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
    );
}
