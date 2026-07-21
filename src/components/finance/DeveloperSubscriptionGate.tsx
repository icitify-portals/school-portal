"use client";

import { useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { initiateDeveloperFee, verifyDeveloperFee } from "@/actions/paystack-developer-subscription";

export function useDeveloperSubscription() {
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        // No client-side script loading needed since we use standard redirect API.
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

            // Ensure email is valid for Paystack, else fallback
            const safeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : 'student@fssibadan.edu.ng';

            if ((initRes as any).authorizationUrl) {
                // Redirect to Paystack standard checkout
                window.location.href = (initRes as any).authorizationUrl;
                return;
            } else if ((initRes as any).error) {
                toast.error((initRes as any).error);
                setIsLoading(false);
                if (onError) onError();
                return;
            } else {
                toast.error("Invalid payment initialization response.");
                setIsLoading(false);
                if (onError) onError();
                return;
            }
            
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

