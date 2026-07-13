"use client";

import { usePathname } from "next/navigation";
import { Stethoscope, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MedicalLockEnforcer({ 
    children, 
    healthStatus 
}: { 
    children: React.ReactNode, 
    healthStatus: string | null
}) {
    const pathname = usePathname();

    // Allow access to medical page
    if (healthStatus === "cleared" || pathname.startsWith("/student/medical")) {
        return <>{children}</>;
    }

    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4 relative z-50">
            <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-green-100 p-10 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner shadow-green-200/50">
                    <Stethoscope className="w-12 h-12" />
                </div>
                
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">
                    Medical Profile Incomplete
                </h1>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-6 text-left flex gap-2 rounded-r-md">
                    <ShieldAlert className="w-5 h-5 text-yellow-600 shrink-0" />
                    <p className="text-xs text-yellow-800 font-medium">
                        To comply with the Federal School of Statistics health regulations, you must complete your medical form before accessing the portal.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link href="/student/medical" className="block w-full">
                        <Button className="w-full bg-green-700 hover:bg-green-800 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-green-700/20 transition-all hover:scale-105">
                            <Stethoscope className="w-4 h-4 mr-2" /> Complete Medical Form
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
