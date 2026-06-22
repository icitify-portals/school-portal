"use client";

import { useState, useEffect } from "react";
import { 
    getBursaryStaffLoans, 
    updateLoanStatus, 
    getBursaryCashAdvances, 
    updateCashAdvanceStatus 
} from "@/actions/bursary_loans";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock, Check, CreditCard, Wallet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BursaryLoansDashboard() {
    const [loans, setLoans] = useState<any[]>([]);
    const [advances, setAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

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

    const handleLoanAction = async (id: number, status: 'approved' | 'rejected' | 'disbursed') => {
        setActionLoading(id);
        const res = await updateLoanStatus(id, status, 1); // Mocking admin user ID 1
        if (res.success) {
            toast.success(`Loan ${status} successfully.`);
            loadData();
        } else {
            toast.error(res.error || "Failed to update loan");
        }
        setActionLoading(null);
    };

    const handleAdvanceAction = async (id: number, status: 'approved' | 'rejected' | 'disbursed', amount?: number) => {
        setActionLoading(id);
        const res = await updateCashAdvanceStatus(id, status, amount);
        if (res.success) {
            toast.success(`Advance ${status} successfully.`);
            loadData();
        } else {
            toast.error(res.error || "Failed to update advance");
        }
        setActionLoading(null);
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Financials (Loans & Advances)</h1>
                <p className="text-slate-500">Manage and disburse staff loan applications and cash advances.</p>
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
                            <CardDescription>Review and approve term loans for staff members.</CardDescription>
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
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loans.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">No loan applications found.</td>
                                                </tr>
                                            ) : (
                                                loans.map(loan => (
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
                                                        <td className="px-6 py-4 text-right space-x-2">
                                                            {loan.status === 'pending' && (
                                                                <>
                                                                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleLoanAction(loan.id, 'approved')} disabled={actionLoading === loan.id}>Approve</Button>
                                                                    <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleLoanAction(loan.id, 'rejected')} disabled={actionLoading === loan.id}>Reject</Button>
                                                                </>
                                                            )}
                                                            {loan.status === 'approved' && (
                                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleLoanAction(loan.id, 'disbursed')} disabled={actionLoading === loan.id}>Mark Disbursed</Button>
                                                            )}
                                                        </td>
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
                            <CardDescription>Review and approve short-term cash advances.</CardDescription>
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
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {advances.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">No cash advance requests found.</td>
                                                </tr>
                                            ) : (
                                                advances.map(adv => (
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
                                                        <td className="px-6 py-4 text-right space-x-2">
                                                            {adv.status === 'requested' && (
                                                                <>
                                                                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleAdvanceAction(adv.id, 'approved', Number(adv.requestedAmount))} disabled={actionLoading === adv.id}>Approve</Button>
                                                                    <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleAdvanceAction(adv.id, 'rejected')} disabled={actionLoading === adv.id}>Reject</Button>
                                                                </>
                                                            )}
                                                            {adv.status === 'approved' && (
                                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleAdvanceAction(adv.id, 'disbursed')} disabled={actionLoading === adv.id}>Mark Disbursed</Button>
                                                            )}
                                                        </td>
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
