
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Banknote,
    Search,
    Loader2,
    CheckCircle2,
    XCircle,
    BadgeCheck,
    CreditCard,
    Filter,
    Clock,
    User,
    Building2,
    AlertCircle,
    ArrowUpRight
} from "lucide-react";
import { getRefundRequests, approveRefund, rejectRefund, disburseRefund } from "@/actions/bursary";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

export default function AdminRefundsPage() {
    const { data: session } = useSession();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'disbursed'>('pending');
    const [submitting, setSubmitting] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        setLoading(true);
        const data = await getRefundRequests(filter === 'all' ? undefined : filter);
        setRequests(data);
        setLoading(false);
    };

    const handleAction = async (id: number, action: 'approve' | 'reject' | 'disburse') => {
        const bursarId = (session?.user as any)?.id;
        if (!bursarId) return;

        setSubmitting(id);
        let res;
        if (action === 'approve') res = await approveRefund(id, parseInt(bursarId));
        else if (action === 'reject') res = await rejectRefund(id);
        else res = await disburseRefund(id);

        if (res.success) {
            fetchData();
        } else {
            alert((res as any).error || "Action failed");
        }
        setSubmitting(null);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Banknote className="w-8 h-8 text-indigo-600" />
                        Refund Management
                    </h2>
                    <p className="text-slate-500 mt-1">Review and process student refund applications</p>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-fit mb-8">
                {['all', 'pending', 'approved', 'rejected', 'disbursed'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={cn(
                            "px-6 py-2 rounded-lg text-xs font-bold capitalize transition-all",
                            filter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                    </div>
                ) : requests.length === 0 ? (
                    <Card className="border-dashed border-2 py-20 flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle className="w-10 h-10 mb-4 opacity-20" />
                        <p className="italic">No refund requests found for this category.</p>
                    </Card>
                ) : (
                    requests.map((item) => (
                        <Card key={item.request.id} className="border-none shadow-sm group hover:shadow-md transition-all overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-50">
                                    <div className="p-8 lg:w-1/3 bg-slate-50/50">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold">
                                                {item.student?.firstName?.[0]}{item.student?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-slate-900">{item.student?.firstName} {item.student?.lastName}</h3>
                                                <p className="text-xs text-slate-500">ID: {item.student?.id}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-white p-4 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Refund Amount</p>
                                                <p className="text-2xl font-black text-indigo-600">₦{parseFloat(item.request.amount).toLocaleString()}</p>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                Requested: {new Date(item.request.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col justify-between">
                                        <div>
                                            <Badge className={cn("mb-4 text-[10px] uppercase font-black",
                                                item.request.status === 'pending' ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                                                    item.request.status === 'approved' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                                                        item.request.status === 'disbursed' ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                                                            "bg-red-100 text-red-700 hover:bg-red-100"
                                            )}>
                                                {item.request.status}
                                            </Badge>
                                            <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                                                "{item.request.reason}"
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                                    <Building2 className="w-3 h-3" />
                                                    Bank Details
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">{item.request.bankName}</p>
                                                <p className="text-xs font-mono text-slate-500">{item.request.accountNumber}</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-medium">{item.request.accountName}</p>
                                            </div>

                                            <div className="flex flex-col justify-end items-end gap-3">
                                                {item.request.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 h-9 font-bold text-xs"
                                                            onClick={() => handleAction(item.request.id, 'reject')}
                                                            disabled={submitting === item.request.id}
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 h-9 font-bold text-xs gap-2"
                                                            onClick={() => handleAction(item.request.id, 'approve')}
                                                            disabled={submitting === item.request.id}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Approve Refund
                                                        </Button>
                                                    </div>
                                                )}

                                                {item.request.status === 'approved' && (
                                                    <Button
                                                        className="bg-slate-900 hover:bg-slate-800 h-10 font-black text-xs gap-2 px-8 uppercase tracking-widest"
                                                        onClick={() => handleAction(item.request.id, 'disburse')}
                                                        disabled={submitting === item.request.id}
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                        Confirm Disbursement
                                                    </Button>
                                                )}

                                                {item.request.status === 'disbursed' && (
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter flex items-center gap-1.5">
                                                            <BadgeCheck className="w-3 h-3" />
                                                            Funds Disbursed
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 mt-1">Transaction Completed: {new Date(item.request.disbursedAt).toLocaleDateString()}</p>
                                                    </div>
                                                )}

                                                {item.request.status === 'rejected' && (
                                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-tighter flex items-center gap-1.5">
                                                        <XCircle className="w-3 h-3" />
                                                        Application Rejected
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
