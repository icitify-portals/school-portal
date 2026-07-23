"use client";

import React, { useEffect } from "react";
import Script from "next/script";
import { toast } from "sonner";

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
        <>
            <Script 
                src="https://web.alatpay.ng/js/alatpay.js" 
                strategy="beforeInteractive"
                onLoad={() => {
                    console.log("ALATPay Script Loaded");
                }}
            />
            <button
                onClick={makePayment}
                className="w-full py-4 rounded-xl bg-[#8A2132] hover:bg-[#6c1a27] text-white font-black text-lg transition-all shadow-xl shadow-[#8A2132]/30 flex items-center justify-center gap-2"
            >
                <img src="https://alat.ng/wp-content/uploads/2021/04/alat-logo-white.svg" className="h-6" alt="ALATPay Logo" />
                Pay ₦{amount.toLocaleString()} with ALATPay
            </button>
        </>
    );
}
