"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings2, Plus, Trash2, Save, Columns, FileSpreadsheet } from "lucide-react";
import { getReportCardRubrics, saveReportCardRubric, deleteReportCardRubric } from "@/actions/rubrics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ReportCardRubricsPage() {
    const [rubrics, setRubrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRubric, setSelectedRubric] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newRubric, setNewRubric] = useState({ name: "", isMidTerm: false, columnsConfig: [] as any[] });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await getReportCardRubrics();
        setRubrics(data);
        if (data.length > 0 && !selectedRubric) {
            setSelectedRubric(data[0]);
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!newRubric.name) return toast.error("Name is required");
        const res = await saveReportCardRubric(newRubric);
        if (res.success) {
            toast.success("Rubric created");
            setIsCreating(false);
            setNewRubric({ name: "", isMidTerm: false, columnsConfig: [] });
            loadData();
        }
    };

    const handleSaveColumns = async () => {
        if (!selectedRubric) return;
        const res = await saveReportCardRubric(selectedRubric);
        if (res.success) toast.success("Columns saved");
        else toast.error("Failed to save");
    };

    const addColumn = () => {
        const id = "col_" + Date.now();
        setSelectedRubric({
            ...selectedRubric,
            columnsConfig: [...(selectedRubric.columnsConfig || []), { id, name: "New Column", maxScore: 20 }]
        });
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Loading Rubrics...</div>;

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 pb-20">
            <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic uppercase tracking-tight">
                        <FileSpreadsheet className="w-12 h-12 text-indigo-600" />
                        Report Card Rubrics
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Dynamic layout configuration for End-of-Term and Mid-Term reports</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-7 rounded-2xl shadow-2xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex gap-3 uppercase text-xs tracking-widest"
                    >
                        <Plus className="w-5 h-5" /> New Layout
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Available Layouts</h3>
                    {rubrics.map(rubric => (
                        <button
                            key={rubric.id}
                            onClick={() => setSelectedRubric(rubric)}
                            className={cn(
                                "w-full text-left p-6 rounded-2xl transition-all group flex flex-col gap-2 relative overflow-hidden",
                                selectedRubric?.id === rubric.id
                                    ? "bg-slate-900 text-white shadow-2xl scale-105 z-10"
                                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-black italic uppercase text-sm tracking-tight">{rubric.name}</span>
                                {rubric.isMidTerm && (
                                    <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-300">
                                        MID
                                    </span>
                                )}
                            </div>
                            <p className={cn("text-[9px] font-bold uppercase tracking-widest truncate",
                                selectedRubric?.id === rubric.id ? "text-white/40" : "text-slate-400"
                            )}>
                                {(rubric.columnsConfig || []).length} Columns configured
                            </p>
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-3">
                    {selectedRubric ? (
                        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-10 bg-slate-900 text-white flex flex-row justify-between items-center">
                                <div>
                                    <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Columns Config: {selectedRubric.name}</CardTitle>
                                    <p className="text-white/40 font-bold uppercase tracking-widest text-[9px] mt-1">Map continuous assessment max scores to columns</p>
                                </div>
                                <Button onClick={addColumn} variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl font-black uppercase text-[10px] tracking-widest px-6">
                                    <Plus className="w-4 h-4 mr-2" /> Add Column
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-50">
                                    {(selectedRubric.columnsConfig || []).map((col: any, i: number) => (
                                        <div key={i} className="p-8 flex items-center gap-8 group hover:bg-slate-50/50 transition-all">
                                            <div className="w-48 space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Column Internal ID</label>
                                                <Input
                                                    value={col.id}
                                                    onChange={e => {
                                                        const n = [...selectedRubric.columnsConfig];
                                                        n[i].id = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                                                        setSelectedRubric({ ...selectedRubric, columnsConfig: n });
                                                    }}
                                                    className="rounded-2xl border-slate-200 py-6 font-black text-slate-400 bg-slate-50"
                                                    placeholder="e.g. ca1"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Display Name</label>
                                                <Input
                                                    value={col.name}
                                                    onChange={e => {
                                                        const n = [...selectedRubric.columnsConfig];
                                                        n[i].name = e.target.value;
                                                        setSelectedRubric({ ...selectedRubric, columnsConfig: n });
                                                    }}
                                                    className="rounded-2xl border-slate-200 py-6 font-black italic uppercase tracking-tight"
                                                    placeholder="e.g. 1st CA"
                                                />
                                            </div>
                                            <div className="w-32 space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Max Marks</label>
                                                <Input
                                                    type="number"
                                                    value={col.maxScore}
                                                    onChange={e => {
                                                        const n = [...selectedRubric.columnsConfig];
                                                        n[i].maxScore = parseInt(e.target.value) || 0;
                                                        setSelectedRubric({ ...selectedRubric, columnsConfig: n });
                                                    }}
                                                    className="rounded-2xl border-slate-200 py-6 font-black text-indigo-600"
                                                />
                                            </div>
                                            <div className="w-32 space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Is Exam?</label>
                                                <div className="flex items-center h-full">
                                                    <Switch
                                                        checked={col.isExam}
                                                        onCheckedChange={v => {
                                                            const n = [...selectedRubric.columnsConfig];
                                                            n[i].isExam = v;
                                                            setSelectedRubric({ ...selectedRubric, columnsConfig: n });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    const n = selectedRubric.columnsConfig.filter((_: any, idx: number) => idx !== i);
                                                    setSelectedRubric({ ...selectedRubric, columnsConfig: n });
                                                }}
                                                variant="ghost"
                                                className="text-rose-500 hover:bg-rose-50 p-6 rounded-2xl mt-6"
                                            >
                                                <Trash2 className="w-6 h-6" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(selectedRubric.columnsConfig || []).length === 0 && (
                                        <div className="p-20 text-center opacity-40">
                                            <Columns className="w-16 h-16 mx-auto mb-4" />
                                            <p className="font-black italic uppercase text-slate-400">No columns defined</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Total Configured Marks:</span>
                                        <span className="text-xl font-black text-indigo-600">
                                            {(selectedRubric.columnsConfig || []).reduce((acc: number, cur: any) => acc + (cur.maxScore || 0), 0)}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={handleSaveColumns}
                                        className="bg-slate-900 hover:bg-slate-950 text-white font-black px-12 py-7 rounded-[1.5rem] shadow-2xl flex gap-3 uppercase text-xs tracking-widest"
                                    >
                                        <Save className="w-5 h-5" /> Commit Layout
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="p-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-6">
                            <div className="p-8 bg-slate-50 rounded-[2.5rem]">
                                <Settings2 className="w-20 h-20 text-slate-200" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-300 italic uppercase">Select or Define a Rubric</h3>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isCreating && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[3rem] overflow-hidden">
                        <CardHeader className="p-10 bg-slate-900 text-white">
                            <CardTitle className="text-3xl font-black italic uppercase tracking-tight text-center">New Rubric Layout</CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Rubric Name</label>
                                <Input
                                    placeholder="e.g. Standard End-of-Term"
                                    value={newRubric.name}
                                    onChange={e => setNewRubric({ ...newRubric, name: e.target.value })}
                                    className="rounded-2xl border-slate-200 py-6 font-black uppercase italic"
                                />
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-2xl">
                                <Switch
                                    checked={newRubric.isMidTerm}
                                    onCheckedChange={v => setNewRubric({ ...newRubric, isMidTerm: v })}
                                />
                                <div>
                                    <h4 className="text-sm font-black uppercase italic text-slate-900">Mid-Term Layout</h4>
                                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Select if this is for mid-term reports</p>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <Button onClick={() => setIsCreating(false)} variant="ghost" className="flex-1 py-7 rounded-2xl font-black uppercase text-xs tracking-widest">Discard</Button>
                                <Button onClick={handleCreate} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-7 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Initialize</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
