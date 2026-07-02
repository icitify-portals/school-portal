"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getNelfundDisbursements, recordNelfundBatch, generateNelfundSvsExport } from "@/actions/bursary";
import { Landmark, Plus, Loader2, FileJson, History, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NelfundPage() {
    const [disbursements, setDisbursements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [processingBatch, setProcessingBatch] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Form state (New Disbursement Batch)
    const [batchReference, setBatchReference] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [disbursementDate, setDisbursementDate] = useState("");

    // Beneficiary JSON for demo simplicity
    // In production, this would be a CSV upload parsed by Papaparse
    const [beneficiaryJson, setBeneficiaryJson] = useState("[\n  {\n    \"studentId\": 1,\n    \"institutionFeeAmount\": \"150000\",\n    \"upkeepAmount\": \"20000\"\n  }\n]");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getNelfundDisbursements();
        setDisbursements(data);
        setLoading(false);
    };

    const handleRecordBatch = async () => {
        try {
            setProcessingBatch(true);
            const parsedBeneficiaries = JSON.parse(beneficiaryJson);

            // Map the parsed JSON to ensure it matches the expected type
            const beneficiaries = parsedBeneficiaries.map((b: any) => ({
                studentId: b.studentId,
                amount: (parseFloat(b.institutionFeeAmount || "0") + parseFloat(b.upkeepAmount || "0")).toString(),
                institutionFeeAmount: b.institutionFeeAmount,
                upkeepAmount: b.upkeepAmount
            }));

            // Validate total
            const calcTotal = beneficiaries.reduce((sum: number, b: any) => sum + parseFloat(b.amount), 0);
            if (Math.abs(calcTotal - parseFloat(totalAmount)) > 1) { // Allowing 1 naira tolerance
                alert(`Total amount mismatch. Beneficiaries total ₦${calcTotal.toLocaleString()}, but Batch Total is ₦${parseFloat(totalAmount).toLocaleString()}`);
                setProcessingBatch(false);
                return;
            }

            const res = await recordNelfundBatch({
                batchReference,
                totalAmount,
                disbursementDate: new Date(disbursementDate),
                recordedBy: 1, // System override or fetch from session
                beneficiaries
            });

            if (res.success) {
                setIsRecording(false);
                setBatchReference("");
                setTotalAmount("");
                fetchData();
            } else {
                alert(res.error);
            }
        } catch (error) {
            alert("Invalid Beneficiary JSON format. Please check the structure.");
        } finally {
            setProcessingBatch(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        const res = await generateNelfundSvsExport();
        setExporting(false);
        if (res.success && res.csv) {
            const blob = new Blob([res.csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SVS_Verification_Export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            alert(res.error || "Export failed");
        }
    };

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-650/30 to-slate-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Landmark className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        NELFUND Administration
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Process government educational loans and track SVS verifications
                </p>
            </div>
            
            <div className="relative z-10 flex gap-4 w-full md:w-auto shrink-0 flex-wrap">
                <Button 
                    variant="outline" 
                    className="h-12 px-6 rounded-[1.5rem] font-black uppercase text-xs tracking-wider border-white/20 text-white bg-white/10 hover:bg-white hover:text-slate-900 transition-all gap-2"
                    onClick={handleExport} 
                    disabled={exporting}
                >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />} Export SVS Data
                </Button>
                <Button 
                    className="bg-indigo-650 hover:bg-indigo-700 text-white px-8 py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all gap-2"
                    onClick={() => setIsRecording(true)}
                >
                    <Plus className="w-4 h-4" /> Record Bulk TRSF
                </Button>
            </div>
        </div>

        {isRecording && (
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden animate-in slide-in-from-top-8 duration-500">
                <CardHeader className="p-8 lg:p-10 border-b border-white/40 bg-white/40">
                    <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight uppercase flex items-center gap-3">
                        <FileJson className="w-6 h-6 text-indigo-600" />
                        Process NELFUND Disbursement Batch
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 lg:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">CBN / REMITA Batch Reference</Label>
                            <Input placeholder="e.g. NELF/2026/A4592" value={batchReference} onChange={e => setBatchReference(e.target.value)} className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Total Batch Amount (₦)</Label>
                            <Input type="number" placeholder="5000000" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Date Received via TRSF</Label>
                            <Input type="date" value={disbursementDate} onChange={e => setDisbursementDate(e.target.value)} className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2 flex justify-between">
                            <span>Beneficiary Allocations Payload</span>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">(JSON Array)</span>
                        </Label>
                        <textarea
                            className="w-full h-48 p-4 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white outline-none font-mono text-xs font-bold transition-all shadow-inner text-slate-800 custom-scrollbar"
                            value={beneficiaryJson}
                            onChange={e => setBeneficiaryJson(e.target.value)}
                        />
                        <p className="text-[10px] text-indigo-650 font-black uppercase tracking-wider pl-2">
                            * Payload generated by uploading the official NELFUND CSV remittance block.
                        </p>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-white/40">
                        <Button variant="outline" className="rounded-xl font-bold uppercase text-xs tracking-wider" onClick={() => setIsRecording(false)}>Cancel Processing</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-xs tracking-wider min-w-[200px]" onClick={handleRecordBatch} disabled={processingBatch}>
                            {processingBatch ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Reconcile Respective Ledgers"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 lg:p-10 border-b border-white/40 bg-white/40 flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">
                    Disbursement History
                </CardTitle>
                <History className="w-6 h-6 text-slate-400" />
            </CardHeader>
            <div className="divide-y divide-white/40 bg-white/20">
                {disbursements.map((d) => (
                    <div key={d.id} className="p-8 flex items-center justify-between hover:bg-white/40 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex w-14 h-14 bg-indigo-600/90 border border-indigo-500/50 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-indigo-500/10 shrink-0">
                                <Landmark className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <h4 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{d.batchReference}</h4>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm">
                                        {d.status}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-slate-500">
                                    Received: {new Date(d.disbursementDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-slate-800">₦{parseFloat(d.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">Recorded by Admin</p>
                        </div>
                    </div>
                ))}

                {!loading && disbursements.length === 0 && (
                    <div className="text-center py-16 text-slate-500 font-bold uppercase tracking-widest text-xs">No NELFUND disbursements recorded yet.</div>
                )}
            </div>
        </Card>

        {loading && <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600 block my-10" />}
      </div>
    </div>
    );
}
