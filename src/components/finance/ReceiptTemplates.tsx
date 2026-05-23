
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { BadgeCheck, Landmark, ShieldCheck, Printer, Download, Mail, Phone, Globe } from "lucide-react";

interface ReceiptProps {
    transaction: any;
    student: any;
    branding: any;
    bursar?: any;
}

export const ModernReceipt = ({ transaction, student, branding, bursar }: ReceiptProps) => {
    return (
        <div id="receipt-content" className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden print:shadow-none print:border-none print:p-0">
            {/* Design Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 z-0" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-50 rounded-full -ml-24 -mb-24 opacity-50 z-0" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-4">
                        {branding.INST_LOGO ? (
                            <img src={branding.INST_LOGO} alt="Logo" className="w-16 h-16 object-contain rounded-2xl" />
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
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-flex items-center gap-2">
                            <BadgeCheck className="w-3 h-3" />
                            Official Payment Receipt
                        </div>
                        <p className="text-sm font-bold text-slate-900">No: #{transaction.id?.toString().padStart(6, '0')}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(transaction.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Paid By</h4>
                        <div className="space-y-1">
                            <p className="text-lg font-black text-slate-900">{student.firstName} {student.lastName}</p>
                            <p className="text-sm font-bold text-slate-500 uppercase">{student.matricNumber || "N/A"}</p>
                            <p className="text-xs text-slate-400">{student.programme?.name}</p>
                        </div>
                    </div>
                    <div className="md:text-right">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Transaction Info</h4>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-700 uppercase">{transaction.gateway || 'Manual'}</p>
                            <p className="text-xs font-mono text-slate-400 truncate max-w-[200px] ml-auto">Ref: {transaction.gatewayReference || "SCHOOL-INTERNAL"}</p>
                            <p className="text-xs text-slate-500">Status: <span className="text-emerald-500 font-bold uppercase italic">{transaction.status}</span></p>
                        </div>
                    </div>
                </div>

                {/* Amount Row */}
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white mb-12 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt for</p>
                        <h3 className="text-xl font-bold italic tracking-tight">{transaction.purpose}</h3>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount Paid</p>
                        <h2 className="text-4xl font-black text-white">₦{parseFloat(transaction.amount).toLocaleString()}</h2>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-100">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-indigo-500 mt-1" />
                        <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase">Secure Verification</p>
                            <p className="text-[9px] text-slate-400 leading-tight">This receipt is electronically generated and digitally signed by the Bursary Department.</p>
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
                            <p className="text-[10px] font-black text-slate-900 uppercase">{bursar?.name || "Bursar"}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Cashier / Bursar</p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full mb-2 mx-auto border-2 border-slate-100 flex items-center justify-center opacity-40 grayscale">
                                {branding.INST_LOGO ? <img src={branding.INST_LOGO} className="w-10 opacity-30" /> : <Landmark className="w-8" />}
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Bursary Seal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ClassicReceipt = ({ transaction, student, branding, bursar }: ReceiptProps) => {
    return (
        <div id="receipt-content" className="max-w-2xl mx-auto bg-white p-12 border-4 border-double border-slate-900 relative print:border-2 print:p-8">
            <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
                <h1 className="text-3xl font-serif font-bold text-slate-900 uppercase tracking-tighter mb-1">{branding.INST_NAME}</h1>
                <p className="text-sm font-serif italic text-slate-600 mb-4">{branding.INST_MOTTO}</p>
                <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> support@{branding.INST_NAME.toLowerCase().replace(/\s+/g, '')}.edu.ng</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +234 000 000 0000</span>
                </div>
            </div>

            <div className="flex justify-between items-start mb-10">
                <div className="text-left py-2 px-4 border border-slate-200 rounded">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Receipt Number</p>
                    <p className="text-lg font-mono font-bold text-red-600">RC-{transaction.id?.toString().padStart(8, '0')}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 uppercase italic">Official Receipt</p>
                    <p className="text-xs font-bold text-slate-500">{new Date(transaction.createdAt).toLocaleDateString('en-US')}</p>
                </div>
            </div>

            <table className="w-full mb-10 border-collapse">
                <tbody>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Student Name:</td>
                        <td className="py-3 text-right font-bold text-slate-900">{student.firstName} {student.lastName}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Registration No:</td>
                        <td className="py-3 text-right font-bold text-slate-900">{student.matricNumber || "NOT ASSIGNED"}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Programme:</td>
                        <td className="py-3 text-right font-bold text-slate-900">{student.programme?.name}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Payment For:</td>
                        <td className="py-3 text-right font-bold text-slate-900">{transaction.purpose}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-[10px] font-bold text-slate-400 uppercase">Channel:</td>
                        <td className="py-3 text-right font-bold text-slate-900 uppercase">{transaction.gateway}</td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-end mb-12">
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
                                alt="Bursar"
                            />
                        </div>
                    )}
                    <p className="text-xs font-serif font-black uppercase text-slate-900 leading-tight">{bursar?.name || "The Bursar"}</p>
                    <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Financial Controller</p>
                </div>
            </div>
        </div>
    );
};

export const MinimalistReceipt = ({ transaction, student, branding, bursar }: ReceiptProps) => {
    return (
        <div id="receipt-content" className="max-w-xl mx-auto bg-white p-8 md:p-12 print:p-4">
            <div className="flex justify-between items-start mb-16">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">{branding.INST_NAME}</h1>
                    <p className="text-xs text-slate-500">{branding.INST_MOTTO}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Receipt ID</p>
                    <p className="text-sm font-bold text-slate-900">#{transaction.id}</p>
                </div>
            </div>

            <div className="mb-12">
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-4">Statement of Account</p>
                <div className="flex justify-between items-end pb-4 border-b border-slate-100 mb-4">
                    <div>
                        <p className="text-lg font-medium text-slate-900">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-slate-400">{student.matricNumber}</p>
                    </div>
                    <p className="text-xs text-slate-500">{new Date(transaction.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
                </div>

                <div className="py-6 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-slate-800">{transaction.purpose}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase">Payment through {transaction.gateway}</p>
                    </div>
                    <p className="text-xl font-bold text-slate-900">₦{parseFloat(transaction.amount).toLocaleString()}</p>
                </div>

                <div className="border-y border-slate-100 py-4 flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-900">Total Paid</p>
                    <p className="text-2xl font-black text-slate-900 underline underline-offset-8 decoration-slate-200 leading-none">₦{parseFloat(transaction.amount).toLocaleString()}</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-slate-900" />
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-none">Digitally Verified Reference: {transaction.gatewayReference?.slice(0, 16) || "N/A"}</p>
                </div>
                <div className="pt-8 flex justify-between items-end border-t border-slate-100">
                    <div className="max-w-[200px]">
                        <p className="text-[9px] text-slate-300 mb-4">This document serves as proof of payment to {branding.INST_NAME} for the session indicated.</p>
                        <Landmark className="w-6 h-6 text-slate-100" />
                    </div>
                    <div className="text-right">
                        {bursar?.signatureUrl && (
                            <img 
                                src={bursar.signatureUrl} 
                                className={cn("h-12 w-auto mb-1 ml-auto", bursar.isDigital ? "brightness-0 opacity-80" : "")} 
                                alt="Bursar"
                            />
                        )}
                        <p className="text-[10px] font-black uppercase text-slate-900 tracking-wider leading-none mb-1">{bursar?.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Official Stamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
