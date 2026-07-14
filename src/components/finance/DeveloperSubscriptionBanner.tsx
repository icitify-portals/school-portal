"use client";

import { useEffect, useState } from "react";
import { getMyUnpaidDeveloperSubscription } from "@/actions/developer-subscriptions";
import { AlertCircle, CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export default function DeveloperSubscriptionBanner() {
    const [sub, setSub] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        getMyUnpaidDeveloperSubscription().then(data => {
            setSub(data);
            setLoading(false);
        });
    }, []);

    if (loading || !sub) return null;

    return (
        <Alert variant="destructive" className="mb-6 border-red-500/50 bg-red-500/10 text-red-700 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4 w-full">
                <AlertCircle className="h-6 w-6 mt-1 flex-shrink-0" />
                <div className="flex-1">
                    <AlertTitle className="text-lg font-semibold flex items-center gap-2">
                        Platform Access Fee Pending 
                        <Lock className="w-4 h-4 text-red-600" />
                    </AlertTitle>
                    <AlertDescription className="mt-1 text-red-600/90 leading-relaxed">
                        You have an unpaid <strong>{sub.feeName}</strong> for the <strong>{sub.session?.name}</strong> session. 
                        Amount due: <span className="font-bold text-red-800">₦{Number(sub.amountDue).toLocaleString()}</span>. 
                        Please make payment before Week {sub.lockWeek} to avoid portal access restriction.
                    </AlertDescription>
                </div>
            </div>
            
            <Button 
                onClick={() => router.push(`/student/finance/developer-subscription/checkout`)}
                variant="destructive" 
                className="w-full sm:w-auto shadow-sm whitespace-nowrap bg-red-600 hover:bg-red-700 text-white font-medium px-6"
            >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Now
            </Button>
        </Alert>
    );
}
