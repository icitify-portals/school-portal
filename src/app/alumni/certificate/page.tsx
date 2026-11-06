"use client";

import React, { useState, useEffect } from "react";
import { getDynamicAlumniFees, submitCertificateApplication, getStudentCertificateStatus } from "@/actions/alumni-requests";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap, MapPin, CreditCard, Info, Check, CheckSquare, Square, Building2, ShieldCheck, CheckCircle2 } from "lucide-react";
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

    // Active category selection: 'cert_account' | 'ict_account' | 'processing'
    const [selectedCategory, setSelectedCategory] = useState<'cert_account' | 'ict_account' | 'processing'>('cert_account');

    // Sub-items for cert_account (all credited to FSS TECH STUDIO-CERT)
    const [certItems, setCertItems] = useState<string[]>(['convocation_gown']);

    // Existing student record status
    const [existingStatus, setExistingStatus] = useState<any>(null);
    const [checkingStatus, setCheckingStatus] = useState(false);
    
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

    // Auto-check clearance status when matric number is entered
    const handleMatricBlur = async () => {
        if (!formData.matricNumber || formData.matricNumber.trim().length < 5) return;
        setCheckingStatus(true);
        try {
            const res = await getStudentCertificateStatus(formData.matricNumber);
            if (res && res.found) {
                setExistingStatus(res);
                if (res.applicantName && !formData.applicantName) {
                    setFormData(prev => ({
                        ...prev,
                        applicantName: res.applicantName,
                        programmeType: (res.programmeType || prev.programmeType) as "ND" | "HND"
                    }));
                }
            } else {
                setExistingStatus(null);
            }
        } catch (e) {
            console.warn("Status check failed:", e);
        } finally {
            setCheckingStatus(false);
        }
    };

    // Calculate total for currently selected category
    let payableAmount = 0;
    let categoryName = "";
    let destinationBankInfo = "";
    let gatewayName = "";

    if (selectedCategory === 'cert_account') {
        categoryName = "Academic & Convocation (FSS TECH STUDIO-CERT)";
        gatewayName = "ALATPay";
        destinationBankInfo = "Wema Bank • Account No: 0126932593";
        if (certItems.includes('certificate')) payableAmount += certificateFee;
        if (certItems.includes('convocation')) payableAmount += fees.convocationFee;
        if (certItems.includes('convocation_gown')) payableAmount += fees.convocationGownFee;
    } else if (selectedCategory === 'ict_account') {
        categoryName = "Compulsory Incidental Fee (FSS TECH STUDIO-ICT)";
        gatewayName = "ALATPay";
        destinationBankInfo = "Wema Bank • Account No: 0126932586";
        payableAmount = fees.incidentalFee;
    } else if (selectedCategory === 'processing') {
        categoryName = "Portal Processing Fee (Paystack)";
        gatewayName = "Paystack";
        destinationBankInfo = "Online Gateway Instant Checkout";
        payableAmount = fees.processingFee;
    }

    const toggleCertItem = (key: string) => {
        setCertItems(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (selectedCategory === 'cert_account' && certItems.length === 0) {
            setError("Please select at least one item from the Academic & Convocation category.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await submitCertificateApplication({
                ...formData,
                category: selectedCategory,
                selectedItems: selectedCategory === 'cert_account' ? certItems : [selectedCategory === 'ict_account' ? 'incidental' : 'processing']
            });

            if (res.success && res.url) {
                router.push(res.url);
            } else {
                setError(res.error || "Application submission failed. Please try again.");
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
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Graduation Clearance & Certificate Request</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Complete your bio-data and choose your <strong>Payment Category</strong>. Each category is routed directly to its designated bank account via its authorized gateway.
                    </p>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Bio-Data Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Matriculation Number *</label>
                                <div className="relative">
                                    <input 
                                        required 
                                        type="text" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase" 
                                        value={formData.matricNumber} 
                                        onChange={e => setFormData({...formData, matricNumber: e.target.value.toUpperCase()})} 
                                        onBlur={handleMatricBlur}
                                        placeholder="e.g. COM/FSS/IB/2023/10234" 
                                    />
                                    {checkingStatus && (
                                        <div className="absolute right-3 top-3.5 text-xs text-slate-400 flex items-center gap-1">
                                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} placeholder="e.g. John Doe" />
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

                        {/* Existing Clearance Status Banner if found */}
                        {existingStatus && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        Existing Record Found for {formData.matricNumber}:
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded-full font-bold ${existingStatus.gownFeeStatus === 'paid' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
                                            Gown: {existingStatus.gownFeeStatus === 'paid' ? 'Paid ✓' : 'Unpaid'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold ${existingStatus.convocationFeeStatus === 'paid' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
                                            Convocation: {existingStatus.convocationFeeStatus === 'paid' ? 'Paid ✓' : 'Unpaid'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold ${existingStatus.certFeeStatus === 'paid' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
                                            Certificate: {existingStatus.certFeeStatus === 'paid' ? 'Paid ✓' : 'Unpaid'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold ${existingStatus.incidentalFeeStatus === 'paid' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
                                            Incidental: {existingStatus.incidentalFeeStatus === 'paid' ? 'Paid ✓' : 'Unpaid'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold ${existingStatus.processingFeeStatus === 'paid' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
                                            Processing: {existingStatus.processingFeeStatus === 'paid' ? 'Paid ✓' : 'Unpaid'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Collection Details */}
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

                        {/* PAYMENT CATEGORY SELECTION */}
                        <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/40 rounded-3xl p-6 md:p-8 border border-amber-200/90 space-y-6 shadow-sm">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-amber-600" />
                                    Select Payment Category To Settle
                                </h3>
                                <p className="text-xs text-slate-600 mt-1">
                                    To ensure accurate bursary crediting, select one payment category at a time. All items in the selected category go directly to the designated bank account.
                                </p>
                            </div>

                            {/* 3 Main Category Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Category 1 Card: CERT Account */}
                                <div
                                    onClick={() => setSelectedCategory('cert_account')}
                                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                                        selectedCategory === 'cert_account'
                                            ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20'
                                            : 'bg-white/60 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                                            🔴 ALATPay
                                        </span>
                                        {selectedCategory === 'cert_account' && (
                                            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-extrabold text-sm text-slate-900 mt-2">
                                        Academic & Convocation
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                        FSS TECH STUDIO - CERT<br />
                                        Wema Bank: <span className="font-mono font-bold text-slate-700">0126932593</span>
                                    </p>
                                    <p className="text-xs text-rose-800 font-semibold mt-3">
                                        Gown Fee • Convocation • Certificate
                                    </p>
                                </div>

                                {/* Category 2 Card: ICT Account */}
                                <div
                                    onClick={() => setSelectedCategory('ict_account')}
                                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                                        selectedCategory === 'ict_account'
                                            ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                                            : 'bg-white/60 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                                            🔴 ALATPay
                                        </span>
                                        {selectedCategory === 'ict_account' && (
                                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-extrabold text-sm text-slate-900 mt-2">
                                        Compulsory Incidental Fee
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                        FSS TECH STUDIO - ICT<br />
                                        Wema Bank: <span className="font-mono font-bold text-slate-700">0126932586</span>
                                    </p>
                                    <p className="text-xs text-indigo-800 font-bold mt-3">
                                        Fixed: ₦{fees.incidentalFee.toLocaleString()}
                                    </p>
                                </div>

                                {/* Category 3 Card: Processing Fee */}
                                <div
                                    onClick={() => setSelectedCategory('processing')}
                                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                                        selectedCategory === 'processing'
                                            ? 'bg-white border-sky-500 shadow-md ring-2 ring-sky-500/20'
                                            : 'bg-white/60 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                                            🔵 Paystack
                                        </span>
                                        {selectedCategory === 'processing' && (
                                            <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-extrabold text-sm text-slate-900 mt-2">
                                        Portal Processing Fee
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                        Paystack Online Gateway<br />
                                        Card, Bank Transfer, USSD
                                    </p>
                                    <p className="text-xs text-sky-800 font-bold mt-3">
                                        Fixed: ₦{fees.processingFee.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Detailed item selection for Category 1 */}
                            {selectedCategory === 'cert_account' && (
                                <div className="bg-white rounded-2xl p-5 border border-amber-300 shadow-sm space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">
                                                Items Credited to FSS TECH STUDIO - CERT (0126932593)
                                            </h4>
                                            <p className="text-xs text-slate-500">
                                                Check which item(s) you want to pay now into this account.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setCertItems(['convocation_gown'])}
                                                className="text-[11px] font-bold text-amber-800 hover:underline"
                                            >
                                                Gown Only
                                            </button>
                                            <span className="text-slate-300">|</span>
                                            <button
                                                type="button"
                                                onClick={() => setCertItems(['convocation_gown', 'convocation', 'certificate'])}
                                                className="text-[11px] font-bold text-amber-800 hover:underline"
                                            >
                                                Select All 3
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                        {/* Convocation Gown Fee */}
                                        <div
                                            onClick={() => toggleCertItem('convocation_gown')}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                certItems.includes('convocation_gown')
                                                    ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20'
                                                    : 'bg-slate-50/70 border-slate-200 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                {certItems.includes('convocation_gown') ? (
                                                    <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                <span className="font-bold text-xs text-slate-800">Convocation Gown Fee</span>
                                            </div>
                                            <p className="text-base font-black text-slate-900">₦{fees.convocationGownFee.toLocaleString()}</p>
                                            <p className="text-[11px] text-slate-500 mt-1">Gown hire for ND & HND graduants.</p>
                                        </div>

                                        {/* Convocation Fee */}
                                        <div
                                            onClick={() => toggleCertItem('convocation')}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                certItems.includes('convocation')
                                                    ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20'
                                                    : 'bg-slate-50/70 border-slate-200 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                {certItems.includes('convocation') ? (
                                                    <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                <span className="font-bold text-xs text-slate-800">Convocation Fee</span>
                                            </div>
                                            <p className="text-base font-black text-slate-900">₦{fees.convocationFee.toLocaleString()}</p>
                                            <p className="text-[11px] text-slate-500 mt-1">Convocation levy & archival entry.</p>
                                        </div>

                                        {/* Certificate Fee */}
                                        <div
                                            onClick={() => toggleCertItem('certificate')}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                certItems.includes('certificate')
                                                    ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20'
                                                    : 'bg-slate-50/70 border-slate-200 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                {certItems.includes('certificate') ? (
                                                    <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                <span className="font-bold text-xs text-slate-800">Certificate Fee ({formData.programmeType})</span>
                                            </div>
                                            <p className="text-base font-black text-slate-900">₦{certificateFee.toLocaleString()}</p>
                                            <p className="text-[11px] text-slate-500 mt-1">Official diploma seal & printing.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Summary & Checkout Action */}
                            <div className="pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-amber-200/70">
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
                                        Selected: {categoryName}
                                    </p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">₦{payableAmount.toLocaleString()}</p>
                                    <p className="text-[11px] text-slate-600 mt-1 font-medium">
                                        Routing via <span className="font-bold text-slate-900">{gatewayName}</span> ➔ {destinationBankInfo}
                                    </p>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading || payableAmount === 0} 
                                    className="w-full md:w-auto bg-amber-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-md"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        `Pay ₦${payableAmount.toLocaleString()} via ${gatewayName}`
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
