"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAlumniReceiptDetails } from "@/actions/alumni-requests";
import { Loader2, Printer, ArrowLeft, ShieldCheck, CheckCircle2, GraduationCap, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function ReceiptContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState("");

    const ref = searchParams.get("ref");

    useEffect(() => {
        if (!ref) {
            setError("Missing payment reference.");
            setLoading(false);
            return;
        }

        getAlumniReceiptDetails(ref).then(res => {
            if (res.found) {
                setData(res);
            } else {
                setError(res.error || "Receipt not found.");
            }
            setLoading(false);
        }).catch(err => {
            setError(err.message || "Failed to load receipt.");
            setLoading(false);
        });
    }, [ref]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
                <Loader2 className="w-12 h-12 text-amber-600 animate-spin mb-4" />
                <p className="text-slate-600 font-semibold text-sm">Generating Official Receipt...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl shadow-xl text-center border border-red-100">
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    ✕
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Receipt Unavailable</h2>
                <p className="text-sm text-slate-500 mb-6">{error || "Could not retrieve the payment receipt record."}</p>
                <Link href="/alumni/certificate" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs">
                    Return to Clearance Portal
                </Link>
            </div>
        );
    }

    const receiptDate = new Date(data.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 print:p-0 print:m-0">
            {/* Top Toolbar - Hidden on Print */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <Link href="/alumni/certificate" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Back to Clearance
                </Link>
                <div className="flex gap-2">
                    <Button onClick={() => window.print()} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow">
                        <Printer className="w-4 h-4" /> Print Official Receipt
                    </Button>
                    <Link href="/login" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5">
                        Portal Login
                    </Link>
                </div>
            </div>

            {/* Printable Receipt Card */}
            <div className="bg-white rounded-3xl shadow-2xl print:shadow-none border border-slate-200 p-8 md:p-12 text-slate-900 print:p-6 print:border-none print:rounded-none">
                {/* School Header */}
                <div className="border-b-2 border-slate-900 pb-6 mb-6 text-center">
                    <div className="flex justify-center items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-xl flex items-center justify-center font-black">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900">
                        Federal School of Statistics, Ibadan
                    </h1>
                    <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold mt-0.5">
                        P.M.B. 5065, Sango, Ibadan, Oyo State, Nigeria
                    </p>
                    <div className="mt-4 inline-block bg-slate-900 text-white text-[11px] font-black uppercase px-4 py-1.5 rounded-full tracking-wider">
                        Official Graduation Clearance Receipt
                    </div>
                </div>

                {/* Receipt Metadata & Stamp */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl mb-6 text-xs">
                    <div>
                        <p className="text-slate-400 uppercase font-black text-[10px]">Receipt Reference</p>
                        <p className="font-mono font-bold text-slate-900 break-all">{data.reference}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 uppercase font-black text-[10px]">Date & Time Issued</p>
                        <p className="font-semibold text-slate-800">{receiptDate}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 uppercase font-black text-[10px]">Payment Channel</p>
                        <p className="font-bold text-emerald-800">{data.gatewayName} (Verified)</p>
                    </div>
                    <div className="sm:col-span-3 pt-2 border-t border-slate-200/60">
                        <p className="text-slate-400 uppercase font-black text-[10px]">Credited Settlement Account</p>
                        <p className="font-bold text-slate-900">
                            {data.creditedAccountName} • {data.creditedBank} ({data.creditedAccountNumber})
                        </p>
                    </div>
                </div>

                {/* Student Details */}
                <div className="mb-6">
                    <h3 className="text-xs uppercase tracking-wider font-black text-slate-400 mb-3">
                        Graduant & Student Particulars
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 border border-slate-200 rounded-2xl">
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                            <span className="font-extrabold text-sm text-slate-900 uppercase">{data.applicantName}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Matriculation Number</span>
                            <span className="font-mono font-extrabold text-sm text-slate-900">{data.matricNumber}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                            <span className="font-bold text-slate-800">{data.department}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Programme & Year</span>
                            <span className="font-bold text-slate-800">{data.programmeType} • Class of {data.yearOfGraduation}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                            <span className="text-slate-700 font-medium">{data.email}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                            <span className="text-slate-700 font-medium">{data.phone || "—"}</span>
                        </div>
                    </div>
                </div>

                {/* Items Paid Table */}
                <div className="mb-6">
                    <h3 className="text-xs uppercase tracking-wider font-black text-slate-400 mb-3">
                        Payment Particulars
                    </h3>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] tracking-wider">
                                <tr>
                                    <th className="p-3">S/N</th>
                                    <th className="p-3">Fee Item Description</th>
                                    <th className="p-3 text-right">Amount (₦)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="p-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                                        <td className="p-3">
                                            <p className="font-bold text-slate-900">{item.name}</p>
                                            <p className="text-[11px] text-slate-500">{item.description}</p>
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                                            ₦{item.amount.toLocaleString()}.00
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-900 text-white font-black">
                                <tr>
                                    <td colSpan={2} className="p-4 text-right uppercase text-xs">Total Amount Paid</td>
                                    <td className="p-4 text-right text-base font-mono">₦{data.totalAmount.toLocaleString()}.00</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Amount in words */}
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl mb-8 text-xs">
                    <span className="font-black uppercase text-[10px] text-amber-900 block mb-0.5">Amount in Words:</span>
                    <p className="font-serif italic font-bold text-amber-950 text-sm">
                        {data.totalInWords}
                    </p>
                </div>

                {/* Signatures & Security Stamp */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-dashed border-slate-200">
                    <div className="text-center">
                        <div className="h-12 border-b border-slate-300 flex items-end justify-center pb-1">
                            <span className="font-serif italic text-sm text-slate-700">Digital Bursary Verified</span>
                        </div>
                        <p className="text-[10px] uppercase font-black text-slate-500 mt-1">Bursar / Authorized Officer</p>
                    </div>
                    <div className="text-center">
                        <div className="h-12 border-b border-slate-300 flex items-end justify-center pb-1">
                            <span className="font-serif italic text-sm text-slate-700">Academic Records Directorate</span>
                        </div>
                        <p className="text-[10px] uppercase font-black text-slate-500 mt-1">Registrar / Exams & Records</p>
                    </div>
                </div>

                <div className="mt-8 text-center text-[10px] text-slate-400 font-medium">
                    This is a computer-generated official receipt issued by the Federal School of Statistics, Ibadan. Verified and authentic without physical seal.
                </div>
            </div>
        </div>
    );
}

export default function AlumniReceiptPage() {
    return (
        <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
                </div>
            }>
                <ReceiptContent />
            </Suspense>
        </div>
    );
}
