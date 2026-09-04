"use client";
import { useState } from "react";
import { processManualAdmissionPayment, forceUpdateAdmissionPayment } from "@/actions/manual-update";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function RemitaManualUpdatePage() {
    const [reference, setReference] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState<'requery' | 'paid' | 'reverse' | null>(null);

    const handleVerify = async () => {
        if (!reference) return toast.error("Please enter a reference");
        setLoading(true);
        setLoadingAction('requery');
        const res = await processManualAdmissionPayment(reference.trim());
        if (res.success) {
            toast.success(res.message);
            setReference("");
        } else {
            toast.error(res.error);
        }
        setLoading(false);
        setLoadingAction(null);
    };

    const handleForce = async (action: 'paid' | 'reverse') => {
        if (!reference) return toast.error("Please enter a reference");
        const confirmMsg = action === 'paid' ? "Are you sure you want to forcibly mark this as SUCCESSFUL without querying the gateway?" : "Are you sure you want to forcibly REVERSE this transaction?";
        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        setLoadingAction(action);
        const res = await forceUpdateAdmissionPayment(reference.trim(), action);
        if (res.success) {
            toast.success(res.message);
            setReference("");
        } else {
            toast.error(res.error);
        }
        setLoading(false);
        setLoadingAction(null);
    };

    return (
        <div className="p-6 max-w-xl mx-auto space-y-6 mt-10">
            <h1 className="text-3xl font-black text-slate-900">Developer Gateway Tools</h1>
            <p className="text-slate-500">Manually re-query or override pending transactions.</p>

            <Card>
                <CardHeader>
                    <CardTitle>Manual Transaction Override</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Gateway Reference</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. SCH-5-1234567890"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={handleVerify}
                            disabled={loading}
                            className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {loadingAction === 'requery' && <Loader2 className="w-4 h-4 animate-spin" />}
                            API Re-query (Normal)
                        </button>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button 
                                onClick={() => handleForce('paid')}
                                disabled={loading}
                                className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex justify-center items-center gap-2 text-sm"
                            >
                                {loadingAction === 'paid' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Force Success
                            </button>
                            <button 
                                onClick={() => handleForce('reverse')}
                                disabled={loading}
                                className="w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex justify-center items-center gap-2 text-sm"
                            >
                                {loadingAction === 'reverse' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Force Reverse
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
