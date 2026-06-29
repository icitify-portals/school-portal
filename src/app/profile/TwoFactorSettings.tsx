"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ShieldCheck,
    ShieldAlert,
    Copy,
    Download,
    Loader2,
    CheckCircle2,
    Lock,
    KeyRound,
    RefreshCw,
    DownloadCloud
} from "lucide-react";
import {
    generateTwoFactorSetupAction,
    enableTwoFactorAction,
    disableTwoFactorAction,
    getUserTwoFactorStatusAction,
    requestTwoFactorOTPAction,
    enableOtpTwoFactorAction
} from "@/actions/two-factor";
import QRCode from "qrcode";
import { toast } from "sonner";

export default function TwoFactorSettings() {
    const { data: session, update } = useSession();
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [method, setMethod] = useState<"app" | "email" | "sms">("app");
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    
    // Setup state
    const [setupStep, setSetupStep] = useState<"idle" | "setup" | "backup_codes">("idle");
    const [secret, setSecret] = useState<string>("");
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [verificationCode, setVerificationCode] = useState<string>("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    
    // Disable state
    const [confirmDisable, setConfirmDisable] = useState<boolean>(false);
    const [disableCode, setDisableCode] = useState<string>("");

    useEffect(() => {
        fetch2FAStatus();
    }, []);

    async function fetch2FAStatus() {
        setLoading(true);
        const res = await getUserTwoFactorStatusAction();
        setIsEnabled(res.enabled);
        if (res.method) setMethod(res.method as any);
        setLoading(false);
    }

    async function handleStartSetup(selectedMethod: "app" | "email" | "sms" = method) {
        setMethod(selectedMethod);
        setSubmitting(true);
        if (selectedMethod === "app") {
            const res = await generateTwoFactorSetupAction();
            if (res.error || !res.secret || !res.otpauthUri) {
                toast.error(res.error || "Failed to start 2FA setup");
                setSubmitting(false);
                return;
            }
            try {
                const url = await QRCode.toDataURL(res.otpauthUri);
                setSecret(res.secret);
                setQrCodeUrl(url);
                setSetupStep("setup");
            } catch (err) {
                toast.error("Failed to generate QR code");
            }
        } else {
            const res = await requestTwoFactorOTPAction('setup', selectedMethod);
            if (res.error) {
                toast.error(res.error || "Failed to send verification code");
                setSubmitting(false);
                return;
            }
            toast.success(res.message || "Code sent!");
            setSetupStep("setup");
        }
        setSubmitting(false);
    }

    async function handleVerifyAndEnable() {
        if (!verificationCode || verificationCode.length !== 6) {
            toast.error("Please enter a valid 6-digit code");
            return;
        }
        setSubmitting(true);
        
        let res;
        if (method === "app") {
            res = await enableTwoFactorAction(secret, verificationCode);
        } else {
            res = await enableOtpTwoFactorAction(method, verificationCode);
        }

        if (res.error || !res.backupCodes) {
            toast.error(res.error || "Failed to verify 2FA code");
            setSubmitting(false);
            return;
        }

        setBackupCodes(res.backupCodes);
        setIsEnabled(true);
        setSetupStep("backup_codes");
        
        await update({ twoFactorVerified: true });
        
        toast.success("Two-Factor Authentication successfully enabled!");
        setSubmitting(false);
    }

    async function handleDisable2FA() {
        if (!disableCode || disableCode.length !== 6) {
            toast.error("Please enter a valid 6-digit code");
            return;
        }

        setSubmitting(true);
        const res = await disableTwoFactorAction(disableCode);
        if (res.error) {
            toast.error(res.error || "Failed to disable 2FA");
            setSubmitting(false);
            return;
        }

        setIsEnabled(false);
        setConfirmDisable(false);
        setDisableCode("");
        setSetupStep("idle");
        
        // Sync session details client side
        await update({ twoFactorVerified: false });

        toast.success("Two-Factor Authentication has been disabled.");
        setSubmitting(false);
    }

    function handleCopyBackupCodes() {
        const text = backupCodes.join("\n");
        navigator.clipboard.writeText(text);
        toast.success("Recovery codes copied to clipboard!");
    }

    function handleDownloadBackupCodes() {
        const text = `SCHOOL PORTAL 2FA BACKUP CODES\nGenerated: ${new Date().toLocaleString()}\n\nKeep these codes in a safe place. Each code can be used once to log in.\n\n${backupCodes.join("\n")}`;
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "school-portal-2fa-backup-codes.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Recovery codes downloaded!");
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in slide-in-from-right-4">
            {/* Status Info Box */}
            <div className={`p-8 rounded-[2.5rem] border flex gap-6 items-center transition-all ${
                isEnabled 
                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-900" 
                    : "bg-amber-50/50 border-amber-100 text-amber-900"
            }`}>
                {isEnabled ? (
                    <ShieldCheck className="w-12 h-12 text-emerald-600 shrink-0" />
                ) : (
                    <ShieldAlert className="w-12 h-12 text-amber-600 shrink-0" />
                )}
                <div>
                    <h4 className="font-black italic uppercase text-[12px] tracking-wider">
                        {isEnabled ? "Two-Factor Authentication is Active" : "Two-Factor Authentication is Disabled"}
                    </h4>
                    <p className="text-[10px] font-black opacity-70 uppercase tracking-widest leading-loose mt-1">
                        {isEnabled 
                            ? "Your account is secured with secondary app-based validation. A code will be required during sign in."
                            : "Securing your portal login with an authenticator app adds an extra layer of security beyond your password."}
                    </p>
                </div>
            </div>

            {/* Enable Process Flow */}
            {setupStep === "idle" && !isEnabled && (
                <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-[2.5rem] space-y-6">
                    <div className="text-center">
                        <Lock className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                        <h5 className="font-black text-sm uppercase text-slate-800">Secure Your Session</h5>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed max-w-md mx-auto">
                            Choose your preferred secondary security method to protect your account.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-6">
                        <div className="p-6 bg-white border border-slate-100 rounded-2xl flex flex-col items-center text-center space-y-4 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer" onClick={() => handleStartSetup("app")}>
                            <ShieldCheck className="w-8 h-8 text-emerald-600" />
                            <div>
                                <h6 className="font-black text-xs uppercase text-slate-800">Authenticator App</h6>
                                <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">Highest Security</p>
                            </div>
                            <Button disabled={submitting} className="w-full mt-auto bg-emerald-800 hover:bg-emerald-950 text-white text-[9px] uppercase tracking-widest rounded-xl">Use App</Button>
                        </div>
                        
                        <div className="p-6 bg-white border border-slate-100 rounded-2xl flex flex-col items-center text-center space-y-4 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer" onClick={() => handleStartSetup("email")}>
                            <RefreshCw className="w-8 h-8 text-blue-600" />
                            <div>
                                <h6 className="font-black text-xs uppercase text-slate-800">Email OTP</h6>
                                <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">Codes sent to email</p>
                            </div>
                            <Button disabled={submitting} className="w-full mt-auto bg-blue-600 hover:bg-blue-800 text-white text-[9px] uppercase tracking-widest rounded-xl">Use Email</Button>
                        </div>

                        <div className="p-6 bg-white border border-slate-100 rounded-2xl flex flex-col items-center text-center space-y-4 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer" onClick={() => handleStartSetup("sms")}>
                            <KeyRound className="w-8 h-8 text-purple-600" />
                            <div>
                                <h6 className="font-black text-xs uppercase text-slate-800">SMS / WhatsApp</h6>
                                <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">Codes sent to phone</p>
                            </div>
                            <Button disabled={submitting} className="w-full mt-auto bg-purple-600 hover:bg-purple-800 text-white text-[9px] uppercase tracking-widest rounded-xl">Use Phone</Button>
                        </div>
                    </div>
                </div>
            )}

            {setupStep === "setup" && (
                <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] space-y-8 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                        <KeyRound className="w-5 h-5 text-emerald-600" />
                        <h5 className="font-black text-sm uppercase text-slate-800">{method === 'app' ? "Scan Authenticator QR Code" : `Verify ${method === 'email' ? 'Email' : 'Phone'} OTP`}</h5>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            {qrCodeUrl && (
                                <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 object-contain shadow-inner rounded-xl" />
                            )}
                            <div className="mt-4 text-center space-y-1">
                                {method === 'app' && (
                                    <>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Secret Key (Manual Entry)</span>
                                        <code className="block text-xs font-black text-slate-700 tracking-widest select-all">{secret}</code>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-loose">
                                {method === 'app' ? (
                                    <>
                                        1. Open your authenticator application.<br />
                                        2. Scan the QR code or manually enter the secret key.<br />
                                        3. Enter the 6-digit code displayed in the app below to finalize activation.
                                    </>
                                ) : (
                                    <>
                                        A 6-digit verification code has been sent to your {method === 'email' ? 'email address' : 'phone number'}.<br />
                                        Please enter the code below to finalize activation.<br />
                                        The code will expire in 10 minutes.
                                    </>
                                )}
                            </p>
                            
                            <div className="space-y-2">
                                <Label htmlFor="verificationCode" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Verification Code</Label>
                                <Input
                                    id="verificationCode"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                    className="h-14 rounded-2xl font-black text-center text-lg tracking-[0.4em] border-slate-200"
                                />
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSetupStep("idle")}
                                    className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-[9px] border-slate-200 text-slate-600"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleVerifyAndEnable}
                                    disabled={submitting}
                                    className="bg-emerald-800 h-14 flex-1 rounded-2xl hover:bg-emerald-950 text-white font-black uppercase tracking-widest text-[9px] transition-all hover:scale-105"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Activate"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {setupStep === "backup_codes" && (
                <div className="bg-emerald-50/20 border border-emerald-100 p-10 rounded-[2.5rem] space-y-8 shadow-sm">
                    <div className="text-center space-y-2">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
                        <h5 className="font-black text-sm uppercase text-slate-800">Store Backup Recovery Codes</h5>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed max-w-md mx-auto">
                            If you lose access to your device, you can use these recovery codes to sign in. Save them safely; they are only shown once!
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-inner">
                        {backupCodes.map((code, idx) => (
                            <code key={idx} className="text-center py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-800 select-all tracking-wider">
                                {code}
                            </code>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCopyBackupCodes}
                            className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[9px] border-slate-200 text-slate-600 flex items-center gap-2"
                        >
                            <Copy className="w-4 h-4" /> Copy Codes
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDownloadBackupCodes}
                            className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[9px] border-slate-200 text-slate-600 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Download File
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setSetupStep("idle")}
                            className="bg-emerald-800 h-14 px-8 rounded-2xl hover:bg-emerald-950 text-white font-black uppercase tracking-widest text-[9px] transition-all hover:scale-105"
                        >
                            Complete Setup
                        </Button>
                    </div>
                </div>
            )}

            {/* Active Configuration Options (Disable, etc) */}
            {isEnabled && setupStep !== "backup_codes" && (
                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                        <div className="space-y-1">
                            <h5 className="font-black text-sm uppercase text-slate-800">Two-Factor Authentication Control</h5>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                Temporarily deactivate secondary security validation on login.
                            </p>
                        </div>
                    </div>

                    {!confirmDisable ? (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setConfirmDisable(true)}
                            className="bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all"
                        >
                            Deactivate Two-Factor Authentication
                        </Button>
                    ) : (
                        <div className="space-y-4 p-6 bg-rose-50/20 border border-rose-100 rounded-2xl max-w-md">
                            <h6 className="font-black text-[10px] uppercase tracking-widest text-rose-700">Confirm Deactivation</h6>
                            <p className="text-[9px] font-bold text-rose-800/60 leading-relaxed uppercase">
                                Enter the 6-digit verification code from your authenticator app to complete deactivation.
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="disableCode" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Security Code</Label>
                                <Input
                                    id="disableCode"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={disableCode}
                                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                                    className="h-14 rounded-2xl font-black text-center text-lg tracking-[0.4em] border-rose-200"
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setConfirmDisable(false);
                                        setDisableCode("");
                                    }}
                                    className="h-12 flex-1 rounded-xl font-black uppercase tracking-widest text-[8px] border-slate-200 text-slate-600"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleDisable2FA}
                                    disabled={submitting}
                                    className="bg-rose-600 hover:bg-rose-700 h-12 flex-1 rounded-xl text-white font-black uppercase tracking-widest text-[8px] transition-all"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deactivate 2FA"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
