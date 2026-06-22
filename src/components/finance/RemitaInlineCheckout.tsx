"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";

interface RemitaInlineCheckoutProps {
    rrr: string;
    amount: number;
    email: string;
    firstName: string;
    lastName: string;
    onSuccess: (response: any) => void;
    onError: (response: any) => void;
    onClose: () => void;
}

export function RemitaInlineCheckout({
    rrr,
    amount,
    email,
    firstName,
    lastName,
    onSuccess,
    onError,
    onClose
}: RemitaInlineCheckoutProps) {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [isPaying, setIsPaying] = useState(false);

    const makePayment = () => {
        if (!isScriptLoaded || typeof window === "undefined") {
            console.error("Remita script not loaded yet");
            return;
        }

        const RmPaymentEngine = (window as any).RmPaymentEngine;
        if (!RmPaymentEngine) {
            console.error("RmPaymentEngine not found on window object");
            return;
        }

        setIsPaying(true);

        const paymentEngine = RmPaymentEngine.init({
            key: process.env.NEXT_PUBLIC_REMITA_PUBLIC_KEY || "",
            customerId: email,
            firstName: firstName,
            lastName: lastName,
            email: email,
            amount: amount,
            rrr: rrr,
            extendedData: {
                customFields: [{ name: "rrr", value: rrr }]
            },
            onSuccess: (response: any) => {
                setIsPaying(false);
                onSuccess(response);
            },
            onError: (response: any) => {
                setIsPaying(false);
                onError(response);
            },
            onClose: () => {
                setIsPaying(false);
                onClose();
            }
        });

        paymentEngine.showPaymentWidget();
    };

    return (
        <>
            <Script 
                src="https://remitademo.net/payment/v1/remita-pay-inline.bundle.js" 
                strategy="lazyOnload"
                onLoad={() => setIsScriptLoaded(true)}
            />

            <Button
                onClick={makePayment}
                disabled={!isScriptLoaded || isPaying}
                className="w-full py-6 font-semibold flex items-center justify-center gap-2 text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/35"
            >
                {isPaying ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Initializing Remita...
                    </>
                ) : (
                    <>
                        <CreditCard className="w-5 h-5" />
                        Pay with Remita
                    </>
                )}
            </Button>
        </>
    );
}
