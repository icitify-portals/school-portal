"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CreditCard, Search, Loader2, User, Calendar, CheckCircle2, XCircle,
    Filter, FileText, Download, ExternalLink
} from "lucide-react";
import { getAdminV2Applications, confirmAdmissionPayment } from "@/actions/admission_v2";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export default function BursaryAdmissionPaymentsPage() {
    const [data, setData] = useState<any>({ applications: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        const result = await getAdminV2Applications({ pageSize: 100 });
        setData(result);
        setLoading(false);
    };

    const handleConfirm = async (id: number) => {
        const ref = prompt("Enter Bank Transaction Reference:");
        if (!ref) return;
        const res = await confirmAdmissionPayment(id, ref);
        if (res.success) {
            toast.success("Payment confirmed!");
            fetchData();
        } else {
            toast.error(res.error);
        }
    };

    const filtered = data.applications.filter((app: any) => {
        const matchesSearch = app.applicantName?.toLowerCase().includes(search.toLowerCase()) ||
                             (app.formNumber || '').toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "all" ? true : app.paymentStatus === filter;
        return matchesSearch && matchesFilter;
    });

    const paidTotal = data.applications.filter((a: any) => a.paymentStatus === 'paid').length;
    const pendingTotal = data.applications.filter((a: any) => a.paymentStatus === 'pending').length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <CreditCard className="w-12 h-12 text-emerald-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    ADMISSION PAYMENTS
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Admission fee collection overview for bursary reconciliation
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border border-emerald-200 shadow-lg bg-white/80 rounded-[2rem] p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-2xl">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid</p>
                                <p className="text-3xl font-black text-slate-900">{paidTotal}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="border border-amber-200 shadow-lg bg-white/80 rounded-[2rem] p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-2xl">
                                <XCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                                <p className="text-3xl font-black text-slate-900">{pendingTotal}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="border border-slate-200 shadow-lg bg-white/80 rounded-[2rem] p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-100 rounded-2xl">
                                <FileText className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                <p className="text-3xl font-black text-slate-900">{data.total}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            className="w-full pl-12 pr-4 py-5 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 bg-white/80 text-sm font-bold"
                            placeholder="Search by name or form number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-white/60 rounded-2xl shadow-sm border border-slate-200 p-1.5">
                        {["all", "paid", "pending"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    filter === f ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Applicant</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Form #</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Template</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Amount</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Payment</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Acceptance</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" />
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                                            No admission payments found
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((app: any) => (
                                        <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 uppercase italic">{app.applicantName}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{app.parsedData?.email || ''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="font-mono text-xs font-bold text-slate-600">{app.formNumber || '—'}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-indigo-600">{app.templateName}</span>
                                            </td>
                                            <td className="px-8 py-6 font-black text-slate-900">
                                                ₦{app.template?.applicationFee?.toLocaleString() || '0'}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5",
                                                    app.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", app.paymentStatus === 'paid' ? "bg-emerald-500" : "bg-amber-500")} />
                                                    {app.paymentStatus}
                                                </span>
                                                {app.paymentReference && (
                                                    <p className="text-[8px] font-bold text-slate-400 mt-1">Ref: {app.paymentReference}</p>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5",
                                                    app.acceptancePaymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                    app.acceptancePaymentStatus === 'not_applicable' ? "bg-slate-100 text-slate-500 border-slate-200" :
                                                    "bg-amber-100 text-amber-700 border-amber-200"
                                                )}>
                                                    {app.acceptancePaymentStatus?.replace('_', ' ') || 'pending'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-bold text-slate-500">
                                                {app.appliedAt ? format(new Date(app.appliedAt), 'MMM dd, yyyy') : '—'}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/admin/admission/v2/${app.id}`}>
                                                        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest px-3 py-2 shadow-lg shadow-indigo-100">
                                                            <ExternalLink className="w-3 h-3 mr-1" /> View
                                                        </Button>
                                                    </Link>
                                                    {app.paymentStatus === 'pending' && (
                                                        <Button
                                                            onClick={() => handleConfirm(app.id)}
                                                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest px-3 py-2 shadow-lg shadow-emerald-100"
                                                        >
                                                            Confirm
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
