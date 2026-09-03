"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CreditCard, Search, Loader2, User, Calendar, CheckCircle2, XCircle,
    Filter, FileText, Download, ExternalLink, Trash2, ChevronLeft, ChevronRight
} from "lucide-react";
import { getAdminV2Applications, confirmAdmissionPayment, deleteAdmissionApplication, getAdmissionAcademicUnits, adminConfirmAcceptancePayment, reverseAcceptancePayment, syncAcceptancePaymentsFromTransactions } from "@/actions/admission_v2";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export default function BursaryAdmissionPaymentsPage() {
    const [data, setData] = useState<any>({ applications: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [departmentFilter, setDepartmentFilter] = useState<number | undefined>(undefined);
    const [programmeFilter, setProgrammeFilter] = useState<number | undefined>(undefined);
    const [levelFilter, setLevelFilter] = useState<string>("all");

    const [departments, setDepartments] = useState<any[]>([]);
    const [programmes, setProgrammes] = useState<any[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [syncing, setSyncing] = useState(false);
    const itemsPerPage = 10;

    useEffect(() => { 
        fetchData(); 
        getAdmissionAcademicUnits().then((res) => {
            if (res.success) {
                setDepartments(res.departments || []);
                setProgrammes(res.programmes || []);
            }
        }).catch(() => {});
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await getAdminV2Applications({ pageSize: 5000 });
            if (result && Array.isArray(result.applications)) {
                setData(result);
            } else {
                setData({ applications: [], total: 0 });
                if (result?.error) toast.error(result.error);
            }
        } catch (err: any) {
            console.error("Failed to load admission payments:", err);
            toast.error(err?.message || "Failed to load admission payments");
            setData({ applications: [], total: 0 });
        } finally {
            setLoading(false);
        }
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

    const handleConfirmAcceptance = async (id: number) => {
        const ref = prompt("Enter payment transaction reference (from Alatpay):");
        if (!ref) return;
        const res = await adminConfirmAcceptancePayment(id, ref);
        if (res.success) {
            toast.success("Acceptance payment confirmed!");
            fetchData();
        } else {
            toast.error(res.error);
        }
    };

    const handleReverseAcceptance = async (id: number) => {
        if (!confirm("Are you sure you want to reverse this acceptance payment? This will mark the acceptance fee as unpaid.")) return;
        const res = await reverseAcceptancePayment(id);
        if (res.success) {
            toast.success("Acceptance payment reversed!");
            fetchData();
        } else {
            toast.error(res.error);
        }
    };

    const handleSyncAcceptancePayments = async () => {
        setSyncing(true);
        try {
            const res = await syncAcceptancePaymentsFromTransactions();
            if (res.success) {
                toast.success(`Synced ${res.synced} acceptance payment(s) from transactions`);
                fetchData();
            } else {
                toast.error(res.error || "Sync failed");
            }
        } catch (err: any) {
            toast.error(err?.message || "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const filteredProgrammes = departmentFilter
        ? programmes.filter((p: any) => p.departmentId === departmentFilter || p.deptId === departmentFilter)
        : programmes;

    const appsList = Array.isArray(data?.applications) ? data.applications : [];

    const filtered = appsList.filter((app: any) => {
        const matchesSearch = (app.applicantName || '').toLowerCase().includes(search.toLowerCase()) ||
                             (app.formNumber || '').toLowerCase().includes(search.toLowerCase()) ||
                             (app.templateName || '').toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "all" ? true : app.paymentStatus === filter;
        const matchesDept = !departmentFilter ? true : (app.programme?.deptId === departmentFilter || app.programme?.departmentId === departmentFilter);
        const matchesProg = !programmeFilter ? true : app.programmeId === programmeFilter;
        const matchesLevel = levelFilter === "all" ? true : (
            (app.academicLevel || '').toUpperCase() === levelFilter.toUpperCase() ||
            (app.administrativeLevel || '').toUpperCase() === levelFilter.toUpperCase()
        );
        return matchesSearch && matchesFilter && matchesDept && matchesProg && matchesLevel;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedApps = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filter, departmentFilter, programmeFilter, levelFilter]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;
        
        const res = await deleteAdmissionApplication(id);
        if (res.success) {
            toast.success("Application deleted successfully");
            fetchData();
        } else {
            toast.error(res.error);
        }
    };

    const paidTotal = appsList.filter((a: any) => a.paymentStatus === 'paid').length;
    const pendingTotal = appsList.filter((a: any) => a.paymentStatus === 'pending').length;

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
                        <div className="flex gap-3">
                            <Button
                                onClick={handleSyncAcceptancePayments}
                                disabled={syncing}
                                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest px-4 py-3 shadow-lg shadow-amber-100"
                            >
                                {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                Sync Acceptance Fees
                            </Button>
                            <Link href="/admin/bursary/acceptance-payments">
                                <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-4 py-3 shadow-lg shadow-indigo-100">
                                    View Acceptance Payments
                                </Button>
                            </Link>
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

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
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

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={departmentFilter || ""}
                            onChange={(e) => { setDepartmentFilter(e.target.value ? Number(e.target.value) : undefined); setProgrammeFilter(undefined); setCurrentPage(1); }}
                            className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white/80 text-sm font-bold shadow-sm focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">All Departments</option>
                            {departments.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>

                        <select
                            value={programmeFilter || ""}
                            onChange={(e) => { setProgrammeFilter(e.target.value ? Number(e.target.value) : undefined); setCurrentPage(1); }}
                            className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white/80 text-sm font-bold shadow-sm focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">All Programmes</option>
                            {filteredProgrammes.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>

                        <select
                            value={levelFilter}
                            onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white/80 text-sm font-bold shadow-sm focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Levels</option>
                            <option value="Applicant">Applicant</option>
                            <option value="ND 1">ND 1</option>
                            <option value="ND 2">ND 2</option>
                            <option value="ND_GRADUATED">ND_GRADUATED</option>
                            <option value="HND 1">HND 1</option>
                            <option value="HND 2">HND 2</option>
                            <option value="HND_GRADUATED">HND_GRADUATED</option>
                        </select>

                        <div className="flex items-center px-4 ml-auto">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                Matches: <span className="text-emerald-600 ml-1">{filtered.length}</span>
                            </span>
                        </div>
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
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Fees</th>
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
                                ) : paginatedApps.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                                            No admission payments found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedApps.map((app: any) => (
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
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1 w-24">
                                                    <div className="flex items-center justify-between text-xs font-black text-slate-900">
                                                        <span className="text-[9px] text-slate-400 uppercase tracking-widest">App:</span>
                                                        <span>₦{app.template?.applicationFee?.toLocaleString() || '0'}</span>
                                                    </div>
                                                    {app.template?.requireAcceptanceFee && (
                                                        <div className="flex items-center justify-between text-xs font-black text-emerald-700">
                                                            <span className="text-[9px] text-emerald-600/70 uppercase tracking-widest">Acc:</span>
                                                            <span>₦{app.template?.acceptanceFee?.toLocaleString() || '0'}</span>
                                                        </div>
                                                    )}
                                                </div>
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
                                                {app.acceptancePaymentReference && (
                                                    <p className="text-[8px] font-bold text-slate-400 mt-1">Ref: {app.acceptancePaymentReference}</p>
                                                )}
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
                                                            Confirm App Fee
                                                        </Button>
                                                    )}
                                                    {app.acceptancePaymentStatus === 'pending' && (
                                                        <Button
                                                            onClick={() => handleConfirmAcceptance(app.id)}
                                                            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] uppercase tracking-widest px-3 py-2 shadow-lg shadow-amber-100"
                                                        >
                                                            Confirm Acceptance
                                                        </Button>
                                                    )}
                                                    {app.acceptancePaymentStatus === 'paid' && (
                                                        <Button
                                                            onClick={() => handleReverseAcceptance(app.id)}
                                                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-widest px-3 py-2 shadow-lg shadow-rose-100"
                                                        >
                                                            Reverse Acceptance
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => handleDelete(app.id)}
                                                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                        title="Remove Transaction"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-8 py-4 bg-slate-50 border-t border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Showing <span className="text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="text-slate-700">{filtered.length}</span> entries
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        // Show pages around current page
                                        let pageNum = currentPage;
                                        if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;
                                        
                                        if (pageNum < 1 || pageNum > totalPages) return null;
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={cn(
                                                    "w-8 h-8 rounded-xl text-[10px] font-black flex items-center justify-center transition-all",
                                                    currentPage === pageNum 
                                                        ? "bg-slate-900 text-white shadow-md" 
                                                        : "text-slate-500 hover:bg-slate-200"
                                                )}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest"
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
