"use client";

import { useState, useEffect, useRef } from "react";
import { 
    BrainCircuit, 
    X, 
    MessageSquare, 
    Mic, 
    Volume2, 
    VolumeX, 
    Send, 
    Loader2,
    Sparkles,
    User,
    Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { askAITutor } from "@/actions/ai";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function IntelligentTutoringSystem({ context }: { context?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'tutor', text: string }[]>([
        { role: 'tutor', text: "Hello! I'm your Intelligent Tutoring System (ITS). How can I help you with your studies today?" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [visionActive, setVisionActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!query.trim() || isLoading) return;

        const userText = query;
        setQuery("");
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsLoading(true);

        const res = await askAITutor(userText, context);
        setIsLoading(false);

        if (res.success && res.text) {
            setMessages(prev => [...prev, { role: 'tutor', text: res.text! }]);
            if (autoSpeak) speak(res.text);
        } else {
            setMessages(prev => [...prev, { role: 'tutor', text: "I'm having trouble connecting. Let's try that again." }]);
        }
    };

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        
        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1.1;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const toggleVision = async () => {
        if (!visionActive) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setVisionActive(true);
                }
            } catch (err) {
                toast.error("Camera access denied. SmartTutor Vision requires a webcam.");
            }
        } else {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            setVisionActive(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 print:hidden">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-80 md:w-96 h-[500px] border-none shadow-2xl shadow-indigo-500/20 rounded-[2.5rem] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                    <CardHeader className="bg-indigo-600 p-6 text-white flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <BrainCircuit className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black tracking-tight">ITS</CardTitle>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">AI Active</span>
                                </div>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-white/10 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-50/50">
                        {/* Vision Feed (Mini) */}
                        {visionActive && (
                            <div className="h-32 bg-slate-900 relative overflow-hidden group">
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    muted 
                                    className="w-full h-full object-cover opacity-60"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex gap-1">
                                        <div className="w-1 h-4 bg-emerald-500 animate-pulse" />
                                        <div className="w-1 h-6 bg-emerald-500 animate-pulse delay-75" />
                                        <div className="w-1 h-4 bg-emerald-500 animate-pulse delay-150" />
                                    </div>
                                </div>
                                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                                    <Badge className="bg-emerald-500 text-[8px] font-black uppercase py-0.5">Focus Active</Badge>
                                </div>
                            </div>
                        )}

                        {/* Messages Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
                        >
                            {messages.map((msg, idx) => (
                                <div key={idx} className={cn(
                                    "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}>
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                        msg.role === 'user' ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"
                                    )}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={cn(
                                        "max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                                        msg.role === 'user' ? "bg-white rounded-tr-none text-slate-700" : "bg-indigo-50 rounded-tl-none text-indigo-900"
                                    )}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                    <div className="bg-indigo-50 p-4 rounded-2xl rounded-tl-none flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150" />
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100 space-y-3">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask anything..."
                                    className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                />
                                <Button 
                                    onClick={handleSend}
                                    disabled={isLoading || !query.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 rounded-xl w-10 h-10 p-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <div className="flex items-center gap-4">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setAutoSpeak(!autoSpeak)}
                                        className={cn("text-[10px] font-black uppercase tracking-widest gap-2 p-0 h-auto hover:bg-transparent", autoSpeak ? "text-indigo-600" : "text-slate-400")}
                                    >
                                        {autoSpeak ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                                        {autoSpeak ? "Voice Coaching ON" : "Voice Coaching OFF"}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={toggleVision}
                                        className={cn("text-[10px] font-black uppercase tracking-widest gap-2 p-0 h-auto hover:bg-transparent", visionActive ? "text-emerald-600" : "text-slate-400")}
                                    >
                                        <Bot className="w-3 h-3" />
                                        {visionActive ? "Adaptive Mode ON" : "Adaptive Mode OFF"}
                                    </Button>
                                </div>
                                {isSpeaking && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={stopSpeaking}
                                        className="text-rose-600 text-[10px] font-black uppercase p-0 h-auto hover:bg-transparent animate-pulse"
                                    >
                                        Stop Voice
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Toggle Button */}
            <Button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-16 h-16 rounded-full shadow-2xl shadow-indigo-500/30 flex flex-col items-center justify-center p-0 group overflow-hidden transition-all duration-500",
                    isOpen ? "bg-slate-900" : "bg-indigo-600 hover:scale-110 active:scale-95"
                )}
            >
                <div className="relative">
                    {isOpen ? <X className="w-7 h-7 text-white" /> : <BrainCircuit className="w-7 h-7 text-white group-hover:rotate-12 transition-transform" />}
                    {!isOpen && <Sparkles className="w-4 h-4 text-amber-300 absolute -top-2 -right-2 animate-bounce" />}
                </div>
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1 opacity-80 group-hover:opacity-100 transition-colors">ITS</span>
            </Button>
        </div>
    );
}
