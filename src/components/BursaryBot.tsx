"use client";

import { useState, useRef, useEffect } from "react";
import {
    MessageSquare,
    X,
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    TrendingUp,
    PieChart,
    ChevronDown,
    Zap
} from "lucide-react";
import { bursaryChat } from "@/actions/ai";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export default function BursaryBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
        { role: 'model', text: "Hello! I'm Bursary-Bot. How can I assist with the institution's finances today?" }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));
        // Note: we add the new message to history for the action
        history.push({ role: 'user', parts: [{ text: userMsg }] });

        const res = await bursaryChat(history);

        if (res.success && res.text) {
            setMessages(prev => [...prev, { role: 'model', text: res.text as string }]);
        } else {
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting to my brain right now. Please check the AI configuration." }]);
        }
        setLoading(false);
    };

    const suggestedPrompts = [
        "What is our current tuition revenue?",
        "Show budget utilization for IT Dept",
        "Summarize recent ledger transactions",
        "Are we over budget anywhere?"
    ];

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:scale-110 transition-all z-50 group"
            >
                <div className="absolute -top-2 -right-2 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white animate-pulse" />
                <MessageSquare className="w-8 h-8 group-hover:rotate-12 transition-transform" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-8 right-8 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">Bursary-Bot</h3>
                        <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Zap className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                            Active Intelligence
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {messages.map((m, i) => (
                    <div key={i} className={cn(
                        "flex gap-3",
                        m.role === 'user' ? "flex-row-reverse" : ""
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                            m.role === 'user' ? "bg-slate-900" : "bg-indigo-600"
                        )}>
                            {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                        </div>
                        <div className={cn(
                            "p-4 rounded-2xl text-sm leading-relaxed max-w-[80%]",
                            m.role === 'user' ? "bg-slate-900 text-white rounded-tr-none" : "bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none"
                        )}>
                            <div className="prose prose-sm prose-slate max-w-none">
                                {m.text.split('\n').map((line, j) => (
                                    <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-lg bg-indigo-400 shrink-0" />
                        <div className="p-4 bg-white rounded-2xl rounded-tl-none shadow-sm border border-slate-100 w-[60%] h-12 flex items-center px-4">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Input */}
            <div className="p-6 bg-white border-t border-slate-100">
                {messages.length < 3 && !loading && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {suggestedPrompts.map(p => (
                            <button
                                key={p}
                                onClick={() => setInput(p)}
                                className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSend} className="relative">
                    <input
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything about finances..."
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-md shadow-indigo-500/20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
