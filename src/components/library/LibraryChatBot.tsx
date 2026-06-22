"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, X, Bot, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { libraryChat } from "@/actions/library";
import { toast } from "sonner";

export default function LibraryChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! I'm your Intelligent Library Assistant. Need help finding a book or preparing for an exam?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMsg = { role: "user", content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            // Call actual Server Action
            const result = await libraryChat(input, messages);
            if (result.success && result.text) {
                setMessages(prev => [...prev, { role: "assistant", content: result.text }]);
            } else {
                toast.error(result.error || "Failed to query library AI.");
                setMessages(prev => [...prev, { 
                    role: "assistant", 
                    content: "Sorry, I ran into an error while processing your request. Please try again." 
                }]);
            }
        } catch (err) {
            toast.error("AI service currently unavailable.");
            setMessages(prev => [...prev, { 
                role: "assistant", 
                content: "I'm offline. Please check your network connection." 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Toggle */}
            <Button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-10 right-10 h-20 w-20 rounded-[30px] bg-indigo-600 hover:bg-indigo-700 shadow-[0_20px_50px_rgba(79,70,229,0.4)] z-50 group transition-all hover:scale-110"
            >
                <div className="relative">
                    <MessageSquare className="h-8 w-8 text-white group-hover:scale-90 transition-transform" />
                    <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-indigo-200 animate-bounce" />
                </div>
            </Button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-32 right-10 w-[400px] max-w-[90vw] h-[600px] max-h-[70vh] bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                <Bot className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <div className="font-black text-white text-sm">Library AI</div>
                                <div className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Always Online</div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-xl">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-bold leading-relaxed whitespace-pre-wrap ${
                                    m.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] p-4 rounded-2xl rounded-tl-none bg-slate-800 border border-slate-700 text-slate-400 font-bold text-sm flex items-center gap-1.5">
                                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex gap-2">
                        <Input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isLoading ? "Library AI is thinking..." : "Type your request..."}
                            disabled={isLoading}
                            className="h-14 rounded-2xl bg-slate-900 border-none px-6 font-bold text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:opacity-50"
                        />
                        <Button 
                            onClick={handleSend} 
                            disabled={isLoading || !input.trim()}
                            className="h-14 w-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shrink-0"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
