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

function CheckoutSimulatorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const gateway = searchParams.get("gateway") || "paystack";
    const reference = searchParams.get("reference") || "";
    const amountStr = searchParams.get("amount") || "0";
    const rrr = searchParams.get("rrr") || "";

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
                    setStatusMessage("Transaction settled successfully! Funding split among destination accounts.");
                } else {
                    setStatus('failed');
                    setStatusMessage("Transaction was cancelled or declined by user.");
                }
            } else {
                setStatus('failed');
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
                <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border-slate-800 shadow-2xl text-center">
                    <CardContent className="pt-8 pb-8 flex flex-col items-center">
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
                            onClick={() => router.push("/student/finance")}
                        >
                            Return to Student Dashboard
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
                                Sandbox Payment Gateway
                            </CardTitle>
                            <p className="text-slate-400 text-xs mt-1">Simulating split transaction flow</p>
                        </div>
                        <Badge className="bg-slate-800 text-slate-300 border-slate-700 px-3 py-1 text-xs">
                            {theme.name} Mode
                        </Badge>
                    </CardHeader>
                    
                    <CardContent className="pt-6 space-y-6">
                        {/* Transaction Metadata summary */}
                        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 flex justify-between items-center">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Amount Due</p>
                                <h3 className="text-3xl font-extrabold text-white mt-1">
                                    {settings?.base_currency || '₦'}{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

                        {/* Physical split visualization */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                                Physical Settlement Split Accounts
                            </h4>
                            
                            <div className="bg-slate-950/40 rounded-xl border border-slate-800/80 p-4 space-y-3">
                                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-b border-slate-800 pb-2">
                                    <span>BENEFICIARY BANK ACCOUNT</span>
                                    <span>SHARE</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-500" />
                                            <div>
                                                <p className="font-semibold text-slate-200">Tuition Settlement A/C</p>
                                                <p className="text-xs text-slate-500">First Bank • 012345****</p>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-white">
                                            {settings?.base_currency || '₦'}{(amount * 0.4).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-500" />
                                            <div>
                                                <p className="font-semibold text-slate-200">Developer Settlement A/C</p>
                                                <p className="text-xs text-slate-500">Jaiz Bank • 987654****</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-mono font-bold text-white">
                                                {settings?.base_currency || '₦'}{(amount * 0.1).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                            <Badge className="block mt-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] scale-90 px-1 py-0">
                                                Developer Share
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-500" />
                                            <div>
                                                <p className="font-semibold text-slate-200">Laboratory A/C</p>
                                                <p className="text-xs text-slate-500">GTBank • 567890****</p>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-white">
                                            {settings?.base_currency || '₦'}{(amount * 0.2).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-500" />
                                            <div>
                                                <p className="font-semibold text-slate-200">School Main Default A/C</p>
                                                <p className="text-xs text-slate-500">Zenith Bank • 102234****</p>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-white">
                                            {settings?.base_currency || '₦'}{(amount * 0.3).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Disclaimer */}
                        <div className="bg-indigo-950/20 border border-indigo-500/15 rounded-xl p-4 flex gap-3">
                            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-400 leading-relaxed">
                                You are in a secure sandbox testing environment. No real funds will be deducted from your bank card. Clicking complete successfully will settle the splits dynamically according to the active fee-bearer rule.
                            </p>
                        </div>

                        {/* Simulation Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                className="bg-rose-600 hover:bg-rose-500 text-white w-full py-6 font-semibold flex items-center justify-center gap-2 border border-rose-500/35"
                                disabled={loading}
                                onClick={() => handleSimulate('failed')}
                            >
                                <XCircle className="w-5 h-5" />
                                Simulate Cancel/Fail
                            </Button>

                            {gateway === 'remita' && rrr ? (
                                <div className="w-full">
                                    <RemitaInlineCheckout 
                                        rrr={rrr} 
                                        amount={amount} 
                                        email={"student@school.edu"} 
                                        firstName={"Student"} 
                                        lastName={"Payer"} 
                                        onSuccess={(response) => handleSimulate('completed')} 
                                        onError={(response) => handleSimulate('failed')} 
                                        onClose={() => handleSimulate('failed')} 
                                    />
                                </div>
                            ) : (
                                <Button
                                    className={`w-full py-6 font-semibold flex items-center justify-center gap-2 text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/35`}
                                    disabled={loading}
                                    onClick={() => handleSimulate('completed')}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing Splits...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Simulate Success
                                        </>
                                    )}
                                </Button>
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
