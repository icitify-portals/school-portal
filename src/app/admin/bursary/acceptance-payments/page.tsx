"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    CreditCard, Search, Loader2, User, Calendar, CheckCircle2, XCircle,
    Filter, FileText, Download, ExternalLink, ChevronLeft, ChevronRight, Printer, Receipt
} from "lucide-react";
import { getSuccessfulAcceptancePayments } from "@/actions/admission_v2";
import { getDepartments } from "@/actions/departments";
import { getProgrammes } from "@/actions/programmes";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export default function AcceptancePaymentsPage() {
    const [data, setData] = useState<any>({ payments: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState<number | undefined>(undefined);
    const [programmeFilter, setProgrammeFilter] = useState<number | undefined>(undefined);
    const [levelFilter, setLevelFilter] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    const [departments, setDepartments] = useState<any[]>([]);
    const [programmes, setProgrammes] = useState<any[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchData();
        Promise.all([
            getDepartments(),
            getProgrammes()
        ]).then(([deptRes, progRes]) => {
            if (deptRes.success) setDepartments(deptRes.data || []);
            if (progRes.success) setProgrammes(progRes.data || []);
        }).catch(() => {});
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await getSuccessfulAcceptancePayments({
                pageSize: 5000,
                search: search || undefined,
                departmentId: departmentFilter,
                programmeId: programmeFilter,
                level: levelFilter !== 'all' ? levelFilter : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            if (result) {
                setData(result);
            } else {
                setData({ payments: [], total: 0 });
            }
        } catch (err: any) {
            console.error("Failed to load acceptance payments:", err);
            toast.error(err?.message || "Failed to load acceptance payments");
            setData({ payments: [], total: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(debounce);
    }, [search, departmentFilter, programmeFilter, levelFilter, startDate, endDate]);

    const filteredProgrammes = departmentFilter
        ? programmes.filter((p: any) => p.deptId === departmentFilter || p.departmentId === departmentFilter)
        : programmes;

    const paymentsList = Array.isArray(data?.payments) ? data.payments : [];

    const filtered = paymentsList.filter((app: any) => {
        const matchesSearch = (app.applicantName || '').toLowerCase().includes(search.toLowerCase()) ||
                             (app.formNumber || '').toLowerCase().includes(search.toLowerCase()) ||
                             (app.applicantEmail || '').toLowerCase().includes(search.toLowerCase()) ||
                             (app.studentMatricNumber || '').toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const totalAmount = filtered.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedPayments = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, departmentFilter, programmeFilter, levelFilter, startDate, endDate]);

    const handlePrintReceipt = (payment: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = `
<!DOCTYPE html>
<html>
<head>
    <title>Acceptance Fee Receipt - ${payment.formNumber || payment.id}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; }
        .receipt-id { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; font-weight: bold; }
        .value { text-align: right; }
        .amount { font-size: 28px; font-weight: bold; color: #059669; text-align: right; margin: 20px 0; }
        .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>FEDERAL SCHOOL OF STATISTICS</h1>
        <p>Km 4, Ikpaja Road, Ibadan, Oyo State</p>
        <p>Email: info@fss.edu.ng | Tel: 080XXXXXXXX</p>
    </div>

    <div class="receipt-id">
        <strong>ACCEPTANCE FEE RECEIPT</strong><br/>
        Receipt No: ${payment.transactionId || 'N/A'}<br/>
        Reference: ${payment.transactionRef || 'N/A'}
    </div>

    <div class="row">
        <span class="label">Applicant Name:</span>
        <span class="value">${payment.applicantName}</span>
    </div>
    <div class="row">
        <span class="label">Form Number:</span>
        <span class="value">${payment.formNumber || 'N/A'}</span>
    </div>
    <div class="row">
        <span class="label">Programme:</span>
        <span class="value">${payment.programmeName}</span>
    </div>
    <div class="row">
        <span class="label">Department:</span>
        <span class="value">${payment.departmentName}</span>
    </div>
    <div class="row">
        <span class="label">Level:</span>
        <span class="value">${payment.academicLevel}</span>
    </div>
    <div class="row">
        <span class="label">Payment Date:</span>
        <span class="value">${payment.paidAt ? format(new Date(payment.paidAt), 'dd MMMM yyyy, HH:mm') : 'N/A'}</span>
    </div>

    <div class="amount">
        Amount Paid: ₦${(parseFloat(payment.amount) || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
    </div>

    <div class="footer">
        <p>This is an official receipt for acceptance fee payment.</p>
        <p>Federal School of Statistics Bursary Department</p>
        <p>Printed on: ${format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
    </div>
</body>
</html>
`;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    };

    const handleExportCSV = () => {
        const headers = ['Form Number', 'Applicant Name', 'Email', 'Phone', 'Matric Number', 'Programme', 'Department', 'Level', 'Amount', 'Transaction Ref', 'Paid At'];
        const rows = filtered.map((p: any) => [
            p.formNumber || '',
            p.applicantName || '',
            p.applicantEmail || '',
            p.applicantPhone || '',
            p.studentMatricNumber || '',
            p.programmeName || '',
            p.departmentName || '',
            p.academicLevel || '',
            p.amount || '0',
            p.transactionRef || '',
            p.paidAt ? format(new Date(p.paidAt), 'yyyy-MM-dd HH:mm:ss') : ''
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `acceptance_payments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 lg:p-12 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Receipt className="w-12 h-12 text-emerald-200" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    Acceptance Payments
                                </h1>
                            </div>
                            <p className="text-emerald-100 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Track all successful acceptance fee payments
                            </p>
                        </div>
                        <button
                            onClick={handleExportCSV}
                            disabled={filtered.length === 0}
                            className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            <Download className="w-5 h-5" />
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border border-emerald-200 shadow-lg bg-white/80 rounded-[2rem] p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-2xl">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Paid</p>
                                <p className="text-3xl font-black text-slate-900">{filtered.length}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="border border-blue-200 shadow-lg bg-white/80 rounded-[2rem] p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-2xl">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                                <p className="text-2xl font-black text-slate-900">₦{totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="border border-purple-200 shadow-lg bg-white/80 rounded-[2rem] p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-2xl">
                                <User className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ND Students</p>
                                <p className="text-3xl font-black text-slate-900">
                                    {filtered.filter((p: any) => p.academicLevel?.includes('ND')).length}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="border border-amber-200 shadow-lg bg-white/80 rounded-[2rem] p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-2xl">
                                <User className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HND Students</p>
                                <p className="text-3xl font-black text-slate-900">
                                    {filtered.filter((p: any) => p.academicLevel?.includes('HND')).length}
                                </p>
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
                                placeholder="Search by name, form number, email, or matric number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-white/60 rounded-2xl shadow-sm border border-slate-200 p-1.5">
                            {["all", "ND1", "ND2", "HND1", "HND2"].map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => setLevelFilter(lvl)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        levelFilter === lvl ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {lvl === 'all' ? 'All Levels' : lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={departmentFilter || ''}
                            onChange={e => setDepartmentFilter(e.target.value ? Number(e.target.value) : undefined)}
                            className="px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium shadow-sm focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">All Departments</option>
                            {departments.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        <select
                            value={programmeFilter || ''}
                            onChange={e => setProgrammeFilter(e.target.value ? Number(e.target.value) : undefined)}
                            className="px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium shadow-sm focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">All Programmes</option>
                            {filteredProgrammes.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium shadow-sm focus:ring-2 focus:ring-emerald-500"
                            placeholder="Start Date"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium shadow-sm focus:ring-2 focus:ring-emerald-500"
                            placeholder="End Date"
                        />
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium shadow-sm hover:bg-red-100 transition-colors"
                            >
                                Clear Dates
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Applicant</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Form / Matric</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Programme</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">Level</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Transaction Ref</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Paid At</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedPayments.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                    <p className="text-lg font-medium">No acceptance payments found</p>
                                                    <p className="text-sm">Try adjusting your filters</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedPayments.map((payment: any) => (
                                                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-semibold text-slate-900">{payment.applicantName}</p>
                                                            <p className="text-xs text-slate-500">{payment.applicantEmail}</p>
                                                            <p className="text-xs text-slate-400">{payment.applicantPhone}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-mono text-sm font-medium text-slate-900">{payment.formNumber || 'N/A'}</p>
                                                            <p className="font-mono text-xs text-emerald-600">{payment.studentMatricNumber || 'Not Matriculated'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900">{payment.programmeName}</p>
                                                            <p className="text-xs text-slate-500">{payment.departmentName}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={cn(
                                                            "inline-flex px-3 py-1 rounded-full text-xs font-bold",
                                                            payment.academicLevel?.includes('HND')
                                                                ? "bg-amber-100 text-amber-700"
                                                                : "bg-blue-100 text-blue-700"
                                                        )}>
                                                            {payment.academicLevel}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <p className="font-bold text-emerald-600">
                                                            ₦{(parseFloat(payment.amount) || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-mono text-xs text-slate-600">{payment.transactionRef || 'N/A'}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-slate-600">
                                                            {payment.paidAt ? format(new Date(payment.paidAt), 'dd MMM yyyy') : 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            {payment.paidAt ? format(new Date(payment.paidAt), 'HH:mm') : ''}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handlePrintReceipt(payment)}
                                                                className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors"
                                                                title="Print Receipt"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                            </button>
                                                            <Link
                                                                href={`/admin/admission/v2/${payment.id}`}
                                                                className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                                                                title="View Application"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                                    <p className="text-sm text-slate-500">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} payments
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-sm font-medium text-slate-600">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
