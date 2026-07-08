"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

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
        if (typeof window === "undefined") {
            console.error("Remita script not loaded yet");
            return;
        }

        const RmPaymentEngine = (window as any).RmPaymentEngine;
        if (!RmPaymentEngine) {
            console.error("RmPaymentEngine not found on window object");
            toast.error("Payment engine is still loading. Please wait a moment and try again.");
            setIsPaying(false);
            return;
        }

        setIsPaying(true);

        try {
            const paymentEngine = RmPaymentEngine.init({
                key: process.env.NEXT_PUBLIC_REMITA_PUBLIC_KEY || "QzAwMDAyNzEyNTl8MTEwNjE4Njc3MzZ8MThkNGYwY2E0YWZkNmM4MmEwOGEyZDkxYWMwMGMyYWFlNjRlYmY4MzM0OGNlMjcxZDU4NTkyZTNkZTI5YWNkNzEzN2ZkMWI4ZmE5OTQ0NDg3YmM0YjFlNGM2NjExMGYzZDZmMGUzY2I5MmY2YWZlMDVmMzBhY2QzNzEzOWQwNDc=", // Fallback to demo key if missing
                customerId: email,
                firstName: firstName,
                lastName: lastName,
                email: email,
                amount: amount,
                rrr: rrr,
                processRrr: true,
                transactionId: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
        } catch (error: any) {
            console.error("Remita Initialization Error:", error);
            setIsPaying(false);
            toast.error(error?.message || "Failed to initialize Remita Payment Engine. Please check your API keys.");
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        if ((window as any).RmPaymentEngine) {
            setIsScriptLoaded(true);
            return;
        }

        const scriptId = "remita-inline-script";
        if (document.getElementById(scriptId)) return; // Already injected

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://demo.remita.net/payment/v1/remita-pay-inline.bundle.js";
        script.async = true;
        
        script.onload = () => {
            // Give it a tiny bit of time to execute and attach to window
            setTimeout(() => setIsScriptLoaded(true), 200);
        };
        
        script.onerror = () => {
            console.error("Failed to load Remita script");
            toast.error("Failed to load Remita payment engine. Please check your network connection or adblocker.", { duration: 5000 });
        };
        
        document.body.appendChild(script);
    }, []);

    return (
        <>
            <Button
                onClick={makePayment}
                disabled={isPaying}
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
