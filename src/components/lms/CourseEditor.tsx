"use client";

import { useState } from "react";
import {
    Plus,
    Trash2,
    MoveUp,
    MoveDown,
    FileText,
    FileVideo,
    FileBox,
    ClipboardCheck,
    Sparkles,
    Settings,
    Lock,
    Unlock,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createModule, createLesson, deleteModule, deleteLesson, reorderModules, createCourseFromAI, updateModuleSettings, updateCourseSettings } from "@/actions/lms";
import { uploadFile } from "@/actions/upload";
import { generateCourseStructure } from "@/actions/ai-lms";
import { cn } from "@/lib/utils";
import FileUploadZone from "./FileUploadZone";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Lesson {
    id: number;
    title: string;
    contentType: 'text' | 'video' | 'pdf' | 'scorm' | 'quiz' | 'assignment';
    contentUrl?: string;
    contentBody?: string;
    order: number;
    prerequisiteLessonId?: number;
}

interface Module {
    id: number;
    title: string;
    order: number;
    lessons: Lesson[];
    isLocked?: boolean;
    prerequisiteModuleId?: number;
}

interface CourseEditorProps {
    courseId: number;
    initialModules: Module[];
    initialFormatSettings?: {
        courseFormat: 'topics' | 'weeks' | 'days';
        courseStartDate: string | null;
        totalDurationWeeks: number;
        flowControl: 'sequential' | 'open';
        minPassingScore: number;
    };
}

