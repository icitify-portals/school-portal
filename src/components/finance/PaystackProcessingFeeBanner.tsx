"use client";

import { useState } from "react";
import { AlertCircle, CreditCard, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { initiatePaystackProcessingFeeAction } from "@/actions/dashboard-actions";
import { toast } from "sonner";

export function PaystackProcessingFeeBanner({ hasUnpaidSubscription, sessionName }: { hasUnpaidSubscription: boolean, sessionName: string }) {
    const [loading, setLoading] = useState(false);

    if (!hasUnpaidSubscription) return null;

    const handlePay = async () => {
        setLoading(true);
        try {
            const res = await initiatePaystackProcessingFeeAction();
            if (res.success && res.authorizationUrl) {
                window.location.href = res.authorizationUrl;
            } else {
                toast.error(res.message || "Failed to initialize payment");
                setLoading(false);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to initialize payment");
            setLoading(false);
        }
    };

    return (
        <Alert variant="destructive" className="mb-6 border-red-500/50 bg-red-500/10 text-red-700 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4 w-full">
                <AlertCircle className="h-6 w-6 mt-1 flex-shrink-0" />
                <div className="flex-1">
                    <AlertTitle className="text-lg font-semibold flex items-center gap-2">
                        Processing Fee Pending 
                        <Lock className="w-4 h-4 text-red-600" />
                    </AlertTitle>
                    <AlertDescription className="mt-1 text-red-600/90 leading-relaxed">
                        You have an unpaid <strong>Processing Fee (₦3,000)</strong> for the <strong>{sessionName}</strong> session. 
                        Please make this payment to avoid portal access restrictions towards examination periods.
                    </AlertDescription>
                </div>
            </div>
            
            <Button 
                onClick={handlePay}
                disabled={loading}
                variant="destructive" 
                className="w-full sm:w-auto shadow-sm whitespace-nowrap bg-red-600 hover:bg-red-700 text-white font-medium px-6 h-11"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                )}
                Pay Now
            </Button>
        </Alert>
    );
}
