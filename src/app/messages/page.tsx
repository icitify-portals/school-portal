"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getConversations } from "@/actions/communication";
import { MessagingChat } from "@/components/communication/MessagingChat";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Search,
    MessageSquare,
    Users,
    ShieldCheck,
    Clock,
    Plus,
    Filter
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function MessagingPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getConversations();
        setConversations(data);
        if (data.length > 0) setSelectedId(data[0].conversationId);
        setLoading(false);
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <div className="w-96 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-50 space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-indigo-600" />
                            Messages
                        </h1>
                        <button className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Find a conversation..."
                            className="pl-10 rounded-xl bg-slate-50 border-none h-10 font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-10 text-center space-y-2">
                            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No messages yet</p>
                        </div>
                    ) : conversations.map((item) => {
                        const otherParticipant = item.conversation.participants.find((p: any) => p.userId !== item.userId)?.user;
                        const lastMsg = item.conversation.messages[0];

                        return (
                            <div
                                key={item.id}
                                onClick={() => setSelectedId(item.conversationId)}
                                className={cn(
                                    "p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors border-l-4",
                                    selectedId === item.conversationId ? "bg-indigo-50/50 border-indigo-600" : "border-transparent"
                                )}
                            >
                                <Avatar className="w-12 h-12 shadow-sm border-2 border-white">
                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                                        {otherParticipant?.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-black text-slate-900 truncate">
                                            {otherParticipant?.name || "Group Chat"}
                                        </h4>
                                        <span className="text-[10px] font-bold text-slate-400">10:45 AM</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate font-medium">
                                        {lastMsg ? "New encrypted message..." : "Start a secure chat"}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-3.3 h-3.3 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure AES-256 Storage</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-6 flex items-center justify-center">
                {selectedId ? (
                    <div className="w-full max-w-4xl">
                        <MessagingChat conversationId={selectedId} />
                    </div>
                ) : (
                    <div className="text-center space-y-4 max-w-sm">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto shadow-xl shadow-indigo-100/50">
                            <MessageSquare className="w-10 h-10 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Select a Chat</h2>
                            <p className="text-sm text-slate-500 font-medium">Pick a student, staff, or group to start communicating securely across the school.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
