"use client";

import { useSession } from "next-auth/react";
import { stopImpersonating } from "@/actions/impersonation";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ImpersonationBanner() {
    const { data: session, update } = useSession();
    const router = useRouter();

    if (!(session?.user as any)?.impersonating) return null;

    const handleStop = async () => {
        const res = await stopImpersonating();
        if (res.success) {
            toast.success("Returned to Admin context");
            // Hard refresh to clear session overrides and reload modules
            window.location.href = "/admin/students";
        } else {
            toast.error(res.error || "Failed to stop impersonation");
        }
    };

    return (
        <div className="bg-amber-500 text-white h-12 flex items-center justify-between px-6 sticky top-0 z-[100] shadow-md border-b border-amber-600">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest italic">Admin Mode:</span>
                    <span className="text-sm font-bold flex items-center gap-2">
                        <User className="w-3 h-3" /> Viewing as {session?.user?.name || "User"}
                    </span>
                </div>
            </div>

            <Button
                onClick={handleStop}
                variant="ghost"
                className="h-8 text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white gap-2 border border-white/30"
            >
                <LogOut className="w-3 h-3" />
                Stop Impersonating
            </Button>
        </div>
    );
}
