"use client";

import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Props {
    question: any;
    updateQuestion: (updates: any) => void;
}

export function MultipleChoiceEditor({ question, updateQuestion }: Props) {
    const options = question.options || ["", "", "", ""];

    const updateOption = (idx: number, val: string) => {
        const newOpts = [...options];
        newOpts[idx] = val;
        updateQuestion({ options: newOpts });
    };

    const addOption = () => {
        updateQuestion({ options: [...options, ""] });
    };

    const removeOption = (idx: number) => {
        if (options.length <= 2) return;
        const newOpts = options.filter((_: any, i: number) => i !== idx);
        updateQuestion({ options: newOpts });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Options & Correct Answer</label>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={addOption}
                    className="h-7 text-[9px] font-black uppercase text-indigo-600 hover:bg-indigo-50"
                >
                    <Plus className="w-3 h-3 mr-1" /> Add Option
                </Button>
            </div>

            <div className="space-y-4">
                {options.map((opt: string, idx: number) => (
                    <div key={idx} className="flex gap-4 items-start group/opt">
                        <div className="pt-2">
                            <input
                                type="radio"
                                name={`correct-${question.id}`}
                                className="w-5 h-5 accent-emerald-500 cursor-pointer"
                                checked={question.correct === opt}
                                onChange={() => updateQuestion({ correct: opt })}
                            />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 mt-1">
                            {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="flex-1">
                            <RichTextEditor
                                content={opt}
                                onChange={val => updateOption(idx, val)}
                                placeholder={`Option ${idx + 1}`}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(idx)}
                            disabled={options.length <= 2}
                            className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-opacity mt-1"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Preview Selection</p>
                <p className="text-xs font-medium text-emerald-600">
                    Correct Answer: <span className="font-bold underline">{question.correct ? `Option ${String.fromCharCode(65 + options.indexOf(question.correct))}` : "None selected"}</span>
                </p>
            </div>
        </div>
    );
}