export default function CourseEditor({ courseId, initialModules, initialFormatSettings }: CourseEditorProps) {
    const [modules, setModules] = useState<Module[]>(initialModules);
    const [loading, setLoading] = useState(false);

    // Course Settings State
    const [isCourseSettingsOpen, setIsCourseSettingsOpen] = useState(false);
    const [courseFormat, setCourseFormat] = useState<'topics' | 'weeks' | 'days'>(initialFormatSettings?.courseFormat || 'topics');
    const [courseStartDate, setCourseStartDate] = useState<string>(initialFormatSettings?.courseStartDate || "");
    const [totalDurationWeeks, setTotalDurationWeeks] = useState<number>(initialFormatSettings?.totalDurationWeeks || 12);
    const [flowControl, setFlowControl] = useState<'sequential' | 'open'>(initialFormatSettings?.flowControl || 'open');
    const [minPassingScore, setMinPassingScore] = useState<number>(initialFormatSettings?.minPassingScore || 75);


    // Module Modal State
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState("");

    // Lesson Modal State
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
    const [newLessonTitle, setNewLessonTitle] = useState("");
    const [newLessonType, setNewLessonType] = useState<'text' | 'video' | 'pdf' | 'scorm' | 'quiz' | 'assignment'>("text");
    const [newLessonContent, setNewLessonContent] = useState(""); // URL or Body
    const [uploading, setUploading] = useState(false);

    // AI Structure State
    const [aiStructureModalOpen, setAiStructureModalOpen] = useState(false);
    const [aiTopic, setAiTopic] = useState("");
    const [generatingStructure, setGeneratingStructure] = useState(false);

    // Module Settings State
    const [isModuleSettingsOpen, setIsModuleSettingsOpen] = useState(false);
    const [settingsModuleId, setSettingsModuleId] = useState<number | null>(null);
    const [settingsModuleTitle, setSettingsModuleTitle] = useState("");
    const [isLocked, setIsLocked] = useState(false);
    const [prereqModuleId, setPrereqModuleId] = useState<string>("none");

    // -- AI ACTIONS --
    const handleAiStructureGenerate = async () => {
        if (!aiTopic.trim()) return;
        setGeneratingStructure(true);
        const res = await generateCourseStructure(aiTopic);
        if (res.success && res.modules) {
            const createRes = await createCourseFromAI(courseId, res.modules);
            if (createRes.success) {
                setAiStructureModalOpen(false);
                setAiTopic("");
                window.location.reload();
            } else {
                alert("Failed to save generated structure");
            }
        } else {
            alert("Failed to generate structure: " + (res.error || "Unknown error"));
        }
        setGeneratingStructure(false);
    };

    // -- MODULE ACTIONS --

    const handleCreateModule = async () => {
        if (!newModuleTitle.trim()) return;
        setLoading(true);
        const order = modules.length + 1;
        const res = await createModule(courseId, newModuleTitle, order);
        if (res.success) {
            setNewModuleTitle("");
            setIsModuleModalOpen(false);
            window.location.reload();
        } else {
            alert("Failed to create module");
        }
        setLoading(false);
    };

    const handleOpenSettings = (module: Module) => {
        setSettingsModuleId(module.id);
        setSettingsModuleTitle(module.title);
        setIsLocked(module.isLocked || false);
        setPrereqModuleId(module.prerequisiteModuleId?.toString() || "none");
        setIsModuleSettingsOpen(true);
    };

    const handleSaveModuleSettings = async () => {
        if (!settingsModuleId) return;
        setLoading(true);
        const res = await updateModuleSettings(settingsModuleId, courseId, {
            title: settingsModuleTitle,
            isLocked: isLocked,
            prerequisiteModuleId: prereqModuleId === "none" ? null : Number(prereqModuleId)
        });
        if (res.success) {
            setIsModuleSettingsOpen(false);
            window.location.reload();
        } else {
            alert("Failed to update module settings");
        }
        setLoading(false);
    };

    const handleDeleteModule = async (moduleId: number) => {
        if (!confirm("Are you sure? All lessons will be deleted.")) return;
        setModules(prev => prev.filter(m => m.id !== moduleId));
        await deleteModule(moduleId, courseId);
    };

    const moveModule = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === modules.length - 1) return;

        const newModules = [...modules];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newModules[index], newModules[swapIndex]] = [newModules[swapIndex], newModules[index]];
        newModules.forEach((m, i) => m.order = i + 1);
        setModules(newModules);

        const updates = newModules.map(m => ({ id: m.id, order: m.order }));
        await reorderModules(updates, courseId);
    };

    // -- LESSON ACTIONS --

    const openAddLesson = (moduleId: number) => {
        setActiveModuleId(moduleId);
        setNewLessonTitle("");
        setNewLessonType("text");
        setNewLessonContent("");
        setIsLessonModalOpen(true);
    };

    const handleCreateLesson = async () => {
        if (!activeModuleId || !newLessonTitle.trim()) return;
        setLoading(true);
        const module = modules.find(m => m.id === activeModuleId);
        const order = (module?.lessons.length || 0) + 1;
        const res = await createLesson(activeModuleId, newLessonTitle, order, newLessonType, newLessonContent);
        if (res.success) {
            window.location.reload();
        } else {
            alert("Failed to create lesson");
        }
        setLoading(false);
    };

    const handleDeleteLesson = async (lessonId: number) => {
        if (!confirm("Delete this lesson?")) return;
        setModules(prev => prev.map(m => ({
            ...m,
            lessons: m.lessons.filter(l => l.id !== lessonId)
        })));
        await deleteLesson(lessonId, courseId);
    };

    const handleSaveCourseSettings = async () => {
        setLoading(true);
        const res = await updateCourseSettings(courseId, {
            courseFormat,
            courseStartDate: courseStartDate || null,
            totalDurationWeeks: Number(totalDurationWeeks),
            flowControl,
            minPassingScore: Number(minPassingScore)
        });
        if (res.success) {
            setIsCourseSettingsOpen(false);
            window.location.reload();
        } else {
            alert("Failed to update course settings");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Course Editor</h1>
                <div className="flex gap-2">
                    <Button variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50" onClick={() => setIsCourseSettingsOpen(true)}>
                        <Settings className="w-4 h-4 mr-2" /> Course Settings
                    </Button>
                    <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setAiStructureModalOpen(true)}>
                        <Sparkles className="w-4 h-4 mr-2" /> AI Generate
                    </Button>
                    <Button onClick={() => setIsModuleModalOpen(true)}>

                        <Plus className="w-4 h-4 mr-2" /> Add Module
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {modules.map((module, index) => (
                    <div key={module.id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                        <div className="p-4 bg-slate-50 border-b flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => moveModule(index, 'up')} disabled={index === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-20">
                                        <MoveUp className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => moveModule(index, 'down')} disabled={index === modules.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-20">
                                        <MoveDown className="w-4 h-4" />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{module.title}</h3>
                                    {module.isLocked && <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Locked</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => openAddLesson(module.id)}>
                                    <Plus className="w-4 h-4 mr-2" /> Lesson
                                </Button>
                                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-600" onClick={() => handleOpenSettings(module)}>
                                    <Settings className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteModule(module.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-2 space-y-2">
                            {module.lessons.map((lesson) => (
                                <div key={lesson.id} className="flex items-center justify-between p-3 rounded bg-white border hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {lesson.contentType === 'video' ? <FileVideo className="w-4 h-4 text-blue-500" /> :
                                            lesson.contentType === 'scorm' ? <FileBox className="w-4 h-4 text-orange-500" /> :
                                                lesson.contentType === 'quiz' ? <ClipboardCheck className="w-4 h-4 text-purple-500" /> :
                                                    lesson.contentType === 'assignment' ? <ClipboardCheck className="w-4 h-4 text-green-500" /> :
                                                        <FileText className="w-4 h-4 text-slate-500" />}
                                        <span className="text-sm font-medium">{lesson.title}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">{lesson.contentType}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-500" onClick={() => window.location.href = `/staff/courses/${courseId}/lesson/${lesson.id}/edit`}>
                                            <FileText className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDeleteLesson(lesson.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {module.lessons.length === 0 && (
                                <div className="text-center py-4 text-sm text-slate-400 italic">No lessons in this module</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            <Modal isOpen={isModuleModalOpen} onClose={() => setIsModuleModalOpen(false)} title="Add New Module">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Module Title</label>
                        <Input value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="e.g., Introduction to Biology" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsModuleModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateModule} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Module"}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} title="Add Lesson">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Lesson Title</label>
                        <Input value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} placeholder="e.g., Chapter 1 Video" />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Type</label>
                        <select
                            className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                            value={newLessonType}
                            onChange={(e) => setNewLessonType(e.target.value as any)}
                        >
                            <option value="text">Rich Text</option>
                            <option value="video">Video</option>
                            <option value="pdf">PDF Document</option>
                            <option value="scorm">SCORM Package</option>
                            <option value="assignment">Assignment</option>
                            <option value="quiz">Quiz</option>
                        </select>
                    </div>

                    {['video', 'pdf', 'scorm'].includes(newLessonType) && (
                        <div>
                            <label className="text-sm font-medium mb-1 block">{newLessonType === 'scorm' ? 'SCORM Package (.zip)' : 'Content File'}</label>
                            <FileUploadZone
                                currentUrl={newLessonContent}
                                uploading={uploading}
                                onUpload={async (file) => {
                                    setUploading(true);
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    const res = await uploadFile(formData);
                                    if (res.success) setNewLessonContent((res as any).url!);
                                    else alert("Upload failed");
                                    setUploading(false);
                                }}
                                label={`Drag & drop ${newLessonType} here`}
                                accept={
                                    newLessonType === 'video' ? { 'video/*': [] } :
                                        newLessonType === 'pdf' ? { 'application/pdf': ['.pdf'] } :
                                            { 'application/zip': ['.zip'] }
                                }
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setIsLessonModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateLesson} disabled={loading || uploading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Lesson"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isModuleSettingsOpen} onClose={() => setIsModuleSettingsOpen(false)} title="Module Settings">
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Module Title</label>
                        <Input value={settingsModuleTitle} onChange={(e) => setSettingsModuleTitle(e.target.value)} />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shadow-sm", isLocked ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600")}>
                                    {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Lock Module</p>
                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Manual lock control</p>
                                </div>
                            </div>
                            <button onClick={() => setIsLocked(!isLocked)} className={cn("w-12 h-6 rounded-full transition-colors relative", isLocked ? "bg-rose-500" : "bg-slate-200")}>
                                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-transform", isLocked ? "translate-x-7" : "translate-x-1")} />
                            </button>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Prerequisite Module</label>
                            <Select value={prereqModuleId} onValueChange={setPrereqModuleId}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Unlock after completing..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Prerequisite</SelectItem>
                                    {modules.filter(m => m.id !== settingsModuleId).map(m => (
                                        <SelectItem key={m.id} value={m.id.toString()}>{m.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setIsModuleSettingsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveModuleSettings} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={aiStructureModalOpen} onClose={() => setAiStructureModalOpen(false)} title="Generate Course Structure">
                <div className="space-y-4">
                    <Input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="e.g., Introduction to Python" />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setAiStructureModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAiStructureGenerate} disabled={generatingStructure}>
                            {generatingStructure ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Generate"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isCourseSettingsOpen} onClose={() => setIsCourseSettingsOpen(false)} title="Moodle-Style Course Format & Flow Settings">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Course Format</label>
                        <select
                            className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                            value={courseFormat}
                            onChange={(e) => setCourseFormat(e.target.value as any)}
                        >
                            <option value="topics">Topics Format</option>
                            <option value="weeks">Weekly Format</option>
                            <option value="days">Daily Format</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Course Start Date</label>
                        <Input
                            type="date"
                            value={courseStartDate}
                            onChange={(e) => setCourseStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Total Duration (Weeks)</label>
                        <Input
                            type="number"
                            min={1}
                            max={52}
                            value={totalDurationWeeks}
                            onChange={(e) => setTotalDurationWeeks(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Flow Control Locking Gate</label>
                        <select
                            className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                            value={flowControl}
                            onChange={(e) => setFlowControl(e.target.value as any)}
                        >
                            <option value="open">Open (Students can access any lesson anytime)</option>
                            <option value="sequential">Sequential (Enforce chronology & locks)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Min passing Score (%) for locks</label>
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            value={minPassingScore}
                            onChange={(e) => setMinPassingScore(Number(e.target.value))}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setIsCourseSettingsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveCourseSettings} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Course Settings"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

