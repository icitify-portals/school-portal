"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { verifyTwoFactorLoginAction, verifyBackupCodeLoginAction } from "@/actions/two-factor";
import { toast } from "sonner";

export default function TwoFactorLoginClient() {
    const router = useRouter();
    const { update } = useSession();
    const [mode, setMode] = useState<"totp" | "backup">("totp");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        
        if (mode === "totp" && code.length !== 6) {
            toast.error("Please enter a valid 6-digit code.");
            return;
        }

        if (mode === "backup" && code.length !== 8) {
            toast.error("Please enter a valid 8-character recovery code.");
            return;
        }

        setLoading(true);

        const res = mode === "totp" 
            ? await verifyTwoFactorLoginAction(code)
            : await verifyBackupCodeLoginAction(code);

        if (res?.error) {
            toast.error(res.error);
            setLoading(false);
            return;
        }

        // Successfully verified, update session to clear pending flag
        await update({ twoFactorVerified: true });
        
        toast.success("Identity verified successfully!");
        
        // Brief delay for the session update to propagate, then redirect
        setTimeout(() => {
            router.push("/");
            router.refresh();
        }, 500);
    }

    return (
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] p-10 bg-white">
            <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    {mode === "totp" ? (
                        <ShieldCheck className="w-10 h-10 text-emerald-600" />
                    ) : (
                        <KeyRound className="w-10 h-10 text-amber-600" />
                    )}
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {mode === "totp" ? "Two-Factor Verification" : "Recovery Login"}
                    </h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                        {mode === "totp" 
                            ? "Open your authenticator app and enter the 6-digit code to continue."
                            : "Enter one of your 8-character emergency recovery codes."}
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6 pt-4">
                    <Input
                        type="text"
                        placeholder={mode === "totp" ? "000000" : "XXXXXXXX"}
                        maxLength={mode === "totp" ? 6 : 8}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(mode === "totp" ? /\\D/g : /[^a-zA-Z0-9]/g, "").toUpperCase())}
                        className="h-16 text-center text-2xl tracking-[0.5em] font-black rounded-2xl border-slate-200"
                        autoFocus
                    />

                    <Button
                        type="submit"
                        disabled={loading || code.length < (mode === "totp" ? 6 : 8)}
                        className="w-full h-14 rounded-2xl bg-emerald-800 hover:bg-emerald-950 text-white font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                    </Button>
                </form>

                <div className="pt-6 border-t border-slate-100">
                    {mode === "totp" ? (
                        <button 
                            type="button"
                            onClick={() => { setMode("backup"); setCode(""); }}
                            className="text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors"
                        >
                            Lost your device? Use a recovery code
                        </button>
                    ) : (
                        <button 
                            type="button"
                            onClick={() => { setMode("totp"); setCode(""); }}
                            className="flex items-center justify-center gap-2 w-full text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors"
                        >
                            <ArrowLeft className="w-3 h-3" /> Back to Authenticator
                        </button>
                    )}
                </div>
            </div>
        </Card>
    );
}
