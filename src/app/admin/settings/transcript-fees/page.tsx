"use client";

import { useState, useEffect } from "react";
import { getSystemSettings, updateSystemSetting } from "@/actions/system-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, FileText } from "lucide-react";

export default function TranscriptFeesSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [transcriptFee, setTranscriptFee] = useState("15000");
    const [processingFee, setProcessingFee] = useState("5000");

    useEffect(() => {
        getSystemSettings().then(res => {
            const tFee = res.find(r => r.key === 'transcript_fee')?.value;
            const pFee = res.find(r => r.key === 'transcript_processing_fee')?.value;
            if (tFee) setTranscriptFee(tFee);
            if (pFee) setProcessingFee(pFee);
            setLoading(false);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateSystemSetting('transcript_fee', transcriptFee.toString());
            await updateSystemSetting('transcript_processing_fee', processingFee.toString());
            toast.success("Transcript fees updated successfully");
        } catch (error) {
            toast.error("Failed to update fees");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-8 h-8 text-indigo-600" />
                        Transcript & Processing Fees
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Configure the fees charged to external applicants for ordering transcripts.</p>
                </div>
            </div>

            <Card className="max-w-2xl border-none shadow-xl shadow-slate-200/50">
                <CardHeader className="bg-white border-b border-slate-100 rounded-t-xl">
                    <CardTitle className="text-lg font-black text-slate-800">Fee Configuration</CardTitle>
                    <CardDescription>If set to 0, that payment step will be bypassed.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-white rounded-b-xl">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="tfee" className="text-sm font-bold text-slate-700">Transcript Fee (₦)</Label>
                            <Input 
                                id="tfee"
                                type="number" 
                                value={transcriptFee} 
                                onChange={(e) => setTranscriptFee(e.target.value)}
                                className="bg-slate-50 border-slate-200 font-medium"
                                required
                                min="0"
                            />
                            <p className="text-xs text-slate-500">Processed via ALATPay. E.g. 15000</p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="pfee" className="text-sm font-bold text-slate-700">Processing Fee (₦)</Label>
                            <Input 
                                id="pfee"
                                type="number" 
                                value={processingFee} 
                                onChange={(e) => setProcessingFee(e.target.value)}
                                className="bg-slate-50 border-slate-200 font-medium"
                                required
                                min="0"
                            />
                            <p className="text-xs text-slate-500">Processed via Paystack. E.g. 5000</p>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8">
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
