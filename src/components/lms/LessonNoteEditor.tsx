"use client";

import { useState, useEffect } from "react";
import { 
    Sparkles, Save, Send, Eye, FileText, 
    ChevronRight, Wand2, History, MessageSquare, 
    CheckCircle2, XCircle, Loader2, BookOpen, 
    Calendar, Layers, Target, Library
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { saveLessonNote, submitLessonNote } from "@/actions/lesson-notes";
import { generateLessonNoteContent } from "@/actions/ai-content";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LessonNoteEditorProps {
    initialData?: any;
    teacherId: number;
    courses: any[];
    sessions: any[];
    academicTier: 'k12' | 'tertiary';
}

export default function LessonNoteEditor({ initialData, teacherId, courses, sessions, academicTier }: LessonNoteEditorProps) {
    const [id, setId] = useState(initialData?.id || null);
    const [title, setTitle] = useState(initialData?.title || "");
    const [courseId, setCourseId] = useState(initialData?.courseId || "");
    const [weekNumber, setWeekNumber] = useState(initialData?.weekNumber || 1);
    const [sessionId, setSessionId] = useState(initialData?.sessionId || "");
    const [termId, setTermId] = useState(initialData?.termId || 1);
    const [objectives, setObjectives] = useState(initialData?.objectives || "");
    const [content, setContent] = useState(initialData?.contentBody || "");
    const [status, setStatus] = useState(initialData?.status || "draft");
    const [feedback, setFeedback] = useState(initialData?.supervisorFeedback || "");

    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await saveLessonNote({
                id,
                teacherId,
                courseId: parseInt(courseId),
                weekNumber,
                sessionId: parseInt(sessionId),
                termId,
                title,
                objectives,
                contentBody: content
            });
            if (res.success) {
                setId(res.id);
                toast.success("Lesson Note saved as draft");
            } else {
                toast.error(res.error || "Failed to save");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!id) {
            toast.error("Please save as draft first");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await submitLessonNote(id, academicTier);
            if (res.success) {
                setStatus(res.status);
                toast.success(academicTier === 'tertiary' ? "Lesson published successfully" : "Lesson note submitted for approval");
            } else {
                toast.error(res.error || "Failed to submit");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        try {
            const course = courses.find(c => c.id.toString() === courseId.toString());
            const res = await generateLessonNoteContent(aiPrompt, course?.name || "Subject", academicTier);
            if (res.success) {
                setContent(res.content);
                toast.success("AI Content Generated!");
            } else {
                toast.error(res.error || "AI Generation failed");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Editor Side */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <Card className="p-6 border-none shadow-xl bg-white/80 backdrop-blur-md rounded-2xl shrink-0">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Note Title</Label>
                            <Input 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Introduction to Quadratic Equations"
                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 text-lg font-bold focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Subject</Label>
                            <select 
                                value={courseId}
                                onChange={(e) => setCourseId(e.target.value)}
                                className="w-full h-12 rounded-xl border-slate-100 bg-slate-50/50 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">Select Subject</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Week</Label>
                            <Input 
                                type="number" 
                                min={1} max={13} 
                                value={weekNumber} 
                                onChange={(e) => setWeekNumber(parseInt(e.target.value))}
                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </Card>

                <Card className="flex-1 p-0 border-none shadow-2xl bg-white rounded-2xl overflow-hidden relative">
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        {status === 'rejected' && (
                            <Badge variant="destructive" className="rounded-full px-4 py-1 gap-2 border-none">
                                <XCircle className="w-3 h-3" /> Rejected
                            </Badge>
                        )}
                        {status === 'pending' && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-full px-4 py-1 gap-2 border-none">
                                <Loader2 className="w-3 h-3 animate-spin" /> Pending Approval
                            </Badge>
                        )}
                        {status === 'approved' && (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-full px-4 py-1 gap-2 border-none">
                                <CheckCircle2 className="w-3 h-3" /> Approved
                            </Badge>
                        )}
                    </div>
                    
                    <div className="h-full flex flex-col">
                        <div className="p-6 pb-0 space-y-2 shrink-0">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Learning Objectives</Label>
                            <textarea 
                                value={objectives}
                                onChange={(e) => setObjectives(e.target.value)}
                                placeholder="What should students be able to do after this lesson?"
                                className="w-full h-20 p-4 rounded-2xl border-none bg-slate-50/50 resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm italic"
                            />
                        </div>
                        <div className="flex-1 p-6 pt-4">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Lesson Content</Label>
                            <RichTextEditor 
                                value={content} 
                                onChange={setContent}
                            />
                        </div>
                    </div>
                </Card>
                
                <div className="flex justify-between items-center bg-white/50 backdrop-blur rounded-2xl p-4 shrink-0 border border-white/20">
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-2xl gap-2 font-bold px-6">
                            <Eye className="w-4 h-4" /> Preview
                        </Button>
                        <Button variant="outline" className="rounded-2xl gap-2 font-bold px-6 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                            <Library className="w-4 h-4" /> Media Library
                        </Button>
                    </div>
                    
                    <div className="flex gap-4">
                        {status !== 'approved' && (
                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving || status === 'pending'}
                                variant="secondary"
                                className="rounded-2xl gap-2 font-bold px-8 h-12 bg-slate-100 hover:bg-slate-200"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Draft
                            </Button>
                        )}
                        {(status === 'draft' || status === 'rejected' || (academicTier === 'tertiary' && status !== 'approved')) && (
                            <Button 
                                onClick={handleSubmit} 
                                disabled={isSubmitting}
                                className="rounded-2xl gap-2 font-bold px-10 h-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {academicTier === 'tertiary' ? 'Publish Lesson' : 'Submit for Approval'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Assistant Sidebar */}
            <Card className="w-96 flex flex-col border-none shadow-2xl bg-indigo-900 rounded-[2.5rem] overflow-hidden text-white shrink-0">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/30 rounded-xl">
                            <Sparkles className="w-6 h-6 text-indigo-300" />
                        </div>
                        <h2 className="text-2xl font-black italic tracking-tight">AI Assistant</h2>
                    </div>
                    <p className="text-indigo-300/80 text-sm leading-relaxed">Generate lesson content, objectives, or summaries in seconds.</p>
                </div>

                <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
                    <Card className="bg-indigo-950/40 border-indigo-800 p-4 rounded-2xl space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Generation Prompt</Label>
                        <textarea 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="e.g. Write a lesson on the causes of the French Revolution for JSS2..."
                            className="w-full h-32 bg-indigo-950/60 border-indigo-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder:text-indigo-800/50"
                        />
                        <Button 
                            onClick={handleGenerateAI}
                            disabled={isGenerating || !courseId}
                            className="w-full h-12 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black gap-2 border-none shadow-xl shadow-indigo-950/20"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            Generate Content
                        </Button>
                    </Card>

                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4 pb-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Quick Actions</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    <Button variant="ghost" className="justify-start text-xs h-10 rounded-xl hover:bg-indigo-800/40 text-left gap-3 px-4">
                                        <Target className="w-4 h-4 text-indigo-400" /> Generate Objectives
                                    </Button>
                                    <Button variant="ghost" className="justify-start text-xs h-10 rounded-xl hover:bg-indigo-800/40 text-left gap-3 px-4">
                                        <Layers className="w-4 h-4 text-indigo-400" /> Breakdown into Sections
                                    </Button>
                                    <Button variant="ghost" className="justify-start text-xs h-10 rounded-xl hover:bg-indigo-800/40 text-left gap-3 px-4">
                                        <MessageSquare className="w-4 h-4 text-indigo-400" /> Create Review Quiz
                                    </Button>
                                </div>
                            </div>

                            {feedback && (
                                <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                                        <History className="w-3 h-3" /> Supervisor Feedback
                                    </div>
                                    <p className="text-sm text-indigo-100 italic">"{feedback}"</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </Card>
        </div>
    );
}
