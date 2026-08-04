"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    CreditCard, 
    Search, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    Filter,
    ArrowUpRight,
    User,
    Calendar,
    Download
} from "lucide-react";
import { getAdmissionApplications, confirmAdmissionPayment, deleteAdmissionApplication } from "@/actions/admission_v2";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdmissionPaymentsPage() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        const data = await getAdmissionApplications();
        setApplications(data);
        setLoading(false);
    };

    const handleConfirm = async (id: number) => {
        const reference = prompt("Enter Bank Transaction Reference:");
        if (!reference) return;

        const res = await confirmAdmissionPayment(id, reference);
        if (res.success) {
            toast.success("Payment confirmed!");
            fetchApplications();
        } else {
            toast.error(res.error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;
        
        const res = await deleteAdmissionApplication(id);
        if (res.success) {
            toast.success("Application deleted successfully");
            fetchApplications();
        } else {
            toast.error(res.error);
        }
    };

    const filteredApps = applications.filter(app => {
        const matchesSearch = app.template.name.toLowerCase().includes(search.toLowerCase()) ||
                             (app.data && typeof app.data === 'string' && app.data.toLowerCase().includes(search.toLowerCase()));
        const matchesFilter = filter === "all" ? true : app.paymentStatus === filter;
        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
    const paginatedApps = filteredApps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset to page 1 when filter/search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filter]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <CreditCard className="w-12 h-12 text-emerald-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    ADMISSION REVENUE
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Verify and confirm intake application payments
                            </p>
                        </div>
                        
                        <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner gap-2 flex-wrap">
                            <button className="flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg hover:-translate-y-1">
                                <Download className="w-4 h-4" /> Export Ledger
                            </button>
                        </div>
                    </div>
                </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        className="w-full pl-12 pr-4 py-5 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-emerald-500 bg-white/80 backdrop-blur-3xl font-bold text-sm"
                        placeholder="Search by candidate name or form type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex bg-white/60 backdrop-blur-3xl p-1.5 rounded-2xl shadow-sm border border-slate-200">
                    {["all", "pending", "paid"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === f ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                    <div className="flex items-center px-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            Matches: <span className="text-emerald-600 ml-1">{filteredApps.length}</span>
                        </span>
                    </div>
                </div>
            </div>

            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Candidate</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Form Level</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Amount</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
                                    </td>
                                </tr>
                            ) : paginatedApps.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                                        No matching transactions found
                                    </td>
                                </tr>
                            ) : (
                                paginatedApps.map((app) => {
                                    let data: any = {};
                                    try {
                                        data = typeof app.data === 'string' ? JSON.parse(app.data || "{}") : (app.data || {});
                                    } catch (e) {
                                        console.error("Failed to parse app data", app.id);
                                    }
                                    const candidateName = data.firstName || data.lastName 
                                        ? `${data.firstName || ''} ${data.lastName || ''}`.trim() 
                                        : (app.student?.firstName ? `${app.student.firstName} ${app.student.surname}`.trim() 
                                            : (app.applicant?.firstName ? `${app.applicant.firstName} ${app.applicant.surname}`.trim() : (app.applicant?.name || "Unnamed Candidate")));
                                    
                                    return (
                                        <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 uppercase italic">{candidateName}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Calendar className="w-3 h-3" /> {format(new Date(app.appliedAt), 'MMM dd, HH:mm')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-700 uppercase italic">{app.template.name}</span>
                                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{app.template.level} level</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-black text-slate-900 italic">
                                                \u20A6{app.template.applicationFee.toLocaleString()}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit",
                                                    app.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", app.paymentStatus === 'paid' ? "bg-emerald-500" : "bg-amber-500")} />
                                                    {app.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {app.paymentStatus === 'pending' ? (
                                                        <Button 
                                                            onClick={() => handleConfirm(app.id)}
                                                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-100"
                                                        >
                                                            Confirm Bank Pay
                                                        </Button>
                                                    ) : (
                                                        <div className="flex flex-col items-end mr-4">
                                                            <span className="text-[9px] font-black text-emerald-600 uppercase italic">Verified</span>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Ref: {app.paymentReference}</span>
                                                        </div>
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
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-8 py-4 bg-slate-50 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-700">{Math.min(currentPage * itemsPerPage, filteredApps.length)}</span> of <span className="text-slate-700">{filteredApps.length}</span> entries
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
