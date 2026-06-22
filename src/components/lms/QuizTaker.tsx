"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { startQuizAttempt, submitQuiz, getStudentQuizQuestions } from "@/actions/quiz";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isAfter, isBefore, addMinutes } from "date-fns";
import { Timer, CalendarDays, Lock, CheckCircle, XCircle, Loader2, ShieldCheck, Clock } from "lucide-react";

interface QuizTakerProps {
    quiz: any;
    studentId: number;
    onComplete: () => void;
}

export default function QuizTaker({ quiz, studentId, onComplete }: QuizTakerProps) {
    const [started, setStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null); // Seconds
    const [result, setResult] = useState<{ score: number, passed: boolean } | null>(null);
    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Status Determination
    const effectiveStart = quiz?.slot?.startTime ? new Date(quiz.slot.startTime) : (quiz?.availableFrom ? new Date(quiz.availableFrom) : null);
    const effectiveEnd = quiz?.slot?.endTime ? new Date(quiz.slot.endTime) : (quiz?.availableUntil ? new Date(quiz.availableUntil) : null);
    const gracePeriodTotal = quiz?.quizType === 'examination' ? 0 : (quiz?.gracePeriodMinutes || 0);
    const cutoffDate = effectiveEnd ? addMinutes(effectiveEnd, gracePeriodTotal) : null;

    const isPending = effectiveStart && isBefore(currentTime, effectiveStart);
    const isClosed = cutoffDate && isAfter(currentTime, cutoffDate);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Questions
    const fetchQuestions = async () => {
        const res = await getStudentQuizQuestions(quiz.id);
        if (res.success && res.questions) {
            setQuestions(res.questions.map((q: any) => ({
                ...q,
                options: JSON.parse(q.options)
            })));
        }
    };

    // Timer Logic
    useEffect(() => {
        if (started && timeLeft !== null && timeLeft > 0 && !result) {
            const timer = setInterval(() => {
                setTimeLeft(prev => (prev && prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !result) {
            handleSubmit(); // Auto-submit on timeout
        }
    }, [started, timeLeft, result]);

    const handleStart = async () => {
        setLoading(true);
        await fetchQuestions();
        const res = await startQuizAttempt(quiz.id, studentId);
        if (res.success && res.attemptId) {
            setAttemptId(res.attemptId);
            setStarted(true);
            
            // Calculate time left based on individual limit AND global cutoff
            let seconds = (quiz.timeLimitMinutes || 30) * 60;
            
            if (cutoffDate) {
                const secondsToCutoff = Math.floor((cutoffDate.getTime() - new Date().getTime()) / 1000);
                seconds = Math.min(seconds, secondsToCutoff);
            }
            
            setTimeLeft(Math.max(0, seconds));
        } else {
            alert("Failed to start quiz.");
        }
        setLoading(false);
    };

    const handleSelectOption = (questionId: number, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async () => {
        if (!attemptId) return;
        setLoading(true);
        const res = await submitQuiz(attemptId, answers);
        if (res.success) {
            setResult({ score: res.score!, passed: res.passed! });
            if (res.passed) {
                onComplete();
            }
        } else {
            alert("Failed to submit quiz.");
        }
        setLoading(false);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (result) {
        return (
            <div className="max-w-xl mx-auto text-center p-8 space-y-6 animate-in zoom-in-95">
                <div className={cn(
                    "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4",
                    result.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                    {result.passed ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                </div>

                <h2 className="text-3xl font-bold text-slate-800">
                    {result.passed ? "Quiz Passed!" : "Quiz Failed"}
                </h2>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <p className="text-slate-500 text-sm uppercase font-bold tracking-wider mb-2">Your Score</p>
                    <p className={cn("text-5xl font-black", result.passed ? "text-green-600" : "text-slate-800")}>
                        {result.score}%
                    </p>
                    <p className="text-slate-400 text-xs mt-2">Passing Score: {quiz.passingScore || 50}%</p>
                </div>

                <div className="flex justify-center gap-4">
                    {!result.passed && (
                        <Button onClick={() => window.location.reload()} variant="outline">Retry Quiz</Button>
                    )}
                    <Button onClick={onComplete} className="bg-slate-800 text-white">Continue Course</Button>
                </div>
            </div>
        );
    }

    if (isPending) {
        return (
            <div className="max-w-xl mx-auto p-12 text-center bg-white rounded-[3rem] shadow-2xl shadow-indigo-100/50 border-2 border-slate-50 animate-in zoom-in-95 duration-700">
                <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 mx-auto mb-8 shadow-lg shadow-indigo-100 rotate-3">
                    <CalendarDays className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 italic">Examination Pending</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Synchronizing with central scheduling...</p>
                
                <div className="bg-slate-900 text-white p-8 rounded-2xl space-y-4 shadow-xl shadow-indigo-200">
                    <div className="flex flex-col items-center">
                        <p className="text-indigo-400 font-black uppercase tracking-tighter text-[10px] mb-2">Automated Countdown</p>
                        <div className="flex gap-4">
                            <div className="text-center">
                                <p className="text-4xl font-black">{formatDistanceToNow(effectiveStart!, { includeSeconds: true })}</p>
                                <p className="text-[9px] font-bold uppercase text-slate-500 mt-2">To Activation</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Session Start</p>
                        <p className="text-sm font-bold text-slate-700">{format(effectiveStart!, "HH:mm:ss")}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Hard Cutoff</p>
                        <p className="text-sm font-bold text-slate-700">{effectiveEnd ? format(effectiveEnd, "HH:mm:ss") : "N/A"}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isClosed) {
        return (
            <div className="max-w-xl mx-auto p-12 text-center bg-slate-50 rounded-[3rem] border-2 border-slate-100 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-6">
                    <Lock className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Session Terminated</h2>
                <p className="text-slate-500 font-medium mt-2">The time window for this examination / quiz has closed.</p>
                <div className="mt-8 pt-8 border-t border-slate-200">
                    <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl font-bold h-12 px-8">Refresh Status</Button>
                </div>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="max-w-xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-indigo-100/30 border-2 border-slate-50 text-center animate-in slide-in-from-bottom-8 duration-700">
                <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-indigo-200 -rotate-3">
                    <Timer className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 italic uppercase">{quiz.quizType === 'examination' ? 'Final Examination' : 'Knowledge Check'}</h2>
                <div className="prose prose-sm mx-auto text-slate-400 font-medium mb-10 px-4">
                    <p>{quiz.description || "Instruction: Verify your connectivity before beginning. All in-progress work will be auto-submitted at the cutoff time."}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100/50 backdrop-blur-sm">
                        <span className="block text-2xl font-black text-indigo-600 tracking-tight">{quiz.timeLimitMinutes || "30"}m</span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Timer</span>
                    </div>
                    <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100/50 backdrop-blur-sm">
                        <span className="block text-2xl font-black text-emerald-600 tracking-tight">{quiz.passingScore || 50}%</span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Threshold</span>
                    </div>
                </div>

                <Button 
                    size="lg" 
                    className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase tracking-widest text-xs gap-3 shadow-xl transition-all hover:scale-[1.02]" 
                    onClick={handleStart} 
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Initialize Attempt</>}
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border sticky top-4 z-10">
                <h3 className="font-bold text-slate-700 truncate max-w-[200px]">{quiz.title}</h3>
                <div className={cn(
                    "font-mono font-bold text-lg px-3 py-1 rounded bg-slate-100 flex items-center gap-2",
                    timeLeft !== null && timeLeft < 60 ? "text-red-600 bg-red-50" : "text-slate-700"
                )}>
                    <Clock className="w-4 h-4" />
                    {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-8">
                {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 font-bold rounded-full text-sm">
                                {idx + 1}
                            </span>
                            <div className="flex-1">
                                <p className="font-medium text-lg text-slate-800 mb-6">{q.questionText}</p>

                                <div className="space-y-3">
                                    {q.type === 'multiple_choice' ? (
                                        q.options.map((opt: string, optIdx: number) => (
                                            <button
                                                key={optIdx}
                                                onClick={() => handleSelectOption(q.id, opt)}
                                                className={cn(
                                                    "w-full text-left p-4 rounded-lg border-2 transition-all flex items-center justify-between group",
                                                    answers[q.id] === opt
                                                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                                                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-600"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        "w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold",
                                                        answers[q.id] === opt ? "bg-indigo-500 text-white border-indigo-500" : "bg-white border-slate-300 text-slate-400"
                                                    )}>
                                                        {String.fromCharCode(65 + optIdx)}
                                                    </span>
                                                    {opt}
                                                </div>
                                                {answers[q.id] === opt && <CheckCircle className="w-5 h-5 text-indigo-500" />}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="flex gap-4">
                                            {["True", "False"].map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => handleSelectOption(q.id, opt)}
                                                    className={cn(
                                                        "flex-1 py-4 px-6 rounded-lg border-2 font-bold transition-all text-center",
                                                        answers[q.id] === opt
                                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:pl-80">
                <div className="max-w-2xl mx-auto flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">ANSWERED: {Object.keys(answers).length} / {questions.length}</span>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 min-w-[150px]">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Quiz"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
