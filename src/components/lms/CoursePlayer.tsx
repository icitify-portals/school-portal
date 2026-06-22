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
    MessageSquare,
    Sparkles,
    Calendar,
    Clock,
    Award,
    Play,
    Pause,
    BookOpen,
    HelpCircle,
    FileCheck,
    LockKeyhole
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateProgress, submitAssignment } from "@/actions/lms";
import { issueCourseCertificate } from "@/actions/credentials";
import { uploadFile } from "@/actions/upload";
import { getActiveLectureSession, markOnlinePresence } from "@/actions/attendance";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import SubmissionPortal from "./SubmissionPortal";
import PDFAnnotator from "./PDFAnnotator";
import { isBefore } from "date-fns";
import confetti from "canvas-confetti";

interface Lesson {
    id: number;
    title: string;
    contentType: 'text' | 'video' | 'pdf' | 'scorm' | 'quiz' | 'assignment' | 'h5p';
    contentUrl?: string;
    contentBody?: string;
    isLocked: boolean;
    isCompleted: boolean;
    durationMinutes?: number;
    releaseDate?: string | Date;
    isPublished?: boolean;
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
    courseFormat?: 'topics' | 'weeks' | 'days';
    courseStartDate?: string | Date;
    flowControl?: 'sequential' | 'open';
    minPassingScore?: number;
}

