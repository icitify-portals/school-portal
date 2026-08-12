"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Brain, Monitor, AlertCircle, Sparkles, Send, Flag, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CBTStudentGuide() {
    return (
        <div className="p-8 max-w-[1200px] w-full mx-auto space-y-8 pb-32">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Brain className="w-8 h-8 text-indigo-600" />
                    CBT Student Guide
                </h1>
                <p className="text-slate-500 font-medium mt-2">Learn how to take online tests and exams seamlessly.</p>
            </div>

            <div className="grid gap-6">
                <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                    <div className="h-2 bg-indigo-600 w-full"></div>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Step 1: Starting the Exam</h2>
                                <p className="text-sm text-slate-500 font-medium">Entering the CBT Environment</p>
                            </div>
                        </div>
                        <div className="space-y-4 text-sm text-slate-600">
                            <p>To begin a test, you will need the direct link or Quiz ID provided by your lecturer.</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Open the link. You will be prompted to select a mode.</li>
                                <li><strong>Exam Mode:</strong> Timed, fullscreen, strictly proctored. Your score counts.</li>
                                <li><strong>Practice Mode:</strong> Untimed, no strict restrictions, usually for revision.</li>
                                <li>The system will enforce <strong>fullscreen mode</strong>. Switching tabs or closing the window is monitored.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                    <div className="h-2 bg-emerald-500 w-full"></div>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                <Monitor className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Step 2: Taking the Exam</h2>
                                <p className="text-sm text-slate-500 font-medium">Navigating questions and the timer.</p>
                            </div>
                        </div>
                        <div className="space-y-4 text-sm text-slate-600">
                            <p>Inside the exam interface, you have several tools to help you:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-slate-700" />
                                        <strong className="text-slate-900">Server-Side Timer</strong>
                                    </div>
                                    <p className="text-xs">The timer keeps running even if you close the browser. Make sure to finish before time runs out!</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Flag className="w-4 h-4 text-amber-500" />
                                        <strong className="text-slate-900">Flag for Review</strong>
                                    </div>
                                    <p className="text-xs">Not sure about an answer? Click the Flag icon to mark it for review later.</p>
                                </div>
                            </div>
                            <p className="mt-4">Use the question grid on the side to see which questions you've answered (✅), which are unanswered (⬜), and which are flagged (🚩).</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                    <div className="h-2 bg-rose-500 w-full"></div>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                                <Send className="w-6 h-6 text-rose-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Step 3: Submission</h2>
                                <p className="text-sm text-slate-500 font-medium">Finishing your exam.</p>
                            </div>
                        </div>
                        <div className="space-y-4 text-sm text-slate-600">
                            <p>When you have answered all questions, click the <strong>Submit Exam</strong> button.</p>
                            <div className="p-4 bg-rose-50 text-rose-800 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong>Important:</strong> Once you submit, you cannot take the exam again. If the timer runs out, your exam will be <strong>auto-submitted</strong> with the answers you have selected so far.
                                </div>
                            </div>
                            <p>After submission, you will see a confirmation screen. If it was an objective (multiple choice) test, your score may be displayed immediately.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
