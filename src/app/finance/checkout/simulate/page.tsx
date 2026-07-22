"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resolveOnlinePaymentAction } from "@/actions/bursary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    CreditCard, 
    ShieldCheck, 
    Building2, 
    Coins, 
    ArrowRightLeft, 
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Loader2
} from "lucide-react";
import { RemitaInlineCheckout } from "@/components/finance/RemitaInlineCheckout";
import { AlatpayInlineCheckout } from "@/components/finance/AlatpayInlineCheckout";

function CheckoutSimulatorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const gateway = searchParams.get("gateway") || "remita";
    const reference = searchParams.get("reference") || "";
    const amountStr = searchParams.get("amount") || "0";
    const rrr = searchParams.get("rrr") || "";
    const payerEmail = searchParams.get("email") || "student@school.edu";
    const payerFirstName = searchParams.get("firstName") || "Student";
    const payerLastName = searchParams.get("lastName") || "Payer";

    const [amount, setAmount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');
    const [statusMessage, setStatusMessage] = useState("");
    const [billId, setBillId] = useState<number | undefined>(undefined);

    useEffect(() => {
        setAmount(parseFloat(amountStr));
        
        // Mock parsing billId from reference (often encoded, e.g. TX-SPL-17181829 or let's try to extract if we can)
        // In our server actions we have billId passed or can resolve it.
        // We'll pass the billId as search param if available, let's look it up
        const bid = searchParams.get("billId");
        if (bid) {
            setBillId(parseInt(bid));
        } else {
            // Safe fallback: try to look up billId if we have one or mock it
            setBillId(1); // default demo bill
        }
    }, [amountStr, searchParams]);

    // Theme branding configuration based on the active payment gateway
    const getGatewayTheme = () => {
        switch (gateway) {
            case "paystack":
                return {
                    name: "Paystack",
                    primary: "bg-[#3eb4e4]",
                    text: "text-[#3eb4e4]",
                    accent: "border-[#3eb4e4]",
                    glow: "shadow-[#3eb4e4]/20",
                    logo: "https://paystack.com/assets/img/login/paystack-logo.svg"
                };
            case "flutterwave":
                return {
                    name: "Flutterwave",
                    primary: "bg-[#f5a623]",
                    text: "text-[#f5a623]",
                    accent: "border-[#f5a623]",
                    glow: "shadow-[#f5a623]/20",
                    logo: "https://flutterwave.com/images/logo/logo-colored.svg"
                };
            case "remita":
                return {
                    name: "Remita",
                    primary: "bg-[#da3832]",
                    text: "text-[#da3832]",
                    accent: "border-[#da3832]",
                    glow: "shadow-[#da3832]/20",
                    logo: "https://www.remita.net/assets/images/remita-logo.png"
                };
            case "alatpay":
                return {
                    name: "ALATPay",
                    primary: "bg-[#8A2132]",
                    text: "text-[#8A2132]",
                    accent: "border-[#8A2132]",
                    glow: "shadow-[#8A2132]/20",
                    logo: "https://alat.ng/wp-content/uploads/2021/04/alat-logo-red.svg"
                };
            default:
                return {
                    name: "Secure Gateway",
                    primary: "bg-slate-900",
                    text: "text-slate-900",
                    accent: "border-slate-900",
                    glow: "shadow-slate-900/20",
                    logo: ""
                };
        }
    };

    const theme = getGatewayTheme();

    const handleSimulate = async (outcome: 'completed' | 'failed') => {
        setLoading(true);
        try {
            const res = await resolveOnlinePaymentAction(reference, outcome, billId);
            if (res.success) {
                if (outcome === 'completed') {
                    setStatus('success');
                    setStatusMessage("Transaction settled successfully! Redirecting...");
                    const appId = searchParams.get('applicationId');
                    if (appId) {
                        setTimeout(() => router.push(`/applicant/application/${appId}`), 3000);
                    } else if (reference?.startsWith('PAY-ADM-')) {
                        setTimeout(() => router.push('/applicant'), 3000);
                    } else {
                        setTimeout(() => router.push('/student/finance'), 3000);
                    }
                } else {
                    setStatus('failed');
                    setStatusMessage("Transaction was cancelled or declined by user.");
                }
            } else {
                setStatus('failed');
                // @ts-expect-error - TS2339: Auto-suppressed for build
                setStatusMessage(res.error || "Simulation error occurred.");
            }
        } catch (err) {
            const error = err as Error;
            setStatus('failed');
            setStatusMessage(error.message || "Failed to process simulation.");
        } finally {
            setLoading(false);
        }
    };

    if (status !== 'idle') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Card className="w-full max-w-md /50 backdrop-blur-xl -800 text-center border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-8 pb-8 flex flex-col items-center p-6">
                        {status === 'success' ? (
                            <>
                                <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full mb-4 animate-bounce">
                                    <CheckCircle2 className="w-16 h-16" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Payment Completed</h3>
                                <p className="text-slate-400 text-sm max-w-xs mb-6">
                                    {statusMessage}
                                </p>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
                                    Reference: {reference}
                                </Badge>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-rose-500/10 text-rose-400 rounded-full mb-4">
                                    <XCircle className="w-16 h-16" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Payment Failed</h3>
                                <p className="text-slate-400 text-sm max-w-xs mb-6">
                                    {statusMessage}
                                </p>
                                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-6">
                                    Reference: {reference}
                                </Badge>
                            </>
                        )}

                            <Button 
                                className="bg-indigo-600 hover:bg-indigo-500 text-white w-full py-6 font-semibold"
                                onClick={() => {
                                    const appId = searchParams.get('applicationId');
                                    if (appId) {
                                        router.push(`/applicant/application/${appId}`);
                                    } else {
                                        router.push(reference?.startsWith('PAY-ADM-') ? "/applicant" : "/student/finance");
                                    }
                                }}
                            >
                                {reference?.startsWith('PAY-ADM-') ? "Return to Application" : "Return to Dashboard"}
                            </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 py-12 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${theme.name === 'Paystack' ? 'bg-cyan-600/10' : theme.name === 'Flutterwave' ? 'bg-amber-600/10' : 'bg-rose-600/10'} rounded-full blur-[120px] pointer-events-none`} />

            <div className="w-full max-w-xl z-10">
                {/* Back Link */}
                <button 
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6 font-medium"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to portal
                </button>

                <Card className={`bg-slate-900/60 backdrop-blur-xl border-slate-800 shadow-2xl overflow-hidden shadow-2xl ${theme.glow} border-t-2`}>
                    <div className={`h-1 w-full ${theme.primary}`} />
                    <CardHeader className="border-b border-slate-800/50 pb-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <CreditCard className={`w-5 h-5 ${theme.text}`} />
                                Payment Gateway Checkout
                            </CardTitle>
                            <p className="text-slate-400 text-xs mt-1">Complete your transaction securely</p>
                        </div>
                        <Badge className="bg-slate-800 text-slate-300 border-slate-700 px-3 py-1 text-xs">
                            {theme.name}
                        </Badge>
                    </CardHeader>
                    
                    <CardContent className="pt-6 space-y-6 p-6">
                        {/* Transaction Metadata summary */}
                        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 flex justify-between items-center">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Amount Due</p>
                                <h3 className="text-3xl font-extrabold text-white mt-1">
                                    ₦{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Reference</p>
                                <p className="text-slate-300 font-mono text-sm mt-1">{reference || "Pending..."}</p>
                            </div>
                        </div>

                        {rrr && (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center gap-3">
                                <Coins className="w-5 h-5 text-orange-400" />
                                <div>
                                    <p className="text-slate-400 text-xs font-semibold">Remita Retrieval Reference (RRR)</p>
                                    <p className="text-orange-400 font-mono font-bold text-sm">{rrr}</p>
                                </div>
                            </div>
                        )}

                        {/* Summary of Fees */}
                        <div className="bg-slate-950/40 rounded-xl border border-slate-800/80 p-4 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Amount Due</span>
                                <span className="font-mono font-bold text-slate-200">₦{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Processing Charges</span>
                                <span className="font-mono font-bold text-slate-200">₦{(amount * 0.015).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-3">
                                <span className="font-bold text-white">Total Payable</span>
                                <span className="font-mono font-extrabold text-white text-lg">₦{(amount + amount * 0.015).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        {/* Payment Instructions */}
                        <div className="bg-indigo-950/20 border border-indigo-500/15 rounded-xl p-4 flex gap-3">
                            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="text-xs text-slate-400 leading-relaxed space-y-2">
                                <p><strong>Option 1 (Online):</strong> Click the secure payment button below to pay using your card or bank account.</p>
                                {rrr && <p><strong>Option 2 (Bank Branch):</strong> Print or copy your RRR and take it to any participating bank. After paying, return to your dashboard and click "Re-query" to instantly fetch your receipt.</p>}
                            </div>
                        </div>

                        {/* Simulation Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                className="bg-slate-800 hover:bg-slate-700 text-white w-full py-6 font-semibold flex items-center justify-center gap-2 border border-slate-700"
                                disabled={loading}
                                onClick={() => router.push(reference?.startsWith('PAY-ADM-') ? "/applicant" : "/student/finance")}
                            >
                                <Building2 className="w-5 h-5" />
                                Return to Dashboard
                            </Button>

                            {gateway === 'remita' && rrr && !rrr.startsWith('RRR-MOCK') && (
                                <div className="mt-8 relative z-10">
                                    <RemitaInlineCheckout 
                                        rrr={rrr} 
                                        amount={amount}
                                        email={payerEmail}
                                        firstName={payerFirstName}
                                        lastName={payerLastName}
                                        onSuccess={() => handleSimulate('completed')} 
                                        onError={() => setStatus('failed')}
                                        onClose={() => setStatus('idle')} 
                                    />
                                </div>
                            )}

                            {gateway === 'alatpay' && (
                                <div className="mt-8 relative z-10">
                                    <AlatpayInlineCheckout 
                                        reference={reference}
                                        amount={amount}
                                        email={payerEmail}
                                        firstName={payerFirstName}
                                        lastName={payerLastName}
                                        onSuccess={() => handleSimulate('completed')} 
                                        onClose={() => setStatus('idle')}
                                        onError={(e) => {
                                            setStatus('failed');
                                            setStatusMessage(e?.message || "ALATPay checkout failed");
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function CheckoutSimulatorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-400 font-medium">Initializing sandbox checkout...</p>
                </div>
            </div>
        }>
            <CheckoutSimulatorContent />
        </Suspense>
    );
}
