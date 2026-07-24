"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AlatpayInlineCheckoutProps {
    reference: string;
    amount: number;
    email: string;
    firstName: string;
    lastName: string;
    onSuccess: () => void;
    onClose: () => void;
    onError: (error: any) => void;
    targetBusinessId?: string;
}

export function AlatpayInlineCheckout({
    reference,
    amount,
    email,
    firstName,
    lastName,
    onSuccess,
    onClose,
    onError,
    targetBusinessId
}: AlatpayInlineCheckoutProps) {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    useEffect(() => {
        // Check if already loaded
        // @ts-ignore
        if (typeof window !== "undefined" && window.Alatpay) {
            setIsScriptLoaded(true);
            return;
        }

        // Poll for Alatpay object in case onload fails or script was injected by another component
        const interval = setInterval(() => {
            // @ts-ignore
            if (typeof window !== "undefined" && window.Alatpay) {
                setIsScriptLoaded(true);
                clearInterval(interval);
            }
        }, 500);

        // Check if script tag already exists to prevent duplicate injections
        const existingScript = document.querySelector('script[src="https://web.alatpay.ng/js/alatpay.js"]');
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = "https://web.alatpay.ng/js/alatpay.js";
            script.async = true;
            script.onload = () => {
                setIsScriptLoaded(true);
                clearInterval(interval);
                console.log("ALATPay Script Loaded Successfully");
            };
            script.onerror = () => {
                console.error("Failed to load ALATPay script");
                clearInterval(interval);
            };
            document.head.appendChild(script);
        }

        return () => {
            clearInterval(interval);
        };
    }, []);

    const getBusinessCredentials = (reqBusinessId?: string) => {
        const config: Record<string, string | undefined> = {
            [process.env.NEXT_PUBLIC_ALATPAY_BUSINESS_ID_MAIN || '']: process.env.NEXT_PUBLIC_ALATPAY_API_KEY_MAIN,
            [process.env.NEXT_PUBLIC_ALATPAY_BUSINESS_ID_ELEARNING || '']: process.env.NEXT_PUBLIC_ALATPAY_API_KEY_ELEARNING,
            [process.env.NEXT_PUBLIC_ALATPAY_BUSINESS_ID_1 || '']: process.env.NEXT_PUBLIC_ALATPAY_API_KEY_1,
            [process.env.NEXT_PUBLIC_ALATPAY_BUSINESS_ID_CERT || '']: process.env.NEXT_PUBLIC_ALATPAY_API_KEY_CERT,
            [process.env.NEXT_PUBLIC_ALATPAY_BUSINESS_ID_ICT || '']: process.env.NEXT_PUBLIC_ALATPAY_API_KEY_ICT,
        };

        const resolvedId = reqBusinessId || process.env.NEXT_PUBLIC_ALATPAY_BUSINESS_ID_MAIN || "DEMO_BUSINESS_ID";
        const resolvedKey = config[resolvedId] || process.env.NEXT_PUBLIC_ALATPAY_API_KEY_MAIN || "DEMO_API_KEY";

        return { businessId: resolvedId, apiKey: resolvedKey };
    };

    const { businessId, apiKey } = getBusinessCredentials(targetBusinessId);

    const makePayment = () => {
        // @ts-ignore
        if (typeof window !== "undefined" && window.Alatpay) {
            try {
                // Debug alert to see EXACTLY what is being passed
                alert(`ALATPay Debug:\nBusinessID: ${businessId}\nAPIKey: ${apiKey}`);
                
                // @ts-ignore
                let popup = window.Alatpay.setup({
                    apiKey,
                    businessId,
                    email,
                    amount,
                    currency: "NGN",
                    firstName,
                    lastName,
                    onTransaction: function (response: any) {
                        if (response.status === true || response.message === "Approved" || response.status === "Approved") {
                            onSuccess();
                        } else {
                            onError(response);
                        }
                    },
                    onClose: function () {
                        onClose();
                    },
                });

                popup.show();
            } catch (err) {
                console.error("ALATPay Error:", err);
                onError(err);
            }
        } else {
            console.error("ALATPay script not loaded");
            toast.error("Payment Gateway is still loading. Please try again in a few seconds.");
            onError("Payment Gateway Error");
        }
    };

    return (
        <button
            onClick={makePayment}
            disabled={!isScriptLoaded}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-2 ${
                isScriptLoaded 
                ? "bg-[#8A2132] hover:bg-[#6c1a27] text-white shadow-[#8A2132]/30" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
        >
            {isScriptLoaded ? (
                <>
                    <span className="font-extrabold tracking-widest text-white mr-1">ALATPay</span>
                    Pay ₦{amount.toLocaleString()}
                </>
            ) : (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                </>
            )}
        </button>
    );
}
