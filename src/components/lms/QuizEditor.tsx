"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle, Save, Loader2, GripVertical } from "lucide-react";
import { getQuizDetails, saveQuestion, deleteQuestion } from "@/actions/quiz";
import { cn } from "@/lib/utils";

interface QuizEditorProps {
    lessonId: number;
    quizId?: number; // Optional, might need to fetch if not passed
}

interface Question {
    id?: number;
    text: string;
    type: 'multiple_choice' | 'true_false';
    options: string[];
    correctAnswer: string;
    points: number;
}

export default function QuizEditor({ lessonId, quizId }: QuizEditorProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeQuizId, setActiveQuizId] = useState<number | null>(quizId || null);

    // Editor State
    const [editingQ, setEditingQ] = useState<Question | null>(null);

    useEffect(() => {
        loadData();
    }, [lessonId]);

    const loadData = async () => {
        setLoading(true);
        const res = await getQuizDetails(lessonId);
        if (res.success && res.quiz) {
            setActiveQuizId(res.quiz.id);
            setQuestions(res.questions.map((q: any) => ({
                id: q.id,
                text: q.questionText,
                type: q.type,
                options: JSON.parse(q.options),
                correctAnswer: q.correctAnswer,
                points: q.points
            })));
        } else {
            // Quiz might not exist yet if lesson was just created? 
            // Usually lesson creation creates a skeleton quiz row.
        }
        setLoading(false);
    };

    const handleSaveQuestion = async () => {
        if (!editingQ || !activeQuizId) return;

        // Basic Validation
        if (!editingQ.text.trim()) {
            alert("Question text is required");
            return;
        }
        if (editingQ.type === 'multiple_choice' && editingQ.options.some(o => !o.trim())) {
            alert("All options must be filled");
            return;
        }

        const res = await saveQuestion(activeQuizId, editingQ);
        if (res.success) {
            setEditingQ(null);
            loadData();
        } else {
            alert("Failed to save question");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this question?")) return;
        await deleteQuestion(id);
        loadData();
    };

    const startNewQuestion = () => {
        setEditingQ({
            text: "",
            type: 'multiple_choice',
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: "Option A", // Default to first matches option text? Or index? 
            // Let's store actual text for simplicity, but index is robust against text changes.
            // Requirement says store string "Paris".
            points: 1
        });
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading quiz data...</div>;

    if (!activeQuizId) return <div className="p-4 bg-yellow-50 text-yellow-600 rounded">Quiz details not found. Please save the lesson first.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Quiz Questions ({questions.length})</h3>
                <Button onClick={startNewQuestion} disabled={!!editingQ} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Add Question
                </Button>
            </div>

            {/* Editor Form */}
            {editingQ && (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-600">
                            {editingQ.id ? "Edit Question" : "New Question"}
                        </h4>
                        <button onClick={() => setEditingQ(null)} className="text-slate-400 hover:text-slate-600">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Question Text</label>
                        <Input
                            value={editingQ.text}
                            onChange={e => setEditingQ({ ...editingQ, text: e.target.value })}
                            placeholder="Enter the question here..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Points</label>
                            <Input
                                type="number"
                                value={editingQ.points}
                                onChange={e => setEditingQ({ ...editingQ, points: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Type</label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                                value={editingQ.type}
                                onChange={e => setEditingQ({
                                    ...editingQ,
                                    type: e.target.value as any,
                                    options: e.target.value === 'true_false' ? ["True", "False"] : ["", "", "", ""],
                                    correctAnswer: e.target.value === 'true_false' ? "True" : ""
                                })}
                            >
                                <option value="multiple_choice">Multiple Choice</option>
                                <option value="true_false">True / False</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">Options & Correct Answer</label>
                        {editingQ.type === 'multiple_choice' ? (
                            <div className="space-y-2">
                                {editingQ.options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <button
                                            onClick={() => setEditingQ({ ...editingQ, correctAnswer: opt })}
                                            className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center border transition-all flex-shrink-0",
                                                editingQ.correctAnswer === opt && opt !== ""
                                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                                    : "border-slate-300 hover:border-slate-400"
                                            )}
                                            title="Mark as correct"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                        </button>
                                        <Input
                                            value={opt}
                                            onChange={e => {
                                                const newOpts = [...editingQ.options];
                                                newOpts[idx] = e.target.value;
                                                // If this was the correct answer, update it too
                                                const newCorrect = editingQ.correctAnswer === opt ? e.target.value : editingQ.correctAnswer;
                                                setEditingQ({ ...editingQ, options: newOpts, correctAnswer: newCorrect });
                                            }}
                                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                {["True", "False"].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setEditingQ({ ...editingQ, correctAnswer: opt })}
                                        className={cn(
                                            "flex-1 py-3 px-4 rounded-lg border-2 font-bold transition-all",
                                            editingQ.correctAnswer === opt
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={handleSaveQuestion} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Save className="w-4 h-4" /> Save Question
                        </Button>
                    </div>
                </div>
            )}

            {/* Questions List */}
            <div className="space-y-3">
                {questions.length === 0 && !editingQ && (
                    <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-400">
                        No questions added yet. Click "Add Question" to start.
                    </div>
                )}

                {questions.map((q, idx) => (
                    <div
                        key={q.id}
                        className={cn(
                            "flex items-start gap-4 p-4 rounded-lg border bg-white transition-all hover:shadow-md group",
                            editingQ?.id === q.id ? "ring-2 ring-indigo-500 border-transparent" : "border-slate-200"
                        )}
                    >
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full font-bold text-slate-500 text-xs mt-0.5">
                            {idx + 1}
                        </span>

                        <div className="flex-1 space-y-1">
                            <p className="font-medium text-slate-800">{q.text}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">
                                    {q.type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
                                </span>
                                <span className="bg-amber-100 px-2 py-0.5 rounded text-amber-700 font-medium">
                                    {q.points} Points
                                </span>
                                <span className="bg-emerald-100 px-2 py-0.5 rounded text-emerald-700 font-bold border border-emerald-200">
                                    Answer: {q.correctAnswer}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingQ(q)}
                                disabled={!!editingQ}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(q.id!)}
                                disabled={!!editingQ}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
