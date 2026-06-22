"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Download,
    Calendar,
    Wallet,
    Search,
    Loader2,
    ArrowRight,
    Printer,
    ChevronDown,
    Building2,
    CheckCircle2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMyPayslips, getPayslipDetails } from "@/actions/hr_payslips";
import { cn } from "@/lib/utils";

export default function StaffPayslipsPage() {
    const [payslips, setPayslips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getMyPayslips();
        setPayslips(data);
        if (data.length > 0) {
            handleViewDetails(data[0].id);
        }
        setLoading(false);
    };

    const handleViewDetails = async (id: number) => {
        setIsFetchingDetails(true);
        const details = await getPayslipDetails(id);
        setSelectedPayslip(details);
        setIsFetchingDetails(false);
    };

    const handlePrint = () => {
        const printContent = document.getElementById('payslip-print-area');
        if (printContent) {
            const originalContent = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload(); // Reload to restore state
        }
    };

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                        <Wallet className="w-8 h-8 text-indigo-600" />
                        My Compensation Hub
                    </h1>
                    <p className="text-slate-500 font-medium italic">Access your monthly earnings, tax breakdowns and historical charts</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified Document Portal
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Historical List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2 italic">Earnings History</h3>
                    <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {loading ? (
                            <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></div>
                        ) : payslips.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => handleViewDetails(p.id)}
                                className={cn(
                                    "p-5 rounded-2xl cursor-pointer transition-all border group",
                                    selectedPayslip?.log.id === p.id
                                        ? "bg-white shadow-xl border-indigo-200 scale-105"
                                        : "bg-white/40 border-slate-100 hover:border-slate-200 hover:bg-white"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        <p className="font-black text-xs text-slate-900 uppercase tracking-tighter">
                                            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(p.year, p.month - 1))}
                                        </p>
                                    </div>
                                    <ArrowRight className={cn(
                                        "w-3 h-3 transition-transform",
                                        selectedPayslip?.log.id === p.id ? "translate-x-1 text-indigo-600" : "text-slate-300 opacity-0 group-hover:opacity-100"
                                    )} />
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Net Pay</p>
                                    <p className="text-sm font-black text-slate-900">\u20a6{parseFloat(p.netPay).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payslip View Center */}
                <div className="lg:col-span-3">
                    {isFetchingDetails ? (
                        <div className="h-[600px] flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-200" />
                        </div>
                    ) : selectedPayslip ? (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">Payslip Breakdown</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: {selectedPayslip.log.ledgerBatchId.substring(0, 8).toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrint}
                                        className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 gap-2 border-slate-200"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        Print Document
                                    </Button>
                                    <Button
                                        onClick={handlePrint} // In a browser, print to PDF is the download
                                        className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-black uppercase text-[10px] tracking-widest h-10 gap-2 shadow-lg shadow-indigo-100"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Save as PDF
                                    </Button>
                                </div>
                            </div>

                            {/* Actual Payslip Document Area */}
                            <div id="payslip-print-area" className="bg-white rounded-2xl shadow-xl border border-slate-100 p-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none" />

                                {/* Header */}
                                <div className="flex justify-between items-start mb-12 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic">PH</div>
                                            <h1 className="text-lg font-black tracking-tight text-slate-900">PRINCESS HERITAGE</h1>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Pay Stub</p>
                                            <p className="text-sm font-black text-slate-700 italic">
                                                {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(selectedPayslip.log.year, selectedPayslip.log.month - 1))}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-sm font-black text-slate-900 mb-1 uppercase tracking-tight">{selectedPayslip.user.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">{selectedPayslip.staff.jobTitle}</p>
                                        <p className="text-[10px] font-medium text-slate-400 italic">ID: {selectedPayslip.staff.staffId}</p>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="grid grid-cols-2 gap-12 mb-12">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 border-b border-indigo-50 pb-2 italic">Earnings</h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500">Basic Salary</span>
                                                <span className="text-xs font-black text-slate-900">\u20a6{parseFloat(selectedPayslip.log.basePay).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500">Allowances</span>
                                                <span className="text-xs font-black text-slate-900">\u20a6{parseFloat(selectedPayslip.log.allowances).toLocaleString()}</span>
                                            </div>
                                            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                                <span className="text-xs font-black text-slate-900 italic uppercase tracking-widest">Gross Total</span>
                                                <span className="text-sm font-black text-indigo-600">
                                                    \u20a6{(parseFloat(selectedPayslip.log.basePay) + parseFloat(selectedPayslip.log.allowances)).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 mb-6 border-b border-rose-50 pb-2 italic">Deductions</h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500">Income Tax (P.A.Y.E)</span>
                                                <span className="text-xs font-black text-slate-900 italic">Included</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500">Statutory Deductions</span>
                                                <span className="text-xs font-black text-rose-600">(\u20a6{parseFloat(selectedPayslip.log.deductions).toLocaleString()})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Net Total Banner */}
                                <div className="bg-slate-900 text-white p-8 rounded-2xl flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                            <Wallet className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Net Salary Pay</p>
                                            <h2 className="text-4xl font-black italic tracking-tight">\u20a6{parseFloat(selectedPayslip.log.netPay).toLocaleString()}</h2>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center justify-end gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Payment Verified
                                        </p>
                                        <p className="text-[9px] font-medium text-slate-500 italic mt-1">Disbursed on {new Date(selectedPayslip.log.paidAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-12 flex justify-between items-end border-t border-slate-50 pt-8">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-slate-300" />
                                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Imperial Heritage - Automated Payroll System</p>
                                    </div>
                                    <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center italic text-slate-300 font-black text-[10px] border-2 border-dashed border-slate-200">
                                        Official Stamp
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-center p-20">
                            <Wallet className="w-16 h-16 text-slate-100 mb-6" />
                            <h2 className="text-2xl font-black text-slate-900 italic tracking-tight">No Payment History Detected</h2>
                            <p className="max-w-xs text-sm text-slate-400 font-medium mt-2">When your salary is processed, your interactive payslips will appear here automatically.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
