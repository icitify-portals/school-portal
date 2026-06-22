"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, BrainCircuit } from "lucide-react";

interface RubricCriterion {
    id: string;
    label: string;
    description: string;
    maxPoints: number;
}

interface Props {
    rubric: string; // JSON string
    onChange: (rubric: string) => void;
}

export function RubricBuilder({ rubric, onChange }: Props) {
    const criteria: RubricCriterion[] = rubric ? JSON.parse(rubric) : [];

    const updateCriteria = (newCriteria: RubricCriterion[]) => {
        onChange(JSON.stringify(newCriteria));
    };

    const addCriterion = () => {
        const newCriterion: RubricCriterion = {
            id: Date.now().toString(),
            label: "",
            description: "",
            maxPoints: 5
        };
        updateCriteria([...criteria, newCriterion]);
    };

    const removeCriterion = (id: string) => {
        updateCriteria(criteria.filter(c => c.id !== id));
    };

    const updateItem = (id: string, updates: Partial<RubricCriterion>) => {
        updateCriteria(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <div>
                    <h4 className="text-xs font-black text-indigo-900 flex items-center gap-2 uppercase tracking-wide">
                        <BrainCircuit className="w-4 h-4 text-indigo-600" /> AI Grading Rubric
                    </h4>
                    <p className="text-[10px] text-indigo-700 font-medium">Define clear criteria to guide the AI's grading logic.</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={addCriterion}
                    className="h-8 bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold uppercase text-[9px]"
                >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Criterion
                </Button>
            </div>

            <div className="space-y-3">
                {criteria.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 group animate-in slide-in-from-right-1">
                        <div className="flex gap-4 items-start">
                            <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-3">
                                        <Input
                                            placeholder="Criterion Name (e.g. Grammar, Content Depth)"
                                            className="h-9 rounded-xl border-slate-200 font-bold text-xs"
                                            value={c.label}
                                            onChange={(e) => updateItem(c.id, { label: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Input
                                            type="number"
                                            placeholder="Pts"
                                            className="h-9 rounded-xl border-slate-200 font-black text-xs text-center"
                                            value={c.maxPoints}
                                            onChange={(e) => updateItem(c.id, { maxPoints: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <Textarea
                                    placeholder="Explain what the student must do to get full points..."
                                    className="min-h-[60px] rounded-xl border-slate-100 text-[11px] font-medium"
                                    value={c.description}
                                    onChange={(e) => updateItem(c.id, { description: e.target.value })}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCriterion(c.id)}
                                className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {criteria.length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No criteria defined</p>
                </div>
            )}
        </div>
    );
}
