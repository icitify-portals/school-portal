"use client";

import { useState } from "react";
import QuizEditor from "./QuizEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateLessonContent, updateLessonSettings } from "@/actions/lms";
import { 
    Loader2, 
    Save, 
    Sparkles, 
    FileText, 
    HelpCircle, 
    ClipboardCheck, 
    Settings, 
    Calendar, 
    Eye, 
    EyeOff 
} from "lucide-react";
import { uploadFile } from "@/actions/upload";
import { Modal } from "@/components/ui/modal";
import { generateLessonContent } from "@/actions/ai-lms";
import FileUploadZone from "./FileUploadZone";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AssignmentConfigForm from "./AssignmentConfigForm";
import QuizConfigForm from "./QuizConfigForm";
import { uploadH5P } from "@/actions/h5p";
import RichEditor from "./RichEditor";

interface LessonEditorProps {
    courseId: number;
    lesson: any;
    assignment: any;
    quiz: any;
}

export default function LessonEditor({ courseId, lesson, assignment, quiz }: LessonEditorProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Active Tab state
    // Standalone quiz or assignment lessons open directly to their configuration
    const [activeTab, setActiveTab] = useState<"content" | "quiz" | "assignment" | "settings">(
        lesson.contentType === "quiz" ? "quiz" : 
        lesson.contentType === "assignment" ? "assignment" : "content"
    );

    // Base State
    const [title, setTitle] = useState(lesson.title);
    const [contentBody, setContentBody] = useState(lesson.contentBody || "");
    const [contentUrl, setContentUrl] = useState(lesson.contentUrl || "");

    // Scheduled Release & Manual Publish States
    const [isPublished, setIsPublished] = useState<boolean>(lesson.isPublished ?? true);
    const [releaseDate, setReleaseDate] = useState<string>(
        lesson.releaseDate ? new Date(lesson.releaseDate).toISOString().slice(0, 16) : ""
    );

    // Assignment State
    const [dueDate, setDueDate] = useState(assignment?.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : "");
    const [maxScore, setMaxScore] = useState(assignment?.maxScore || 100);
    const [assignmentDesc, setAssignmentDesc] = useState(assignment?.description || "");

    // Quiz State
    const [timeLimit, setTimeLimit] = useState(quiz?.timeLimitMinutes || 30);
    const [passingScore, setPassingScore] = useState(quiz?.passingScore || 50);
    const [quizDesc, setQuizDesc] = useState(quiz?.description || "");

    // Conditional Access
    const [prereqLessonId, setPrereqLessonId] = useState<string>(lesson.prerequisiteLessonId?.toString() || "none");

    // AI State
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLevel, setAiLevel] = useState("Intermediate");
    const [generating, setGenerating] = useState(false);
    const [robustAssignmentData, setRobustAssignmentData] = useState<any>(null);
    const [robustQuizData, setRobustQuizData] = useState<any>(null);

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setGenerating(true);
        const res = await generateLessonContent(aiPrompt, aiLevel);
        if (res.success && res.content) {
            setContentBody((prev: string) => prev ? prev + "\n\n" + res.content : res.content);
            setAiModalOpen(false);
            setAiPrompt("");
        } else {
            alert("Failed to generate content: " + (res.error || "Unknown error"));
        }
        setGenerating(false);
    };

    const handleSave = async () => {
        setLoading(true);
        
        // Construct Content Payload
        const data: any = {
            title,
            contentBody: lesson.contentType === 'text' ? contentBody : undefined,
            contentUrl: ['video', 'pdf', 'scorm', 'h5p'].includes(lesson.contentType) ? contentUrl : undefined,
        };

        // Always allow saving assignment details if present or configured
        if (lesson.contentType === 'assignment' || activeTab === 'assignment') {
            data.dueDate = dueDate ? new Date(dueDate) : undefined;
            data.maxScore = Number(maxScore);
            data.assignmentDescription = assignmentDesc;
            
            if (robustAssignmentData) {
                data.cutOffDate = robustAssignmentData.cutOffDate ? new Date(robustAssignmentData.cutOffDate) : undefined;
                data.includeInCa = robustAssignmentData.includeInCa;
                data.caAveragingMethod = robustAssignmentData.caAveragingMethod;
                data.allowResubmission = robustAssignmentData.allowResubmission;
                data.submissionTypes = robustAssignmentData.submissionTypes;
            }
        }

        // Always allow saving quiz details if present or configured
        if (lesson.contentType === 'quiz' || activeTab === 'quiz') {
            data.timeLimit = Number(timeLimit);
            data.passingScore = Number(passingScore);
            data.quizDescription = quizDesc;

            if (robustQuizData) {
                data.quizType = robustQuizData.quizType;
                data.slotId = robustQuizData.slotId;
                data.visibilityRule = robustQuizData.visibilityRule;
                data.gracePeriodMinutes = robustQuizData.gracePeriod;
                data.availableFrom = robustQuizData.availableFrom;
                data.availableUntil = robustQuizData.availableUntil;
            }
        }

        // Settings / scheduled release payload
        const settingsData = {
            prerequisiteLessonId: prereqLessonId === "none" ? null : Number(prereqLessonId),
            releaseDate: releaseDate ? new Date(releaseDate) : null,
            isPublished
        };

        try {
            const [res, settingsRes] = await Promise.all([
                updateLessonContent(lesson.id, data),
                updateLessonSettings(lesson.id, courseId, settingsData)
            ]);

            if (res.success && settingsRes.success) {
                alert("Saved successfully");
            } else {
                alert("Failed to save changes: " + (res.error || settingsRes.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save changes.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Unified Top Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lesson Title</label>
                    <Input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0 h-8 text-slate-800"
                        placeholder="Input Lesson Title"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold px-6 py-5">
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Lesson Settings
                    </Button>
                </div>
            </div>

            {/* Custom Premium Tabs Navigation Bar */}
            <div className="flex border-b border-slate-200 gap-1 bg-slate-50 p-1 rounded-xl">
                {/* 1. Learning Content Tab */}
                {lesson.contentType !== "quiz" && lesson.contentType !== "assignment" && (
                    <button
                        type="button"
                        onClick={() => setActiveTab("content")}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === "content" 
                                ? "bg-white text-indigo-600 shadow-sm" 
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Learning Material
                    </button>
                )}

                {/* 2. CBT Quiz Assessment Tab */}
                <button
                    type="button"
                    onClick={() => setActiveTab("quiz")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === "quiz" 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                    }`}
                >
                    <HelpCircle className="w-4 h-4" />
                    CBT Assessment Quiz
                </button>

                {/* 3. Practical Assignment Tab */}
                <button
                    type="button"
                    onClick={() => setActiveTab("assignment")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === "assignment" 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                    }`}
                >
                    <ClipboardCheck className="w-4 h-4" />
                    Lesson Assignment
                </button>

                {/* 4. Release & Conditional Access Settings Tab */}
                <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === "settings" 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                    }`}
                >
                    <Settings className="w-4 h-4" />
                    Release & Flow Locks
                </button>
            </div>

            {/* TAB CONTENTS CONTAINER */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[450px]">
                
                {/* 1. LEARNING CONTENT TAB */}
                {activeTab === "content" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {lesson.contentType === 'text' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">Rich Text Content Builder</h3>
                                        <p className="text-xs text-slate-400">Design your lesson page beautifully with headings, tables, list items, and media uploads.</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-9 px-4 text-xs font-bold rounded-xl shadow-sm"
                                        onClick={() => setAiModalOpen(true)}
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" /> Generate with AI
                                    </Button>
                                </div>
                                <RichEditor value={contentBody} onChange={setContentBody} />
                            </div>
                        )}

                        {['video', 'pdf', 'scorm', 'h5p'].includes(lesson.contentType) && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Multimedia Attachment Resource</h3>
                                    <p className="text-xs text-slate-400">Upload your dedicated {lesson.contentType.toUpperCase()} asset file below.</p>
                                </div>
                                <FileUploadZone
                                    currentUrl={contentUrl}
                                    uploading={uploading}
                                    onUpload={async (file) => {
                                        setUploading(true);
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        const res = lesson.contentType === 'h5p' ? await uploadH5P(formData) : await uploadFile(formData);
                                        if (res.success) setContentUrl((res as any).url!);
                                        else alert("Upload failed: " + (res.error || "Unknown error"));
                                        setUploading(false);
                                    }}
                                    accept={
                                        lesson.contentType === 'video' ? { 'video/*': [] } :
                                            lesson.contentType === 'pdf' ? { 'application/pdf': ['.pdf'] } :
                                                lesson.contentType === 'h5p' ? { 'application/octet-stream': ['.h5p'] } :
                                                    { 'application/zip': ['.zip'] }
                                    }
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 2. CBT QUIZ ASSESSMENT TAB */}
                {activeTab === "quiz" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-purple-800 flex items-start gap-3">
                            <HelpCircle className="w-5 h-5 mt-0.5 text-purple-600" />
                            <div>
                                <h3 className="font-bold">Interactive Lesson CBT Assessment</h3>
                                <p className="text-xs mt-1 text-purple-600/80">Configure properties for the CBT quiz linked directly to this lesson.</p>
                            </div>
                        </div>

                        <QuizConfigForm 
                            quiz={quiz}
                            onChange={(data) => {
                                setTimeLimit(data.timeLimit);
                                setPassingScore(data.passingScore);
                                setRobustQuizData(data);
                            }}
                        />

                        <div className="border-t border-slate-100 pt-6 mt-6">
                            <h4 className="font-bold text-slate-800 mb-4">CBT Questions Editor & Database</h4>
                            <QuizEditor lessonId={lesson.id} quizId={lesson.quiz?.id || quiz?.id} />
                        </div>
                    </div>
                )}

                {/* 3. PRACTICAL ASSIGNMENT TAB */}
                {activeTab === "assignment" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-emerald-800 flex items-start gap-3">
                            <ClipboardCheck className="w-5 h-5 mt-0.5 text-emerald-600" />
                            <div>
                                <h3 className="font-bold">Practical Lesson Homework Assignment</h3>
                                <p className="text-xs mt-1 text-emerald-600/80">Set practical problems, instructions, scoring models, and grading rubrics.</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Assignment Instructions & Description</label>
                            <textarea
                                className="w-full min-h-[180px] p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/30 focus:outline-none"
                                value={assignmentDesc}
                                onChange={(e) => setAssignmentDesc(e.target.value)}
                                placeholder="Write clear, comprehensive details for homework tasks..."
                            />
                        </div>

                        <AssignmentConfigForm 
                            assignment={assignment} 
                            onChange={(data) => {
                                setDueDate(data.dueDate);
                                setMaxScore(data.maxScore);
                                setRobustAssignmentData(data);
                            }} 
                        />
                    </div>
                )}

                {/* 4. RELEASE & CONDITIONAL LOCKS TAB */}
                {activeTab === "settings" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Publishing Schedule Panel */}
                        <div className="p-6 rounded-2xl border border-slate-200/80 bg-white space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Publishing Timeline Schedule</h3>
                                    <p className="text-[10px] text-slate-400">Determine who can see the lesson and when it will unlock for students.</p>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Manual Publish Switch */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">Manual Visibility Switch</label>
                                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 bg-slate-50/30 hover:border-slate-300 transition-colors">
                                        <button
                                            type="button"
                                            onClick={() => setIsPublished(!isPublished)}
                                            className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                                                isPublished ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                            }`}
                                        >
                                            {isPublished ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                        </button>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{isPublished ? "Currently Published" : "Hidden Draft State"}</p>
                                            <p className="text-[10px] text-slate-400">{isPublished ? "Students can access this if timeline/locks permit." : "Completely hidden for all students."}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Scheduled Release Date */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">Future Scheduled Release (Optional)</label>
                                    <Input
                                        type="datetime-local"
                                        value={releaseDate}
                                        onChange={(e) => setReleaseDate(e.target.value)}
                                        className="h-11 rounded-xl border-slate-200 text-slate-600 font-medium"
                                    />
                                    <p className="text-[10px] text-slate-400">Leave empty to release immediately. If set, student lockout is automatically enforced until this date.</p>
                                </div>
                            </div>
                        </div>

                        {/* Sequential Prerequisite Locking Panel */}
                        <div className="p-6 rounded-2xl border border-slate-200/80 bg-white space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Conditional Access Flows</h3>
                                    <p className="text-[10px] text-slate-400 font-medium text-slate-400">Control learning paths by requiring previous tasks completion.</p>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-2 block">Lock Prerequisite Lesson</label>
                                <Select value={prereqLessonId} onValueChange={setPrereqLessonId}>
                                    <SelectTrigger className="bg-white h-11 rounded-xl border-slate-200 text-slate-600 font-medium">
                                        <SelectValue placeholder="Select a lesson that must be completed first" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-lg border-slate-100">
                                        <SelectItem value="none" className="rounded-lg py-2.5 font-bold">No Prerequisite (Unlocked by default)</SelectItem>
                                        {/* Dynamic lesson options would be passed in a real scenario */}
                                        <SelectItem value="1" className="rounded-lg py-2.5">Introductory Lesson (Example)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-slate-400 mt-2 font-semibold">Students cannot access this lesson until they successfully complete and pass the selected prerequisite lesson.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Generator Modal */}
            <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title="Generate Content with AI">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Topic / Concept</label>
                        <Input
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="e.g., The Laws of Thermodynamics"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Complexity Level</label>
                        <select
                            className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
                            value={aiLevel}
                            onChange={(e) => setAiLevel(e.target.value)}
                        >
                            <option value="Beginner">Beginner (Primary/JSS)</option>
                            <option value="Intermediate">Intermediate (SSS)</option>
                            <option value="Advanced">Advanced (Undergrad)</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setAiModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAiGenerate} disabled={generating}>
                            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Generate
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
