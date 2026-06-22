"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { createGradingRubric } from "@/actions/lms";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CriterionLevel {
    label: string;
    points: number;
    description?: string;
}

interface Criterion {
    id: string; // Temporary UI ID
    title: string;
    description?: string;
    weight: number;
    levels: CriterionLevel[];
}

export default function RubricEditor({ courseId }: { courseId?: number }) {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [criteria, setCriteria] = useState<Criterion[]>([
        {
            id: "1",
            title: "Performance",
            weight: 20,
            levels: [
                { label: "Excellent", points: 20, description: "Exceptional work" },
                { label: "Good", points: 15, description: "Solid work" },
                { label: "Fair", points: 10, description: "Basic requirements met" },
                { label: "Poor", points: 5, description: "Major deficiencies" }
            ]
        }
    ]);
    const [saving, setSaving] = useState(false);

    const addCriterion = () => {
        setCriteria([...criteria, {
            id: Math.random().toString(36).substr(2, 9),
            title: "New Criterion",
            weight: 10,
            levels: [
                { label: "Excellent", points: 10 },
                { label: "Poor", points: 0 }
            ]
        }]);
    };

    const removeCriterion = (id: string) => {
        setCriteria(criteria.filter(c => c.id !== id));
    };

    const updateCriterion = (id: string, field: keyof Criterion, value: any) => {
        setCriteria(criteria.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const addLevel = (critId: string) => {
        setCriteria(criteria.map(c => c.id === critId ? {
            ...c,
            levels: [...c.levels, { label: "New Level", points: 0 }]
        } : c));
    };

    const updateLevel = (critId: string, index: number, field: keyof CriterionLevel, value: any) => {
        setCriteria(criteria.map(c => c.id === critId ? {
            ...c,
            levels: c.levels.map((l, i) => i === index ? { ...l, [field]: value } : l)
        } : c));
    };

    const removeLevel = (critId: string, index: number) => {
        setCriteria(criteria.map(c => c.id === critId ? {
            ...c,
            levels: c.levels.filter((_, i) => i !== index)
        } : c));
    };

    const handleSave = async () => {
        if (!title) return toast.error("Rubric title is required");
        if (criteria.length === 0) return toast.error("At least one criterion is required");

        setSaving(true);
        try {
            const res = await createGradingRubric({
                title,
                description,
                courseId,
                criteria: criteria.map((c, i) => ({
                    title: c.title,
                    weight: c.weight,
                    levels: c.levels,
                    order: i
                }))
            });

            if (res.success) {
                toast.success("Rubric created successfully!");
                router.push("/staff/grading/rubrics");
            } else {
                toast.error((res as any).error || "Failed to save rubric");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
        setSaving(false);
    };

    return (
        <div className="max-w-[1600px] w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-sm p-4 rounded-xl z-20 shadow-sm border border-slate-200/50">
                <div className="flex-1 mr-8">
                    <Input
                        placeholder="Rubric Title (e.g., Essay Assessment)"
                        className="text-2xl h-14 font-black bg-transparent border-none focus:ring-0 px-0 placeholder:text-slate-300"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 font-bold shadow-lg shadow-indigo-100">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Creating..." : "Save Rubric"}
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 py-4">
                    <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-none">Global Metadata</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">Contextual Description</Label>
                        <Textarea
                            placeholder="Describe how this rubric should be used..."
                            className="bg-slate-50 border-none focus:ring-2 focus:ring-indigo-100"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tighter uppercase">
                        Definition of Criteria
                        <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">{criteria.length}</span>
                    </h2>
                    <Button onClick={addCriterion} variant="outline" className="text-xs font-bold uppercase tracking-wider h-9 gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                        <Plus className="w-3.5 h-3.5" />
                        Add Criterion
                    </Button>
                </div>

                {criteria.map((crit, cIdx) => (
                    <Card key={crit.id} className="border-2 border-slate-100 group hover:border-indigo-100 transition-all shadow-sm">
                        <div className="p-6">
                            <div className="flex gap-6 mb-8">
                                <div className="flex-1 space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Criterion Title</Label>
                                        <Input
                                            value={crit.title}
                                            onChange={(e) => updateCriterion(crit.id, 'title', e.target.value)}
                                            className="font-bold text-lg h-12 border-none bg-slate-50 focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description / Goal</Label>
                                        <Input
                                            value={crit.description || ""}
                                            onChange={(e) => updateCriterion(crit.id, 'description', e.target.value)}
                                            className="text-xs border-none bg-slate-50/50 focus:ring-2 focus:ring-indigo-50"
                                            placeholder="What exactly are you measuring here?"
                                        />
                                    </div>
                                </div>
                                <div className="w-32 space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Max Pts</Label>
                                        <Input
                                            type="number"
                                            value={crit.weight}
                                            onChange={(e) => updateCriterion(crit.id, 'weight', parseInt(e.target.value) || 0)}
                                            className="h-12 text-xl font-bold text-center border-none bg-indigo-50 text-indigo-700"
                                        />
                                    </div>
                                    <Button onClick={() => removeCriterion(crit.id)} variant="ghost" className="w-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 h-10">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">Performance Levels & Descriptors</Label>
                                    <Button onClick={() => addLevel(crit.id)} variant="ghost" size="sm" className="text-[10px] font-black uppercase text-indigo-500 hover:bg-indigo-50 px-2 h-7">
                                        <Plus className="w-3 h-3 mr-1" /> Add Level
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {crit.levels.map((lvl, lIdx) => (
                                        <div key={lIdx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 relative group/lvl transition-all hover:bg-white hover:shadow-md hover:border-indigo-100">
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <Input
                                                        value={lvl.label}
                                                        onChange={(e) => updateLevel(crit.id, lIdx, 'label', e.target.value)}
                                                        className="h-7 text-[11px] font-bold border-none bg-white shadow-sm focus:ring-2 focus:ring-indigo-100"
                                                        placeholder="Label"
                                                    />
                                                </div>
                                                <div className="w-16">
                                                    <Input
                                                        type="number"
                                                        value={lvl.points}
                                                        onChange={(e) => updateLevel(crit.id, lIdx, 'points', parseInt(e.target.value) || 0)}
                                                        className="h-7 text-[11px] font-bold text-center border-none bg-indigo-600 text-white shadow-lg"
                                                    />
                                                </div>
                                            </div>
                                            <Textarea
                                                value={lvl.description}
                                                onChange={(e) => updateLevel(crit.id, lIdx, 'description', e.target.value)}
                                                className="text-[10px] min-h-[60px] p-2 bg-transparent border-dashed border-slate-200 focus:border-indigo-200 transition-all"
                                                placeholder="Level description..."
                                            />
                                            <button
                                                onClick={() => removeLevel(crit.id, lIdx)}
                                                className="absolute -top-1 -right-1 h-5 w-5 bg-white rounded-full border border-slate-200 flex items-center justify-center text-slate-300 hover:text-rose-500 opacity-0 group-hover/lvl:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex justify-center pb-12">
                <Button onClick={addCriterion} variant="ghost" className="h-16 w-full border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600 text-slate-400 font-bold text-lg transition-all gap-4">
                    <Plus className="w-6 h-6" />
                    Expand Evaluation Scope (Add Criterion)
                </Button>
            </div>
        </div>
    );
}
