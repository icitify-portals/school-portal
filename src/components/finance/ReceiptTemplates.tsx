"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { BadgeCheck, Landmark, ShieldCheck, Mail, Phone, Receipt } from "lucide-react";
import { AcademicNomenclature } from "@/lib/nomenclature";
import { amountInWords } from "@/lib/numberToWords";

interface ReceiptProps {
    transaction: any;
    student: any;
    branding: any;
    bursar?: any;
    arrears?: number;
    bursarySettings?: any;
}

export const ModernReceipt = ({ transaction, student, branding, bursar, arrears = 0, bursarySettings }: ReceiptProps) => {
    const isPaidInFull = arrears <= 0.01;
    const termLabel = AcademicNomenclature.getLabel(
        transaction.sessionId || student.admissionSessionId || "1",
        bursarySettings
    );

    return (
        <div id="receipt-content" className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden print:shadow-none print:border-none print:p-0">
            {/* Design Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-40 z-0" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-50 rounded-full -ml-24 -mb-24 opacity-50 z-0" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-4">
                        {(branding?.INST_LOGO?.trim() && branding.INST_LOGO !== 'null') ? (
                            <img src={branding.INST_LOGO} alt="Logo" className="w-16 h-16 object-contain rounded-2xl" onError={(e) => { e.currentTarget.src = "/logo.png"; }} />
                        ) : (
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                <Landmark className="w-8 h-8" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                                {branding.INST_NAME}
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{branding.INST_MOTTO}</p>
                            {branding.SCHOOL_ADDRESS && (
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">{branding.SCHOOL_ADDRESS}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-flex items-center gap-2">
                            <BadgeCheck className="w-3 h-3" />
                            Official Payment Receipt
                        </div>
                        <p className="text-sm font-bold text-slate-900">No: #{transaction.id?.toString().padStart(6, '0')}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {new Date(transaction.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Paid By</h4>
                        <div className="space-y-1">
                            <p className="text-lg font-black text-slate-900">{student.firstName} {student.lastName}</p>
                            <p className="text-sm font-bold text-slate-500 uppercase">{student.matricNumber || "NOT REGISTERED"}</p>
                            <p className="text-xs text-slate-400">{student.programme?.name || "General Course"}</p>
                        </div>
                    </div>
                    <div className="md:text-right">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Transaction Details</h4>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-700 uppercase">Method: {transaction.gateway === "wallet" ? "Student Wallet" : (transaction.gateway || 'Manual')}</p>
                            <p className="text-xs font-mono text-slate-400 truncate max-w-[250px] ml-auto">RRR: {transaction.rrr || transaction.gatewayReference || "N/A"}</p>
                            <p className="text-xs font-mono text-slate-400 truncate max-w-[250px] ml-auto">Txn Ref: TRX-{transaction.id}</p>
                            <p className="text-xs text-slate-500">Status: <span className="text-emerald-500 font-bold uppercase italic">{transaction.status}</span></p>
                        </div>
                    </div>
                </div>

                {/* Billing Summary Box */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white mb-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-6 mb-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Purpose</p>
                            <h3 className="text-lg font-bold italic tracking-tight">{transaction.purpose} ({termLabel})</h3>
                            <p className="text-xs text-indigo-300 font-medium uppercase mt-1">{termLabel}</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount Paid</p>
                            <h2 className="text-4xl font-black text-white">₦{parseFloat(transaction.amount).toLocaleString()}</h2>
                        </div>
                    </div>

                    {/* Outstanding & Status Row */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arrears / Outstanding Balance:</span>
                            <span className={cn("text-lg font-black", isPaidInFull ? "text-emerald-400" : "text-amber-400")}>
                                ₦{arrears.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div>
                            <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", 
                                isPaidInFull ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300")}>
                                {isPaidInFull ? "Fully Settled" : "Partially Settled"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-100">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 mt-1" />
                        <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase">Verification System</p>
                            <p className="text-[9px] text-slate-400 leading-tight">This official receipt is electronically signed. Authenticity can be verified online via Bursary department portal.</p>
                        </div>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-12">
                        <div className="text-center">
                            <div className="h-12 flex items-end justify-center mb-1">
                                {bursar?.signatureUrl && (
                                    <img 
                                        src={bursar.signatureUrl} 
                                        className={cn("h-full object-contain mb-1", bursar.isDigital ? "brightness-0 grayscale" : "")} 
                                        alt="Bursar Signature"
                                    />
                                )}
                            </div>
                            <div className="w-24 h-0.5 bg-slate-200 mb-2 mx-auto" />
                            <p className="text-[10px] font-black text-slate-900 uppercase">{bursar?.name || "Official Bursar"}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Bursary Controller</p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full mb-2 mx-auto border-2 border-slate-100 flex items-center justify-center opacity-40 grayscale">
                                {(branding?.INST_LOGO?.trim() && branding.INST_LOGO !== 'null') ? <img src={branding.INST_LOGO} className="w-10 opacity-30" onError={(e) => { e.currentTarget.src = "/logo.png"; }} /> : <Receipt className="w-8" />}
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">School Stamp</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ClassicReceipt = ({ transaction, student, branding, bursar, arrears = 0, bursarySettings }: ReceiptProps) => {
    const isPaidInFull = arrears <= 0.01;
    const termLabel = AcademicNomenclature.getLabel(
        transaction.sessionId || student.admissionSessionId || "1",
        bursarySettings
    );

    return (
        <div id="receipt-content" className="max-w-2xl mx-auto bg-white p-12 border-4 border-double border-slate-900 relative print:border-2 print:p-4 print:my-0 break-inside-avoid">
            <div className="text-center border-b-2 border-slate-900 pb-6 mb-8 print:mb-4 print:pb-4">
                <h1 className="text-3xl font-serif font-bold text-slate-900 uppercase tracking-tighter mb-1">{branding.INST_NAME}</h1>
                <p className="text-sm font-serif italic text-slate-600 mb-4 print:mb-2">{branding.INST_MOTTO}</p>
                <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> support@{branding.INST_NAME.toLowerCase().replace(/\s+/g, '')}.edu.ng</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +234 000 000 0000</span>
                </div>
            </div>

            <div className="flex justify-between items-start mb-8">
                <div className="text-left py-2 px-4 border border-slate-200 rounded">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Receipt Number</p>
                    <p className="text-lg font-mono font-bold text-red-600">RC-{transaction.id?.toString().padStart(8, '0')}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 uppercase italic">Official Receipt</p>
                    <p className="text-xs font-bold text-slate-500">{new Date(transaction.createdAt).toLocaleDateString('en-US')}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">RRR: {transaction.rrr || transaction.gatewayReference || "N/A"}</p>
                </div>
            </div>

            <table className="w-full mb-8 border-collapse">
                <tbody>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Student Name:</td>
                        <td className="py-3 text-right font-bold text-slate-900">{student.firstName} {student.lastName}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Registration No:</td>
                        <td className="py-3 text-right font-bold text-slate-900">{student.matricNumber || "NOT REGISTERED"}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Programme:</td>
                        <td className="py-3 text-right font-bold text-slate-900">{student.programme?.name || "General Course"}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Academic Period:</td>
                        <td className="py-3 text-right font-bold text-slate-900 uppercase">{termLabel}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Payment For:</td>
                        <td className="py-3 text-right font-bold text-slate-900">{transaction.purpose} ({termLabel})</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Payment Method:</td>
                        <td className="py-3 text-right font-bold text-slate-900 uppercase">
                            {transaction.gateway === "wallet" ? "Student Wallet" : transaction.gateway}
                        </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Outstanding Balance:</td>
                        <td className="py-3 text-right font-black text-red-600">
                            ₦{arrears.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-between items-center gap-6 mb-12">
                <div className="py-2 px-4 border border-slate-300 rounded text-left">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Payment Status</p>
                    <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                        {isPaidInFull ? "Fully Paid" : "Installment / Part-Paid"}
                    </span>
                </div>
                <div className="bg-slate-50 border-2 border-slate-900 p-6 min-w-[250px] text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount Paid</p>
                    <h2 className="text-3xl font-serif font-black text-slate-900">₦{parseFloat(transaction.amount).toLocaleString()}</h2>
                </div>
            </div>

            <div className="flex justify-between items-end pt-12">
                <div className="text-center w-48 border-t-2 border-slate-900 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-tight">Student Signature</p>
                </div>
                <div className="text-center w-60 border-t-2 border-slate-900 pt-2 relative">
                    {bursar?.signatureUrl && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-16 pointer-events-none">
                             <img 
                                src={bursar.signatureUrl} 
                                className={cn("w-full h-full object-contain", bursar.isDigital ? "brightness-0" : "")} 
                                alt="Bursar Signature"
                            />
                        </div>
                    )}
                    <p className="text-xs font-serif font-black uppercase text-slate-900 leading-tight">{bursar?.name || "The Bursar"}</p>
                    <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Authorized Officer</p>
                </div>
            </div>
        </div>
    );
};

export const MinimalistReceipt = ({ transaction, student, branding, bursar, arrears = 0, bursarySettings }: ReceiptProps) => {
    const isPaidInFull = arrears <= 0.01;
    const termLabel = AcademicNomenclature.getLabel(
        transaction.sessionId || student.admissionSessionId || "1",
        bursarySettings
    );

    return (
        <div id="receipt-content" className="max-w-xl mx-auto bg-white p-8 md:p-12 print:p-4 print:m-0 break-inside-avoid">
            <div className="flex justify-between items-start mb-16">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">{branding.INST_NAME}</h1>
                    <p className="text-xs text-slate-500">{branding.INST_MOTTO}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Receipt ID</p>
                    <p className="text-sm font-bold text-slate-900">#{transaction.id}</p>
                    <p className="text-[10px] text-slate-400 mt-2">RRR: {transaction.rrr || transaction.gatewayReference || "N/A"}</p>
                </div>
            </div>

            <div className="mb-12">
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-4">Financial Record Summary</p>
                <div className="flex justify-between items-end pb-4 border-b border-slate-100 mb-4">
                    <div>
                        <p className="text-lg font-medium text-slate-900">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-slate-400">{student.matricNumber || "NOT REGISTERED"}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">{termLabel}</p>
                    </div>
                    <p className="text-xs text-slate-500">{new Date(transaction.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
                </div>

                <div className="py-4 flex justify-between items-center text-sm border-b border-slate-100">
                    <div>
                        <p className="font-medium text-slate-800">{transaction.purpose} ({termLabel})</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase">
                            Paid via {transaction.gateway === "wallet" ? "Student Wallet" : transaction.gateway}
                        </p>
                    </div>
                    <p className="font-bold text-slate-900">₦{parseFloat(transaction.amount).toLocaleString()}</p>
                </div>

                <div className="py-4 flex justify-between items-center text-sm border-b border-slate-100">
                    <span className="text-slate-500">Remaining Balance (Arrears):</span>
                    <span className="font-bold text-slate-900">₦{arrears.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="py-4 flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-900">Total Settled In This Transaction</p>
                    <p className="text-2xl font-black text-slate-900 underline underline-offset-8 decoration-slate-200 leading-none">
                        ₦{parseFloat(transaction.amount).toLocaleString()}
                    </p>
                </div>

                <div className="mt-4">
                    <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                        isPaidInFull ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800")}>
                        {isPaidInFull ? "Paid in Full" : "Partially Paid"}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-slate-900" />
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-none">
                        Digital Verification Hash: {transaction.gatewayReference?.slice(0, 16) || "SCHOOL-INTERNAL-REF"}
                    </p>
                </div>
                <div className="pt-8 flex justify-between items-end border-t border-slate-100">
                    <div className="max-w-[200px]">
                        <p className="text-[9px] text-slate-300 mb-4">Official computer generated invoice. Serves as absolute proof of credit entry into the student ledger.</p>
                        <Landmark className="w-6 h-6 text-slate-100" />
                    </div>
                    <div className="text-right">
                        {bursar?.signatureUrl && (
                            <img 
                                src={bursar.signatureUrl} 
                                className={cn("h-12 w-auto mb-1 ml-auto", bursar.isDigital ? "brightness-0 opacity-80" : "")} 
                                alt="Bursar Stamp"
                            />
                        )}
                        <p className="text-[10px] font-black uppercase text-slate-900 tracking-wider leading-none mb-1">{bursar?.name || "Official Bursar"}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Financial Control</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const HeritageReceipt = ({ transaction, student, branding, bursar, arrears = 0, bursarySettings }: ReceiptProps) => {
    const isPaidInFull = arrears <= 0.01;
    const termLabel = AcademicNomenclature.getLabel(
        transaction.sessionId || student.admissionSessionId || "1",
        bursarySettings
    );
    const amountVal = parseFloat(transaction.amount);
    const spelledOutAmount = amountInWords(amountVal);

    // Determine checklist active options
    const isCash = transaction.gateway === "manual";
    const isCheque = false;
    const isTeller = transaction.gateway === "direct";
    const isDraft = ["paystack", "flutterwave", "remita", "wallet"].includes(transaction.gateway || "");

    return (
        <div id="receipt-content" className="max-w-2xl mx-auto bg-amber-50/10 p-10 border-2 border-slate-800 rounded-2xl shadow-xl print:shadow-none print:border-none print:p-0 font-serif print:m-0 break-inside-avoid">
            {/* Header: School Logo & Details */}
            <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-4">
                    {(branding?.INST_LOGO?.trim() && branding.INST_LOGO !== 'null') ? (
                        <img src={branding.INST_LOGO} alt="Logo" className="w-16 h-16 object-contain" onError={(e) => { e.currentTarget.src = "/logo.png"; }} />
                    ) : (
                        <div className="w-16 h-16 border-2 border-black flex items-center justify-center font-bold text-xs uppercase text-center p-1">
                            Logo
                        </div>
                    )}
                    <div className="text-left">
                        <h1 className="text-xl font-bold text-blue-900 tracking-tight leading-none uppercase">
                            {branding.INST_NAME}
                        </h1>
                        {branding.INST_MOTTO && (
                            <p className="text-[10px] italic text-slate-500 mt-1 font-sans">{branding.INST_MOTTO}</p>
                        )}
                    </div>
                </div>
                <div className="text-right text-xs mt-4 md:mt-0 font-sans text-slate-600 max-w-xs leading-normal">
                    <p>{branding.INST_ADDRESS || "Federal School of Statistics, Along Ajibode Shasha road, Behind NISER, Shasha-Ojoo, Ibadan."}</p>
                    <p>Tel: {branding.INST_PHONE || "+234 000 000 0000"}</p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <span className="bg-emerald-700 text-white font-extrabold uppercase tracking-widest text-xs py-1 px-4 rounded-lg">
                            RECEIPT
                        </span>
                        <span className="font-mono text-sm font-bold text-slate-800 font-sans">
                            No: <span className="text-red-600 font-bold">#{transaction.id?.toString().padStart(6, "0")}</span>
                        </span>
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-2">
                        <span>RRR: {transaction.rrr || transaction.gatewayReference || "N/A"}</span>
                        <span className="mx-2">|</span>
                        <span>Txn Ref: TRX-{transaction.id}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-sans">
                    <span className="text-slate-400 uppercase tracking-widest">Date:</span>
                    <span className="border-b border-dashed border-slate-600 px-3 font-mono italic">
                        {new Date(transaction.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Handwritten Fields */}
            <div className="space-y-6 mb-8 text-sm">
                <div className="flex items-end gap-2">
                    <span className="whitespace-nowrap font-bold text-slate-700">Received from:</span>
                    <div className="flex-1 border-b border-dashed border-slate-600 pb-0.5 px-4 text-left italic font-bold text-blue-950 font-sans tracking-wide">
                        {student.firstName} {student.lastName} ({student.matricNumber || student.id})
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <span className="whitespace-nowrap font-bold text-slate-700">the sum of:</span>
                    <div className="flex-1 border-b border-dashed border-slate-600 pb-0.5 px-4 text-left italic font-bold text-blue-950 font-sans tracking-wide">
                        {spelledOutAmount}
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <span className="whitespace-nowrap font-bold text-slate-700">Being the transaction of:</span>
                    <div className="flex-1 border-b border-dashed border-slate-600 pb-0.5 px-4 text-left italic font-bold text-blue-950 font-sans tracking-wide">
                        {transaction.purpose} ({termLabel})
                    </div>
                </div>
            </div>

            {/* Checklist of Payment Modes */}
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 mb-8 font-sans">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">Cash</span>
                            <div className={`w-8 h-6 border border-slate-800 flex items-center justify-center font-bold text-xs bg-white ${isCash ? 'text-emerald-700' : 'text-transparent'}`}>
                                {isCash ? '✓' : ''}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">Cheque</span>
                            <div className={`w-8 h-6 border border-slate-800 flex items-center justify-center font-bold text-xs bg-white ${isCheque ? 'text-emerald-700' : 'text-transparent'}`}>
                                {isCheque ? '✓' : ''}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">Teller</span>
                            <div className={`w-8 h-6 border border-slate-800 flex items-center justify-center font-bold text-xs bg-white ${isTeller ? 'text-emerald-700' : 'text-transparent'}`}>
                                {isTeller ? '✓' : ''}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">Draft</span>
                            <div className={`w-8 h-6 border border-slate-800 flex items-center justify-center font-bold text-xs bg-white ${isDraft ? 'text-emerald-700' : 'text-transparent'}`}>
                                {isDraft ? '✓' : ''}
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tick as appropriate</span>
                </div>
            </div>

            {/* Bottom Row: Amount Box, Balance & Cashier Signature */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-8 border-t border-slate-300 pt-6">
                <div className="flex items-center gap-4">
                    <div className="border-2 border-slate-800 py-2 px-4 bg-slate-900 text-white font-mono rounded-lg flex items-center gap-2">
                        <span className="text-xl font-bold">&#8358;</span>
                        <span className="text-2xl font-black">{amountVal.toLocaleString()} : 00</span>
                        <span className="text-xs font-bold">K</span>
                    </div>
                    <div className="text-left font-sans">
                        <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Bal:</span>
                        <span className="text-sm font-black text-slate-800">
                            {arrears > 0.01 ? `₦${arrears.toLocaleString()}` : "—"}
                        </span>
                    </div>
                </div>

                <div className="text-center min-w-[150px]">
                    <div className="h-10 flex items-end justify-center mb-1">
                        {bursar?.signatureUrl && (
                            <img 
                                src={bursar.signatureUrl} 
                                className="h-full object-contain brightness-0" 
                                alt="Signature"
                            />
                        )}
                    </div>
                    <div className="w-32 border-t border-slate-800 mx-auto mb-1"></div>
                    <span className="text-xs font-bold text-slate-600 block leading-none font-sans uppercase">{bursar?.name || "Official Bursar"}</span>
                    <span className="text-[9px] text-slate-400 font-sans uppercase tracking-widest leading-none">Cashier</span>
                </div>
            </div>
        </div>
    );
};
