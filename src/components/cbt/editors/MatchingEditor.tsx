"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowRightLeft } from "lucide-react";

interface Props {
    question: any;
    updateQuestion: (updates: any) => void;
}

export function MatchingEditor({ question, updateQuestion }: Props) {
    const pairs = question.matching || [{ key: "", val: "" }];

    const updatePair = (idx: number, updates: any) => {
        const newPairs = [...pairs];
        newPairs[idx] = { ...newPairs[idx], ...updates };
        updateQuestion({ matching: newPairs });
    };

    const addPair = () => {
        updateQuestion({ matching: [...pairs, { key: "", val: "" }] });
    };

    const removePair = (idx: number) => {
        if (pairs.length <= 1) return;
        const newPairs = pairs.filter((_: any, i: number) => i !== idx);
        updateQuestion({ matching: newPairs });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matching Key-Value Pairs</label>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={addPair}
                    className="h-7 text-[9px] font-black uppercase text-indigo-600 hover:bg-indigo-50"
                >
                    <Plus className="w-3 h-3 mr-1" /> Add Pair
                </Button>
            </div>

            <div className="space-y-3">
                {pairs.map((pair: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center group/pair bg-slate-50/50 p-3 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                            {idx + 1}
                        </div>
                        <div className="flex-1">
                            <Input
                                placeholder="Term / Prompt"
                                className="h-10 border-slate-100 rounded-xl font-bold text-xs"
                                value={pair.key}
                                onChange={e => updatePair(idx, { key: e.target.value })}
                            />
                        </div>
                        <ArrowRightLeft className="w-4 h-4 text-slate-300" />
                        <div className="flex-1">
                            <Input
                                placeholder="Matching Target"
                                className="h-10 border-slate-100 rounded-xl font-bold text-xs"
                                value={pair.val}
                                onChange={e => updatePair(idx, { val: e.target.value })}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePair(idx)}
                            disabled={pairs.length <= 1}
                            className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover/pair:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-slate-400 font-medium italic">
                Tips: Students will see prompts on one side and a dropdown/draggable targets on the other.
            </p>
        </div>
    );
}
