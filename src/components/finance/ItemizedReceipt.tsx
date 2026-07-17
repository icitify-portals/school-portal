"use client";

import React from "react";
import { BadgeCheck, Landmark, Receipt, ShieldCheck } from "lucide-react";

interface PaymentItem {
    name: string;
    category: string;
    originalAmount: number;
    finalAmount: number;
    amountPaid: number;
    scholarshipApplied: number;
    discountApplied: number;
    status: 'paid' | 'partial' | 'unpaid';
}

interface ItemizedReceiptProps {
    transaction: any;
    student: any;
    branding: any;
    bill: any;
    items: PaymentItem[];
    bursar?: any;
    arrears?: number;
    bursarySettings?: any;
}

export const ItemizedReceipt = ({
    transaction,
    student,
    branding,
    bill,
    items,
    bursar,
    arrears = 0,
    bursarySettings,
}: ItemizedReceiptProps) => {
    const isPaidInFull = arrears <= 0.01;
    const totalOriginal = items.reduce((s, i) => s + i.originalAmount, 0);
    const totalScholarship = items.reduce((s, i) => s + i.scholarshipApplied, 0);
    const totalDiscount = items.reduce((s, i) => s + i.discountApplied, 0);
    const totalAfterAid = items.reduce((s, i) => s + i.finalAmount, 0);
    const totalPaid = items.reduce((s, i) => s + i.amountPaid, 0);
    const paymentAmount = parseFloat(transaction.amount);

    return (
        <div id="receipt-content" className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden print:shadow-none print:border-none print:p-0">
            {/* Design Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-40 z-0" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-50 rounded-full -ml-24 -mb-24 opacity-50 z-0" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-4">
                        {branding?.INST_LOGO?.trim() && branding.INST_LOGO !== 'null' ? (
                            <img src={branding.INST_LOGO} alt="Logo" className="w-16 h-16 object-contain rounded-2xl" />
                        ) : (
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                <Landmark className="w-8 h-8" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                                {branding.INST_NAME}
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{branding.INST_MOTTO}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-flex items-center gap-2">
                            <Receipt className="w-3 h-3" />
                            Detailed Payment Receipt
                        </div>
                        <p className="text-sm font-bold text-slate-900">Bill: {bill?.billNumber || `#${bill?.id || transaction.id}`}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {new Date(transaction.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Student</p>
                        <p className="text-lg font-black text-slate-900">{student.firstName} {student.lastName}</p>
                        <p className="text-sm font-bold text-slate-500 uppercase">{student.matricNumber || "NOT REGISTERED"}</p>
                    </div>
                    <div className="md:text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Payment Method</p>
                        <p className="text-sm font-bold text-slate-700 uppercase">{transaction.gateway === "wallet" ? "Student Wallet" : (transaction.gateway || 'Manual')}</p>
                        <p className="text-[10px] font-mono text-slate-400">Txn Ref: TRX-{transaction.id}</p>
                        {transaction.rrr && <p className="text-[10px] font-mono text-slate-400">RRR: {transaction.rrr}</p>}
                    </div>
                </div>

                {/* Itemized Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left p-3 font-black text-slate-500 uppercase tracking-wider">Fee Item</th>
                                <th className="text-left p-3 font-black text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="text-right p-3 font-black text-slate-500 uppercase tracking-wider">Original</th>
                                <th className="text-right p-3 font-black text-slate-500 uppercase tracking-wider">Scholarship</th>
                                <th className="text-right p-3 font-black text-slate-500 uppercase tracking-wider">Discount</th>
                                <th className="text-right p-3 font-black text-slate-500 uppercase tracking-wider">Net Due</th>
                                <th className="text-right p-3 font-black text-slate-500 uppercase tracking-wider">Paid</th>
                                <th className="text-center p-3 font-black text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100">
                                    <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                                    <td className="p-3">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                            item.category === 'tuition' ? 'bg-indigo-50 text-indigo-600' :
                                            item.category === 'hostel' ? 'bg-amber-50 text-amber-600' :
                                            'bg-slate-50 text-slate-600'
                                        }`}>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right font-medium text-slate-400">₦{item.originalAmount.toLocaleString()}</td>
                                    <td className="p-3 text-right font-medium text-emerald-600">
                                        {item.scholarshipApplied > 0 ? `-₦${item.scholarshipApplied.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="p-3 text-right font-medium text-blue-600">
                                        {item.discountApplied > 0 ? `-₦${item.discountApplied.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="p-3 text-right font-bold text-slate-800">₦{item.finalAmount.toLocaleString()}</td>
                                    <td className="p-3 text-right font-bold text-emerald-600">₦{item.amountPaid.toLocaleString()}</td>
                                    <td className="p-3 text-center">
                                        {item.status === 'paid' ? (
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Paid</span>
                                        ) : item.status === 'partial' ? (
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Partial</span>
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Unpaid</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            {totalScholarship > 0 && (
                                <tr className="bg-emerald-50/50">
                                    <td colSpan={3} className="p-3 text-right font-black text-emerald-700 uppercase tracking-wider text-[10px]">Total Scholarship Aid</td>
                                    <td colSpan={5} className="p-3 text-left font-bold text-emerald-600">-₦{totalScholarship.toLocaleString()}</td>
                                </tr>
                            )}
                            {totalDiscount > 0 && (
                                <tr className="bg-blue-50/50">
                                    <td colSpan={3} className="p-3 text-right font-black text-blue-700 uppercase tracking-wider text-[10px]">Total Discount Applied</td>
                                    <td colSpan={5} className="p-3 text-left font-bold text-blue-600">-₦{totalDiscount.toLocaleString()}</td>
                                </tr>
                            )}
                            <tr className="bg-slate-100">
                                <td colSpan={5} className="p-3 text-right font-black text-slate-800 uppercase tracking-wider text-xs">Total Net Due</td>
                                <td className="p-3 text-right font-black text-slate-900 text-sm">₦{totalAfterAid.toLocaleString()}</td>
                                <td className="p-3 text-right font-black text-emerald-700 text-sm">₦{totalPaid.toLocaleString()}</td>
                                <td className="p-3 text-center">
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${isPaidInFull ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {isPaidInFull ? 'Settled' : 'Part Paid'}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Payment Summary Box */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">This Payment</p>
                            <h3 className="text-lg font-bold italic tracking-tight">{transaction.purpose}</h3>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount Paid</p>
                            <h2 className="text-4xl font-black text-white">₦{paymentAmount.toLocaleString()}</h2>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Outstanding:</span>
                            <span className={`text-lg font-black ${isPaidInFull ? 'text-emerald-400' : 'text-amber-400'}`}>
                                ₦{arrears.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isPaidInFull ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {isPaidInFull ? "Fully Settled" : "Partially Settled"}
                        </span>
                    </div>
                    {bill?.tuitionInstallmentEnabled && !isPaidInFull && (
                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                                Tuition Installment Mode: Remaining tuition must be paid by {bill.tuitionInstallmentDeadline ? new Date(bill.tuitionInstallmentDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'End of Second Semester'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end pt-6 border-t border-slate-100">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verified By</p>
                        <p className="text-xs font-bold text-slate-700">{bursar?.name || "Bursary Department"}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Authentication</p>
                        <p className="text-[9px] font-mono text-slate-500">REF: {transaction.gatewayReference?.slice(0, 16) || `TRX-${transaction.id}`}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
