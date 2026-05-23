"use client";

import { useState, useEffect } from "react";
import ScormPlayer from "./ScormPlayer";
import H5PPlayer from "./H5PPlayer";
import QuizTaker from "./QuizTaker";
import {
    Lock,
    Unlock,
    PlayCircle,
    FileText,
    CheckCircle,
    Circle,
    ChevronDown,
    ChevronRight,
    Menu,
    X,
    FileVideo,
    Minimize2,
    Loader2,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateProgress, submitAssignment } from "@/actions/lms";
import { uploadFile } from "@/actions/upload";
import { getActiveLectureSession, markOnlinePresence } from "@/actions/attendance";
import { toast } from "sonner";
import { Users, Clock, PartyPopper, Award, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import SubmissionPortal from "./SubmissionPortal";
import PDFAnnotator from "./PDFAnnotator";
import { Sparkles, CalendarDays, Lock as LockIcon } from "lucide-react";
import { isBefore } from "date-fns";

interface Lesson {
    id: number;
    title: string;
    contentType: 'text' | 'video' | 'pdf' | 'scorm' | 'quiz' | 'assignment' | 'h5p';
    contentUrl?: string;
    contentBody?: string;
    isLocked: boolean;
    isCompleted: boolean;
    durationMinutes?: number;
    quiz?: any;
    assignment?: {
        id: number;
        title: string;
        description: string;
        dueDate?: string;
        cutOffDate?: string;
        maxScore: number;
        submissionTypes: string; // JSON string
        rubricId?: number;
    };
    submission?: {
        id: number;
        fileUrl?: string;
        onlineText?: string;
        status: 'submitted' | 'late' | 'draft';
        score?: number;
        feedback?: string;
        annotations?: string;
    };
}

interface Module {
    id: number;
    title: string;
    isLocked: boolean;
    isCompleted: boolean;
    lessons: Lesson[];
}

interface CoursePlayerProps {
    courseId: number;
    studentId: number;
    initialContent: Module[];
    courseTitle: string;
}

export default function CoursePlayer({ courseId, studentId, initialContent, courseTitle }: CoursePlayerProps) {
    const [modules, setModules] = useState<Module[]>(initialContent);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedModules, setExpandedModules] = useState<number[]>([]);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [attendanceStatus, setAttendanceStatus] = useState<'idle' | 'present' | 'loading'>('idle');
    const [courseProgress, setCourseProgress] = useState({ percentage: 0, isComplete: false });
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    // Check for active lecture session
    useEffect(() => {
        const checkSession = async () => {
            const res = await getActiveLectureSession(courseId);
            if (res.success && res.session) {
                setActiveSession(res.session);
                // Also check if already marked present?
                // For simplicity, we'll let the markOnlinePresence action handle it.
            }
        };
        checkSession();
    }, [courseId]);

    const handleMarkAttendance = async (action: 'in' | 'out') => {
        if (!activeSession) return;
        setAttendanceStatus('loading');
        const res = await markOnlinePresence(activeSession.id, action);
        if (res.success) {
            setAttendanceStatus(action === 'in' ? 'present' : 'idle');
            toast.success(action === 'in' ? "Presence marked successfully!" : "Checkout successful.");
        } else {
            toast.error(res.error || "Failed to mark attendance.");
            setAttendanceStatus('idle');
        }
    };

    // Auto-select first unlocked lesson
    useEffect(() => {
        if (!currentLesson && modules.length > 0) {
            for (const m of modules) {
                if (!m.isLocked) {
                    const firstLesson = m.lessons.find(l => !l.isLocked);
                    if (firstLesson) {
                        setCurrentLesson(firstLesson);
                        setExpandedModules(prev => [...prev, m.id]);
                        break;
                    }
                }
            }
        }
    }, [modules]);

    const handleLessonSelect = (lesson: Lesson) => {
        if (lesson.isLocked) return;
        setCurrentLesson(lesson);
        // On mobile, close sidebar
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    const toggleModule = (modId: number) => {
        setExpandedModules(prev =>
            prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
        );
    };

    const handleMarkComplete = async () => {
        if (!currentLesson) return;

        // Optimistic update
        const updatedModules = modules.map(m => ({
            ...m,
            lessons: m.lessons.map(l =>
                l.id === currentLesson.id ? { ...l, isCompleted: true } : l
            )
        }));
        setModules(updatedModules);


        const res = await updateProgress(studentId, courseId, currentLesson.id, 'lesson', true);

        if (res.success) {
            setCourseProgress({
                percentage: res.percentage || 0,
                isComplete: !!res.isCourseComplete
            });

            if (res.isCourseComplete) {
                setShowCompletionModal(true);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#4F46E5', '#10B981', '#F59E0B']
                });
            }
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
            {/* Sidebar Toggle (Mobile) */}
            <div className="md:hidden fixed bottom-4 right-4 z-50">
                <Button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="rounded-full h-12 w-12 shadow-xl bg-indigo-600 hover:bg-indigo-700"
                >
                    {sidebarOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* Sidebar */}
            <div className={cn(
                "w-80 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 absolute md:relative h-full z-40",
                sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden"
            )}>
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-bold text-slate-800 line-clamp-2">{courseTitle}</h2>
                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                        <span>{courseProgress.percentage.toFixed(0)}% Completed</span>
                        <span>{modules.reduce((acc, m) => acc + m.lessons.filter(l => l.isCompleted).length, 0)} / {modules.reduce((acc, m) => acc + m.lessons.length, 0)} Lessons</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden shadow-inner">
                        <div
                            className={cn(
                                "h-full transition-all duration-1000 ease-out",
                                courseProgress.isComplete ? "bg-emerald-500" : "bg-indigo-500"
                            )}
                            style={{
                                width: `${courseProgress.percentage}%`
                            }}
                        />
                    </div>

                    {/* Attendance Status */}
                    {activeSession && (
                        <div className="mt-4 p-4 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-100 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Live Lecture</span>
                                </div>
                                <Badge variant="outline" className="text-[8px] border-white/30 text-white font-black">{activeSession.type.toUpperCase()}</Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase italic leading-none">Class Session Ongoing</p>
                                <p className="text-[8px] font-bold text-blue-100 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Started at {new Date(activeSession.startTime).toLocaleTimeString()}
                                </p>
                            </div>

                            {attendanceStatus === 'present' ? (
                                <Button
                                    onClick={() => handleMarkAttendance('out')}
                                    className="w-full h-8 bg-white/20 hover:bg-white/30 text-white border-none text-[8px] font-black uppercase tracking-widest rounded-lg"
                                >
                                    Leave Class
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => handleMarkAttendance('in')}
                                    disabled={attendanceStatus === 'loading'}
                                    className="w-full h-10 bg-white text-blue-600 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] rounded-lg shadow-sm"
                                >
                                    {attendanceStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join & Mark Presence"}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {modules.map(module => (
                        <div key={module.id} className="border-b border-slate-100">
                            <button
                                onClick={() => toggleModule(module.id)}
                                className={cn(
                                    "w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors",
                                    module.isLocked && "opacity-50 cursor-not-allowed bg-slate-50"
                                )}
                            >
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                    {module.isLocked ? <Lock className="w-4 h-4 text-slate-400" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
                                    <span className="text-left">{module.title}</span>
                                </div>
                                {expandedModules.includes(module.id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                            </button>

                            {expandedModules.includes(module.id) && (
                                <div className="bg-slate-50/50">
                                    {module.lessons.map(lesson => (
                                        <button
                                            key={lesson.id}
                                            onClick={() => handleLessonSelect(lesson)}
                                            disabled={lesson.isLocked}
                                            className={cn(
                                                "w-full px-4 py-2 pl-10 flex items-center justify-between text-xs transition-all border-l-2",
                                                currentLesson?.id === lesson.id
                                                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium"
                                                    : "border-transparent hover:bg-slate-100 text-slate-600",
                                                lesson.isLocked && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {lesson.contentType === 'video' || lesson.contentType === 'scorm' ? <FileVideo className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                                <span className="truncate max-w-[140px]">{lesson.title}</span>
                                                {lesson.contentType === 'quiz' && lesson.quiz && (
                                                    (() => {
                                                        const effectiveStart = lesson.quiz.slot?.startTime ? new Date(lesson.quiz.slot.startTime) : (lesson.quiz.availableFrom ? new Date(lesson.quiz.availableFrom) : null);
                                                        const isPending = effectiveStart && isBefore(new Date(), effectiveStart);
                                                        if (isPending) {
                                                            return (
                                                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-1.5 h-4 text-[7px] font-black uppercase tracking-tighter">
                                                                    Pending
                                                                </Badge>
                                                            );
                                                        }
                                                        return null;
                                                    })()
                                                )}
                                            </div>
                                            {lesson.isLocked ? (
                                                <Lock className="w-3 h-3 text-slate-300" />
                                            ) : lesson.isCompleted ? (
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                            ) : (
                                                <Circle className="w-3.5 h-3.5 text-slate-300" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col h-full relative">
                {/* Desktop Toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-sm border border-slate-200 hidden md:block hover:bg-slate-50"
                >
                    {sidebarOpen ? <Minimize2 className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {currentLesson ? (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold text-slate-900">{currentLesson.title}</h1>
                                {!currentLesson.isCompleted && currentLesson.contentType !== 'scorm' && (
                                    <Button onClick={handleMarkComplete} variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                        <CheckCircle className="w-4 h-4" />
                                        Mark Complete
                                    </Button>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                                {currentLesson.contentType === 'h5p' && currentLesson.contentUrl ? (
                                    <H5PPlayer
                                        h5pJsonPath={currentLesson.contentUrl}
                                        onComplete={(score) => handleMarkComplete()}
                                    />
                                ) : currentLesson.contentType === 'scorm' && currentLesson.contentUrl ? (
                                    <ScormPlayer
                                        src={currentLesson.contentUrl}
                                        studentId={studentId}
                                        courseId={courseId}
                                        lessonId={currentLesson.id}
                                        onComplete={handleMarkComplete}
                                    />
                                ) : currentLesson.contentType === 'video' && currentLesson.contentUrl ? (
                                    <div className="aspect-video bg-black flex items-center justify-center">
                                        <video controls className="w-full h-full" src={currentLesson.contentUrl} onEnded={handleMarkComplete} />
                                    </div>
                                ) : currentLesson.contentType === 'pdf' && currentLesson.contentUrl ? (
                                    <iframe src={currentLesson.contentUrl} className="w-full h-[800px]" />
                                ) : currentLesson.contentType === 'assignment' ? (
                                    <AssignmentView
                                        lesson={currentLesson}
                                        studentId={studentId}
                                        onSubmit={() => handleMarkComplete()}
                                    />
                                ) : currentLesson.contentType === 'quiz' ? (
                                    <QuizTaker
                                        quiz={currentLesson.quiz}
                                        studentId={studentId}
                                        onComplete={handleMarkComplete}
                                    />
                                ) : (
                                    <div className="p-8 prose prose-slate max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: currentLesson.contentBody || "<p>No content available.</p>" }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <PlayCircle className="w-16 h-16 mb-4 opacity-50" />
                            <p>Select a lesson to begin learning.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AssignmentView({ lesson, studentId, onSubmit }: { lesson: Lesson, studentId: number, onSubmit: () => void }) {
    const [viewMode, setViewMode] = useState<'details' | 'submit' | 'feedback'>('details');
    const assignment = lesson.assignment;
    const submission = lesson.submission;

    useEffect(() => {
        if (submission) setViewMode('feedback');
    }, [submission]);

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* 1. Header with Status */}
            <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{assignment?.title || lesson.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] uppercase font-black border-slate-200 text-slate-400">Assignment</Badge>
                            {submission && (
                                <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-black uppercase tracking-widest">
                                    {submission.status.toUpperCase()}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant={viewMode === 'details' ? 'default' : 'ghost'} 
                        onClick={() => setViewMode('details')}
                        className={cn("rounded-xl h-10 px-6 font-bold", viewMode === 'details' && "bg-slate-900 text-white shadow-lg")}
                    >
                        Instructions
                    </Button>
                    <Button 
                        variant={viewMode === 'submit' ? 'default' : 'ghost'} 
                        onClick={() => setViewMode('submit')}
                        className={cn("rounded-xl h-10 px-6 font-bold", viewMode === 'submit' && "bg-indigo-600 text-white shadow-lg shadow-indigo-100")}
                    >
                        {submission ? "Update Work" : "Submit Work"}
                    </Button>
                    {submission && (
                        <Button 
                            variant={viewMode === 'feedback' ? 'default' : 'ghost'} 
                            onClick={() => setViewMode('feedback')}
                            className={cn("rounded-xl h-10 px-6 font-bold", viewMode === 'feedback' && "bg-emerald-600 text-white shadow-lg shadow-emerald-100")}
                        >
                            View Feedback
                        </Button>
                    )}
                </div>
            </div>

            {/* 2. Content Scrolling Area */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                    {viewMode === 'details' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="p-8 pb-0">
                                    <h3 className="text-xl font-bold text-slate-800">Mission Briefing</h3>
                                </CardHeader>
                                <CardContent className="p-8 pt-4 prose prose-slate max-w-none text-slate-700 font-medium">
                                    <div dangerouslySetInnerHTML={{ __html: assignment?.description || "No instructions provided." }} />
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Max Score</p>
                                    <p className="text-2xl font-black text-slate-800">{assignment?.maxScore || 100}pts</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Due Date</p>
                                    <p className="text-sm font-bold text-indigo-600 line-clamp-1">
                                        {assignment?.dueDate ? new Date(assignment.dueDate).toLocaleString() : "TBD"}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Integrity</p>
                                    <p className="text-sm font-bold text-slate-500 flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> Plagiarism Check</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'submit' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <SubmissionPortal 
                                assignment={assignment} 
                                studentId={studentId} 
                                submission={submission}
                                onSuccess={onSubmit}
                            />
                        </div>
                    )}

                    {viewMode === 'feedback' && submission && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                           <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6 text-emerald-500" /> Evaluation Results
                                </h3>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Points Obtained</p>
                                    <p className="text-3xl font-black text-emerald-600">
                                        {submission.score !== null ? submission.score : "PENDING"} 
                                        <span className="text-sm text-slate-300 ml-1">/ {assignment?.maxScore}</span>
                                    </p>
                                </div>
                           </div>

                           {submission.feedback ? (
                               <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                                   <CardHeader className="bg-emerald-50 border-b border-emerald-100/50">
                                       <CardTitle className="text-sm font-black uppercase text-emerald-800 tracking-widest flex items-center gap-2">
                                           <MessageSquare className="w-4 h-4" /> Teacher Remarks
                                       </CardTitle>
                                   </CardHeader>
                                   <CardContent className="p-8 prose prose-emerald max-w-none text-slate-700 font-medium">
                                       <div dangerouslySetInnerHTML={{ __html: submission.feedback }} />
                                   </CardContent>
                               </Card>
                           ) : (
                               <div className="p-12 bg-slate-100/50 border border-dashed border-slate-200 rounded-3xl text-center">
                                   <Loader2 className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-2" />
                                   <p className="text-sm text-slate-500 font-medium italic">Grading in progress. Please check back later.</p>
                               </div>
                           )}

                           {submission.annotations && (
                               <div className="pt-8 space-y-4">
                                   <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest px-2">Visual Annotations & Markups</h4>
                                   <div className="relative group">
                                       <div className="absolute inset-0 bg-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity rounded-3xl pointer-events-none" />
                                       <PDFAnnotator 
                                            fileUrl={submission.fileUrl ?? ""} 
                                            initialData={submission.annotations}
                                            onSave={() => {}} // Read-only for student
                                       />
                                       <div className="absolute inset-x-0 bottom-8 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                           <Badge className="bg-indigo-600 text-white shadow-xl px-4 py-2 rounded-xl text-xs font-bold">Interactive Corrections Layer</Badge>
                                       </div>
                                   </div>
                               </div>
                           )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


