"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Trash2,
    ChevronLeft,
    Settings2,
    Eye,
    Save,
    CheckCircle2,
    HelpCircle,
    Copy,
    FileEdit,
    Monitor,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { getCourses } from "@/actions/courses";
import { cn } from "@/lib/utils";
import { addQuestion, createQuiz } from "@/actions/cbt";
import { useRouter } from "next/navigation";
import { QuestionEditor } from "@/components/cbt/QuestionEditor";

const QUESTION_TYPES = [
    { id: "multiple_choice", name: "Multiple Choice", icon: "MC" },
    { id: "true_false", name: "True/False", icon: "TF" },
    { id: "short_answer", name: "Short Answer", icon: "SA" },
    { id: "essay", name: "Essay", icon: "ES" },
    { id: "matching", name: "Matching", icon: "MT" },
    { id: "numerical", name: "Numerical", icon: "NM" },
    { id: "ordering", name: "Ordering", icon: "OR" },
    { id: "hotspot", name: "Hotspot", icon: "HS" },
];

export default function QuizEditor() {
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("settings"); // settings, questions, preview
    const [isSaving, setIsSaving] = useState(false);
    const [quizData, setQuizData] = useState({
        title: "",
        courseId: "",
        timeLimit: "60",
        passingScore: "50",
        maxPoints: "",
        totalWeight: "30",
        randomize: false,
        proctoringEnabled: false,
        isPooled: false,
        drawCount: "",
        availableFrom: "",
        availableUntil: ""
    });

    const [questions, setQuestions] = useState<any[]>([]);

    useEffect(() => {
        getCourses().then(setCourses);
    }, []);

    const addNewQuestion = (type: string) => {
        const newQ = {
            id: Date.now(),
            type,
            text: "",
            points: 1,
            options: type === 'multiple_choice' ? ["", "", "", ""] : [],
            correct: type === 'true_false' ? "true" : "",
            matching: type === 'matching' ? [{ key: "", val: "" }] : []
        };
        setQuestions([...questions, newQ]);
    };

    const handleSave = async () => {
        if (!quizData.title || !quizData.courseId) return alert("Please fill title and course");
        if (questions.length === 0) return alert("Add at least one question");

        setIsSaving(true);
        const res = await createQuiz(quizData, questions);
        setIsSaving(false);

        if (res.success) {
            alert("Assessment created successfully!");
            router.push("/admin/cbt");
        } else alert((res as any).error);
    };

    const updateQuestion = (id: number, updates: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/cbt">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quiz Editor</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {quizData.title || "Untitled Assessment"}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-widest h-11">
                        <Eye className="w-4 h-4 mr-2" /> Preview
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Exam</>}
                    </Button>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                {["settings", "questions", "preview"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'settings' && (
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Settings2 className="w-4 h-4" /> Exam Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Assessment Title</label>
                                    <Input
                                        placeholder="e.g. Mid-Semester Exam: CSC 101"
                                        className="h-12 rounded-xl border-slate-200"
                                        value={quizData.title}
                                        onChange={e => setQuizData({ ...quizData, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Select Course</label>
                                    <select
                                        className="w-full h-12 rounded-xl border-slate-200 bg-white border px-3 text-sm font-medium"
                                        value={quizData.courseId}
                                        onChange={e => setQuizData({ ...quizData, courseId: e.target.value })}
                                    >
                                        <option value="">Choose a course...</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Timer (Mins)</label>
                                    <Input
                                        type="number"
                                        className="h-12 rounded-xl border-slate-200"
                                        value={quizData.timeLimit}
                                        onChange={e => setQuizData({ ...quizData, timeLimit: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Pass Mark (%)</label>
                                    <Input
                                        type="number"
                                        className="h-12 rounded-xl border-slate-200"
                                        value={quizData.passingScore}
                                        onChange={e => setQuizData({ ...quizData, passingScore: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-indigo-500 uppercase">CA Weighting (%)</label>
                                    <Input
                                        type="number"
                                        className="h-12 rounded-xl border-indigo-100 bg-indigo-50/20 font-black"
                                        value={quizData.totalWeight}
                                        onChange={e => setQuizData({ ...quizData, totalWeight: e.target.value })}
                                    />
                                    <p className="text-[9px] text-slate-400 font-medium italic">Example: Set to 30 for 30% CA weight.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-indigo-500 uppercase">Overall Score Scale</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 40"
                                        className="h-12 rounded-xl border-indigo-100 bg-indigo-50/20 font-black"
                                        value={quizData.maxPoints}
                                        onChange={e => setQuizData({ ...quizData, maxPoints: e.target.value })}
                                    />
                                    <p className="text-[9px] text-slate-400 font-medium italic">Score will be scaled down to this value.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Available From</label>
                                    <Input
                                        type="datetime-local"
                                        className="h-12 rounded-xl border-slate-200"
                                        value={quizData.availableFrom}
                                        onChange={e => setQuizData({ ...quizData, availableFrom: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Available Until</label>
                                    <Input
                                        type="datetime-local"
                                        className="h-12 rounded-xl border-slate-200"
                                        value={quizData.availableUntil}
                                        onChange={e => setQuizData({ ...quizData, availableUntil: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Randomize Questions</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Shuffle question order for each student</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-indigo-600 cursor-pointer"
                                        checked={quizData.randomize}
                                        onChange={e => setQuizData({ ...quizData, randomize: e.target.checked })}
                                    />
                                </div>

                                <div className="col-span-2 flex items-center justify-between p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center">
                                            <Monitor className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Enable Proctoring</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Detect tab switching and enforce full-screen mode</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-indigo-600 cursor-pointer"
                                        checked={quizData.proctoringEnabled}
                                        onChange={e => setQuizData({ ...quizData, proctoringEnabled: e.target.checked })}
                                    />
                                </div>

                                <div className="col-span-2 space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center">
                                                <ChevronRight className="w-5 h-5 text-emerald-600 rotate-90" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Advanced Question Pooling</p>
                                                <p className="text-[10px] text-slate-500 font-medium">Draw a subset of questions randomly from the bank</p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-emerald-600 cursor-pointer"
                                            checked={quizData.isPooled}
                                            onChange={e => setQuizData({ ...quizData, isPooled: e.target.checked })}
                                        />
                                    </div>

                                    {quizData.isPooled && (
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Number of Questions to Draw</label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 20"
                                                    className="h-12 rounded-xl border-slate-200 w-32 font-black"
                                                    value={quizData.drawCount}
                                                    onChange={e => setQuizData({ ...quizData, drawCount: e.target.value })}
                                                />
                                                <p className="text-[10px] text-slate-400 font-medium leading-tight">
                                                    Each student will get <span className="font-bold text-slate-900">{quizData.drawCount || 'N'}</span> random questions from the total pool of <span className="font-bold text-slate-900">{questions.length}</span> questions.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'questions' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1 space-y-4">
                        <div className="sticky top-8 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Toolbox</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {QUESTION_TYPES.map(type => (
                                    <Button
                                        key={type.id}
                                        variant="outline"
                                        onClick={() => addNewQuestion(type.id)}
                                        className="h-16 flex flex-col gap-1 rounded-2xl border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                                    >
                                        <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600">{type.icon}</span>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase">{type.name.split(' ')[0]}</span>
                                    </Button>
                                ))}
                            </div>
                            <Button className="w-full py-6 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase tracking-widest text-[10px]">
                                <Plus className="w-4 h-4 mr-2" /> Add From Bank
                            </Button>
                        </div>
                    </div>

                    <div className="md:col-span-3 space-y-6">
                        {questions.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <HelpCircle className="w-12 h-12 text-slate-300 mb-4" />
                                <h3 className="font-bold text-slate-900">No questions yet</h3>
                                <p className="text-sm text-slate-500 max-w-xs mt-1">Start building your assessment by selecting a question type from the toolbox.</p>
                            </div>
                        )}

                        {questions.map((q, idx) => (
                            <Card key={q.id} className="border-none shadow-sm group">
                                <CardHeader className="py-4 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 text-[10px] font-black">{idx + 1}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                            {q.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600"><Copy className="w-4 h-4" /></Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setQuestions(questions.filter(x => x.id !== q.id))}
                                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <QuestionEditor
                                        question={q}
                                        updateQuestion={updateQuestion}
                                    />

                                    <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Weightage (Points)</span>
                                            <Input
                                                type="number"
                                                className="w-16 h-8 rounded-lg text-center font-bold text-xs bg-slate-50 border-none"
                                                value={q.points}
                                                onChange={e => updateQuestion(q.id, { points: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <Button variant="ghost" className="h-8 text-[9px] font-black text-slate-400 uppercase hover:text-indigo-600 gap-2">
                                            <Plus className="w-3 h-3" /> Add Feedback Mapping
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
