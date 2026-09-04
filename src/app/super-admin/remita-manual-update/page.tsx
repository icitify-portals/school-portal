"use client";
import { useState } from "react";
import { processManualAdmissionPayment } from "@/actions/manual-update";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function RemitaManualUpdatePage() {
    const [reference, setReference] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!reference) return toast.error("Please enter a reference");
        setLoading(true);
        const res = await processManualAdmissionPayment(reference.trim());
        if (res.success) {
            toast.success(res.message);
            setReference("");
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-xl mx-auto space-y-6 mt-10">
            <h1 className="text-3xl font-black text-slate-900">Developer Gateway Tools</h1>
            <p className="text-slate-500">Manually re-query pending transactions from Remita or ALATPay.</p>

            <Card>
                <CardHeader>
                    <CardTitle>Manual Transaction Re-query</CardTitle>
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
                    <button 
                        onClick={handleVerify}
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Re-query Transaction
                    </button>
                </CardContent>
            </Card>
        </div>
    );
}
