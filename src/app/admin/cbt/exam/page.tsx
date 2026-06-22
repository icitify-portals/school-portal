"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Flag,
    Send,
    AlertCircle,
    CheckCircle2,
    Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/RichTextEditor";

export default function ExamInterface() {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(3600); // 60 mins
    const [flagged, setFlagged] = useState<number[]>([]);
    const [answers, setAnswers] = useState<any>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Mock questions for preview
    const questions = [
        { id: 1, text: "What is the capital of Nigeria?", type: "multiple_choice", options: ["Lagos", "Abuja", "Kano", "Ibadan"], points: 2 },
        { id: 2, text: "React is a backend framework.", type: "true_false", points: 1 },
        { id: 3, text: "Explain the concept of 'Virtual DOM' in detail.", type: "essay", points: 10 },
        { id: 4, text: "Match the following capitals with their countries.", type: "matching", pairs: ["France->Paris", "Italy->Rome"], points: 4 }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (isSubmitted) {
        return (
            <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-8 text-center">
                <div className="p-4 bg-emerald-100 rounded-full mb-6">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Examination Submitted</h1>
                <p className="text-slate-500 max-w-md">Your responses have been securely uploaded. You can now close this window or return to your dashboard.</p>
                <Button className="mt-8 rounded-xl bg-slate-900 px-8 py-6 font-black uppercase tracking-widest text-xs">Return to Dashboard</Button>
            </div>
        );
    }

    const currentQ = questions[currentIdx];

    return (
        <div className="fixed inset-0 bg-slate-50 z-[999] flex flex-col font-sans">
            {/* Header */}
            <header className="bg-slate-900 text-white p-4 md:px-8 flex justify-between items-center shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-tight">Main Semester Examination</h2>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">CSC 101: Intro to Computer Science</p>
                    </div>
                </div>

                <div className={cn(
                    "flex items-center gap-3 px-6 py-2 rounded-2xl border-2 transition-colors",
                    timeLeft < 300 ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" : "bg-white/10 border-white/20"
                )}>
                    <Clock className="w-5 h-5" />
                    <span className="text-xl font-black tabular-nums">{formatTime(timeLeft)}</span>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400">Candidate</p>
                        <p className="text-xs font-bold">JANE DOE (STU/24/001)</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700" />
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Side Navigation */}
                <aside className="w-80 bg-white border-r border-slate-200 hidden lg:flex flex-col">
                    <div className="p-6 border-b border-slate-50">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Question Map</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIdx(i)}
                                    className={cn(
                                        "w-full aspect-square rounded-lg text-xs font-black flex items-center justify-center transition-all border-2",
                                        currentIdx === i ? "bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg" :
                                            answers[i] ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                flagged.includes(i) ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                    "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300"
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
                            <div className="w-3 h-3 rounded bg-indigo-600" /> Current
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
                            <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-100" /> Answered
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
                            <div className="w-3 h-3 rounded bg-amber-50 border border-amber-100" /> Flagged
                        </div>
                    </div>
                </aside>

                {/* Question Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Question {currentIdx + 1} of {questions.length}</span>
                                <div
                                    className="prose prose-slate max-w-none mt-4 q-rich-content text-2xl"
                                    dangerouslySetInnerHTML={{ __html: currentQ.text }}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setFlagged(prev => prev.includes(currentIdx) ? prev.filter(x => x !== currentIdx) : [...prev, currentIdx]);
                                }}
                                className={cn("rounded-xl transition-colors", flagged.includes(currentIdx) ? "text-amber-600 bg-amber-50" : "text-slate-300 hover:text-amber-500")}
                            >
                                <Flag className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {currentQ.type === 'multiple_choice' && (
                                <div className="grid grid-cols-1 gap-3">
                                    {currentQ.options?.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setAnswers({ ...answers, [currentIdx]: i })}
                                            className={cn(
                                                "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all",
                                                answers[currentIdx] === i ? "bg-white border-indigo-600 shadow-md ring-4 ring-indigo-50" : "bg-white border-slate-100 hover:border-slate-300"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0",
                                                answers[currentIdx] === i ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <div
                                                className="text-slate-700 font-semibold prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: opt }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {currentQ.type === 'true_false' && (
                                <div className="grid grid-cols-2 gap-4">
                                    {['True', 'False'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setAnswers({ ...answers, [currentIdx]: opt })}
                                            className={cn(
                                                "p-8 rounded-2xl border-2 font-black uppercase tracking-widest transition-all",
                                                answers[currentIdx] === opt ? "bg-white border-indigo-600 shadow-lg ring-4 ring-indigo-50 text-indigo-600" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                                            )}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {currentQ.type === 'essay' && (
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Your Detailed Response</label>
                                    <RichTextEditor
                                        content={answers[currentIdx] || ""}
                                        onChange={val => setAnswers({ ...answers, [currentIdx]: val })}
                                        placeholder="Type your comprehensive answer here..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Navigation */}
            <footer className="bg-white border-t border-slate-200 p-6 flex justify-between items-center shadow-2xl">
                <Button
                    variant="outline"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(prev => prev - 1)}
                    className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] border-slate-200"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous Question
                </Button>

                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full">
                    {questions.map((_, i) => (
                        <div key={i} className={cn("w-1.5 h-1.5 rounded-full", currentIdx === i ? "bg-indigo-600 w-4" : "bg-slate-300")} />
                    ))}
                </div>

                <div className="flex gap-3">
                    {currentIdx < questions.length - 1 ? (
                        <Button
                            onClick={() => setCurrentIdx(prev => prev + 1)}
                            className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-black"
                        >
                            Next Question <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setIsSubmitted(true)}
                            className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                        >
                            <Send className="w-4 h-4 mr-2" /> Submit Examination
                        </Button>
                    )}
                </div>
            </footer>
            <style jsx global>{`
                .q-rich-content p { display: inline; }
                .q-rich-content img { max-width: 100%; border-radius: 1rem; margin: 1rem 0; }
                .q-rich-content iframe { width: 100%; aspect-ratio: 16/9; border-radius: 1rem; margin: 1rem 0; }
            `}</style>
        </div>
    );
}
