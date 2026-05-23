"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getExamSessionData, startExamSession, submitExam } from "@/actions/admission_exam";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Clock, 
    ChevronRight, 
    ChevronLeft, 
    Timer, 
    CheckCircle,
    AlertCircle,
    Loader2,
    BookOpen,
    HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CandidateCBTPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const examId = parseInt(params.examId as string);
    const applicationId = parseInt(searchParams.get("appId") || "0");

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [resultId, setResultId] = useState<number | null>(null);
    const [activeSubject, setActiveSubject] = useState<number | null>(null);
    const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<any>({}); // { subjectId: { questionId: answer } }
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isStarted, setIsStarted] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!applicationId) {
            toast.error("Invalid Application ID");
            return;
        }
        fetchData();
    }, [examId, applicationId]);

    useEffect(() => {
        if (isStarted && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        autoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isStarted, timeLeft]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getExamSessionData(examId);
        if (res) {
            setData(res);
            setTimeLeft((res.exam?.duration || 0) * 60);
            if (res.subjects && res.subjects.length > 0) setActiveSubject(res.subjects[0].id);
        }
        setLoading(false);
    };

    const handleStart = async () => {
        const now = new Date();
        const examStart = new Date(data.exam.examDate);
        if (now < examStart) {
            toast.error("Examination has not started yet. Please wait until the scheduled time.");
            return;
        }

        const res = await startExamSession(applicationId, examId);
        if (res.success) {
            setResultId(res.resultId || null);
            setIsStarted(true);
            toast.success("Exam started! Good luck.");
        } else {
            toast.error(res.error);
        }
    };

    const handleAnswer = (questionId: number, answer: string) => {
        if (!activeSubject) return;
        setAnswers((prev: any) => ({
            ...prev,
            [activeSubject]: {
                ...(prev[activeSubject] || {}),
                [questionId]: answer
            }
        }));
    };

    const autoSubmit = () => {
        toast.info("Time is up! Submitting your examination...");
        handleFinalSubmit();
    };

    const handleFinalSubmit = async () => {
        if (!resultId) return;
        if (!confirm("Are you sure you want to submit? This action cannot be undone.")) return;
        
        setSubmitting(true);
        const res = await submitExam(resultId, answers);
        if (res.success) {
            setIsSubmitted(true);
            toast.success("Examination submitted successfully!");
        } else {
            toast.error(res.error);
        }
        setSubmitting(false);
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!data) return <div className="min-h-screen flex justify-center items-center font-black text-2xl text-slate-300">Exam Not Found</div>;

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <Card className="max-w-xl w-full border-none shadow-2xl rounded-[3rem] p-12 text-center space-y-8 bg-white">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-slate-900 italic uppercase">Examination Completed</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Your responses have been recorded and graded.</p>
                    </div>
                    <p className="text-sm font-bold text-slate-400 italic">You will be notified once the admission list is published. You may now close this window.</p>
                    <Button onClick={() => router.push('/')} className="w-full bg-slate-900 text-white font-black py-8 rounded-2xl uppercase text-xs tracking-widest">Return to Home</Button>
                </Card>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
                <div className="max-w-2xl w-full space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter">{data.exam.template.name}</h1>
                        <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Entrance Examination CBT Portal</p>
                    </div>

                    <Card className="border-none shadow-2xl rounded-[3rem] p-12 bg-white space-y-10">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</p>
                                <p className="text-xl font-black text-slate-900 italic uppercase">{data.exam.duration} Minutes</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Subjects</p>
                                <p className="text-xl font-black text-slate-900 italic uppercase">{data.subjects.length}</p>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-indigo-600" /> Candidate Instructions
                            </h4>
                            <div className="text-xs font-bold text-slate-500 leading-relaxed italic space-y-2">
                                <p>• Do not refresh this page during the examination.</p>
                                <p>• The system will auto-submit once the timer reaches zero.</p>
                                <p>• Ensure you have a stable internet connection.</p>
                            </div>
                        </div>

                        <Button onClick={handleStart} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-10 rounded-3xl uppercase text-sm tracking-widest shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02]">
                            Initialize Examination
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    const currentSubject = data.subjects.find((s: any) => s.id === activeSubject);
    const currentQuestion = currentSubject?.questions[activeQuestionIdx];
    const totalQuestions = data.subjects.reduce((acc: number, s: any) => acc + s.questions.length, 0);
    const answeredCount = Object.values(answers).reduce((acc: number, s: any) => acc + Object.keys(s).length, 0);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Bar */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-black text-slate-900 italic uppercase tracking-tight">{data.exam.template.name}</h2>
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Entrance Assessment</span>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-100" />
                    <div className="flex gap-2">
                        {data.subjects.map((s: any) => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    setActiveSubject(s.id);
                                    setActiveQuestionIdx(0);
                                }}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeSubject === s.id ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                )}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={cn(
                    "flex items-center gap-4 px-6 py-3 rounded-2xl font-black italic shadow-lg transition-colors",
                    timeLeft < 300 ? "bg-rose-600 text-white animate-pulse" : "bg-indigo-600 text-white"
                )}>
                    <Timer className="w-5 h-5" />
                    <span className="text-xl tabular-nums">{formatTime(timeLeft)}</span>
                </div>
            </div>

            <div className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-10 grid grid-cols-12 gap-10">
                {/* Left: Question Content */}
                <div className="col-span-8 space-y-8">
                    {currentQuestion ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest italic">
                                    Question {activeQuestionIdx + 1} of {currentSubject.questions.length}
                                </span>
                                <div className="flex items-center gap-3 text-slate-400 font-bold uppercase text-[9px] tracking-widest">
                                    <HelpCircle className="w-4 h-4" /> {currentSubject.name} Subject
                                </div>
                            </div>

                            <div className="p-12 bg-white rounded-[4rem] shadow-xl border border-slate-50">
                                <h3 className="text-3xl font-black text-slate-900 uppercase italic leading-tight">
                                    {currentQuestion.questionText}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {JSON.parse(currentQuestion.options || "[]").map((opt: string, i: number) => {
                                    const isSelected = (answers[activeSubject!] || {})[currentQuestion.id] === opt;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleAnswer(currentQuestion.id, opt)}
                                            className={cn(
                                                "w-full flex items-center gap-6 p-8 rounded-[2.5rem] transition-all border-4 text-left group",
                                                isSelected 
                                                    ? "bg-indigo-600 border-indigo-200 text-white shadow-2xl translate-x-4" 
                                                    : "bg-white border-transparent shadow-sm hover:bg-slate-50 hover:border-slate-100"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-colors",
                                                isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400"
                                            )}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <span className="text-lg font-black italic uppercase">{opt}</span>
                                            {isSelected && <CheckCircle className="w-6 h-6 text-white ml-auto" />}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between pt-10">
                                <Button 
                                    onClick={() => setActiveQuestionIdx(Math.max(0, activeQuestionIdx - 1))}
                                    disabled={activeQuestionIdx === 0}
                                    variant="ghost" 
                                    className="px-10 py-8 rounded-2xl font-black uppercase text-xs tracking-widest flex gap-3"
                                >
                                    <ChevronLeft className="w-5 h-5" /> Previous Question
                                </Button>
                                <Button 
                                    onClick={() => setActiveQuestionIdx(Math.min(currentSubject.questions.length - 1, activeQuestionIdx + 1))}
                                    disabled={activeQuestionIdx === currentSubject.questions.length - 1}
                                    className="bg-slate-900 text-white px-10 py-8 rounded-2xl font-black uppercase text-xs tracking-widest flex gap-3"
                                >
                                    Next Question <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        </div>
                    )}
                </div>

                {/* Right: Navigation Grid */}
                <div className="col-span-4 space-y-8">
                    <Card className="border-none shadow-xl rounded-[3rem] p-10 bg-white sticky top-28">
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Question Navigator</h4>
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{answeredCount} / {totalQuestions} Done</span>
                            </div>

                            <div className="grid grid-cols-5 gap-3">
                                {currentSubject?.questions.map((q: any, idx: number) => {
                                    const isAnswered = (answers[activeSubject!] || {})[q.id];
                                    const isActive = activeQuestionIdx === idx;
                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => setActiveQuestionIdx(idx)}
                                            className={cn(
                                                "w-full aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all",
                                                isActive ? "ring-4 ring-indigo-200 bg-slate-900 text-white" :
                                                isAnswered ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                            )}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pt-8 border-t border-slate-50 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Answered</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-slate-900" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-slate-100" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Not Attempted</span>
                                </div>
                            </div>

                            <Button 
                                onClick={handleFinalSubmit}
                                disabled={submitting}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-8 rounded-3xl uppercase text-xs tracking-widest shadow-xl shadow-rose-100 flex gap-3"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Submit Examination</>}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
