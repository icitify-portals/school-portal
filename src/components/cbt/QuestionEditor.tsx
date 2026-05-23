"use client";

import { MultipleChoiceEditor } from "./editors/MultipleChoiceEditor";
import { TrueFalseEditor } from "./editors/TrueFalseEditor";
import { ShortAnswerEditor } from "./editors/ShortAnswerEditor";
import { MatchingEditor } from "./editors/MatchingEditor";
import { NumericalEditor } from "./editors/NumericalEditor";
import { EssayEditor } from "./editors/EssayEditor";
import { OrderingEditor } from "./editors/OrderingEditor";
import { HotspotEditor } from "./editors/HotspotEditor";
import { RichTextEditor } from "../RichTextEditor";
import { FileEdit, Sparkles } from "lucide-react";

interface QuestionEditorProps {
    question: any;
    updateQuestion: (id: number, updates: any) => void;
}

export function QuestionEditor({ question, updateQuestion }: QuestionEditorProps) {
    const handleUpdate = (updates: any) => {
        updateQuestion(question.id, updates);
    };

    const renderSpecializedEditor = () => {
        switch (question.type) {
            case "multiple_choice":
                return <MultipleChoiceEditor question={question} updateQuestion={handleUpdate} />;
            case "true_false":
                return <TrueFalseEditor question={question} updateQuestion={handleUpdate} />;
            case "short_answer":
                return <ShortAnswerEditor question={question} updateQuestion={handleUpdate} />;
            case "matching":
                return <MatchingEditor question={question} updateQuestion={handleUpdate} />;
            case "numerical":
                return <NumericalEditor question={question} updateQuestion={handleUpdate} />;
            case "essay":
                return <EssayEditor question={question} updateQuestion={handleUpdate} />;
            case "ordering":
                return <OrderingEditor question={question} updateQuestion={handleUpdate} />;
            case "hotspot":
                return <HotspotEditor question={question} updateQuestion={handleUpdate} />;
            default:
                return <div className="p-8 text-center text-slate-400 font-medium">Unknown question type selection</div>;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Primary Question Text</label>
                <RichTextEditor
                    content={question.text}
                    onChange={val => handleUpdate({ text: val })}
                    placeholder="Enter your question prompt here..."
                />
            </div>

            <div className="pt-4 border-t border-slate-50">
                {renderSpecializedEditor()}
            </div>
        </div>
    );
}
