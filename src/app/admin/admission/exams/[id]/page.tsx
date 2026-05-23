"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Plus, 
    BookOpen, 
    FileQuestion, 
    Upload, 
    Settings, 
    Trash2, 
    CheckCircle2, 
    Loader2,
    ChevronLeft,
    Search,
    Type,
    ToggleLeft,
    ListChecks,
    Download
} from "lucide-react";
import Link from "next/link";
import { getExamSessionData, saveExamSubject, saveExamQuestion, bulkUploadQuestions } from "@/actions/admission_exam";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ExamManagerPage() {
    const params = useParams();
    const id = parseInt(params.id as string);
    const [exam, setExam] = useState<any>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubject, setActiveSubject] = useState<number | null>(null);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    const [subjectData, setSubjectData] = useState({ name: "", questionCount: 0, marksPerQuestion: "1" });
    const [questionData, setQuestionData] = useState({
        questionText: "",
        questionType: "multiple_choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: ""
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const data = await getExamSessionData(id);
        if (data) {
            setExam(data.exam);
            setSubjects(data.subjects);
            if (data.subjects.length > 0) setActiveSubject(data.subjects[0].id);
        }
        setLoading(false);
    };

    const handleSaveSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await saveExamSubject({ examId: id, ...subjectData });
        if (res.success) {
            setShowSubjectModal(false);
            fetchData();
            toast.success("Subject saved");
        }
    };

    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSubject) return;
        const res = await saveExamQuestion({ subjectId: activeSubject, ...questionData });
        if (res.success) {
            setShowQuestionModal(false);
            setQuestionData({
                questionText: "", questionType: "multiple_choice", options: ["", "", "", ""], correctAnswer: "", explanation: ""
            });
            fetchData();
            toast.success("Question added");
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!exam) return <div className="p-20 text-center">Exam not found</div>;

    const currentSubject = subjects.find(s => s.id === activeSubject);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-[1600px] mx-auto px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/admission/builder">
                            <Button variant="ghost" className="rounded-2xl p-4 hover:bg-slate-100">
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-slate-900 italic uppercase">CBT Manager</h1>
                                <span className="px-3 py-0.5 bg-indigo-100 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-600">
                                    Entrance Exam Configuration
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                                {exam.template.name} • Scheduled: {new Date(exam.examDate).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className="rounded-2xl border-slate-200 font-black px-6 py-6 flex gap-2 uppercase text-[10px] tracking-widest shadow-sm">
                            <Download className="w-4 h-4" /> Download Sample CSV
                        </Button>
                        <Button 
                            onClick={() => setShowBulkModal(true)}
                            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-6 flex gap-2 uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100"
                        >
                            <Upload className="w-4 h-4" /> Bulk Upload
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-8 py-10 grid grid-cols-12 gap-8">
                {/* Sidebar: Subjects */}
                <div className="col-span-3 space-y-6">
                    <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Exam Subjects</h3>
                            <Button onClick={() => setShowSubjectModal(true)} size="sm" className="rounded-xl bg-slate-900 text-white p-2">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {subjects.map((s: any) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSubject(s.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-5 rounded-2xl transition-all font-bold text-sm",
                                        activeSubject === s.id 
                                            ? "bg-slate-900 text-white shadow-xl -translate-x-2" 
                                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                    )}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="truncate">{s.name}</span>
                                        <span className={cn("text-[9px] uppercase tracking-widest", activeSubject === s.id ? "text-slate-400" : "text-slate-300")}>
                                            {s.questions.length} / {s.questionCount} Questions
                                        </span>
                                    </div>
                                    <BookOpen className={cn("w-4 h-4 transition-transform", activeSubject === s.id ? "opacity-100" : "opacity-0")} />
                                </button>
                            ))}
                        </div>
                    </Card>

                    {currentSubject && (
                        <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-indigo-600 text-white space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest italic">Grading Rubric</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/10 rounded-2xl">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Per Correct</p>
                                    <p className="text-xl font-black italic mt-1">+{currentSubject.marksPerQuestion}</p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-2xl">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Max Score</p>
                                    <p className="text-xl font-black italic mt-1">{(currentSubject.questionCount * parseFloat(currentSubject.marksPerQuestion)).toFixed(0)}</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Main: Question Bank */}
                <div className="col-span-9 space-y-8">
                    {currentSubject ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 italic uppercase">{currentSubject.name} Question Bank</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage and curate entrance exam questions</p>
                                </div>
                                <Button onClick={() => setShowQuestionModal(true)} className="rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black px-8 py-6 flex gap-3 uppercase text-xs tracking-widest shadow-xl">
                                    <Plus className="w-5 h-5" /> New Question
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {currentSubject.questions.map((q: any, idx: number) => (
                                    <Card key={q.id} className="border-none shadow-sm rounded-3xl p-8 bg-white group hover:shadow-xl transition-all border border-slate-50">
                                        <div className="flex gap-6">
                                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black italic shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 space-y-6">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-900 uppercase italic leading-snug">{q.questionText}</h4>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                                {q.questionType.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" className="rounded-xl hover:bg-slate-100 p-3">
                                                            <Settings className="w-5 h-5 text-slate-400" />
                                                        </Button>
                                                        <Button variant="ghost" className="rounded-xl hover:bg-rose-50 p-3">
                                                            <Trash2 className="w-5 h-5 text-rose-400" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {JSON.parse(q.options || "[]").map((opt: string, i: number) => (
                                                        <div key={i} className={cn(
                                                            "p-4 rounded-2xl flex items-center gap-4 border-2 transition-all",
                                                            opt === q.correctAnswer 
                                                                ? "bg-emerald-50 border-emerald-200" 
                                                                : "bg-slate-50 border-transparent"
                                                        )}>
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                                                                opt === q.correctAnswer ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                                            )}>
                                                                {String.fromCharCode(65 + i)}
                                                            </div>
                                                            <span className={cn("text-xs font-bold", opt === q.correctAnswer ? "text-emerald-700" : "text-slate-600")}>
                                                                {opt}
                                                            </span>
                                                            {opt === q.correctAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {currentSubject.questions.length === 0 && (
                                    <div className="py-32 text-center bg-white border-4 border-dashed border-slate-50 rounded-[3rem]">
                                        <div className="max-w-xs mx-auto space-y-4">
                                            <div className="p-6 bg-slate-50 rounded-[2rem] w-fit mx-auto">
                                                <FileQuestion className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <h4 className="text-xl font-black text-slate-300 italic uppercase">No Questions</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add manually or use bulk upload to populate this subject.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="py-48 text-center bg-white border-none shadow-xl rounded-[3rem]">
                             <div className="max-w-md mx-auto space-y-6">
                                <BookOpen className="w-16 h-16 text-slate-100 mx-auto" />
                                <h2 className="text-3xl font-black text-slate-900 italic uppercase">Initialize Subject</h2>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs leading-relaxed">Entrance exams are divided into subjects. Start by creating your first subject to add questions.</p>
                                <Button onClick={() => setShowSubjectModal(true)} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 py-8 uppercase text-xs tracking-widest shadow-xl shadow-indigo-100">
                                    <Plus className="w-5 h-5 mr-3" /> Add Exam Subject
                                </Button>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showSubjectModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[3rem] overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase italic text-center">Configure Subject</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 bg-white">
                            <form onSubmit={handleSaveSubject} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Subject Name</label>
                                    <input 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. Mathematics"
                                        value={subjectData.name}
                                        onChange={(e) => setSubjectData({ ...subjectData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Questions Goal</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={subjectData.questionCount}
                                            onChange={(e) => setSubjectData({ ...subjectData, questionCount: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Marks Per Correct</label>
                                        <input 
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={subjectData.marksPerQuestion}
                                            onChange={(e) => setSubjectData({ ...subjectData, marksPerQuestion: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setShowSubjectModal(false)} className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest">Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest">Save Subject</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showQuestionModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[3rem] overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase italic text-center">New CBT Question</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 bg-white max-h-[80vh] overflow-y-auto">
                            <form onSubmit={handleSaveQuestion} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Question Type</label>
                                    <div className="flex bg-slate-50 p-1 rounded-2xl">
                                        {[
                                            { id: 'multiple_choice', icon: ListChecks },
                                            { id: 'true_false', icon: ToggleLeft },
                                            { id: 'matching', icon: Type }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setQuestionData({ ...questionData, questionType: t.id })}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all",
                                                    questionData.questionType === t.id ? "bg-white shadow-md text-indigo-600" : "text-slate-400"
                                                )}
                                            >
                                                <t.icon className="w-4 h-4" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{t.id.replace('_', ' ')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">The Question</label>
                                    <textarea 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                                        placeholder="Write your question text here..."
                                        value={questionData.questionText}
                                        onChange={(e) => setQuestionData({ ...questionData, questionText: e.target.value })}
                                        required
                                    />
                                </div>

                                {questionData.questionType === 'multiple_choice' && (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Options & Answer</label>
                                        {questionData.options.map((opt, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400">
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                                <input 
                                                    className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...questionData.options];
                                                        newOpts[i] = e.target.value;
                                                        setQuestionData({ ...questionData, options: newOpts });
                                                    }}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setQuestionData({ ...questionData, correctAnswer: opt })}
                                                    className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                                        questionData.correctAnswer === opt ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                                                    )}
                                                >
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {questionData.questionType === 'true_false' && (
                                    <div className="flex gap-4">
                                        {['True', 'False'].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setQuestionData({ ...questionData, correctAnswer: val, options: ['True', 'False'] })}
                                                className={cn(
                                                    "flex-1 p-6 rounded-[2rem] font-black uppercase italic tracking-widest transition-all",
                                                    questionData.correctAnswer === val ? "bg-indigo-600 text-white shadow-xl" : "bg-slate-50 text-slate-400"
                                                )}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Explanation (Optional)</label>
                                    <textarea 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                                        placeholder="Explain the correct answer..."
                                        value={questionData.explanation}
                                        onChange={(e) => setQuestionData({ ...questionData, explanation: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                                    <Button type="button" variant="ghost" onClick={() => setShowQuestionModal(false)} className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest">Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">Add to Bank</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
