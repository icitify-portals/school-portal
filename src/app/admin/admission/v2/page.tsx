"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText, Search, Loader2, User, Calendar, CheckCircle2,
    XCircle, AlertCircle, Activity, Filter, ExternalLink, ChevronLeft, ChevronRight,
    CheckSquare, Square, Download
} from "lucide-react";
import { getAdminV2Applications, bulkUpdateAdmissionStatus, getAdmissionTemplates } from "@/actions/admission_v2";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminV2ApplicationsPage() {
    const [data, setData] = useState<any>({ applications: [], total: 0, page: 1, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [templateFilter, setTemplateFilter] = useState<number | undefined>(undefined);
    const [templates, setTemplates] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkAction, setBulkAction] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        const result = await getAdminV2Applications({
            search: search || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
            templateId: templateFilter,
            page,
            pageSize: 20,
        });
        setData(result);
        setLoading(false);
    }, [search, statusFilter, paymentFilter, templateFilter, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        getAdmissionTemplates().then(setTemplates).catch(() => {});
    }, []);

    const handleBulkAction = async (action: string) => {
        if (selectedIds.size === 0) { toast.error("No applications selected"); return; }
        const ids = Array.from(selectedIds);
        const notes = action === 'rejected' ? prompt("Enter rejection reason:") : undefined;
        if (action === 'rejected' && !notes) { toast.error("Rejection reason is required"); return; }
        const res = await bulkUpdateAdmissionStatus(ids, action, notes || undefined);
        if (res.success) {
            toast.success(`${res.count} application(s) ${action === 'admitted' ? 'admitted' : 'rejected'}`);
            setSelectedIds(new Set());
            fetchData();
        } else {
            toast.error(res.error || "Action failed");
        }
        setBulkAction("");
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === data.applications.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(data.applications.map((a: any) => a.id)));
        }
    };

    const statusColors: Record<string, string> = {
        draft: "bg-slate-100 text-slate-600 border-slate-200",
        submitted: "bg-blue-100 text-blue-700 border-blue-200",
        paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
        screened: "bg-purple-100 text-purple-700 border-purple-200",
        admitted: "bg-emerald-100 text-emerald-700 border-emerald-200",
        rejected: "bg-rose-100 text-rose-700 border-rose-200",
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-emerald-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-12 h-12 text-indigo-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    V2 APPLICATIONS
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Review, screen, and manage submitted admission applications
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 bg-white/5 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10">
                            <Activity className="w-4 h-4" />
                            <span className="font-bold">{data.total} total applications</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white/80 text-sm font-bold"
                            placeholder="Search by name or form number..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-4 py-4 rounded-2xl border border-slate-200 bg-white/80 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="paid">Paid</option>
                            <option value="screened">Screened</option>
                            <option value="admitted">Admitted</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <select
                            value={paymentFilter}
                            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
                            className="px-4 py-4 rounded-2xl border border-slate-200 bg-white/80 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Payments</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                        </select>

                        <select
                            value={templateFilter || ""}
                            onChange={(e) => { setTemplateFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                            className="px-4 py-4 rounded-2xl border border-slate-200 bg-white/80 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Templates</option>
                            {templates.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
                        <span className="text-sm font-bold text-indigo-700">{selectedIds.size} selected</span>
                        <Button
                            onClick={() => handleBulkAction('admitted')}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Admit Selected
                        </Button>
                        <Button
                            onClick={() => handleBulkAction('rejected')}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3"
                        >
                            <XCircle className="w-3.5 h-3.5 mr-2" /> Reject Selected
                        </Button>
                        <Button
                            onClick={() => setSelectedIds(new Set())}
                            variant="ghost"
                            className="rounded-xl text-slate-500 font-bold text-xs"
                        >
                            Clear Selection
                        </Button>
                    </div>
                )}

                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="px-6 py-5 w-12">
                                        <button onClick={toggleSelectAll} className="text-white/80 hover:text-white">
                                            {selectedIds.size === data.applications.length && data.applications.length > 0
                                                ? <CheckSquare className="w-4 h-4" />
                                                : <Square className="w-4 h-4" />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Applicant</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Form #</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Template</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Payment</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center">
                                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
                                        </td>
                                    </tr>
                                ) : data.applications.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center">
                                            <div className="max-w-xs mx-auto space-y-4">
                                                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                                                    No applications found
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.applications.map((app: any) => (
                                        <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <button onClick={() => toggleSelect(app.id)} className="text-slate-300 hover:text-slate-500">
                                                    {selectedIds.has(app.id)
                                                        ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                                                        : <Square className="w-4 h-4" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    {app.applicantPhoto ? (
                                                        <img src={app.applicantPhoto} alt="" className="w-10 h-10 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 uppercase italic">{app.applicantName}</p>
                                                        {app.parsedData?.email && (
                                                            <p className="text-[10px] font-bold text-slate-400">{app.parsedData.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                                    {app.formNumber || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-indigo-600">{app.templateName}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5",
                                                    statusColors[app.status] || "bg-slate-100 text-slate-600"
                                                )}>
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        app.status === 'admitted' ? 'bg-emerald-500' :
                                                        app.status === 'rejected' ? 'bg-rose-500' :
                                                        app.status === 'paid' ? 'bg-emerald-500' :
                                                        app.status === 'submitted' ? 'bg-blue-500' : 'bg-slate-400'
                                                    )} />
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5",
                                                    app.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                    app.paymentStatus === 'failed' ? "bg-rose-100 text-rose-700 border-rose-200" :
                                                    "bg-amber-100 text-amber-700 border-amber-200"
                                                )}>
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        app.paymentStatus === 'paid' ? "bg-emerald-500" :
                                                        app.paymentStatus === 'failed' ? "bg-rose-500" : "bg-amber-500"
                                                    )} />
                                                    {app.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-bold text-slate-500">
                                                {app.appliedAt ? format(new Date(app.appliedAt), 'MMM dd, yyyy') : '—'}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Link href={`/admin/admission/v2/${app.id}`}>
                                                    <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2 shadow-lg shadow-indigo-100">
                                                        <ExternalLink className="w-3 h-3 mr-1.5" /> Review
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {data.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 font-bold">
                            Page {data.page} of {data.totalPages} ({data.total} total)
                        </span>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs px-5 py-3"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                            </Button>
                            <Button
                                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                disabled={page >= data.totalPages}
                                className="rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs px-5 py-3"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
