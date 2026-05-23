"use client";

import { useChat, useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, X, MessageSquare, HelpCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { RoomEvent } from "livekit-client";
import { toast } from "sonner";
import { logClassEvent } from "@/actions/live-class";

type Question = {
    id: string;
    text: string;
    fromName: string;
    fromIdentity: string;
    timestamp: number;
    answered: boolean;
};

export default function LiveChat({ onClose, role = "student", dbRoomId }: { onClose: () => void, role?: "staff" | "student", dbRoomId?: string }) {
    const room = useRoomContext();
    const { chatMessages, send, isSending } = useChat();
    const { localParticipant } = useLocalParticipant();
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState<"chat" | "qa">("chat");
    const [questions, setQuestions] = useState<Question[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Listen for Q&A packets over the data channel
    useEffect(() => {
        if (!room) return;

        const handleData = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
            if (topic !== 'qa') return;

            try {
                const text = new TextDecoder().decode(payload);
                const data = JSON.parse(text);

                if (data.type === 'NEW_QUESTION') {
                    setQuestions(prev => [...prev, data.question]);
                    // Only toast for the lecturer if a student asks
                    if (role === 'staff' && participant?.identity !== localParticipant?.identity) {
                        toast.info(`${data.question.fromName} asked a new question`);
                    }
                } else if (data.type === 'MARK_ANSWERED') {
                    setQuestions(prev => prev.map(q =>
                        q.id === data.questionId ? { ...q, answered: true } : q
                    ));
                }
            } catch (e) {
                // Ignore malformed packets
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room, role, localParticipant]);

    // Auto-scroll to bottom of chat when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleSend = async () => {
        if (!message.trim()) return;

        if (activeTab === "chat") {
            if (isSending) return;
            try {
                await send(message);
                if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'chat_message', { text: message.trim() });
                setMessage("");
            } catch (error) {
                console.error("Failed to send message", error);
            }
        } else {
            // Send Q&A
            if (!localParticipant) return;
            const newQ: Question = {
                id: Math.random().toString(36).substring(7),
                text: message.trim(),
                fromName: localParticipant.name || "Student",
                fromIdentity: localParticipant.identity,
                timestamp: Date.now(),
                answered: false
            };

            const payload = JSON.stringify({ type: 'NEW_QUESTION', question: newQ });
            const encoder = new TextEncoder();

            try {
                // Publish to everyone
                await localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'qa' });
                if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'qa_question', { text: newQ.text });
                // Add locally
                setQuestions(prev => [...prev, newQ]);
                setMessage("");
                toast.success("Question submitted!");
            } catch (err) {
                toast.error("Failed to submit question");
            }
        }
    };

    const handleMarkAnswered = async (questionId: string) => {
        if (!localParticipant || role !== 'staff') return;

        // Optimistically update local state
        setQuestions(prev => prev.map(q =>
            q.id === questionId ? { ...q, answered: true } : q
        ));

        const payload = JSON.stringify({ type: 'MARK_ANSWERED', questionId });
        const encoder = new TextEncoder();
        try {
            await localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'qa' });
            if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'qa_answer', { questionId });
        } catch (err) {
            console.error("Failed to broadcast answered state", err);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    return (
        <div className="absolute top-24 right-6 w-80 md:w-96 bg-white/95 backdrop-blur shadow-2xl rounded-xl border border-slate-200 z-50 flex flex-col h-[60vh] overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-600 text-white p-3 flex justify-between items-center shrink-0">
                <div className="flex bg-indigo-700/50 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={cn("px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors", activeTab === 'chat' ? "bg-white text-indigo-700 shadow-sm" : "text-indigo-100 hover:text-white")}
                    >
                        <MessageSquare className="w-4 h-4" /> Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('qa')}
                        className={cn("px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors", activeTab === 'qa' ? "bg-white text-indigo-700 shadow-sm" : "text-indigo-100 hover:text-white")}
                    >
                        <HelpCircle className="w-4 h-4" /> Q&A
                    </button>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors ml-2">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 p-4 bg-slate-50/50">
                <div ref={scrollRef}>
                    {activeTab === 'chat' ? (
                        <>
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
                                    <MessageSquare className="w-12 h-12 text-slate-200" />
                                    <p className="text-sm">Welcome to the class chat. Say hello!</p>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-2">
                                    {chatMessages.map((msg, idx) => {
                                        const isMe = msg.from?.identity === localParticipant?.identity;
                                        return (
                                            <div key={idx} className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                                {!isMe && (
                                                    <span className="text-[10px] font-bold text-slate-500 mb-1 ml-1 px-1">
                                                        {msg.from?.name || "Participant"}
                                                    </span>
                                                )}
                                                <div className={cn(
                                                    "px-3 py-2 text-sm rounded-2xl shadow-sm break-words",
                                                    isMe ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                                                )}>
                                                    {msg.message}
                                                </div>
                                                <span className="text-[9px] text-slate-400 mt-1 px-1">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {questions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
                                    <HelpCircle className="w-12 h-12 text-slate-200" />
                                    <p className="text-sm">No questions asked yet. Be the first!</p>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-2">
                                    {questions.map((q) => (
                                        <div key={q.id} className={cn(
                                            "bg-white border rounded-xl p-3 shadow-sm",
                                            q.answered ? "border-green-200 bg-green-50/30" : "border-slate-200"
                                        )}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                    {q.fromName}
                                                    {q.fromIdentity === localParticipant?.identity && <span className="text-slate-400 font-normal">(You)</span>}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-800 break-words">{q.text}</p>

                                            <div className="mt-3 flex justify-between items-center">
                                                {q.answered ? (
                                                    <span className="text-xs font-medium text-green-600 flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                                        Awaiting Answer
                                                    </span>
                                                )}

                                                {role === 'staff' && !q.answered && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
                                                        onClick={() => handleMarkAnswered(q.id)}
                                                    >
                                                        Mark Answered
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center shrink-0">
                <Input
                    placeholder={activeTab === 'chat' ? "Type a message..." : "Ask a formal question..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-slate-100 border-none shadow-inner focus-visible:ring-indigo-500 rounded-full px-4"
                />
                <Button
                    onClick={handleSend}
                    disabled={!message.trim() || (activeTab === 'chat' && isSending)}
                    size="icon"
                    className="rounded-full bg-indigo-600 hover:bg-indigo-700 h-10 w-10 shrink-0"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div >
    );
}
