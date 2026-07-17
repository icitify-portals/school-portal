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
    allocateFeeStructure,
    getFeeAllocations,
    deleteFeeAllocation
} from "@/actions/bursary";
import { getFaculties } from "@/actions/faculties";
import { getDepartments } from "@/actions/departments";
import { getProgrammes } from "@/actions/programmes";
import { cn } from "@/lib/utils";

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
        const [structData, facData, deptData, progData, allocData] = await Promise.all([
            getFeeStructures(),
            getFaculties(),
            getDepartments(),
            getProgrammes(),
            getFeeAllocations()
        ]);

        setStructures(structData.filter((s: any) => s.status === 'approved'));
        setFaculties(facData);
        setDepts(deptData);
        setProgs(progData);
        setAllocations(allocData);
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

    const handleDeleteAllocation = async (id: number) => {
        if (!confirm("Are you sure you want to delete this allocation?")) return;
        setLoading(true);
        const res = await deleteFeeAllocation(id);
        if (res.success) {
            fetchData();
        } else {
            alert(res.error || "Failed to delete allocation");
            setLoading(false);
        }
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
                <Card className="mb-8 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6 p-6">
                        <form onSubmit={handleAllocate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                    </div>
                ) : allocations.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <LinkIcon className="w-12 h-12 text-slate-300 mb-4" />
                        <h4 className="text-lg font-bold text-slate-400">No active allocations</h4>
                        <p className="text-sm text-slate-400">Map a fee structure to get started.</p>
                    </div>
                ) : (
                    allocations.map(alloc => {
                        const targetName = 
                            alloc.programmeId ? progs.find(p => p.id === alloc.programmeId)?.name :
                            alloc.deptId ? depts.find(d => d.id === alloc.deptId)?.name :
                            alloc.facultyId ? faculties.find(f => f.id === alloc.facultyId)?.name : "Unknown Target";
                            
                        const targetType = alloc.programmeId ? 'Programme' : alloc.deptId ? 'Department' : alloc.facultyId ? 'Faculty' : 'Global';

                        return (
                            <Card key={alloc.id} className="border border-slate-100 shadow-lg rounded-[2rem] hover:shadow-xl transition-shadow bg-white relative overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <LinkIcon className="w-5 h-5" />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDeleteAllocation(alloc.id)}
                                            className="text-slate-400 hover:text-red-500 rounded-full h-8 w-8"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <h4 className="font-bold text-slate-900 line-clamp-1" title={alloc.structure?.name}>
                                        {alloc.structure?.name || `Structure #${alloc.feeStructureId}`}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-medium mb-4">{alloc.structure?.academicYear || "Unknown Year"}</p>
                                    
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Target ({targetType})</p>
                                        <p className="text-sm font-semibold text-slate-700 line-clamp-1" title={targetName}>{targetName}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
