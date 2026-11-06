"use client";

import React, { useState, useEffect } from "react";
import { getDynamicAlumniFees, submitCertificateApplication } from "@/actions/alumni-requests";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap, MapPin, CreditCard, Info, AlertTriangle, Layers, ListChecks, Check, CheckSquare, Square, Building2, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CertificateApplicationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [fees, setFees] = useState({
        certificateFeeND: 18500,
        certificateFeeHND: 28500,
        convocationFee: 15500,
        convocationGownFee: 7000,
        incidentalFee: 5500,
        processingFee: 3000,
    });

    const [paymentMode, setPaymentMode] = useState<'all' | 'individual'>('individual');
    const [selectedFeeKeys, setSelectedFeeKeys] = useState<string[]>(['convocation_gown']);
    
    useEffect(() => {
        getDynamicAlumniFees().then((res) => {
            if (res) setFees(res);
        });
    }, []);
    
    const [formData, setFormData] = useState({
        applicantName: "",
        matricNumber: "",
        email: "",
        phone: "",
        programmeType: "ND" as "ND" | "HND",
        department: "",
        yearOfGraduation: "",
        deliveryMethod: "pickup" as "email" | "courier" | "pickup",
        deliveryAddress: ""
    });

    const certificateFee = formData.programmeType === "HND" ? fees.certificateFeeHND : fees.certificateFeeND;

    const activeKeys = paymentMode === 'all' 
        ? ['certificate', 'convocation', 'convocation_gown', 'incidental', 'processing'] 
        : selectedFeeKeys;

    const isCertSelected = activeKeys.includes('certificate');
    const isConvocationSelected = activeKeys.includes('convocation');
    const isConvocationGownSelected = activeKeys.includes('convocation_gown');
    const isIncidentalSelected = activeKeys.includes('incidental');
    const isProcessingSelected = activeKeys.includes('processing');

    const certGroupTotal = 
        (isCertSelected ? certificateFee : 0) +
        (isConvocationSelected ? fees.convocationFee : 0) +
        (isConvocationGownSelected ? fees.convocationGownFee : 0);

    const ictGroupTotal = isIncidentalSelected ? fees.incidentalFee : 0;
    const processingGroupTotal = isProcessingSelected ? fees.processingFee : 0;

    const totalFee = certGroupTotal + ictGroupTotal + processingGroupTotal;

    const activeAccountCount = [certGroupTotal > 0, ictGroupTotal > 0, processingGroupTotal > 0].filter(Boolean).length;

    const toggleFeeKey = (key: string) => {
        setSelectedFeeKeys(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (paymentMode === 'individual' && activeKeys.length === 0) {
            setError("Please select at least one fee item to proceed with payment.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await submitCertificateApplication({
                ...formData,
                selectedItems: activeKeys
            });
            if (res.success && res.url) {
                router.push(res.url);
            } else {
                setError(res.error || "Application failed. Please try again.");
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-slate-900 text-white p-6 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="text-amber-400 w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-wide">Certificate & Clearance Portal</h1>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">Federal School of Statistics • Alumni & Graduants</p>
                        </div>
                    </div>
                    <Link href="/" className="text-sm font-medium hover:text-amber-300">Back to Portal</Link>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Graduation Clearance & Certificate Request</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Select and pay your compulsory clearance and convocation fee items below. Because different fees are disbursed into designated institutional accounts (Academic/Certificates vs ICT vs Processing), items are organized by destination account.
                    </p>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Matriculation Number *</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase" value={formData.matricNumber} onChange={e => setFormData({...formData, matricNumber: e.target.value.toUpperCase()})} placeholder="e.g. COM/FSS/IB/2023/10234" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                                <input required type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. 08012345678" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Programme Type *</label>
                                <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold" value={formData.programmeType} onChange={e => setFormData({...formData, programmeType: e.target.value as "ND"|"HND"})}>
                                    <option value="ND">National Diploma (ND)</option>
                                    <option value="HND">Higher National Diploma (HND)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Department *</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Computer Science" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Year of Graduation *</label>
                                <input required type="text" maxLength={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.yearOfGraduation} onChange={e => setFormData({...formData, yearOfGraduation: e.target.value})} placeholder="e.g. 2025" />
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-6 mt-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <MapPin className="w-5 h-5 text-amber-500" /> Collection Details
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Method</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.deliveryMethod} onChange={e => setFormData({...formData, deliveryMethod: e.target.value as any})}>
                                        <option value="pickup">Physical Pickup (School Campus)</option>
                                        <option value="courier">Courier Delivery (Physical)</option>
                                        <option value="email">Email Copy (Digital)</option>
                                    </select>
                                </div>

                                {formData.deliveryMethod === 'courier' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Full Delivery Address (Courier Only) *</label>
                                        <textarea required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" rows={3} value={formData.deliveryAddress} onChange={e => setFormData({...formData, deliveryAddress: e.target.value})} placeholder="Enter the exact physical address for courier delivery..."></textarea>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Selection by Destination Account */}
                        <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/40 rounded-3xl p-6 md:p-8 border border-amber-200/90 space-y-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-200/70 pb-5">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-amber-600" />
                                        Select Payment Items & Destination Accounts
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Each fee is routed directly to its designated school bank account through its authorized gateway.
                                    </p>
                                </div>

                                {/* Quick Presets */}
                                <div className="inline-flex flex-wrap p-1 bg-white border border-amber-200 rounded-2xl shadow-sm gap-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaymentMode('individual');
                                            setSelectedFeeKeys(['convocation_gown']);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            activeKeys.length === 1 && isConvocationGownSelected
                                                ? 'bg-amber-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-amber-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        Gown Fee Only (₦7,000)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaymentMode('individual');
                                            setSelectedFeeKeys(['certificate', 'convocation', 'convocation_gown']);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            activeKeys.length === 3 && isCertSelected && isConvocationSelected && isConvocationGownSelected
                                                ? 'bg-amber-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-amber-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        CERT Account Items
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaymentMode('individual');
                                            setSelectedFeeKeys(['certificate', 'convocation', 'convocation_gown', 'incidental', 'processing']);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            activeKeys.length === 5
                                                ? 'bg-amber-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-amber-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        All Fees
                                    </button>
                                </div>
                            </div>

                            {/* Section 1: FSS TECH STUDIO-CERT (ALATPay) */}
                            <div className="bg-white rounded-2xl p-5 border border-amber-300 shadow-sm space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                                            🔴
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-sm text-slate-900">
                                                FSS TECH STUDIO - CERT Account (ALATPay)
                                            </h4>
                                            <p className="text-[11px] text-slate-500">
                                                Wema Bank • Account No: <span className="font-mono font-bold text-slate-700">0126932593</span> • Dedicated Certificate & Convocation Account
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 self-start sm:self-auto">
                                        Subtotal: ₦{certGroupTotal.toLocaleString()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                    {/* Item 1: Certificate Fee */}
                                    <div
                                        onClick={() => toggleFeeKey('certificate')}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            isCertSelected
                                                ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20'
                                                : 'bg-slate-50/70 border-slate-200 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                {isCertSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                <span className="font-bold text-xs text-slate-800">
                                                    Certificate Fee ({formData.programmeType})
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-base font-black text-slate-900">
                                            ₦{certificateFee.toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                            Official {formData.programmeType} certificate printing & seal.
                                        </p>
                                    </div>

                                    {/* Item 2: Convocation Fee */}
                                    <div
                                        onClick={() => toggleFeeKey('convocation')}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            isConvocationSelected
                                                ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20'
                                                : 'bg-slate-50/70 border-slate-200 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                {isConvocationSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                <span className="font-bold text-xs text-slate-800">
                                                    Convocation Fee
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-base font-black text-slate-900">
                                            ₦{fees.convocationFee.toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                            Convocation levy and archival record entry.
                                        </p>
                                    </div>

                                    {/* Item 3: Convocation Gown Fee */}
                                    <div
                                        onClick={() => toggleFeeKey('convocation_gown')}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            isConvocationGownSelected
                                                ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20'
                                                : 'bg-slate-50/70 border-slate-200 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                {isConvocationGownSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                <span className="font-bold text-xs text-slate-800">
                                                    Convocation Gown Fee
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-base font-black text-slate-900">
                                            ₦{fees.convocationGownFee.toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                            Academic convocation gown hire fee. Standalone payment item.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: FSS TECH STUDIO-ICT (ALATPay) */}
                            <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-sm space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                            🔴
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-sm text-slate-900">
                                                FSS TECH STUDIO - ICT Account (ALATPay)
                                            </h4>
                                            <p className="text-[11px] text-slate-500">
                                                Wema Bank • Account No: <span className="font-mono font-bold text-slate-700">0126932586</span> • Dedicated ICT Operations Account
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
                                        Subtotal: ₦{ictGroupTotal.toLocaleString()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    {/* Item 4: Incidental Fee */}
                                    <div
                                        onClick={() => toggleFeeKey('incidental')}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            isIncidentalSelected
                                                ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20'
                                                : 'bg-slate-50/70 border-slate-200 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                {isIncidentalSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                <span className="font-bold text-xs text-slate-800">
                                                    Compulsory Incidental Fee
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-base font-black text-slate-900">
                                            ₦{fees.incidentalFee.toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                            Statutory incidental charge for graduant clearance. Paid to FSS TECH STUDIO-ICT.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Portal Processing Fee (Paystack) */}
                            <div className="bg-white rounded-2xl p-5 border border-sky-200 shadow-sm space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                                            🔵
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-sm text-slate-900">
                                                Portal Processing Account (Paystack)
                                            </h4>
                                            <p className="text-[11px] text-slate-500">
                                                Paystack Gateway • Card, Bank Transfer, USSD & QR
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 self-start sm:self-auto">
                                        Subtotal: ₦{processingGroupTotal.toLocaleString()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    {/* Item 5: Processing Fee */}
                                    <div
                                        onClick={() => toggleFeeKey('processing')}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            isProcessingSelected
                                                ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-500/20'
                                                : 'bg-slate-50/70 border-slate-200 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                {isProcessingSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                <span className="font-bold text-xs text-slate-800">
                                                    Portal Processing Fee
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-base font-black text-slate-900">
                                            ₦{fees.processingFee.toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                            Digital notification and online payment gateway processing charge.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Settlement Routing Notice */}
                            <div className="bg-amber-100/70 border border-amber-300 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-bold">
                                        Multi-Account Separation Notice:
                                    </p>
                                    <p>
                                        Payments are isolated by account: <strong>Certificate, Convocation & Gown</strong> route to <em>FSS TECH STUDIO-CERT</em>; <strong>Incidental Fee</strong> routes to <em>FSS TECH STUDIO-ICT</em>; and <strong>Processing Fee</strong> routes via <em>Paystack</em>.
                                    </p>
                                    {activeAccountCount > 1 && (
                                        <p className="font-semibold text-amber-950 pt-1">
                                            ✨ You have selected items across {activeAccountCount} different accounts. When you click proceed, the portal will smoothly walk you through each account's payment in sequence so funds are properly credited.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Checkout Action */}
                            <div className="pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-amber-200/70">
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
                                        Total Selected ({activeKeys.length} items across {activeAccountCount} account{activeAccountCount === 1 ? '' : 's'})
                                    </p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">₦{totalFee.toLocaleString()}</p>
                                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                                        {activeKeys.length === 0
                                            ? "No items currently selected."
                                            : [
                                                  certGroupTotal > 0 && `CERT Account: ₦${certGroupTotal.toLocaleString()}`,
                                                  ictGroupTotal > 0 && `ICT Account: ₦${ictGroupTotal.toLocaleString()}`,
                                                  processingGroupTotal > 0 && `Processing: ₦${processingGroupTotal.toLocaleString()}`
                                              ]
                                                  .filter(Boolean)
                                                  .join(" • ")}
                                    </p>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading || activeKeys.length === 0} 
                                    className="w-full md:w-auto bg-amber-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-md"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : activeAccountCount > 1 ? (
                                        `Proceed to Step 1 (${certGroupTotal > 0 ? 'CERT Account' : ictGroupTotal > 0 ? 'ICT Account' : 'Paystack'}) • Total: ₦${totalFee.toLocaleString()}`
                                    ) : (
                                        `Pay Selected (${activeKeys.length}) • ₦${totalFee.toLocaleString()}`
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
