"use client";

import { useState, useEffect, use } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Flag,
    Send,
    AlertCircle,
    CheckCircle2,
    Monitor,
    Maximize,
    BrainCircuit,
    Sparkles,
    Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ActivityMonitor } from "@/components/cbt/ActivityMonitor";
import { CertificateGenerator } from "@/components/cbt/CertificateGenerator";
import { getQuizWithQuestions, submitResponse, finalizeAttempt, startQuizAttempt, getAttemptWithTime } from "@/actions/cbt";
import { toast } from "sonner";

interface Props {
    params: Promise<{ quizId: string }>;
}

export default function StudentExamPage({ params }: Props) {
    const { quizId } = use(params);
    const [quiz, setQuiz] = useState<any>(null);
    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [flagged, setFlagged] = useState<number[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);

    const [mode, setMode] = useState<'exam' | 'practice' | null>(null);

    useEffect(() => {
        if (!mode) return;

        async function initExam() {
            try {
                // 1. Start Attempt (Pass mode)
                const attempt = await startQuizAttempt(parseInt(quizId), 1, mode || undefined);
                if (attempt.success) {
                    setAttemptId((attempt as any).attemptId);
                    const attMode = (attempt as any).mode || mode;
                    setMode(attMode as any);

                    // 2. Fetch quiz data with the specific attempt ID
                    const attemptSpecificData = await getQuizWithQuestions(parseInt(quizId), (attempt as any).attemptId);
                    if (attemptSpecificData) {
                        setQuiz(attemptSpecificData);
                        
                        if (attMode === 'practice') {
                            setTimeLeft(3600 * 24); // 24 hours for practice
                        } else {
                            setTimeLeft((attemptSpecificData.timeLimitMinutes || 60) * 60);

                            // Calculate Time Left with Extra Time
                            const now = new Date();
                            const startedAt = new Date((attempt as any).startedAt || now);
                            const baseTimeSeconds = (attemptSpecificData.timeLimitMinutes || 60) * 60;

                            const attemptData = await getAttemptWithTime(parseInt(quizId), 1);
                            const extraSeconds = (attemptData?.extraTimeMinutes || 0) * 60;

                            const totalAllowedSeconds = baseTimeSeconds + extraSeconds;
                            const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
                            let finalTimeLeft = Math.max(0, totalAllowedSeconds - elapsedSeconds);

                            if (attemptSpecificData.availableUntil) {
                                const closeTime = new Date(attemptSpecificData.availableUntil);
                                const secondsUntilClose = Math.floor((closeTime.getTime() - now.getTime()) / 1000);
                                if (secondsUntilClose < finalTimeLeft) {
                                    finalTimeLeft = Math.max(0, secondsUntilClose);
                                }
                            }
                            setTimeLeft(finalTimeLeft);
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        initExam();
    }, [quizId, mode]);

    // Timer logic
    useEffect(() => {
        if (!quiz || isSubmitted || timeLeft <= 0 || mode === 'practice') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [quiz, isSubmitted, timeLeft]);

    const handleAnswer = async (questionId: number, answer: any) => {
        if (!attemptId) return;
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
        await submitResponse(attemptId, questionId, typeof answer === 'string' ? answer : JSON.stringify(answer));
    };

    const handleSubmit = async () => {
        if (!attemptId || isSubmitted) return;

        const ok = confirm("Are you sure you want to submit your examination?");
        if (!ok) return;

        const res = await finalizeAttempt(attemptId);
        if (res.success) {
            setIsSubmitted(true);
            toast.success("Examination submitted successfully!");
            if (document.fullscreenElement) document.exitFullscreen();
        }
    };

    const enterFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
            setHasEnteredFullscreen(true);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-slate-400 animate-pulse">Initializing Secure Environment...</div>;

    if (quiz?.proctoringEnabled && !hasEnteredFullscreen && !isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
                <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl p-8 space-y-6">
                    <div className="w-20 h-20 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto">
                        <Monitor className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Security Check</h1>
                        <p className="text-slate-500 font-medium mt-2">
                            This exam requires **Full Screen Mode** to prevent cheating.
                            The session will be monitored.
                        </p>
                    </div>
                    <Button
                        onClick={enterFullscreen}
                        className="w-full py-8 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase tracking-widest text-xs"
                    >
                        <Maximize className="w-4 h-4 mr-2" /> Enter Secure Mode
                    </Button>
                </Card>
            </div>
        );
    }

    if (isSubmitted) {
        const hasPassed = true; // In real app, calculate based on score

        return (
            <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
                <div className="max-w-md w-full space-y-8">
                    <div className="p-4 bg-emerald-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Examination Submitted</h1>
                        <p className="text-slate-500 font-medium">Your responses have been securely uploaded and are now being processed.</p>
                    </div>

                    {hasPassed && (
                        <div className="pt-8 border-t border-slate-100">
                            <CertificateGenerator
                                studentName="Jane Doe"
                                courseName="Intro to Computer Science"
                                quizTitle={quiz?.title || "Main Semester Examination"}
                                score={85}
                                date={new Date().toLocaleDateString()}
                            />
                        </div>
                    )}

                    <Button
                        onClick={() => window.location.href = '/student/dashboard'}
                        variant="ghost"
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900"
                    >
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const currentQ = quiz?.questions?.[currentIdx];
    if (!quiz || !currentQ) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-slate-400 animate-pulse">Loading Question...</div>;

    return (
        <div className="fixed inset-0 bg-slate-50 z-[999] flex flex-col font-sans">
            {attemptId && (
                <ActivityMonitor
                    attemptId={attemptId}
                    enabled={quiz.proctoringEnabled}
                    onLock={() => setIsSubmitted(true)}
                />
            )}

            <header className={cn("text-white p-4 md:px-8 flex justify-between items-center shadow-xl transition-colors", mode === 'practice' ? "bg-indigo-600" : "bg-slate-900")}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        {mode === 'practice' ? <BrainCircuit className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-tight">{quiz?.title} {mode === 'practice' && "(Practice Mode)"}</h2>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                            {mode === 'practice' ? "Interactive Learning Session" : "Ongoing Examination Session"}
                        </p>
                    </div>
                </div>

                {mode === 'practice' ? (
                    <div className="flex items-center gap-4">
                        <Badge className="bg-white/20 text-white border-none px-4 py-2 rounded-xl backdrop-blur-md flex gap-2">
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Immediate Feedback Enabled</span>
                        </Badge>
                    </div>
                ) : (
                    <div className={cn(
                        "flex items-center gap-3 px-6 py-2 rounded-2xl border-2 transition-colors",
                        timeLeft < 300 ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" : "bg-white/10 border-white/20"
                    )}>
                        <Clock className="w-5 h-5" />
                        <span className="text-xl font-black tabular-nums">{formatTime(timeLeft)}</span>
                    </div>
                )}

                <div className="hidden md:block text-right">
                    <p className="text-[10px] font-black uppercase text-white/40">{mode === 'practice' ? "Unlimited Time" : "Time Remaining"}</p>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <aside className="w-80 bg-white border-r border-slate-200 hidden lg:flex flex-col">
                    <div className="p-6 border-b border-slate-50">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Question Map</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {quiz?.questions?.map((q: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIdx(i)}
                                    className={cn(
                                        "w-full aspect-square rounded-lg text-xs font-black flex items-center justify-center transition-all border-2",
                                        currentIdx === i ? "bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg" :
                                            answers[q.id] ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                flagged.includes(i) ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                    "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300"
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                <div className="flex-1 overflow-y-auto p-6 md:p-12">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Question {currentIdx + 1} of {quiz?.questions?.length || 0}</span>
                                <div
                                    className="prose prose-slate max-w-none mt-4 q-rich-content text-2xl"
                                    dangerouslySetInnerHTML={{ __html: currentQ.questionText }}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setFlagged(prev => prev.includes(currentIdx) ? prev.filter(x => x !== currentIdx) : [...prev, currentIdx])}
                                className={cn("rounded-xl transition-colors", flagged.includes(currentIdx) ? "text-amber-600 bg-amber-50" : "text-slate-300 hover:text-amber-500")}
                            >
                                <Flag className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {currentQ.type === 'multiple_choice' && (
                                <div className="grid grid-cols-1 gap-3">
                                    {JSON.parse(currentQ.options || '[]').map((opt: string, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => handleAnswer(currentQ.id, opt)}
                                            className={cn(
                                                "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all",
                                                answers[currentQ.id] === opt ? "bg-white border-indigo-600 shadow-md ring-4 ring-indigo-50" : "bg-white border-slate-100 hover:border-slate-300"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0",
                                                answers[currentQ.id] === opt ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <div
                                                className="text-slate-700 font-semibold prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: opt }}
                                            />
                                            {mode === 'practice' && answers[currentQ.id] === opt && (
                                                 <div className="ml-auto">
                                                     {opt === currentQ.correctAnswer ? (
                                                         <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                     ) : (
                                                         <AlertCircle className="w-5 h-5 text-rose-500" />
                                                     )}
                                                 </div>
                                             )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {currentQ.type === 'true_false' && (
                                <div className="grid grid-cols-2 gap-4">
                                    {['True', 'False'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => handleAnswer(currentQ.id, opt)}
                                            className={cn(
                                                "p-8 rounded-2xl border-2 font-black uppercase tracking-widest transition-all",
                                                answers[currentQ.id] === opt ? "bg-white border-indigo-600 shadow-lg ring-4 ring-indigo-50 text-indigo-600" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                                            )}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {currentQ.type === 'ordering' && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Reorder these items correctly:</p>
                                    <div className="space-y-2">
                                        {(answers[currentQ.id] || JSON.parse(currentQ.options || '[]').sort(() => Math.random() - 0.5)).map((item: string, i: number, arr: string[]) => (
                                            <div key={i} className="flex items-center gap-3 p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-black text-xs text-indigo-600">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 font-bold text-slate-700">{item}</div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={i === 0}
                                                        onClick={() => {
                                                            const nextArr = [...arr];
                                                            [nextArr[i - 1], nextArr[i]] = [nextArr[i], nextArr[i - 1]];
                                                            handleAnswer(currentQ.id, nextArr);
                                                        }}
                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-50"
                                                    >
                                                        <ChevronRight className="w-4 h-4 -rotate-90" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={i === arr.length - 1}
                                                        onClick={() => {
                                                            const nextArr = [...arr];
                                                            [nextArr[i + 1], nextArr[i]] = [nextArr[i], nextArr[i + 1]];
                                                            handleAnswer(currentQ.id, nextArr);
                                                        }}
                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-50"
                                                    >
                                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentQ.type === 'hotspot' && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Click on the correct area in the image below:</p>
                                    <div className="relative inline-block border-4 border-white shadow-2xl rounded-[2.5rem] overflow-hidden group cursor-crosshair">
                                        <img
                                            src={JSON.parse(currentQ.options || '{}').image}
                                            alt="Hotspot Assessment"
                                            className="max-h-[600px] w-auto block"
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                                handleAnswer(currentQ.id, { x, y });
                                            }}
                                        />
                                        {answers[currentQ.id] && (
                                            <div
                                                className="absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-4 border-white bg-indigo-600 shadow-2xl flex items-center justify-center animate-in zoom-in duration-300"
                                                style={{ left: `${answers[currentQ.id].x}%`, top: `${answers[currentQ.id].y}%` }}
                                            >
                                                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {currentQ.type === 'essay' && (
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Your Detailed Response</label>
                                    <RichTextEditor
                                        content={answers[currentQ.id] || ""}
                                        onChange={val => handleAnswer(currentQ.id, val)}
                                        placeholder="Type your comprehensive answer here..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-slate-200 p-6 flex justify-between items-center shadow-2xl">
                <Button
                    variant="outline"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(prev => prev - 1)}
                    className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] border-slate-200"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>

                <div className="flex gap-3">
                    {currentIdx < quiz.questions.length - 1 ? (
                        <Button
                            onClick={() => setCurrentIdx(prev => prev + 1)}
                            className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-black"
                        >
                            Next Question <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                        >
                            <Send className="w-4 h-4 mr-2" /> Submit Exam
                        </Button>
                    )}
                </div>
            </footer>
        </div>
    );
}
