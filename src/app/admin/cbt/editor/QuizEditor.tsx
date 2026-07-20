"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import LatexRenderer from "@/components/cbt/LatexRenderer";
import { createQuiz, addQuestion, toggleRequireAssignment, searchUsersForAssignment, assignStudentToQuiz, removeStudentFromQuiz, getAssignedStudents } from "@/actions/cbt";
import { Loader2, Search, Trash2 } from "lucide-react";

export default function QuizEditor({ existingQuizzes }: { existingQuizzes: any[] }) {
    const [quizId, setQuizId] = useState<number | null>(null);
    const [quizTitle, setQuizTitle] = useState("");
    const [quizDesc, setQuizDesc] = useState("");
    
    // Question Form State
    const [qText, setQText] = useState("");
    const [containsLatex, setContainsLatex] = useState(true);
    const [optionA, setOptionA] = useState("");
    const [optionB, setOptionB] = useState("");
    const [optionC, setOptionC] = useState("");
    const [optionD, setOptionD] = useState("");
    const [correctAnswer, setCorrectAnswer] = useState("A");
    const [correctAnswer, setCorrectAnswer] = useState("A");

    // Assignment State
    const [requireAssignment, setRequireAssignment] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    async function loadAssigned() {
        if (!quizId) return;
        const res = await getAssignedStudents(quizId);
        if (res.success) setAssignedStudents(res.data);
    }

    async function handleToggleRequire(checked: boolean) {
        if (!quizId) return;
        setRequireAssignment(checked);
        const res = await toggleRequireAssignment(quizId, checked);
        if (res.success) toast.success("Access control updated");
    }

    async function handleSearch(q: string) {
        setSearchQuery(q);
        if (q.length < 3) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const res = await searchUsersForAssignment(q);
        if (res.success) setSearchResults(res.data);
        setIsSearching(false);
    }

    async function handleAssign(userId: number) {
        if (!quizId) return;
        const res = await assignStudentToQuiz(quizId, userId);
        if (res.success) {
            toast.success("Student assigned");
            setSearchQuery("");
            setSearchResults([]);
            loadAssigned();
        } else {
            toast.error(res.error);
        }
    }

    async function handleRemoveAssignment(userId: number) {
        if (!quizId) return;
        const res = await removeStudentFromQuiz(quizId, userId);
        if (res.success) {
            toast.success("Student removed");
            loadAssigned();
        }
    }

    async function handleCreateQuiz() {
        const res = await createQuiz({ title: quizTitle, description: quizDesc, durationMinutes: 60, randomizeQuestions: true, totalMarks: '100.00' });
        if (res.success) {
            toast.success("Quiz created!");
            setQuizId(res.quizId);
        } else {
            toast.error(res.error);
        }
    }

    async function handleAddQuestion() {
        if (!quizId) return;
        const options = { A: optionA, B: optionB, C: optionC, D: optionD };
        const res = await addQuestion(quizId, {
            questionText: qText,
            containsLatex,
            questionType: 'multiple_choice',
            options,
            correctAnswer,
            marks: '1.00',
            explanation: '',
        });
        if (res.success) {
            toast.success("Question added!");
            setQText("");
            setOptionA("");
            setOptionB("");
            setOptionC("");
            setOptionD("");
        } else {
            toast.error(res.error);
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-8">
                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">1. Setup Quiz</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4 p-6">
                        {!quizId ? (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Quiz Title</label>
                                    <Input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="e.g. PHY 101 Midterm" className="h-12 rounded-xl" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                                    <Textarea value={quizDesc} onChange={(e) => setQuizDesc(e.target.value)} className="rounded-xl min-h-[100px]" />
                                </div>
                                <Button onClick={handleCreateQuiz} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 rounded-xl uppercase tracking-widest text-[10px]">
                                    Create New Quiz
                                </Button>
                            </>
                        ) : (
                            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center justify-between border border-emerald-100">
                                <div>
                                    <h3 className="font-black">{quizTitle}</h3>
                                    <p className="text-xs font-medium">Ready to accept questions (ID: {quizId})</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setQuizId(null)} className="rounded-lg text-emerald-700 border-emerald-200">Reset</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className={`border-none shadow-sm ${!quizId ? 'opacity-50 pointer-events-none' : ''}`}>
                    <CardHeader className="bg-slate-50 border-b flex flex-row justify-between items-center">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">2. Add Question</CardTitle>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="latex" checked={containsLatex} onChange={(e) => setContainsLatex(e.target.checked)} className="w-4 h-4 text-indigo-600" />
                            <label htmlFor="latex" className="text-xs font-bold uppercase text-slate-500">Enable LaTeX</label>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4 p-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Question Text</label>
                            <Textarea 
                                value={qText} 
                                onChange={(e) => setQText(e.target.value)} 
                                placeholder="Type question here. Use $$ for block math or $ for inline math." 
                                className="rounded-xl min-h-[120px] font-mono text-sm" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Option A</label>
                                <Input value={optionA} onChange={(e) => setOptionA(e.target.value)} className="rounded-xl" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Option B</label>
                                <Input value={optionB} onChange={(e) => setOptionB(e.target.value)} className="rounded-xl" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Option C</label>
                                <Input value={optionC} onChange={(e) => setOptionC(e.target.value)} className="rounded-xl" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Option D</label>
                                <Input value={optionD} onChange={(e) => setOptionD(e.target.value)} className="rounded-xl" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Correct Answer</label>
                            <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm">
                                <option value="A">Option A</option>
                                <option value="B">Option B</option>
                                <option value="C">Option C</option>
                                <option value="D">Option D</option>
                            </select>
                        </div>

                        <Button onClick={handleAddQuestion} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black h-12 rounded-xl uppercase tracking-widest text-[10px]">
                            Save Question to Bank
                        </Button>
                    </CardContent>
                </Card>

                {/* Assignment Setup */}
                <Card className={`border-none shadow-sm ${!quizId ? 'opacity-50 pointer-events-none' : ''}`}>
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">3. Assign Students (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4 p-6">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <input type="checkbox" id="requireAssign" checked={requireAssignment} onChange={(e) => handleToggleRequire(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded border-slate-300" />
                            <div>
                                <label htmlFor="requireAssign" className="text-sm font-bold text-slate-700 block cursor-pointer">Require Assignment</label>
                                <p className="text-xs text-slate-500">If checked, only specifically assigned students below can access the exam URL.</p>
                            </div>
                        </div>

                        {requireAssignment && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search email, name, or matric..." 
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-9 h-11 rounded-xl"
                                    />
                                    {isSearching && <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-slate-400" />}
                                </div>
                                
                                {searchResults.length > 0 && (
                                    <div className="border border-slate-100 rounded-xl max-h-48 overflow-y-auto divide-y">
                                        {searchResults.map(user => (
                                            <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                                                <div>
                                                    <p className="text-sm font-semibold">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                                <Button size="sm" variant="outline" className="text-xs h-7 rounded-lg" onClick={() => handleAssign(user.id)}>Add</Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {assignedStudents.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Assigned Roster ({assignedStudents.length})</h4>
                                        <div className="space-y-2">
                                            {assignedStudents.map(student => (
                                                <div key={student.userId} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                                    <div>
                                                        <p className="text-sm font-bold text-emerald-800">{student.name}</p>
                                                        <p className="text-xs text-emerald-600/70">{student.email}</p>
                                                    </div>
                                                    <button onClick={() => handleRemoveAssignment(student.userId)} className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <div className="sticky top-8">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live Preview (Student View)
                    </h2>
                    <Card className="-200/50 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className="h-2 bg-indigo-600 w-full"></div>
                        <CardContent className="p-8">
                            <div className="prose prose-slate max-w-none">
                                {qText ? (
                                    <LatexRenderer content={qText} containsLatex={containsLatex} />
                                ) : (
                                    <p className="text-slate-300 italic">Question preview will appear here...</p>
                                )}
                            </div>

                            <div className="mt-8 space-y-3">
                                {['A', 'B', 'C', 'D'].map((opt) => {
                                    const optText = opt === 'A' ? optionA : opt === 'B' ? optionB : opt === 'C' ? optionC : optionD;
                                    if (!optText) return null;
                                    return (
                                        <div key={opt} className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${correctAnswer === opt ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-300'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${correctAnswer === opt ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {opt}
                                            </div>
                                            <div className="flex-1">
                                                <LatexRenderer content={optText} containsLatex={containsLatex} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
