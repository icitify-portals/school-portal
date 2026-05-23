"use client";

import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

interface Props {
    question: any;
    updateQuestion: (updates: any) => void;
}

export function ShortAnswerEditor({ question, updateQuestion }: Props) {
    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accepted Correct Answers</label>
                <Input
                    placeholder="Enter main answer..."
                    className="h-12 rounded-xl border-slate-200 font-bold text-lg"
                    value={question.correct}
                    onChange={e => updateQuestion({ correct: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 font-medium italic mt-2">
                    Separate alternative correct answers with commas (e.g. "AI, Artificial Intelligence, A.I.")
                </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Auto-Grading Logic</p>
                    <p className="text-[11px] text-blue-700 font-medium">
                        Student input will be compared against these variants. Matching is case-insensitive by default.
                    </p>
                </div>
            </div>
        </div>
    );
}
