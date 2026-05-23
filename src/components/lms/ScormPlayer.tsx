"use client";

import { useEffect, useRef, useState } from "react";
import { updateProgress } from "@/actions/lms";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScormPlayerProps {
    src: string; // URL to index.html
    studentId: number;
    courseId: number;
    moduleId?: number;
    lessonId: number;
    onComplete?: () => void;
}

declare global {
    interface Window {
        API?: any;
        API_1484_11?: any;
    }
}

export default function ScormPlayer({ src, studentId, courseId, moduleId, lessonId, onComplete }: ScormPlayerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [scormData, setScormData] = useState({
        status: "incomplete",
        score: 0,
        time: "00:00:00"
    });

    // Initialize SCORM API
    useEffect(() => {
        window.API = {
            LMSInitialize: (val: string) => {
                console.log("LMSInitialize", val);
                return "true";
            },
            LMSFinish: (val: string) => {
                console.log("LMSFinish", val);
                handleFinish();
                return "true";
            },
            LMSGetValue: (key: string) => {
                console.log("LMSGetValue", key);
                // Return stored values if needed
                return "";
            },
            LMSSetValue: (key: string, value: string) => {
                console.log("LMSSetValue", key, value);
                if (key === "cmi.core.lesson_status") {
                    setScormData(prev => ({ ...prev, status: value }));
                    if (value === "completed" || value === "passed") {
                        handleFinish(true);
                    }
                }
                if (key === "cmi.core.score.raw") {
                    setScormData(prev => ({ ...prev, score: parseInt(value) || 0 }));
                }
                return "true";
            },
            LMSCommit: (val: string) => {
                console.log("LMSCommit", val);
                return "true";
            },
            LMSGetLastError: () => "0",
            LMSGetErrorString: () => "No error",
            LMSGetDiagnostic: () => "No error"
        };

        // SCORM 2004 Adapter
        window.API_1484_11 = {
            Initialize: window.API.LMSInitialize,
            Terminate: window.API.LMSFinish,
            GetValue: window.API.LMSGetValue,
            SetValue: window.API.LMSSetValue,
            Commit: window.API.LMSCommit,
            GetLastError: window.API.LMSGetLastError,
            GetErrorString: window.API.LMSGetErrorString,
            GetDiagnostic: window.API.LMSGetDiagnostic
        };

        return () => {
            // Cleanup API on unmount
            delete window.API;
            delete window.API_1484_11;
        };
    }, []);

    const handleFinish = async (completed = false) => {
        // Only update if completed or explicitly finished
        if (completed || scormData.status === 'completed' || scormData.status === 'passed') {
            await updateProgress(studentId, courseId, lessonId, 'lesson', true);
            if (onComplete) onComplete();
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    return (
        <div className={cn("relative w-full h-[600px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200", isFullscreen && "fixed inset-0 z-50 h-screen w-screen rounded-none")}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
                </div>
            )}

            <div className="absolute top-2 right-2 z-20 flex gap-2">
                <Button variant="secondary" className="h-8 w-8 p-0 bg-white/80 backdrop-blur" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
            </div>

            <iframe
                ref={iframeRef}
                src={src}
                className="w-full h-full border-none"
                onLoad={() => setLoading(false)}
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation"
            />
        </div>
    );
}
