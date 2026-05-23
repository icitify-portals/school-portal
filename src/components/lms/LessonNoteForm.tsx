"use client";

import { useState } from "react";
import { 
    Save, Sparkles, Send, ArrowLeft, 
    BookOpen, Target, FileText, Loader2, 
    CheckCircle2, AlertCircle, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { createLessonNote } from "@/actions/lesson-notes";
import { generateAIContent } from "@/actions/ai-content";
import RichTextEditor from "./RichTextEditor";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LessonNoteForm({ 
    courses, 
    teacherId, 
    sessionId,
    tier = 'tertiary',
    initialData
}: { 
    courses: any[], 
    teacherId: number, 
    sessionId: number,
    tier?: 'k12' | 'tertiary',
    initialData?: any
}) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [generating, setGenerating] = useState(false);
    
    const [formData, setFormData] = useState({
        courseId: initialData?.courseId?.toString() || "",
        weekNumber: initialData?.weekNumber?.toString() || "",
        termId: initialData?.termId?.toString() || "1",
        title: initialData?.title || "",
        objectives: initialData?.objectives || "",
        contentBody: initialData?.contentBody || ""
    });

    const isEdit = !!initialData;
    const isK12 = tier === 'k12';

    const handleGenerateAI = async () => {
        if (!formData.title || !formData.objectives) {
            toast.error("Please provide a title and objectives first so AI has context.");
            return;
        }

        setGenerating(true);
        try {
            const prompt = `Generate a detailed ${tier === 'k12' ? 'primary/secondary school subject' : 'university course'} lesson note content based on the following:
            Title: ${formData.title}
            Objectives: ${formData.objectives}
            ${tier === 'k12' ? 'Subject' : 'Course'}: ${courses.find(c => c.id.toString() === formData.courseId)?.name || 'General'}
            
            Return the content in rich HTML format with headings, bullet points, and appropriate pedagogical structure. 
            Do not include the title in the body. Start directly with the content.`;
            
            const subjectName = courses.find(c => c.id.toString() === formData.courseId)?.name || 'General';
            const res = await generateAIContent(prompt, subjectName, tier);
            if (res.success) {
                setFormData(prev => ({ ...prev, contentBody: res.content }));
                toast.success("Lesson content generated successfully!");
            } else {
                toast.error("AI Generation failed: " + res.error);
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'pending') => {
        e.preventDefault();
        if (!formData.courseId || !formData.weekNumber || !formData.title || !formData.contentBody) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            const data = {
                teacherId,
                courseId: parseInt(formData.courseId),
                sessionId,
                termId: parseInt(formData.termId),
                weekNumber: parseInt(formData.weekNumber),
                title: formData.title,
                objectives: formData.objectives,
                contentBody: formData.contentBody,
                status: isK12 ? status : (status === 'pending' ? 'approved' : 'draft') 
            };

            const res = isEdit 
                ? await createLessonNote({ ...data, id: initialData.id }) 
                : await createLessonNote(data);

            if (res.success) {
                const successMsg = isK12 
                    ? (status === 'pending' ? "Lesson Note submitted for approval!" : "Note saved.")
                    : (status === 'pending' ? "Lesson Note published successfully!" : "Note saved.");
                
                toast.success(successMsg);
                router.push("/staff/notes");
                router.refresh();
            } else {
                toast.error("Failed to save: " + res.error);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl border border-white sticky top-4 z-40">
                <div className="flex items-center gap-4">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => router.back()}
                        className="rounded-2xl hover:bg-slate-50 font-bold uppercase text-[10px] tracking-widest gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Go Back
                    </Button>
                    <div className="h-8 w-px bg-slate-100 hidden md:block" />
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Drafting <span className="text-indigo-600">Note</span></h2>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Week {formData.weekNumber || '?'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        type="button"
                        variant="outline"
                        disabled={submitting}
                        onClick={(e) => handleSubmit(e, 'draft')}
                        className="flex-1 md:flex-none h-12 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest border-slate-200 hover:bg-slate-50"
                    >
                        <Save className="w-4 h-4" /> Save Draft
                    </Button>
                    <Button 
                        type="button"
                        disabled={submitting}
                        onClick={(e) => handleSubmit(e, 'pending')}
                        className="flex-1 md:flex-none h-12 px-8 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest bg-slate-900 shadow-lg shadow-slate-100"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit for Approval
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left Column: Metadata */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4">
                                <legend className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> Curriculum Context
                                </legend>
                                
                                <div className="space-y-2 text-left">
                                    <Label className="text-[10px] font-black uppercase tracking-tighter ml-1">Classroom / {tier === 'k12' ? 'Subject' : 'Course'}</Label>
                                    <Select 
                                        value={formData.courseId} 
                                        onValueChange={(v) => setFormData({...formData, courseId: v})}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50">
                                            <SelectValue placeholder={tier === 'k12' ? "Select Subject" : "Select Course"} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            {courses.map(course => (
                                                <SelectItem key={course.id} value={course.id.toString()} className="rounded-xl">
                                                    {course.code} - {course.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 text-left">
                                        <Label className="text-[10px] font-black uppercase tracking-tighter ml-1">Academic Term</Label>
                                        <Select 
                                            value={formData.termId} 
                                            onValueChange={(v) => setFormData({...formData, termId: v})}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                <SelectItem value="1" className="rounded-xl">1st Term</SelectItem>
                                                <SelectItem value="2" className="rounded-xl">2nd Term</SelectItem>
                                                <SelectItem value="3" className="rounded-xl">3rd Term</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <Label className="text-[10px] font-black uppercase tracking-tighter ml-1">Teaching Week</Label>
                                        <Select 
                                            value={formData.weekNumber} 
                                            onValueChange={(v) => setFormData({...formData, weekNumber: v})}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50">
                                                <SelectValue placeholder="Wk" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {Array.from({length: 13}, (_, i) => i + 1).map(wk => (
                                                    <SelectItem key={wk} value={wk.toString()} className="rounded-xl">
                                                        Week {wk}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50 text-left">
                                <legend className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                    <Target className="w-4 h-4" /> Lesson Design
                                </legend>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-tighter ml-1">Main Title</Label>
                                    <Input 
                                        placeholder="e.g. Intro to Photosynthesis"
                                        className="h-12 rounded-2xl border-slate-100 bg-slate-50/50"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-tighter ml-1">Objectives</Label>
                                    <textarea 
                                        placeholder="What should students know after this lesson?"
                                        className="min-h-[120px] w-full p-4 rounded-3xl border border-slate-100 bg-slate-50/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.objectives}
                                        onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-6 bg-indigo-50/50 rounded-[2.5rem] space-y-3">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1">
                            <Info className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{tier === 'k12' ? 'Supervisor Review' : 'Direct Publication'}</span>
                        </div>
                        <p className="text-[10px] font-bold text-indigo-900/60 leading-relaxed italic">
                            {tier === 'k12' 
                                ? "Your submission will be routed to the assigned Department Lead / Supervisor for pedagogical approval before it is visible to students."
                                : "As a Tertiary Lecturer, your lesson notes are published directly to the student portal upon submission."
                            }
                        </p>
                    </div>
                </div>

                {/* Right Column: Content Body */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden min-h-[600px] flex flex-col">
                        <CardHeader className="bg-slate-50/80 p-8 flex flex-row justify-between items-center border-b pb-6">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Manuscript Content
                                </CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Use rich formatting for better student comprehension.</p>
                            </div>
                            
                            <Button
                                type="button"
                                variant="outline"
                                disabled={generating}
                                onClick={handleGenerateAI}
                                className="rounded-2xl h-12 px-6 gap-2 font-black uppercase text-[10px] tracking-widest bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-lg shadow-indigo-50 border-none transition-all"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 font-black" />}
                                {generating ? "AI Thinking..." : "Magic AI Write"}
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 bg-white">
                            <RichTextEditor 
                                value={formData.contentBody}
                                onChange={(html) => setFormData({...formData, contentBody: html})}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
