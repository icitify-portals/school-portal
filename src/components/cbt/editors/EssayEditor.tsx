"use client";

import { RubricBuilder } from "../RubricBuilder";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

interface Props {
    question: any;
    updateQuestion: (updates: any) => void;
}

export function EssayEditor({ question, updateQuestion }: Props) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest">AI-Assist Grading</p>
                        <p className="text-[10px] text-slate-300 font-medium">Automatic evaluation based on criteria</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-[10px] uppercase font-black text-slate-400">Enabled</Label>
                    <Switch
                        checked={question.aiGradingEnabled}
                        onCheckedChange={(val) => updateQuestion({ aiGradingEnabled: val })}
                    />
                </div>
            </div>

            {question.aiGradingEnabled && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <RubricBuilder
                        rubric={question.rubric}
                        onChange={(val) => updateQuestion({ rubric: val })}
                    />
                </div>
            )}

            {!question.aiGradingEnabled && (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl border-dashed">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                        AI Grading is currently disabled.<br />
                        Questions will require manual manual score entry by teachers.
                    </p>
                </div>
            )}
        </div>
    );
}
