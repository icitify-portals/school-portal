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
import { getAdmissionApplications, confirmAdmissionPayment } from "@/actions/admission_v2";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdmissionPaymentsPage() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

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

    const filteredApps = applications.filter(app => {
        const matchesSearch = app.template.name.toLowerCase().includes(search.toLowerCase()) ||
                             (app.formData && app.formData.toLowerCase().includes(search.toLowerCase()));
        const matchesFilter = filter === "all" ? true : app.paymentStatus === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
                        <CreditCard className="w-10 h-10 text-indigo-600" />
                        ADMISSION REVENUE
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Verify and confirm intake application payments</p>
                </div>
                <Button className="bg-slate-900 text-white font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest">
                    <Download className="w-5 h-5" /> Export Ledger
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        className="w-full pl-12 pr-4 py-5 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-sm"
                        placeholder="Search by candidate name or form type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-50">
                    {["all", "pending", "paid"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === f ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
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
                            ) : filteredApps.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                                        No matching transactions found
                                    </td>
                                </tr>
                            ) : (
                                filteredApps.map((app) => {
                                    const data = JSON.parse(app.formData || "{}");
                                    const candidateName = data.firstName ? `${data.firstName} ${data.lastName}` : "Unnamed Candidate";
                                    
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
                                                // @ts-expect-error - TS2304: Auto-suppressed for build
                                                {settings?.base_currency || '₦'}{app.template.applicationFee.toLocaleString()}
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
                                                {app.paymentStatus === 'pending' ? (
                                                    <Button 
                                                        onClick={() => handleConfirm(app.id)}
                                                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-100"
                                                    >
                                                        Confirm Bank Pay
                                                    </Button>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-black text-emerald-600 uppercase italic">Verified</span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Ref: {app.paymentReference}</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
