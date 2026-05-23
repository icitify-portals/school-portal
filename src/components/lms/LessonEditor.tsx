"use client";

import { useState, useCallback } from "react";
import QuizEditor from "./QuizEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateLessonContent } from "@/actions/lms";
import { Loader2, Save, ArrowLeft, FileText, Video, FileBox, ClipboardCheck, HelpCircle, Sparkles } from "lucide-react";
import { uploadFile } from "@/actions/upload";
import { Modal } from "@/components/ui/modal";
import { generateLessonContent } from "@/actions/ai-lms";
import FileUploadZone from "./FileUploadZone";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AssignmentConfigForm from "./AssignmentConfigForm";
import QuizConfigForm from "./QuizConfigForm";
import { uploadH5P } from "@/actions/h5p";

interface LessonEditorProps {
    courseId: number;
    lesson: any;
    assignment: any;
    quiz: any;
}

export default function LessonEditor({ courseId, lesson, assignment, quiz }: LessonEditorProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Base State
    const [title, setTitle] = useState(lesson.title);
    const [contentBody, setContentBody] = useState(lesson.contentBody || "");
    const [contentUrl, setContentUrl] = useState(lesson.contentUrl || "");

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
        const data: any = {
            title,
            contentBody: lesson.contentType === 'text' ? contentBody : undefined,
            contentUrl: ['video', 'pdf', 'scorm', 'h5p'].includes(lesson.contentType) ? contentUrl : undefined,
        };

        if (lesson.contentType === 'assignment') {
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

        if (lesson.contentType === 'quiz') {
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

        // Settings data
        const settingsData = {
            prerequisiteLessonId: prereqLessonId === "none" ? null : Number(prereqLessonId)
        };

        const [res, settingsRes] = await Promise.all([
            updateLessonContent(lesson.id, data),
            // We need updateLessonSettings or similar. Let's assume we can pass it to updateLessonContent 
            // but for now let's use the new action.
            import("@/actions/lms").then(m => m.updateLessonSettings(lesson.id, courseId, settingsData))
        ]);

        if (res.success && settingsRes.success) {
            alert("Saved successfully");
        } else {
            alert("Failed to save some changes");
        }
        setLoading(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const res = await uploadFile(formData);
        if (res.success) {
            setContentUrl((res as any).url!);
        } else {
            alert("Upload failed");
        }
        setUploading(false);
    };

    return (
        <div className="space-y-6">
            {/* Header / Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">Lesson Title</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="flex items-end justify-end">
                    <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Type Specific Forms */}

            {lesson.contentType === 'text' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium mb-1 block">Lesson Content (Rich Text)</label>
                        <Button
                            variant="outline"
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-8 px-3 text-xs"
                            onClick={() => setAiModalOpen(true)}
                        >
                            <Sparkles className="w-4 h-4 mr-2" /> Generate with AI
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Rich text editor integration would go here. Using plain text for now.</p>
                    <textarea
                        className="w-full min-h-[300px] p-4 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        value={contentBody}
                        onChange={(e) => setContentBody(e.target.value)}
                    />
                </div>
            )}

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

            {['video', 'pdf', 'scorm', 'h5p'].includes(lesson.contentType) && (
                <div className="space-y-4">
                    <label className="text-sm font-medium mb-1 block">
                        {lesson.contentType === 'scorm' ? 'SCORM Package (.zip)' : lesson.contentType === 'h5p' ? 'H5P Package (.h5p)' : 'Content File'}
                    </label>
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

            {lesson.contentType === 'assignment' && (
                <div className="space-y-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-green-800 flex items-start gap-3">
                        <ClipboardCheck className="w-5 h-5 mt-0.5" />
                        <div>
                            <h3 className="font-semibold">Assignment Instructions</h3>
                            <p className="text-sm mt-1">Provide clear guidelines for your students.</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Description / Instructions</label>
                        <textarea
                            className="w-full min-h-[150px] p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50"
                            value={assignmentDesc}
                            onChange={(e) => setAssignmentDesc(e.target.value)}
                            placeholder="Explain what the student needs to do..."
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

            {lesson.contentType === 'quiz' && (
                <div className="space-y-6">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-purple-800 flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 mt-0.5" />
                        <div>
                            <h3 className="font-semibold">Quiz Configuration</h3>
                            <p className="text-sm mt-1">Configure quiz settings. (Questions builder coming soon)</p>
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

                    <div className="border-t border-slate-200 pt-6 mt-6">
                        <label className="text-sm font-medium mb-4 block">Quiz Questions</label>
                        <QuizEditor lessonId={lesson.id} quizId={lesson.quiz?.id} />
                    </div>
                </div>
            )}

            <hr className="border-slate-100" />

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800">Conditional Access</h3>
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">Prerequisite Lesson</label>
                    <Select value={prereqLessonId} onValueChange={setPrereqLessonId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select a lesson that must be completed first" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Prerequisite (Unlocked by default)</SelectItem>
                            {/* In a real scenario we'd pass all lessons for this course to this component */}
                            <SelectItem value="1">Introductory Lesson (Example)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Students cannot access this lesson until the selected prerequisite is completed.</p>
                </div>
            </div>
        </div>
    );
}
