"use client";

import { useState, useEffect, useRef } from "react";
import { 
    Play, 
    Pause, 
    SkipForward, 
    Users, 
    MessageSquare, 
    Maximize, 
    Monitor,
    BrainCircuit,
    Zap,
    Mic,
    ShieldCheck,
    Activity,
    Clock,
    Camera,
    UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ITSClassroom() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [activeStudents, setActiveStudents] = useState(24);
    const [engagement, setEngagement] = useState(92);
    const [visionActive, setVisionActive] = useState(false);
    const [substituteMode, setSubstituteMode] = useState(false);
    const [activeQuestion, setActiveQuestion] = useState<any>(null);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState({ a: 12, b: 8, c: 4, d: 2 });
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    const speakScript = (text: string) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        synthRef.current.speak(utterance);
    };

    // AI Vision Capture Loop
    useEffect(() => {
        let visionInterval: any;
        if (visionActive) {
            visionInterval = setInterval(async () => {
                if (videoRef.current && canvasRef.current) {
                    const context = canvasRef.current.getContext('2d');
                    if (context) {
                        context.drawImage(videoRef.current, 0, 0, 320, 240);
                        const frame = canvasRef.current.toDataURL('image/jpeg', 0.5);
                        // Call vision action here
                    }
                }
            }, 5000); // Analyze every 5 seconds
        }
        return () => clearInterval(visionInterval);
    }, [visionActive]);

    const toggleVision = async () => {
        if (!visionActive) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setVisionActive(true);
                }
            } catch (err) {
                console.error("Camera failed", err);
            }
        } else {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            setVisionActive(false);
        }
    };
    const steps = [
        { title: "Learning Objectives", status: "completed" },
        { title: "Introduction to Concept", status: "active" },
        { title: "Interactive Simulation", status: "pending" },
        { title: "Real-world Application", status: "pending" },
        { title: "Class Assessment", status: "pending" },
    ];

    useEffect(() => {
        let interval: any;
        if (isPlaying && progress < 100) {
            interval = setInterval(() => {
                setProgress(prev => {
                    const next = prev + 0.2;
                    if (next >= 100 && currentStep < steps.length - 1) {
                        const nextStep = currentStep + 1;
                        setCurrentStep(nextStep);
                        if (substituteMode) {
                            speakScript(`Moving to next section: ${steps[nextStep].title}`);
                        }
                        return 0; // Reset progress for next step
                    }
                    
                    // Trigger Live Quiz at 50% of Step 2 (Introduction)
                    if (currentStep === 1 && Math.floor(next) === 50 && !activeQuestion) {
                        setActiveQuestion({
                            id: 1,
                            text: "What is the primary difference between a Qubit and a Bit?",
                            options: ["Superposition", "Zero/One only", "Memory Size", "Speed"],
                            correct: "Superposition"
                        });
                        speakScript("Interactive Question Triggered. Students, please check your devices.");
                    }
                    
                    return Math.min(next, 100);
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, progress, currentStep, substituteMode]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-indigo-500 overflow-hidden">
            {/* Top Bar - "The HUD" */}
            <div className="h-24 border-b border-white/5 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-12 z-50">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                        <BrainCircuit className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                            ITS <span className="text-indigo-400">Classroom</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black text-[10px] uppercase">Live Teaching</Badge>
                            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">NUC CCMAS: Computing 101</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="flex flex-col items-end gap-2">
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Teacher Presence</p>
                        <Button 
                            onClick={() => {
                                setSubstituteMode(!substituteMode);
                                if (!substituteMode) speakScript("Substitute Mode Activated. Initiating automated curriculum delivery.");
                            }}
                            className={cn(
                                "h-10 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 transition-all",
                                substituteMode ? "bg-amber-500 text-slate-900" : "bg-white/5 text-white/40 hover:bg-white/10"
                            )}
                        >
                            <UserCheck className="w-3 h-3" />
                            {substituteMode ? "Substitute Mode Active" : "Teacher Present"}
                        </Button>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Time Remaining</p>
                        <div className="flex items-center gap-3 justify-end">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-2xl font-black">24:12</h3>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="flex gap-4">
                        <Button onClick={toggleFullscreen} variant="ghost" className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10">
                            <Maximize className="w-6 h-6" />
                        </Button>
                        <Button onClick={toggleVision} className={cn(
                            "h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest gap-3 shadow-xl transition-all",
                            visionActive ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                        )}>
                            <Camera className="w-5 h-5" />
                            {visionActive ? "Disable Vision" : "Activate Vision"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex gap-8 p-8">
                {/* Visual Delivery Area */}
                <div className="flex-[3] relative bg-black rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl">
                    <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                    {/* Simulated Content Video/Animation */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 to-slate-900/40" />
                    
                    {/* Live Quiz Overlay */}
                    {activeQuestion && (
                        <div className="absolute inset-0 z-40 bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-20 animate-in zoom-in duration-500">
                            <div className="w-full max-w-4xl space-y-12">
                                <div className="space-y-4 text-center">
                                    <Badge className="bg-indigo-500 font-black text-xs uppercase tracking-[0.2em] px-6 py-2">Check for Understanding</Badge>
                                    <h3 className="text-6xl font-black italic uppercase tracking-tighter leading-tight">
                                        {activeQuestion.text}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-8 w-full">
                                    {activeQuestion.options.map((opt: string, i: number) => (
                                        <div key={i} className="relative h-24 bg-white/5 border border-white/10 rounded-2xl overflow-hidden group">
                                            <div 
                                                className={cn(
                                                    "absolute inset-y-0 left-0 bg-indigo-500/20 transition-all duration-1000",
                                                    showResults ? "w-[60%]" : "w-0" // Simplified for demo
                                                )} 
                                            />
                                            <div className="relative h-full flex items-center justify-between px-8">
                                                <span className="text-2xl font-black uppercase italic italic">{opt}</span>
                                                {showResults && <span className="text-xl font-black text-indigo-400">64%</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-center pt-8">
                                    {!showResults ? (
                                        <Button 
                                            onClick={() => {
                                                setShowResults(true);
                                                speakScript("Displaying results. The correct answer was Superposition.");
                                            }}
                                            className="h-16 px-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-sm tracking-widest gap-4 shadow-2xl shadow-indigo-500/20"
                                        >
                                            <Activity className="w-6 h-6" />
                                            Show Class Results
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={() => setActiveQuestion(null)}
                                            className="h-16 px-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-200 font-black uppercase text-sm tracking-widest gap-4 shadow-2xl"
                                        >
                                            Resume Lesson
                                            <SkipForward className="w-6 h-6" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {visionActive && (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            muted 
                            className="absolute top-8 right-8 w-64 h-48 rounded-2xl border-2 border-indigo-500/50 object-cover z-20 shadow-2xl"
                        />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-12 text-center p-20">
                        <div className="space-y-6">
                            <h2 className="text-7xl font-black uppercase italic leading-none tracking-tighter">
                                Exploring <span className="text-indigo-400">Quantum</span> Logic
                            </h2>
                            <p className="text-2xl font-medium text-slate-400 max-w-3xl mx-auto">
                                Analyzing the fundamental shift from binary states to probabilistic qubits in computational theory.
                            </p>
                        </div>
                        
                        {/* Audio Waveform UI */}
                        <div className="flex items-end gap-2 h-24">
                            {[...Array(20)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="w-2 bg-indigo-500/50 rounded-full animate-pulse" 
                                    style={{ 
                                        height: `${30 + Math.random() * 70}%`,
                                        animationDelay: `${i * 0.05}s`,
                                        opacity: isPlaying ? 1 : 0.2
                                    }} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Bottom Progress Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10 overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Sidebar - "The Intelligence Layer" */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Facial Recognition / Attendance */}
                    <Card className="bg-white/5 border-white/10 rounded-[2.5rem] overflow-hidden">
                        <div className="h-48 bg-slate-900 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Camera className="w-12 h-12 text-white/10" />
                            </div>
                            <div className="absolute top-4 left-4 flex gap-2">
                                <Badge className="bg-rose-500 font-black text-[8px] uppercase">Rec Active</Badge>
                                <Badge className="bg-indigo-500 font-black text-[8px] uppercase">Scan: 60FPS</Badge>
                            </div>
                            {/* Scanning HUD Overlays */}
                            <div className="absolute inset-0 border-[20px] border-indigo-500/10 pointer-events-none" />
                        </div>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-white/40 mb-1">Present</p>
                                    <h4 className="text-2xl font-black flex items-center gap-2">
                                        {activeStudents}
                                        <Users className="w-4 h-4 text-emerald-500" />
                                    </h4>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-white/40 mb-1">Attention</p>
                                    <h4 className="text-2xl font-black flex items-center gap-2">
                                        {engagement}%
                                        <Zap className="w-4 h-4 text-amber-500" />
                                    </h4>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-white/40">Recent Interaction</span>
                                    <span className="text-emerald-500">Correct Answer</span>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-xs">AO</div>
                                    <p className="text-xs font-bold italic">Adeola O. answered correctly</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lesson Flow */}
                    <Card className="flex-1 bg-white/5 border-white/10 rounded-[2.5rem] p-8 space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-3">
                            <Activity className="w-4 h-4" />
                            Lesson Milestones
                        </h3>
                        <div className="space-y-6">
                            {steps.map((step, i) => (
                                <div key={i} className="flex items-start gap-4 group">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all",
                                        step.status === 'completed' ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20" :
                                        step.status === 'active' ? "bg-indigo-500 border-indigo-500 animate-pulse" : "border-white/10 bg-transparent"
                                    )}>
                                        {step.status === 'completed' ? <ShieldCheck className="w-4 h-4" /> : <span className="text-[10px] font-black">{i + 1}</span>}
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className={cn(
                                            "text-sm font-black uppercase italic tracking-tighter",
                                            step.status === 'pending' ? "text-white/20" : "text-white"
                                        )}>
                                            {step.title}
                                        </p>
                                        {step.status === 'active' && <p className="text-[10px] font-medium text-indigo-400 mt-1">Currently presenting...</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Global Controls - "The Dashboard Foot" */}
            <div className="h-32 bg-white/5 backdrop-blur-3xl border-t border-white/5 px-12 flex items-center justify-between z-50">
                <div className="flex items-center gap-8">
                    <Button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all",
                            isPlaying ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                        )}
                    >
                        {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-2" />}
                    </Button>
                    <div className="space-y-1">
                        <h4 className="text-xl font-black uppercase italic">Lesson Status</h4>
                        <p className="text-xs font-bold text-white/40 tracking-widest uppercase">
                            {isPlaying ? "Automated Delivery Running" : "Lesson Paused - Standby"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button 
                        onClick={() => setIsListening(!isListening)}
                        className={cn(
                            "h-16 px-8 rounded-2xl border-2 font-black uppercase text-xs tracking-widest gap-4 transition-all",
                            isListening ? "bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20" : "bg-transparent border-white/10 hover:bg-white/5"
                        )}
                    >
                        <Mic className={cn("w-5 h-5", isListening && "animate-bounce")} />
                        {isListening ? "Listening to Class" : "Enable Audio Response"}
                    </Button>
                    <Button variant="ghost" className="h-16 px-8 rounded-2xl bg-white/5 hover:bg-white/10 font-black uppercase text-xs tracking-widest gap-4">
                        <MessageSquare className="w-5 h-5" />
                        Class Discussion
                    </Button>
                    <Button className="h-16 px-8 rounded-2xl bg-white text-slate-900 hover:bg-slate-200 font-black uppercase text-xs tracking-widest gap-4">
                        Next Chapter
                        <SkipForward className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