export default function CoursePlayer({ 
    courseId, 
    studentId, 
    initialContent, 
    courseTitle,
    courseFormat = 'topics',
    courseStartDate,
    flowControl = 'open',
    minPassingScore = 75
}: CoursePlayerProps) {
    const [modules, setModules] = useState<Module[]>(initialContent);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedModules, setExpandedModules] = useState<number[]>([]);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [attendanceStatus, setAttendanceStatus] = useState<'idle' | 'present' | 'loading'>('idle');
    const [courseProgress, setCourseProgress] = useState({ percentage: 0, isComplete: false });
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [certificateCode, setCertificateCode] = useState<string | null>(null);

    // Active sub-tab inside the unified lesson view: "material" | "quiz" | "assignment"
    const [lessonTab, setLessonTab] = useState<"material" | "quiz" | "assignment">("material");

    // Right Sidebar tabs and local Classroom Chat Discussion states
    const [rightSidebarTab, setRightSidebarTab] = useState<"index" | "chat">("index");
    const [chatMessages, setChatMessages] = useState<any[]>([
        { id: 1, sender: "Instructor", text: "Welcome to our live classroom discussion! Feel free to ask questions or share resources.", time: "09:00 AM", isAudio: false },
        { id: 2, sender: "System", text: "Interactive classroom chat session started.", time: "09:01 AM", isAudio: false, isSystem: true }
    ]);
    const [chatInput, setChatInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Check for active lecture session
    useEffect(() => {
        const checkSession = async () => {
            const res = await getActiveLectureSession(courseId);
            if (res.success && res.session) {
                setActiveSession(res.session);
            }
        };
        checkSession();
    }, [courseId]);

    // Format week and day boundaries relative to course start date
    const getTimelineHeader = (index: number) => {
        if (!courseStartDate) return `Section ${index + 1}`;
        const start = new Date(courseStartDate);
        
        if (courseFormat === 'weeks') {
            const weekStart = new Date(start.getTime() + index * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
            return `Week ${index + 1} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
        }
        if (courseFormat === 'days') {
            const dayDate = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
            return `Day ${index + 1} (${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
        }
        return `Module ${index + 1}`;
    };

    // Sequential & Date locking validations (enforces sequential progress gates)
    const processedModules = modules.map((m, mIndex) => {
        let moduleLocked = m.isLocked;

        // Verify prerequisite modules if sequential flow
        if (flowControl === 'sequential' && mIndex > 0) {
            const prevMod = modules[mIndex - 1];
            if (!prevMod.isCompleted) moduleLocked = true;
        }

        const processedLessons = m.lessons.map((l, lIndex) => {
            let lessonLocked = moduleLocked || l.isLocked;

            // 1. Scheduled Release locking gate
            if (l.releaseDate && isBefore(new Date(), new Date(l.releaseDate))) {
                lessonLocked = true;
            }

            // 2. Sequential lesson locking gate
            if (flowControl === 'sequential' && !lessonLocked) {
                // If there's a previous lesson in the current module
                if (lIndex > 0) {
                    const prevLesson = m.lessons[lIndex - 1];
                    const isPrevCompleted = prevLesson.isCompleted;
                    
                    // If predecessor has a quiz, it MUST be passed >= minPassingScore
                    let isPrevQuizPassed = true;
                    if (prevLesson.quiz) {
                        // Assuming quiz score is recorded or checked
                        // In sequential flow, check if quiz has been taken and passed
                        isPrevQuizPassed = prevLesson.isCompleted; // Placeholder for strict pass rules
                    }

                    if (!isPrevCompleted || !isPrevQuizPassed) {
                        lessonLocked = true;
                    }
                } 
                // Or if it's the first lesson of a subsequent module
                else if (mIndex > 0) {
                    const prevModule = modules[mIndex - 1];
                    const lastLessonOfPrevMod = prevModule.lessons[prevModule.lessons.length - 1];
                    if (lastLessonOfPrevMod && !lastLessonOfPrevMod.isCompleted) {
                        lessonLocked = true;
                    }
                }
            }

            return {
                ...l,
                isLocked: lessonLocked
            };
        });

        return {
            ...m,
            isLocked: moduleLocked,
            lessons: processedLessons
        };
    });

    // Auto-select first unlocked lesson
    useEffect(() => {
        if (!currentLesson && processedModules.length > 0) {
            for (const m of processedModules) {
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
        // If lesson is locked due to scheduled release date
        if (lesson.releaseDate && isBefore(new Date(), new Date(lesson.releaseDate))) {
            toast.error(`This lesson is locked. It will be released on ${new Date(lesson.releaseDate).toLocaleString()}`);
            return;
        }

        if (lesson.isLocked) {
            toast.error("This lesson is locked. Please complete previous prerequisite modules/lessons and quizzes first.");
            return;
        }
        
        setCurrentLesson(lesson);
        setLessonTab("material"); // Reset tab to learning material
        
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    const toggleModule = (modId: number) => {
        setExpandedModules(prev =>
            prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
        );
    };

    const handleMarkComplete = async () => {
        if (!currentLesson) return;

        // Optimistically complete
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
                // Fetch or generate certificate via Server Action
                const fetchCert = await issueCourseCertificate(courseId);
                
                if (fetchCert.success && fetchCert.certificateCode) {
                    setCertificateCode(fetchCert.certificateCode);
                }

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

    const handleSendChatMessage = () => {
        if (!chatInput.trim()) return;
        setChatMessages(prev => [
            ...prev,
            {
                id: Date.now(),
                sender: "Student (You)",
                text: chatInput,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isAudio: false
            }
        ]);
        setChatInput("");
    };

    const handleSendAudioMessage = () => {
        setIsRecording(false);
        setChatMessages(prev => [
            ...prev,
            {
                id: Date.now(),
                sender: "Student (You)",
                text: "Voice message (0:08)",
                audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isAudio: true
            }
        ]);
    };

    const handleSendImageMessage = async (file: File) => {
        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadFile(formData);
        if (res.success && res.url) {
            setChatMessages(prev => [
                ...prev,
                {
                    id: Date.now(),
                    sender: "Student (You)",
                    text: chatInput || "Sent an image",
                    image: res.url,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isAudio: false
                }
            ]);
            setChatInput("");
            setImagePreview(null);
            setShowUploadModal(false);
        } else {
            toast.error("Failed to upload chat image.");
        }
        setIsUploadingImage(false);
    };

    // Client-side parser: Extracts HTML5 media nodes (video, audio, iframe) from the contentBody
    const getExtractedMedia = (htmlContent: string) => {
        if (typeof window === "undefined" || !htmlContent) return { cleanHtml: htmlContent, mediaTag: null };

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");
        
        const video = doc.querySelector("video");
        const audio = doc.querySelector("audio");
        const iframe = doc.querySelector("iframe");

        if (video) {
            video.remove();
            return {
                cleanHtml: doc.body.innerHTML,
                mediaTag: <video controls className="w-full h-full object-contain rounded-2xl shadow-lg border border-slate-900 bg-black" src={video.src} playsinline />
            };
        }
        
        if (iframe && iframe.src.includes("youtube.com")) {
            iframe.remove();
            return {
                cleanHtml: doc.body.innerHTML,
                mediaTag: (
                    <div className="aspect-video w-full h-full rounded-2xl overflow-hidden shadow-lg bg-black">
                        <iframe 
                            className="w-full h-full" 
                            src={iframe.src} 
                            allowFullScreen 
                            allow="autoplay" 
                        />
                    </div>
                )
            };
        }

        if (audio) {
            audio.remove();
            return {
                cleanHtml: doc.body.innerHTML,
                mediaTag: (
                    <div className="w-full p-6 bg-slate-950/80 rounded-2xl flex items-center justify-center border border-slate-800 shadow-md">
                        <audio controls className="w-full" src={audio.src} />
                    </div>
                )
            };
        }

        return { cleanHtml: htmlContent, mediaTag: null };
    };

    const mediaParsing = currentLesson?.contentType === 'text' && currentLesson.contentBody 
        ? getExtractedMedia(currentLesson.contentBody) 
        : { cleanHtml: currentLesson?.contentBody || "", mediaTag: null };

    // Determine lock release status
    const isLessonScheduleLocked = currentLesson?.releaseDate && isBefore(new Date(), new Date(currentLesson.releaseDate));

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 flex-col md:flex-row relative">
            {/* Sidebar Toggle (Mobile) */}
            <div className="md:hidden fixed bottom-4 right-4 z-50">
                <Button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="rounded-full h-12 w-12 shadow-xl bg-indigo-600 hover:bg-indigo-700"
                >
                    {sidebarOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* Primary Main Content Area (Now on the Left) */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Desktop Sidebar toggle (moved to top-right corner) */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute top-4 right-4 z-40 p-2 bg-white rounded-lg shadow-sm border border-slate-200 hidden md:block hover:bg-slate-50 transition-colors"
                >
                    {sidebarOpen ? <Minimize2 className="w-4 h-4 text-slate-600" /> : <Menu className="w-4 h-4 text-slate-600" />}
                </button>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {currentLesson ? (
                        <div className="max-w-4xl mx-auto space-y-6">
                            
                            {/* Dynamic Lock Release Warning State Screen */}
                            {isLessonScheduleLocked ? (
                                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] space-y-4">
                                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
                                        <LockKeyhole className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">Future Scheduled Release</h2>
                                    <p className="text-sm text-slate-500 max-w-md">This lesson is scheduled for a future release date. Students cannot view or access this content until the release date arrives.</p>
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold py-1 px-4 mt-2">
                                        Unlocks at {new Date(currentLesson.releaseDate!).toLocaleString()}
                                    </Badge>
                                </div>
                            ) : (
                                <>
                                    {/* Top Header Title & Actions */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{currentLesson.title}</h1>
                                            {flowControl === 'sequential' && (
                                                <Badge variant="outline" className="text-[8px] font-black tracking-widest text-indigo-500 border-indigo-200 bg-indigo-50/30 uppercase mt-1">Sequential Progress Locked</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {currentLesson.quiz && (
                                                <Button onClick={() => setLessonTab("quiz")} className="rounded-xl h-10 px-5 font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                                                    Take Assessment
                                                </Button>
                                            )}
                                            {currentLesson.assignment && (
                                                <Button onClick={() => setLessonTab("assignment")} className="rounded-xl h-10 px-5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                                                    Take homework
                                                </Button>
                                            )}
                                            {!currentLesson.isCompleted && currentLesson.contentType !== 'scorm' && (
                                                <Button onClick={handleMarkComplete} variant="outline" className="rounded-xl h-10 px-5 font-bold gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Mark Lesson Completed
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Unified Lesson-Level Tabbed Control Panels */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                                        
                                        {/* Sub Tabs Selection Bar */}
                                        <div className="flex border-b border-slate-200 bg-slate-50/50 p-1.5 gap-1 shrink-0">
                                            {/* Material Content Tab */}
                                            <button
                                                type="button"
                                                onClick={() => setLessonTab("material")}
                                                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                                    lessonTab === "material" 
                                                        ? "bg-white text-indigo-600 shadow-sm" 
                                                        : "text-slate-500 hover:text-slate-800"
                                                }`}
                                            >
                                                <BookOpen className="w-3.5 h-3.5" />
                                                📖 Lecture Content
                                            </button>

                                            {/* CBT Quiz tab */}
                                            {currentLesson.quiz && (
                                                <button
                                                    type="button"
                                                    onClick={() => setLessonTab("quiz")}
                                                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                                        lessonTab === "quiz" 
                                                            ? "bg-white text-indigo-600 shadow-sm" 
                                                            : "text-slate-500 hover:text-slate-800"
                                                    }`}
                                                >
                                                    <HelpCircle className="w-3.5 h-3.5" />
                                                    📝 CBT Assessment
                                                </button>
                                            )}

                                            {/* Assignment Tab */}
                                            {currentLesson.assignment && (
                                                <button
                                                    type="button"
                                                    onClick={() => setLessonTab("assignment")}
                                                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                                        lessonTab === "assignment" 
                                                            ? "bg-white text-indigo-600 shadow-sm" 
                                                            : "text-slate-500 hover:text-slate-800"
                                                    }`}
                                                >
                                                    <FileCheck className="w-3.5 h-3.5" />
                                                    💼 Assignment
                                                </button>
                                            )}
                                        </div>

                                        {/* TABS CONTAINER */}
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            
                                            {/* 1. LECTURE CONTENT TAB */}
                                            {lessonTab === "material" && (
                                                <div className="flex-1 flex flex-col overflow-y-auto">
                                                    {/* Media Hero Stage Container */}
                                                    {mediaParsing.mediaTag && (
                                                        <div className="w-full bg-slate-900 flex items-center justify-center p-4 border-b border-slate-950 shrink-0">
                                                            <div className="max-w-3xl w-full max-h-[380px]">
                                                                {mediaParsing.mediaTag}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Primary Content Render */}
                                                    <div className="p-8 prose prose-slate max-w-none">
                                                        {currentLesson.contentType === 'h5p' && currentLesson.contentUrl ? (
                                                            <H5PPlayer
                                                                h5pJsonPath={currentLesson.contentUrl}
                                                                onComplete={() => handleMarkComplete()}
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
                                                            <div className="aspect-video bg-black flex items-center justify-center max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-lg">
                                                                <video controls className="w-full h-full" src={currentLesson.contentUrl} onEnded={handleMarkComplete} />
                                                            </div>
                                                        ) : currentLesson.contentType === 'pdf' && currentLesson.contentUrl ? (
                                                            <iframe src={currentLesson.contentUrl} className="w-full h-[650px] rounded-xl border border-slate-200" />
                                                        ) : (
                                                            <div dangerouslySetInnerHTML={{ __html: mediaParsing.cleanHtml || "<p class='text-slate-400 italic'>No description or learning material provided for this lesson.</p>" }} />
                                                        )}

                                                        {/* Modern Lesson Attachments block */}
                                                        <div className="mt-8 pt-6 border-t border-slate-100">
                                                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                                                <span>📎</span> Lesson Attachments & Resources
                                                            </h3>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {currentLesson.contentType === 'video' && currentLesson.contentUrl && (
                                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-[10px]">MP4</div>
                                                                            <div>
                                                                                <p className="text-xs font-bold text-slate-700">Lecture Video</p>
                                                                                <p className="text-[10px] text-slate-400">Attached Media</p>
                                                                            </div>
                                                                        </div>
                                                                        <a href={currentLesson.contentUrl} target="_blank" download className="text-xs text-indigo-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-lg font-bold">Download</a>
                                                                    </div>
                                                                )}
                                                                {currentLesson.contentType === 'pdf' && currentLesson.contentUrl && (
                                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center font-bold text-[10px]">PDF</div>
                                                                            <div>
                                                                                <p className="text-xs font-bold text-slate-700">Learning Document</p>
                                                                                <p className="text-[10px] text-slate-400">Lesson Material</p>
                                                                            </div>
                                                                        </div>
                                                                        <a href={currentLesson.contentUrl} target="_blank" download className="text-xs text-indigo-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-lg font-bold">Download</a>
                                                                    </div>
                                                                )}
                                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between col-span-1 sm:col-span-2">
                                                                    <div className="flex items-center gap-3 w-full">
                                                                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-[10px]">AUDIO</div>
                                                                        <div className="flex-1">
                                                                            <p className="text-xs font-bold text-slate-700">Listen to Audio Overview</p>
                                                                            <audio controls className="w-full mt-1.5 h-8" src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 2. CBT QUIZ ASSESSMENT TAB */}
                                            {lessonTab === "quiz" && currentLesson.quiz && (
                                                <div className="flex-1 overflow-y-auto p-6">
                                                    <QuizTaker
                                                        quiz={currentLesson.quiz}
                                                        studentId={studentId}
                                                        onComplete={handleMarkComplete}
                                                    />
                                                </div>
                                            )}

                                            {/* 3. PRACTICAL LESSON ASSIGNMENT TAB */}
                                            {lessonTab === "assignment" && currentLesson.assignment && (
                                                <div className="flex-1 flex flex-col overflow-hidden">
                                                    <AssignmentView
                                                        lesson={currentLesson}
                                                        studentId={studentId}
                                                        onSubmit={handleMarkComplete}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <PlayCircle className="w-16 h-16 mb-4 opacity-50 text-indigo-500" />
                            <p className="font-bold text-sm">Select a lesson from the sidebar menu to begin learning.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Sidebar Layout (Now on the Right) */}
            <div className={cn(
                "w-80 bg-white border-l border-slate-200 flex flex-col transition-all duration-300 absolute md:relative right-0 h-full z-40 shadow-sm shrink-0",
                sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden"
            )}>
                {/* Right Sidebar Tab Switcher */}
                <div className="flex border-b border-slate-200 bg-slate-50/50 p-1.5 gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => setRightSidebarTab("index")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
                            rightSidebarTab === "index" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        Timeline
                    </button>
                    <button
                        type="button"
                        onClick={() => setRightSidebarTab("chat")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
                            rightSidebarTab === "chat" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Classroom Chat
                    </button>
                </div>

                {rightSidebarTab === "index" && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Course Info Card */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
                            <h2 className="font-bold text-slate-800 line-clamp-2 text-xs leading-snug">{courseTitle}</h2>
                            <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                <span>{courseProgress.percentage.toFixed(0)}% Completed</span>
                                <span>{modules.reduce((acc, m) => acc + m.lessons.filter(l => l.isCompleted).length, 0)} / {modules.reduce((acc, m) => acc + m.lessons.length, 0)} Lessons</span>
                            </div>
                            {/* Completion Progress Bar */}
                            <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden shadow-inner border border-slate-100">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000 ease-out",
                                        courseProgress.isComplete ? "bg-emerald-500" : "bg-indigo-500"
                                    )}
                                    style={{ width: `${courseProgress.percentage}%` }}
                                />
                            </div>

                            {/* Attendance Controller */}
                            {activeSession && (
                                <div className="p-3.5 rounded-xl bg-indigo-600 text-white shadow-md flex flex-col gap-2.5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[8px] font-black uppercase tracking-wider">Class Ongoing</span>
                                        </div>
                                        <Badge variant="outline" className="text-[7px] border-white/20 text-white px-1.5 py-0.5 uppercase">{activeSession.type}</Badge>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase italic leading-none">{activeSession.title || "Live Lecture"}</p>
                                        <p className="text-[8px] font-semibold text-indigo-100 flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" /> Started at {new Date(activeSession.startTime).toLocaleTimeString()}
                                        </p>
                                    </div>

                                    {attendanceStatus === 'present' ? (
                                        <Button
                                            onClick={() => handleMarkAttendance('out')}
                                            className="w-full h-8 bg-white/20 hover:bg-white/30 text-white border-none text-[8px] font-black uppercase tracking-widest rounded-lg transition-colors"
                                        >
                                            Leave Class
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handleMarkAttendance('in')}
                                            disabled={attendanceStatus === 'loading'}
                                            className="w-full h-8 bg-white text-indigo-600 hover:bg-slate-100 font-black uppercase tracking-widest text-[8px] rounded-lg shadow-sm"
                                        >
                                            {attendanceStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : "Mark Presence"}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sidebar Lessons & Module List */}
                        <div className="flex-1 overflow-y-auto">
                            {processedModules.map((module, index) => (
                                <div key={module.id} className="border-b border-slate-100">
                                    {/* Moodle Computed Timeline Header */}
                                    <button
                                        onClick={() => toggleModule(module.id)}
                                        className={cn(
                                            "w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left",
                                            module.isLocked && "opacity-50 cursor-not-allowed bg-slate-50"
                                        )}
                                    >
                                        <div className="flex flex-col gap-0.5 pr-2">
                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">{getTimelineHeader(index)}</span>
                                            <span className="text-xs font-bold text-slate-700">{module.title}</span>
                                        </div>
                                        {expandedModules.includes(module.id) ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        )}
                                    </button>

                                    {expandedModules.includes(module.id) && (
                                        <div className="bg-slate-50/30 border-t border-slate-100/50">
                                            {module.lessons.map(lesson => {
                                                const isFutureLocked = lesson.releaseDate && isBefore(new Date(), new Date(lesson.releaseDate));
                                                
                                                return (
                                                    <button
                                                        key={lesson.id}
                                                        onClick={() => handleLessonSelect(lesson)}
                                                        disabled={lesson.isLocked && !isFutureLocked}
                                                        className={cn(
                                                            "w-full px-4 py-2 pl-8 flex items-center justify-between text-xs transition-all border-l-2 text-left",
                                                            currentLesson?.id === lesson.id
                                                                ? "bg-indigo-50/50 border-indigo-500 text-indigo-700 font-bold"
                                                                : "border-transparent hover:bg-slate-100/60 text-slate-600",
                                                            lesson.isLocked && !isFutureLocked && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2 max-w-[80%]">
                                                            {lesson.contentType === 'video' || lesson.contentType === 'scorm' ? (
                                                                <FileVideo className="w-3.5 h-3.5 shrink-0" />
                                                            ) : (
                                                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                                            )}
                                                            <span className="truncate">{lesson.title}</span>
                                                        </div>

                                                        {/* Status Lock/Complete Indicators */}
                                                        {isFutureLocked ? (
                                                            <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-none px-1 h-4 text-[7px] font-black uppercase shrink-0">
                                                                Scheduled
                                                            </Badge>
                                                        ) : lesson.isLocked ? (
                                                            <Lock className="w-3 h-3 text-slate-300 shrink-0" />
                                                        ) : lesson.isCompleted ? (
                                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Classroom Chat Tab */}
                {rightSidebarTab === "chat" && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
                        {/* Chat Messages viewport */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-box">
                            {chatMessages.map(msg => (
                                <div key={msg.id} className={cn(
                                    "flex flex-col max-w-[85%] rounded-2xl p-3 shadow-sm",
                                    msg.isSystem ? "bg-slate-100 border border-slate-200/50 text-slate-500 text-center mx-auto max-w-[95%] py-1.5 px-4 font-mono text-[9px] uppercase tracking-wider" :
                                    msg.sender === "Student (You)" 
                                        ? "bg-indigo-600 text-white self-end rounded-tr-none" 
                                        : "bg-white text-slate-800 self-start border border-slate-100 rounded-tl-none"
                                )}>
                                    {!msg.isSystem && (
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-wider mb-1 block",
                                            msg.sender === "Student (You)" ? "text-indigo-200" : "text-indigo-600"
                                        )}>{msg.sender}</span>
                                    )}
                                    {msg.image && (
                                        <img src={msg.image} alt="Chat file" className="rounded-xl max-h-40 object-cover mb-2" />
                                    )}
                                    {msg.isAudio ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">🔊</span>
                                            <audio controls className="w-44 h-8" src={msg.audioUrl} />
                                        </div>
                                    ) : (
                                        <p className="text-xs font-semibold leading-relaxed break-words">{msg.text}</p>
                                    )}
                                    {!msg.isSystem && (
                                        <span className={cn(
                                            "text-[8px] font-medium text-right mt-1.5 block",
                                            msg.sender === "Student (You)" ? "text-indigo-300" : "text-slate-400"
                                        )}>{msg.time}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Chat input block */}
                        <div className="p-3 border-t border-slate-100 bg-white shrink-0">
                            {isRecording ? (
                                <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Recording Message</h4>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                                        <span className="text-xs font-mono font-bold text-slate-600">0:08</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button size="sm" variant="ghost" onClick={() => setIsRecording(false)} className="h-8 w-8 rounded-full bg-white hover:bg-slate-50 text-slate-400 shadow-sm border border-slate-100"><X className="w-4 h-4 text-slate-600" /></Button>
                                        <Button size="sm" variant="destructive" onClick={handleSendAudioMessage} className="h-9 px-4 font-black uppercase tracking-wider text-[10px] rounded-xl shadow-lg shadow-rose-100">Stop & Send</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => setShowUploadModal(true)} className="h-9 w-9 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center border border-slate-200/50 transition-colors"><span className="text-sm">📷</span></button>
                                    <button onClick={() => setIsRecording(true)} className="h-9 w-9 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center border border-slate-200/50 transition-colors"><span className="text-sm">🎙️</span></button>
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
                                        placeholder="Type message..."
                                        className="flex-1 h-9 px-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-xs bg-slate-50/50 focus:outline-none"
                                    />
                                    <button onClick={handleSendChatMessage} className="h-9 w-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-md transition-colors"><span className="text-xs font-bold">▶</span></button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Upload Image for Classroom Chat */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="max-w-md w-full mx-4 border-none shadow-2xl rounded-2xl bg-white overflow-hidden p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm">Upload Image to Chat</h3>
                            <button onClick={() => { setShowUploadModal(false); setImagePreview(null); }} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <hr className="border-slate-100" />
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors relative cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setImagePreview(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto object-cover rounded-xl" />
                                ) : (
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-slate-700">Click to upload image</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Supports PNG, JPG (10MB Max)</p>
                                    </div>
                                )}
                            </div>
                            <Button
                                disabled={isUploadingImage || !imagePreview}
                                onClick={() => {
                                    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                    const file = fileInput?.files?.[0];
                                    if (file) handleSendImageMessage(file);
                                }}
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100"
                            >
                                {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Send to Chat"}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Immersive Certificate Issuance & Celebration Overlay Card */}
            {showCompletionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="max-w-lg w-full mx-4 border-none shadow-2xl rounded-2xl bg-white overflow-hidden text-center p-8 space-y-6 transform scale-100 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-indigo-100">
                            <Award className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
                                <Sparkles className="w-6 h-6 text-amber-400" /> Course Completed!
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Congratulations on your academic success</p>
                        </div>

                        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                            You have successfully completed all learning modules and passed all required CBT assessments with outstanding marks. Your digital credential is ready.
                        </p>

                        {certificateCode && (
                            <div className="py-2.5 px-4 rounded-xl border border-indigo-100 bg-indigo-50/40 text-indigo-700 font-bold font-mono text-sm max-w-xs mx-auto shadow-inner">
                                Verification Code: {certificateCode}
                            </div>
                        )}

                        <div className="flex flex-col gap-2 pt-2">
                            <Button 
                                onClick={() => {
                                    window.open(`/api/credentials/certificate/download?code=${certificateCode}`, "_blank");
                                }}
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                            >
                                <Award className="w-4 h-4" /> Download Certificate (PDF)
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={() => setShowCompletionModal(false)}
                                className="w-full text-slate-500 rounded-xl h-10 font-bold"
                            >
                                Close & Return
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
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
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Header controls bar */}
            <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Button 
                        variant={viewMode === 'details' ? 'default' : 'ghost'} 
                        onClick={() => setViewMode('details')}
                        className={cn("rounded-xl h-8 px-4 font-bold text-xs", viewMode === 'details' && "bg-slate-900 text-white shadow-md")}
                    >
                        Briefing
                    </Button>
                    <Button 
                        variant={viewMode === 'submit' ? 'default' : 'ghost'} 
                        onClick={() => setViewMode('submit')}
                        className={cn("rounded-xl h-8 px-4 font-bold text-xs", viewMode === 'submit' && "bg-indigo-600 text-white shadow-md shadow-indigo-100")}
                    >
                        {submission ? "Update Work" : "Submit Work"}
                    </Button>
                    {submission && (
                        <Button 
                            variant={viewMode === 'feedback' ? 'default' : 'ghost'} 
                            onClick={() => setViewMode('feedback')}
                            className={cn("rounded-xl h-8 px-4 font-bold text-xs", viewMode === 'feedback' && "bg-emerald-600 text-white shadow-md shadow-emerald-100")}
                        >
                            Feedback
                        </Button>
                    )}
                </div>
                {submission && (
                    <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase px-2 py-0.5 tracking-wider">
                        {submission.status.toUpperCase()}
                    </Badge>
                )}
            </div>

            {/* Scrollable Viewport area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto">
                    {viewMode === 'details' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="p-6 pb-0">
                                    <h3 className="text-lg font-bold text-slate-800">Mission Description</h3>
                                </CardHeader>
                                <CardContent className="p-6 pt-4 prose prose-slate max-w-none text-slate-600 font-medium text-sm">
                                    <div dangerouslySetInnerHTML={{ __html: assignment?.description || "No instructions provided." }} />
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Points Target</p>
                                    <p className="text-xl font-black text-slate-800">{assignment?.maxScore || 100}pts</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Due Date</p>
                                    <p className="text-sm font-bold text-indigo-600 line-clamp-1">
                                        {assignment?.dueDate ? new Date(assignment.dueDate).toLocaleString() : "TBD"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'submit' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SubmissionPortal 
                                assignment={assignment} 
                                studentId={studentId} 
                                submission={submission}
                                onSuccess={onSubmit}
                            />
                        </div>
                    )}

                    {viewMode === 'feedback' && submission && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" /> Evaluation Results
                                </h3>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Points Obtained</p>
                                    <p className="text-2xl font-black text-emerald-600">
                                        {submission.score !== null ? submission.score : "PENDING"} 
                                        <span className="text-xs text-slate-300 ml-1">/ {assignment?.maxScore}</span>
                                    </p>
                                </div>
                            </div>

                            {submission.feedback ? (
                                <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                                    <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/30">
                                        <CardTitle className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Teacher Remarks
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 prose prose-emerald max-w-none text-slate-600 text-sm font-semibold">
                                        <div dangerouslySetInnerHTML={{ __html: submission.feedback }} />
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="p-10 bg-slate-100/50 border border-dashed border-slate-200 rounded-2xl text-center">
                                    <Loader2 className="w-7 h-7 text-slate-300 animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-slate-500 font-bold italic">Grading and feedback in progress. Please check back soon.</p>
                                </div>
                            )}

                            {submission.annotations && (
                                <div className="pt-6 space-y-3">
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Visual Annotations Markup</h4>
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                                        <PDFAnnotator 
                                            fileUrl={submission.fileUrl ?? ""} 
                                            initialData={submission.annotations}
                                            onSave={() => {}} // Read-only for students
                                        />
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
