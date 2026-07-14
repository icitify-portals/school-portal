
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { initiateDeveloperFee, verifyDeveloperFee } from "@/actions/paystack-developer-subscription";

export default function PaySubscriptionPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if ((window as any).PaystackPop) {
            setIsScriptLoaded(true);
            return;
        }

        const scriptId = "paystack-inline-script";
        const existingScript = document.getElementById(scriptId);
        
        if (existingScript) {
            existingScript.addEventListener("load", () => setIsScriptLoaded(true));
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://js.paystack.co/v1/inline.js";
        script.async = true;
        document.body.appendChild(script);
        
        script.onload = () => {
            setTimeout(() => setIsScriptLoaded(true), 200);
        };
    }, []);

    const handlePayment = async () => {
        if (!session?.user?.id) return;
        setIsLoading(true);

        try {
            const initRes = await initiateDeveloperFee(
                session.user.id.toString(),
                session.user.email!,
                "school_fees"
            );

            if (initRes.alreadyPaid) {
                toast.success("Subscription fee is already paid!");
                router.push("/student/dashboard");
                return;
            }

            if (!initRes.success || !(initRes as any).reference) {
                toast.error((initRes as any).error || "Failed to initialize subscription fee");
                setIsLoading(false);
                return;
            }

            if (!(window as any).PaystackPop) {
                toast.error("Payment engine is still loading. Please try again in a few seconds.");
                setIsLoading(false);
                return;
            }

            const handler = (window as any).PaystackPop.setup({
                key: (initRes as any).publicKey,
                email: session?.user?.email || "",
                amount: (initRes as any).amount * 100,
                ref: (initRes as any).reference,
                currency: "NGN",
                callback: async function(response: any) {
                    const verifyRes = await verifyDeveloperFee(response.reference);
                    if (verifyRes.success) {
                        toast.success("Subscription fee paid successfully!");
                        setTimeout(() => {
                            window.location.href = "/student/dashboard";
                        }, 1500);
                    } else {
                        toast.error(verifyRes.error || "Payment verification failed");
                        setIsLoading(false);
                    }
                },
                onClose: function() {
                    setIsLoading(false);
                }
            });

            handler.openIframe();
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred");
            setIsLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto py-12 px-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl shadow-blue-900/5 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10" />
                </div>
                
                <h1 className="text-3xl font-black text-slate-800 mb-2">Portal Access Fee</h1>
                <p className="text-slate-500 mb-8 font-medium">
                    Please complete your developer subscription fee to restore your portal access and continue with your session activities.
                </p>

                <Button 
                    onClick={handlePayment} 
                    disabled={isLoading || !isScriptLoaded}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-bold shadow-lg shadow-blue-600/20"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Initializing Payment...
                        </>
                    ) : (
                        <>
                            <CreditCard className="w-5 h-5 mr-2" />
                            Pay Subscription Fee
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

