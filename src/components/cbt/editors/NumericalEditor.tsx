"use client";

import { Input } from "@/components/ui/input";
import { Target, Ruler } from "lucide-react";

interface Props {
    question: any;
    updateQuestion: (updates: any) => void;
}

export function NumericalEditor({ question, updateQuestion }: Props) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-3 h-3" /> Exact Correct Value
                    </label>
                    <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        className="h-12 rounded-xl border-slate-200 font-black text-lg"
                        value={question.correct}
                        onChange={e => updateQuestion({ correct: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Ruler className="w-3 h-3" /> Margin of Error (±)
                    </label>
                    <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        className="h-12 rounded-xl border-slate-200 font-black text-lg"
                        value={question.tolerance || "0"}
                        onChange={e => updateQuestion({ tolerance: e.target.value })}
                    />
                </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Student answers will be marked correct if they fall within the range:
                    <span className="font-bold text-slate-900 mx-2">
                        {(parseFloat(question.correct) - parseFloat(question.tolerance || "0")).toFixed(2)} - {(parseFloat(question.correct) + parseFloat(question.tolerance || "0")).toFixed(2)}
                    </span>
                </p>
            </div>
        </div>
    );
}
