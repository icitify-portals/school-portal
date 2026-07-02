"use client";

import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPendingTransfersForStaff, processTransferApproval, finalizeTransfer } from "@/actions/transfers";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, ChevronRight, User, School, ArrowRight } from "lucide-react";

export default function AdminTransfersPage() {
    const [transfers, setTransfers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransfers();
    }, []);

    async function loadTransfers() {
        setLoading(true);
        const data = await getPendingTransfersForStaff(1); // User ID mock
        setTransfers(data as any[]);
        setLoading(false);
    }

    const handleApprove = async (id: number, stage: any) => {
        const status = stage === 'admissions' ? 'eligible' : 
                      stage.includes('hod') ? 'accepted' : 'accepted'; // Simplify
        const res = await processTransferApproval(id, stage, status as any);
        if (res.success) {
            toast.success("Signature recorded successfully");
            loadTransfers();
        }
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Transfer Approvals</h1>
                <p className="text-slate-500 font-medium">Manage and process student course change applications</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {transfers.map((transfer) => (
                    <Card key={transfer.id} className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                    <User className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">{transfer.student.firstName} {transfer.student.lastName}</CardTitle>
                                    <p className="text-sm font-medium text-slate-400">Matric: {transfer.matricNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className={`rounded-xl px-4 py-1 font-bold tracking-wider uppercase text-[10px] ${
                                    transfer.finalStatus === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                    {transfer.finalStatus}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Movement</h4>
                                <div className="flex items-center gap-3">
                                    <div className="text-sm">
                                        <p className="font-bold text-slate-900">{transfer.currentDept.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{transfer.currentFaculty.name}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-300" />
                                    <div className="text-sm">
                                        <p className="font-bold text-indigo-600">{transfer.proposedDept.name}</p>
                                        <p className="text-[10px] text-indigo-400 font-bold">{transfer.proposedFaculty.name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Digital Workflow Progress</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <WorkflowStage 
                                        label="Admissions" 
                                        status={transfer.admissionsOfficerStatus} 
                                        onApprove={() => handleApprove(transfer.id, 'admissions')} 
                                    />
                                    <WorkflowStage 
                                        label="Present HOD" 
                                        status={transfer.presentHodStatus} 
                                        onApprove={() => handleApprove(transfer.id, 'present_hod')} 
                                    />
                                    <WorkflowStage 
                                        label="Present Dean" 
                                        status={transfer.presentDeanStatus} 
                                        onApprove={() => handleApprove(transfer.id, 'present_dean')} 
                                    />
                                    <WorkflowStage 
                                        label="Proposed HOD" 
                                        status={transfer.proposedHodStatus} 
                                        onApprove={() => handleApprove(transfer.id, 'proposed_hod')} 
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-3 flex justify-end pt-4 border-t border-slate-50">
                                {transfer.proposedDeanStatus === 'accepted' && transfer.finalStatus !== 'completed' && (
                                    <Button 
                                        onClick={() => finalizeTransfer(transfer.id)}
                                        className="bg-green-600 hover:bg-green-700 rounded-2xl px-8 font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Effect Changes System-wide
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function WorkflowStage({ label, status, onApprove }: { label: string, status: string, onApprove: () => void }) {
    const isPending = status === 'pending';
    const isApproved = status === 'eligible' || status === 'accepted' || status === 'agreed' || status === 'satisfied';
    
    return (
        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase text-slate-400">{label}</span>
            <div className="flex items-center justify-between mt-1">
                {isApproved ? (
                    <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Signed
                    </div>
                ) : isPending ? (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onApprove}
                        className="h-7 text-[9px] font-black tracking-tight rounded-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                        Sign Now
                    </Button>
                ) : (
                    <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs">
                        <XCircle className="h-3.5 w-3.5" /> Rejected
                    </div>
                )}
            </div>
        </div>
    );
}
