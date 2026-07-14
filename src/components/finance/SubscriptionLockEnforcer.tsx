
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Lock, ShieldAlert, CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SubscriptionLockEnforcer({ 
    children, 
    isLocked 
}: { 
    children: React.ReactNode, 
    isLocked: boolean 
}) {
    const pathname = usePathname();

    // Allow access to the subscription payment page
    if (!isLocked || pathname.startsWith("/student/pay-subscription")) {
        return <>{children}</>;
    }

    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
            <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 p-10 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner shadow-blue-200/50">
                    <ShieldAlert className="w-12 h-12" strokeWidth={1.5} />
                </div>
                
                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
                    Portal Access Locked
                </h2>
                
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                    You are required to pay the Developer Subscription Fee before you can access the student portal.
                </p>

                <div className="space-y-3">
                    <Link href="/student/pay-subscription">
                        <Button className="w-full rounded-2xl h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 text-lg flex items-center justify-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Pay Subscription Fee
                        </Button>
                    </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Access will be restored immediately after payment
                    </p>
                </div>
            </div>
        </div>
    );
}

