"use client";

import React, { useState, useEffect } from "react";
import { getDynamicAlumniFees, submitCertificateApplication } from "@/actions/alumni-requests";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap, MapPin, CreditCard, Info, AlertTriangle, Layers, ListChecks, Check, CheckSquare, Square } from "lucide-react";
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

    const [paymentMode, setPaymentMode] = useState<'all' | 'individual'>('all');
    const [selectedFeeKeys, setSelectedFeeKeys] = useState<string[]>(['certificate', 'convocation', 'convocation_gown', 'incidental', 'processing']);
    
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

    const totalFee = (isCertSelected ? certificateFee : 0) +
        (isConvocationSelected ? fees.convocationFee : 0) +
        (isConvocationGownSelected ? fees.convocationGownFee : 0) +
        (isIncidentalSelected ? fees.incidentalFee : 0) +
        (isProcessingSelected ? fees.processingFee : 0);

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
                            <h1 className="text-2xl font-bold uppercase tracking-wide">Certificate Request</h1>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">Federal School of Statistics • Alumni Services</p>
                        </div>
                    </div>
                    <Link href="/" className="text-sm font-medium hover:text-amber-300">Back to Portal</Link>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Apply for Official Certificate</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Complete the form below to apply for your National Diploma (ND) or Higher National Diploma (HND) certificate. Note that the compulsory Incidental Fee applies to all students and graduants.
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

                        {/* Payment Options: Pay All vs Pay Individual Items */}
                        <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/40 rounded-3xl p-6 md:p-8 border border-amber-200/90 space-y-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-200/70 pb-5">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-amber-600" />
                                        Payment Method & Fee Breakdown ({formData.programmeType})
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Choose whether to settle all clearance fees at once or select individual items to pay now.
                                    </p>
                                </div>

                                {/* Toggle Buttons */}
                                <div className="inline-flex p-1 bg-white border border-amber-200 rounded-2xl shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaymentMode('all');
                                            setSelectedFeeKeys(['certificate', 'convocation', 'convocation_gown', 'incidental', 'processing']);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            paymentMode === 'all'
                                                ? 'bg-amber-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-amber-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Pay All Fees
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMode('individual')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            paymentMode === 'individual'
                                                ? 'bg-amber-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-amber-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <ListChecks className="w-3.5 h-3.5" />
                                        Pay Individual Items
                                    </button>
                                </div>
                            </div>

                            {paymentMode === 'individual' && (
                                <div className="flex items-center justify-between bg-amber-100/60 px-4 py-2.5 rounded-xl border border-amber-200 text-xs">
                                    <span className="text-amber-900 font-medium">
                                        Click any item below to check/uncheck it for payment.
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFeeKeys(['certificate', 'convocation', 'incidental', 'processing'])}
                                            className="text-[11px] font-bold text-amber-800 hover:underline"
                                        >
                                            Select All
                                        </button>
                                        <span className="text-amber-300">|</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFeeKeys([])}
                                            className="text-[11px] font-bold text-amber-800 hover:underline"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Fee Item Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                {/* Item 1: Certificate Fee */}
                                <div
                                    onClick={() => paymentMode === 'individual' && toggleFeeKey('certificate')}
                                    className={`relative p-4 rounded-2xl border transition-all ${
                                        paymentMode === 'individual' ? 'cursor-pointer' : 'cursor-default'
                                    } ${
                                        isCertSelected
                                            ? 'bg-white border-amber-400 shadow-sm ring-2 ring-amber-500/10'
                                            : 'bg-white/50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            {paymentMode === 'individual' ? (
                                                isCertSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-amber-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                                                )
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">
                                                    ✓
                                                </div>
                                            )}
                                            <h4 className="font-bold text-sm text-slate-800">
                                                Certificate Fee ({formData.programmeType})
                                            </h4>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">
                                            ₦{certificateFee.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed pl-7">
                                        Official National Diploma or Higher National Diploma certificate printing and seal.
                                    </p>
                                </div>

                                {/* Item 2: Convocation Fee */}
                                <div
                                    onClick={() => paymentMode === 'individual' && toggleFeeKey('convocation')}
                                    className={`relative p-4 rounded-2xl border transition-all ${
                                        paymentMode === 'individual' ? 'cursor-pointer' : 'cursor-default'
                                    } ${
                                        isConvocationSelected
                                            ? 'bg-white border-amber-400 shadow-sm ring-2 ring-amber-500/10'
                                            : 'bg-white/50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            {paymentMode === 'individual' ? (
                                                isConvocationSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-amber-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                                                )
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">
                                                    ✓
                                                </div>
                                            )}
                                            <h4 className="font-bold text-sm text-slate-800">Convocation Fee</h4>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">
                                            ₦{fees.convocationFee.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed pl-7">
                                        Graduation convocation levy and archival record entry. Can be deselected if paid.
                                    </p>
                                </div>

                                {/* Item 2b: Convocation Gown Fee */}
                                <div
                                    onClick={() => paymentMode === 'individual' && toggleFeeKey('convocation_gown')}
                                    className={`relative p-4 rounded-2xl border transition-all ${
                                        paymentMode === 'individual' ? 'cursor-pointer' : 'cursor-default'
                                    } ${
                                        isConvocationGownSelected
                                            ? 'bg-white border-amber-400 shadow-sm ring-2 ring-amber-500/10'
                                            : 'bg-white/50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            {paymentMode === 'individual' ? (
                                                isConvocationGownSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-amber-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                                                )
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">
                                                    ✓
                                                </div>
                                            )}
                                            <h4 className="font-bold text-sm text-slate-800">Convocation Gown Fee</h4>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">
                                            ₦{fees.convocationGownFee.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed pl-7">
                                        Academic convocation gown hire fee for ND & HND graduants. Paid via ALATPay. Can be deselected if paid.
                                    </p>
                                </div>

                                {/* Item 3: Incidental Fee */}
                                <div
                                    onClick={() => paymentMode === 'individual' && toggleFeeKey('incidental')}
                                    className={`relative p-4 rounded-2xl border transition-all ${
                                        paymentMode === 'individual' ? 'cursor-pointer' : 'cursor-default'
                                    } ${
                                        isIncidentalSelected
                                            ? 'bg-white border-amber-400 shadow-sm ring-2 ring-amber-500/10'
                                            : 'bg-white/50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            {paymentMode === 'individual' ? (
                                                isIncidentalSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-amber-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                                                )
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">
                                                    ✓
                                                </div>
                                            )}
                                            <h4 className="font-bold text-sm text-slate-800">Incidental Fee</h4>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">
                                            ₦{fees.incidentalFee.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed pl-7">
                                        Statutory incidental charge. Compulsory for students unless settled previously.
                                    </p>
                                </div>

                                {/* Item 4: Processing Fee */}
                                <div
                                    onClick={() => paymentMode === 'individual' && toggleFeeKey('processing')}
                                    className={`relative p-4 rounded-2xl border transition-all ${
                                        paymentMode === 'individual' ? 'cursor-pointer' : 'cursor-default'
                                    } ${
                                        isProcessingSelected
                                            ? 'bg-white border-amber-400 shadow-sm ring-2 ring-amber-500/10'
                                            : 'bg-white/50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            {paymentMode === 'individual' ? (
                                                isProcessingSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-amber-600 shrink-0" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                                                )
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">
                                                    ✓
                                                </div>
                                            )}
                                            <h4 className="font-bold text-sm text-slate-800">Portal Processing Fee</h4>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">
                                            ₦{fees.processingFee.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed pl-7">
                                        Online payment gateway integration and digital tracking notification service.
                                    </p>
                                </div>
                            </div>

                            {paymentMode === 'individual' && activeKeys.length === 0 && (
                                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                                    <span>Please select at least one fee item to proceed with payment.</span>
                                </div>
                            )}

                            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-100/60 p-3 rounded-xl">
                                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                <span>
                                    Note: Convocation Fee (₦{fees.convocationFee.toLocaleString()}), Convocation Gown Fee (₦{fees.convocationGownFee.toLocaleString()}), and Incidental Fee (₦{fees.incidentalFee.toLocaleString()}) are payable for graduation clearance unless previously cleared at the bursary.
                                </span>
                            </div>

                            <div className="pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-amber-200/70">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
                                            {paymentMode === 'all'
                                                ? 'Total Amount (All Items Included)'
                                                : `Selected Items Total (${activeKeys.length} of 4 items)`}
                                        </p>
                                        {paymentMode === 'all' && (
                                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                                                Full Package
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-3xl font-black text-slate-900 mt-1">₦{totalFee.toLocaleString()}</p>
                                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                                        {activeKeys.length === 0
                                            ? "No items currently selected."
                                            : [
                                                  isCertSelected && `Certificate (₦${certificateFee.toLocaleString()})`,
                                                  isConvocationSelected && `Convocation (₦${fees.convocationFee.toLocaleString()})`,
                                                  isConvocationGownSelected && `Convocation Gown (₦${fees.convocationGownFee.toLocaleString()})`,
                                                  isIncidentalSelected && `Incidental (₦${fees.incidentalFee.toLocaleString()})`,
                                                  isProcessingSelected && `Processing (₦${fees.processingFee.toLocaleString()})`
                                              ]
                                                  .filter(Boolean)
                                                  .join(" + ")}
                                    </p>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading || (paymentMode === 'individual' && activeKeys.length === 0)} 
                                    className="w-full md:w-auto bg-amber-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-md"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : paymentMode === 'all' ? (
                                        `Proceed to Pay All (₦${totalFee.toLocaleString()})`
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
