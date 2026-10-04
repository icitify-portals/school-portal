"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { bulkUpdateStudentPlacements } from "@/actions/students";
import { useBranch } from "@/providers/BranchProvider";

interface BulkPlacementModalProps {
    open: boolean;
    onClose: () => void;
    selectedStudentIds: number[];
    sessions: any[];
    onComplete: () => void;
}

export function BulkPlacementModal({ open, onClose, selectedStudentIds, sessions, onComplete }: BulkPlacementModalProps) {
    const { isK12 } = useBranch();
    const [loading, setLoading] = useState(false);
    
    const [currentLevel, setCurrentLevel] = useState("");
    const [status, setStatus] = useState("");
    const [currentSessionId, setCurrentSessionId] = useState("");
    const [admissionYear, setAdmissionYear] = useState("");

    const handleSave = async () => {
        setLoading(true);
        const data: any = {};
        if (currentLevel) data.currentLevel = Number(currentLevel);
        if (status) data.status = status;
        if (currentSessionId) data.currentSessionId = Number(currentSessionId);
        if (admissionYear) data.admissionYear = admissionYear;

        const res = await bulkUpdateStudentPlacements(selectedStudentIds, data);
        setLoading(false);

        if (res.success) {
            alert(res.message);
            onComplete();
            onClose();
        } else {
            alert(res.error);
        }
    };

    const levels = isK12 
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        : [
            { label: "ND 1", value: "1" },
            { label: "ND 2", value: "2" },
            { label: "HND 1", value: "1" },
            { label: "HND 2", value: "2" }
        ];

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="border-none shadow-2xl rounded-2xl bg-white max-w-md p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Bulk Academic Placement</DialogTitle>
                    <DialogDescription>
                        Update placement details for {selectedStudentIds.length} selected students. Leave fields empty if you don't want to change them.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase">Level (Integer)</label>
                        <select
                            value={currentLevel}
                            onChange={(e) => setCurrentLevel(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="">-- No Change --</option>
                            {isK12 ? levels.map((lvl) => (
                                <option key={lvl as number} value={lvl as number}>Grade {lvl}</option>
                            )) : (levels as {label:string, value:string}[]).map((lvl, idx) => (
                                <option key={idx} value={lvl.value}>{lvl.label} ({lvl.value})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="">-- No Change --</option>
                            <option value="active">Active</option>
                            <option value="nd_graduant">ND Graduant</option>
                            <option value="hnd_graduant">HND Graduant</option>
                            <option value="nd_graduated">ND Graduated</option>
                            <option value="hnd_graduated">HND Graduated</option>
                            <option value="withdrawn">Withdrawn</option>
                            <option value="suspended">Suspended</option>
                            <option value="rusticated">Rusticated</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase">Current Session</label>
                        <select
                            value={currentSessionId}
                            onChange={(e) => setCurrentSessionId(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="">-- No Change --</option>
                            {sessions.map((s) => (
                                <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase">Admission Year</label>
                        <input
                            type="text"
                            placeholder="e.g. 2026"
                            value={admissionYear}
                            onChange={(e) => setAdmissionYear(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 text-white hover:bg-indigo-700">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Apply Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
