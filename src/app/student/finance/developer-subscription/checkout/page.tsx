"use client";

import { useEffect, useState } from "react";
import { getMyUnpaidDeveloperSubscription, payDeveloperSubscriptionWithWalletAction } from "@/actions/developer-subscriptions";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Lock, Wallet, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { getStudentDashboardStats } from "@/actions/dashboards";

export default function CheckoutPage() {
    const router = useRouter();
    const [sub, setSub] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [walletBal, setWalletBal] = useState(0);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const init = async () => {
            const data = await getMyUnpaidDeveloperSubscription();
            if (!data) {
                router.replace("/student");
                return;
            }
            setSub(data);
            
            // Get wallet balance from dashboard stats
            try {
                const sessionReq = await fetch('/api/auth/session');
                const sessionData = await sessionReq.json();
                const userId = parseInt(sessionData?.user?.id || "0");
                const stats = await getStudentDashboardStats(userId);
                setWalletBal(parseFloat(stats.walletBalance || "0"));
            } catch (err) {
                console.error(err);
            }
            
            setLoading(false);
        };
        init();
    }, [router]);

    const handleWalletPayment = async () => {
        if (!sub) return;
        if (walletBal < parseFloat(sub.amountDue)) {
            toast.error("Insufficient wallet balance. Please top up your wallet first.");
            return;
        }

        setProcessing(true);
        try {
            const res = await payDeveloperSubscriptionWithWalletAction(sub.id, parseFloat(sub.amountDue));
            if (res.success && res.transactionId) {
                toast.success("Payment successful!");
                router.push(`/finance/receipt/${res.transactionId}`);
            } else if (res.success) {
                toast.success("Payment successful!");
                router.push(`/student?payment=success`);
            }
        } catch (error: any) {
            toast.error(error.message || "Payment failed");
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!sub) return null;

    const amountNum = parseFloat(sub.amountDue);

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50">
            <div className="max-w-2xl mx-auto space-y-6">
                
                <Link href="/student" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>

                <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Subscription Checkout</h1>
                    <p className="text-slate-500">Securely pay your platform access fee.</p>
                </div>

                <Card className="border border-slate-200 shadow-xl rounded-[2rem] overflow-hidden bg-white">
                    <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Lock className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-slate-400 font-bold tracking-wider text-xs uppercase mb-2">Fee Summary</p>
                            <h2 className="text-3xl font-black">{sub.feeName}</h2>
                            <p className="text-slate-300 mt-1">{sub.session?.name} Session</p>
                        </div>
                    </div>
                    
                    <CardContent className="p-8 space-y-8">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total Due</span>
                            <span className="text-4xl font-black text-slate-900">₦{amountNum.toLocaleString()}</span>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Payment Method</h3>
                            
                            <div className="border-2 border-indigo-600 bg-indigo-50/30 rounded-2xl p-6 relative">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full">Selected</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <Wallet className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Digital Wallet</p>
                                        <p className="text-sm text-slate-500">Available Balance: <span className="font-bold text-slate-700">₦{walletBal.toLocaleString()}</span></p>
                                    </div>
                                </div>

                                {walletBal < amountNum && (
                                    <div className="mt-4 flex items-start gap-2 text-rose-600 bg-rose-50/50 p-3 rounded-xl border border-rose-100/50 text-xs">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <p className="leading-relaxed font-medium">
                                            Your wallet balance is insufficient. Please fund your wallet in the Finance portal before proceeding.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button 
                            onClick={handleWalletPayment}
                            disabled={processing || walletBal < amountNum}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-14 rounded-2xl shadow-lg shadow-indigo-200 text-lg transition-all"
                        >
                            {processing ? (
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                            ) : (
                                "Confirm & Pay ₦" + amountNum.toLocaleString()
                            )}
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
