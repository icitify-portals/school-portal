"use client";

import { useState, useEffect, useRef } from "react";
import { 
    Mic, 
    MicOff, 
    Volume2, 
    VolumeX, 
    MessageSquare, 
    Sparkles, 
    Zap,
    Brain,
    X,
    Loader2,
    Activity as Waveform
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AIVoiceCoach() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [aiResponse, setAiResponse] = useState("Hello! I am your AI Study Buddy. How can I help you today?");
    const [loading, setLoading] = useState(false);
    
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            // Initialize Speech Recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    const text = event.results[0][0].transcript;
                    setTranscript(text);
                    handleVoiceSubmit(text);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }

            // Initialize Speech Synthesis
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    const speak = (text: string) => {
        if (!synthRef.current) return;
        synthRef.current.cancel(); // Stop any current speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
    };

    const handleVoiceSubmit = async (text: string) => {
        setLoading(true);
        try {
            // Call AI action (simulated or real)
            const res = await fetch("/api/ai/coach", {
                method: "POST",
                body: JSON.stringify({ prompt: text }),
            });
            const data = await res.json();
            setAiResponse(data.response);
            speak(data.response);
        } catch (error) {
            console.error(error);
            setAiResponse("I'm sorry, I couldn't process that. Try again?");
        }
        setLoading(false);
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setTranscript("");
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-20 h-20 bg-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all group z-50 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Brain className="w-10 h-10 relative z-10" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-black border-4 border-white">AI</div>
            </button>
        );
    }

    return (
        <Card className="fixed bottom-8 right-8 w-[400px] border-none shadow-[0_32px_64px_-12px_rgba(79,70,229,0.2)] rounded-[3rem] overflow-hidden bg-white z-50 animate-in slide-in-from-bottom-8 duration-500">
            <CardHeader className="bg-slate-900 p-8 text-white flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-black italic uppercase tracking-tight">Study <span className="text-indigo-400">Buddy</span></CardTitle>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={cn("w-2 h-2 rounded-full", isSpeaking ? "bg-emerald-500 animate-pulse" : "bg-slate-500")} />
                            <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">{isSpeaking ? "Speaking..." : "Ready to assist"}</p>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8">
                {/* AI Avatar / Waveform Area */}
                <div className="flex flex-col items-center justify-center py-6 space-y-6">
                    <div className={cn(
                        "w-32 h-32 rounded-full border-8 border-slate-50 flex items-center justify-center transition-all duration-500",
                        isListening ? "scale-110 border-indigo-100 bg-indigo-50" : "bg-white"
                    )}>
                        {loading ? (
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                        ) : isListening ? (
                            <div className="flex gap-1 items-end h-10">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }} />
                                ))}
                            </div>
                        ) : (
                            <Brain className="w-12 h-12 text-slate-300" />
                        )}
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-xs font-medium text-slate-400 italic">
                            {isListening ? "Listening to you..." : isSpeaking ? "Explaining concept..." : "Tap to speak with me"}
                        </p>
                        {transcript && (
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">"{transcript}"</p>
                        )}
                    </div>
                </div>

                {/* AI Chat Bubble */}
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 relative">
                    <div className="absolute -top-3 left-8 bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">AI Response</div>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                        {aiResponse}
                    </p>
                    <button 
                        onClick={() => speak(aiResponse)}
                        className="absolute bottom-4 right-4 p-2 bg-white rounded-xl shadow-sm text-indigo-600 hover:scale-110 transition-transform"
                    >
                        <Volume2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Controls */}
                <div className="flex gap-4">
                    <Button 
                        onClick={toggleListening}
                        className={cn(
                            "flex-1 h-16 rounded-2xl font-black uppercase text-xs tracking-widest transition-all",
                            isListening ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                        )}
                    >
                        {isListening ? <MicOff className="w-5 h-5 mr-3" /> : <Mic className="w-5 h-5 mr-3" />}
                        {isListening ? "Stop Listening" : "Talk to Buddy"}
                    </Button>
                    <Button variant="outline" className="w-16 h-16 rounded-2xl border-slate-200 text-slate-400">
                        <MessageSquare className="w-6 h-6" />
                    </Button>
                </div>

                <div className="flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3 text-amber-500 fill-current" />
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AI Brain powered by Gemini</p>
                </div>
            </CardContent>
        </Card>
    );
}
