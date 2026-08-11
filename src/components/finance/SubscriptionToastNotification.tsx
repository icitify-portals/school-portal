"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { CreditCard, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function SubscriptionToastNotification({ 
    hasUnpaidSubscription, 
    hasUnpaidSchoolFees 
}: { 
    hasUnpaidSubscription: boolean,
    hasUnpaidSchoolFees?: boolean
}) {
    const router = useRouter();

    useEffect(() => {
        let timer1: NodeJS.Timeout;
        let timer2: NodeJS.Timeout;

        if (hasUnpaidSubscription) {
            timer1 = setTimeout(() => {
                toast("Pending Processing Fee", {
                    description: "You have an unpaid processing fee for this session.",
                    icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
                    duration: 5000,
                    action: {
                        label: "Pay Now",
                        onClick: () => router.push("/student/finance/developer-subscription/checkout"),
                    },
                });
            }, 1500);
        }

        if (hasUnpaidSchoolFees) {
            // Show school fees toast a bit later so they don't overlap awkwardly
            // If subscription is also unpaid, it alternates by showing this one at 8 seconds.
            timer2 = setTimeout(() => {
                toast("Outstanding School Fees", {
                    description: "You have an outstanding school fees balance.",
                    icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
                    duration: 5000,
                    action: {
                        label: "Pay Now",
                        onClick: () => router.push("/student/finance"),
                    },
                });
            }, hasUnpaidSubscription ? 8000 : 1500);
        }

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [hasUnpaidSubscription, hasUnpaidSchoolFees, router]);

    return null;
}
