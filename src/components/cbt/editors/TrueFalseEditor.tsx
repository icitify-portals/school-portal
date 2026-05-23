"use client";

import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    question: any;
    updateQuestion: (updates: any) => void;
}

export function TrueFalseEditor({ question, updateQuestion }: Props) {
    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Correct Answer</label>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => updateQuestion({ correct: 'true' })}
                    className={cn(
                        "flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all gap-3",
                        question.correct === 'true'
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg scale-[1.02]"
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                    )}
                >
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        question.correct === 'true' ? "bg-emerald-500 text-white" : "bg-slate-100"
                    )}>
                        <Check className="w-6 h-6" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm">True</span>
                </button>

                <button
                    onClick={() => updateQuestion({ correct: 'false' })}
                    className={cn(
                        "flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all gap-3",
                        question.correct === 'false'
                            ? "bg-red-50 border-red-500 text-red-700 shadow-lg scale-[1.02]"
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                    )}
                >
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        question.correct === 'false' ? "bg-red-500 text-white" : "bg-slate-100"
                    )}>
                        <X className="w-6 h-6" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm">False</span>
                </button>
            </div>
        </div>
    );
}
