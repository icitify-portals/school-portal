"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Key, CheckCircle, Copy, AlertTriangle } from "lucide-react";
import { getPaymentGatewayConfigs } from "@/actions/payment-gateways";
import { toast } from "sonner";

export default function PaymentGatewaysPage() {
    const [gateways, setGateways] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPaymentGatewayConfigs().then(result => {
            if (result?.success) setGateways(result.gateways);
            setLoading(false);
        });
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (loading) return (
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-indigo-600" />
                    Payment Gateways
                </h1>
                <p className="text-sm text-slate-500 mt-1">Configure online payment providers for tuition and fees</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gateways.map(gateway => (
                    <Card key={gateway.id} className={gateway.enabled ? 'border-green-200' : 'border-slate-200 opacity-80'}>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                <span>{gateway.icon}</span> {gateway.name}
                            </CardTitle>
                            {gateway.enabled ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                    <CheckCircle className="w-3 h-3" /> Active
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                    Disabled
                                </span>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Mode</p>
                                    <p className={`font-medium ${gateway.testMode ? 'text-amber-600' : 'text-slate-700'}`}>
                                        {gateway.testMode ? 'Test Mode' : 'Live Mode'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Public Key</p>
                                    <p className="font-mono text-xs">{gateway.publicKey || 'Not set'}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <Key className="w-3 h-3" /> Webhook URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={gateway.webhookUrl}
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 bg-slate-50 outline-none"
                                    />
                                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(gateway.webhookUrl)} className="px-2">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                    Add this URL to your {gateway.name} dashboard to receive payment notifications.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                        <h3 className="font-bold text-amber-800 text-sm">Configuration via Environment Variables</h3>
                        <p className="text-xs text-amber-700 mt-1">
                            For security reasons, full API keys are not displayed or editable here. Manage your payment gateway credentials securely in your configuration interface or <code className="bg-amber-100 px-1 rounded">.env</code> file.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
