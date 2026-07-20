"use client";

import { useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { initiateDeveloperFee, verifyDeveloperFee } from "@/actions/paystack-developer-subscription";

export function useDeveloperSubscription() {
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
            if ((window as any).PaystackPop) {
                setIsScriptLoaded(true);
            } else {
                existingScript.addEventListener('load', () => setIsScriptLoaded(true));
            }
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://js.paystack.co/v1/inline.js";
        script.async = true;
        
        script.onload = () => {
            setTimeout(() => setIsScriptLoaded(true), 200);
        };
        
        script.onerror = () => {
            console.warn("Failed to load Paystack script");
        };
        
        document.body.appendChild(script);
    }, []);

    const triggerSubscriptionGate = async ({
        identifier,
        email,
        type,
        sessionId,
        customAmount,
        onSuccess,
        onError
    }: {
        identifier: string;
        email: string;
        type: 'admission_form' | 'school_fees';
        sessionId?: number;
        customAmount?: number;
        onSuccess: () => void;
        onError?: () => void;
    }) => {
        if (!identifier || !email) {
            toast.error("Missing required identifiers");
            if (onError) onError();
            return;
        }

        setIsLoading(true);

        try {
            const initRes = await initiateDeveloperFee(identifier, email, type, sessionId, customAmount);
            
            if ((initRes as any).error || !initRes.success) {
                toast.error((initRes as any).error || "Failed to initiate developer subscription");
                setIsLoading(false);
                if (onError) onError();
                return;
            }

            if (initRes.alreadyPaid) {
                setIsLoading(false);
                onSuccess();
                return;
            }

            if (!(window as any).PaystackPop) {
                toast.error("Payment engine is still loading. Please try again in a few seconds.");
                setIsLoading(false);
                if (onError) onError();
                return;
            }
            
            if (!(initRes as any).publicKey) {
                toast.error("Payment Gateway (Paystack) is not configured. Missing public key.");
                setIsLoading(false);
                if (onError) onError();
                return;
            }

            const parsedAmount = Math.round(parseFloat((initRes as any).amount || '0') * 100);
            
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                toast.error("Invalid payment amount.");
                setIsLoading(false);
                if (onError) onError();
                return;
            }
            
            // Ensure email is valid for Paystack, else fallback
            const safeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : 'student@fssibadan.edu.ng';

            console.log("Initializing Paystack with:", {
                key: (initRes as any).publicKey,
                email: email,
                amount: parsedAmount,
                ref: (initRes as any).reference
            });

            const handler = (window as any).PaystackPop.setup({
                key: (initRes as any).publicKey,
                email: safeEmail,
                amount: parsedAmount,
                currency: "NGN",
                ref: (initRes as any).reference,
                callback: function (response: any) {
                    (async () => {
                        setIsLoading(true); 
                        toast.loading("Verifying payment...", { id: "verify-paystack" });
                        
                        const verifyRes = await verifyDeveloperFee(response.reference);
                        
                        if (verifyRes.success) {
                            toast.success("Developer fee paid successfully!", { id: "verify-paystack" });
                            onSuccess();
                        } else {
                            toast.error(verifyRes.error || "Verification failed. Please contact support.", { id: "verify-paystack" });
                            if (onError) onError();
                        }
                        setIsLoading(false);
                    })();
                },
                onClose: function () {
                    toast.info("Payment cancelled.");
                    setIsLoading(false);
                    if (onError) onError();
                },
            });

            handler.openIframe();
            
            // Fallback: If the Paystack modal fails to open visibly but didn't trigger an error,
            // unlock the button after 5 seconds so the user isn't stuck.
            setTimeout(() => {
                setIsLoading(false);
            }, 5000);
            
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "An unexpected error occurred");
            setIsLoading(false);
            if (onError) onError();
        }
    };

    return { triggerSubscriptionGate, isGateLoading: isLoading };
}

// Optional Wrapper Component for places that just need a standard button wrap
export function DeveloperSubscriptionGate({
    identifier,
    email,
    type,
    sessionId,
    onSuccess,
    children,
    buttonText,
    className
}: {
    identifier: string;
    email: string;
    type: 'admission_form' | 'school_fees';
    sessionId?: number;
    onSuccess: () => void;
    children?: ReactNode;
    buttonText?: string;
    className?: string;
}) {
    const { triggerSubscriptionGate, isGateLoading } = useDeveloperSubscription();

    const handleCheckout = () => {
        triggerSubscriptionGate({ identifier, email, type, sessionId, onSuccess });
    };

    return (
        <div onClick={(e) => {
            if (!buttonText) {
                e.preventDefault();
                e.stopPropagation();
                if (!isGateLoading) handleCheckout();
            }
        }} className={buttonText ? "" : className}>
            {buttonText ? (
                <Button 
                    onClick={handleCheckout} 
                    disabled={isGateLoading}
                    className={className}
                >
                    {isGateLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {buttonText}
                </Button>
            ) : (
                children
            )}
        </div>
    );
}

