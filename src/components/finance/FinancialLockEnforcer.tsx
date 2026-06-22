"use client";

import { usePathname } from "next/navigation";
import { Lock, ShieldAlert, CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinancialLockEnforcer({ 
    children, 
    isHardLock 
}: { 
    children: React.ReactNode, 
    isHardLock: boolean 
}) {
    const pathname = usePathname();

    // Allow access to finance and auth pages
    if (!isHardLock || pathname.startsWith("/student/finance")) {
        return <>{children}</>;
    }

    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
            <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-rose-100 p-10 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner shadow-rose-200/50">
                    <Lock className="w-12 h-12" />
                </div>
                
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">
                    Portal Locked
                </h1>
                
                <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                    Your portal access has been restricted due to outstanding financial obligations. 
                    Please navigate to the Finance department to settle your bills and restore full access.
                </p>

                <div className="space-y-4">
                    <Link href="/student/finance" className="block w-full">
                        <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-rose-600/20 transition-all hover:scale-105">
                            <CreditCard className="w-4 h-4 mr-2" /> Go to Finance Portal
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
