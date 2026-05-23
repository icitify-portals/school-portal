"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getNelfundDisbursements, recordNelfundBatch, generateNelfundSvsExport } from "@/actions/bursary";
import { Landmark, Plus, Loader2, FileJson, History, ArrowUpRight } from "lucide-react";

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
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Landmark className="w-8 h-8 text-indigo-600" />
                        NELFUND Loan Administration
                    </h2>
                    <p className="text-slate-500 mt-1">Process government educational loans and track SVS verifications</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 border-indigo-200 text-indigo-700" onClick={handleExport} disabled={exporting}>
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />} Export SVS Data
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={() => setIsRecording(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Record Bulk TRSF
                    </Button>
                </div>
            </div>

            {isRecording && (
                <Card className="border border-indigo-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader className="bg-indigo-50 border-b border-indigo-100 py-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-800 flex items-center gap-2">
                            <FileJson className="w-4 h-4" />
                            Process NELFUND Disbursement Batch
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-indigo-900 font-bold">CBN / REMITA Batch Reference</Label>
                                <Input placeholder="e.g. NELF/2026/A4592" value={batchReference} onChange={e => setBatchReference(e.target.value)} className="border-indigo-100" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-indigo-900 font-bold">Total Batch Amount (₦)</Label>
                                <Input type="number" placeholder="5000000" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="border-indigo-100" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-indigo-900 font-bold">Date Received via TRSF</Label>
                                <Input type="date" value={disbursementDate} onChange={e => setDisbursementDate(e.target.value)} className="border-indigo-100" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-indigo-900 font-bold flex justify-between">
                                Beneficiary Allocations Payload
                                <span className="text-xs font-normal text-slate-500">(JSON Array Simulation)</span>
                            </Label>
                            <textarea
                                className="w-full h-48 p-3 rounded-lg border border-indigo-100 font-mono text-sm bg-slate-50 custom-scrollbar"
                                value={beneficiaryJson}
                                onChange={e => setBeneficiaryJson(e.target.value)}
                            />
                            <p className="text-xs text-indigo-600 font-medium">
                                * Note: In production, this JSON payload is generated by uploading the official NELFUND CSV remittance block.
                            </p>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                            <Button variant="outline" onClick={() => setIsRecording(false)}>Cancel Processing</Button>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 min-w-[200px]" onClick={handleRecordBatch} disabled={processingBatch}>
                                {processingBatch ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Reconcile Respective Ledgers"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
                <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">
                        Disbursement History
                    </CardTitle>
                    <History className="w-4 h-4 text-slate-400" />
                </CardHeader>
                <div className="divide-y divide-slate-100">
                    {disbursements.map((d) => (
                        <div key={d.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 items-center justify-center shrink-0">
                                    <Landmark className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-bold text-slate-900 uppercase">{d.batchReference}</h4>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                                            {d.status}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Received: {new Date(d.disbursementDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-slate-900">₦{parseFloat(d.totalAmount).toLocaleString()}</p>
                                <p className="text-xs text-slate-400 font-medium">Recorded by Admin</p>
                            </div>
                        </div>
                    ))}

                    {!loading && disbursements.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500">No NELFUND disbursements recorded yet.</p>
                        </div>
                    )}
                </div>
            </Card>

            {loading && <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 block my-10" />}
        </div>
    );
}
