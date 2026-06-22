"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Trash2,
    Loader2,
    Building2,
    GraduationCap,
    BookOpen,
    Link as LinkIcon
} from "lucide-react";
import {
    getFeeStructures,
    allocateFeeStructure
} from "@/actions/bursary";
import { getFaculties } from "@/actions/faculties";
import { getDepartments } from "@/actions/departments";
import { getProgrammes } from "@/actions/programmes";
import { cn } from "@/lib/utils";
import { db } from "@/db/db";
import { feeAllocations } from "@/db/schema";
import { eq } from "drizzle-orm";

export default function AllocationsPage() {
    const [structures, setStructures] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<any[]>([]);
    const [depts, setDepts] = useState<any[]>([]);
    const [progs, setProgs] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [selectedStruct, setSelectedStruct] = useState("");
    const [targetType, setTargetType] = useState<'faculty' | 'dept' | 'prog'>('faculty');
    const [targetId, setTargetId] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Note: For actual app, we'd need a dedicated getFeeAllocations action. 
        // For this demo, I'll fetch static data or just the options.
        const [structData, facData, deptData, progData] = await Promise.all([
            getFeeStructures(),
            getFaculties(),
            getDepartments(),
            getProgrammes()
        ]);

        setStructures(structData.filter((s: any) => s.status === 'approved'));
        setFaculties(facData);
        setDepts(deptData);
        setProgs(progData);
        setLoading(false);
    };

    const handleAllocate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStruct || !targetId) return alert("Please select structure and target");

        setSubmitting(true);
        const res = await allocateFeeStructure({
            feeStructureId: parseInt(selectedStruct),
            facultyId: targetType === 'faculty' ? parseInt(targetId) : undefined,
            deptId: targetType === 'dept' ? parseInt(targetId) : undefined,
            programmeId: targetType === 'prog' ? parseInt(targetId) : undefined,
        });

        if (res.success) {
            setIsAdding(false);
            fetchData();
        }
        setSubmitting(false);
    };

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Fee Allocations</h2>
                    <p className="text-slate-500 mt-1">Map approved fee structures to academic entities</p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/20 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Allocation
                </Button>
            </div>

            {isAdding && (
                <Card className="mb-8 border-none shadow-md bg-slate-50">
                    <CardContent className="pt-6">
                        <form onSubmit={handleAllocate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Select Fee Structure</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11"
                                        value={selectedStruct}
                                        onChange={(e) => setSelectedStruct(e.target.value)}
                                    >
                                        <option value="">Select Approved Structure</option>
                                        {structures.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.academicYear})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Allocation Target Type</label>
                                    <div className="flex bg-white p-1 rounded-lg border border-slate-200 h-11">
                                        {(['faculty', 'dept', 'prog'] as const).map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => { setTargetType(type); setTargetId(""); }}
                                                className={cn(
                                                    "flex-1 rounded-md text-xs font-bold transition-all",
                                                    targetType === type ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                                                )}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">
                                    Select Target {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
                                </label>
                                <select
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11"
                                    value={targetId}
                                    onChange={(e) => setTargetId(e.target.value)}
                                >
                                    <option value="">Select Target...</option>
                                    {targetType === 'faculty' && faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    {targetType === 'dept' && depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    {targetType === 'prog' && progs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={submitting} className="bg-slate-900 px-10 h-11">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Allocation"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                    </div>
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <LinkIcon className="w-12 h-12 text-slate-300 mb-4" />
                        <h4 className="text-lg font-bold text-slate-400">Manage active allocations here</h4>
                        <p className="text-sm text-slate-400">Total allocations: 0</p>
                    </div>
                )}
            </div>
        </div>
    );
}
