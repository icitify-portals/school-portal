"use client";

import { useState } from "react";
import { 
    MessageSquare, 
    Send, 
    Search, 
    User, 
    ShieldCheck, 
    Info, 
    AlertCircle,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ParentCommunicationsPage({ params }: { params: { id: string } }) {
    const studentId = params.id;
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [message, setMessage] = useState("");

    const chats = [
        { id: 1, name: "School Registrar", role: "Administration", lastMsg: "Please upload the birth certificate...", time: "1h ago", unread: 1, type: "official" },
        { id: 2, name: "Dr. Adebayo", role: "Class Teacher", lastMsg: "Your child showed great interest in...", time: "3h ago", unread: 0, type: "teacher" },
        { id: 3, name: "Bursary Office", role: "Finance", lastMsg: "Payment for 1st Term has been...", time: "1d ago", unread: 0, type: "finance" },
    ];

    const currentMessages = [
        { id: 1, sender: "official", text: "Hello, we noticed the birth certificate for your child is missing in our records.", time: "10:30 AM" },
        { id: 2, sender: "parent", text: "I will upload it by this evening. Thank you for the reminder.", time: "11:15 AM" },
        { id: 3, sender: "official", text: "Excellent. Please let us know once it's done.", time: "11:20 AM" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/parent/child/${studentId}`} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors group">
                    <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Communication <span className="text-indigo-600">Hub</span></h1>
                    <p className="text-slate-500 font-medium">Direct secure messaging with school staff and administration.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px]">
                {/* Chat List */}
                <Card className="lg:col-span-1 border-none shadow-2xl shadow-indigo-500/5 rounded-[2.5rem] overflow-hidden bg-white flex flex-col">
                    <div className="p-6 border-b border-slate-50 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input placeholder="Search messages..." className="pl-10 h-12 rounded-xl bg-slate-50 border-none font-medium" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {chats.map((chat) => (
                            <div 
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={cn(
                                    "p-4 rounded-2xl cursor-pointer transition-all flex gap-4 items-center group",
                                    selectedChat?.id === chat.id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "hover:bg-slate-50"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                    selectedChat?.id === chat.id ? "bg-white/20" : "bg-indigo-50 text-indigo-600"
                                )}>
                                    <User className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h4 className="font-black text-sm truncate">{chat.name}</h4>
                                        <span className={cn("text-[8px] font-bold uppercase", selectedChat?.id === chat.id ? "text-white/60" : "text-slate-400")}>{chat.time}</span>
                                    </div>
                                    <p className={cn("text-xs truncate font-medium", selectedChat?.id === chat.id ? "text-white/80" : "text-slate-500")}>{chat.lastMsg}</p>
                                </div>
                                {chat.unread > 0 && selectedChat?.id !== chat.id && (
                                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                                        {chat.unread}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Message Window */}
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-indigo-500/5 rounded-[2.5rem] overflow-hidden bg-white flex flex-col relative">
                    {!selectedChat ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 uppercase">Your Inbox</h3>
                                <p className="text-slate-500 font-medium max-w-sm">Select a conversation from the left to start communicating with the school.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <CardHeader className="bg-white border-b border-slate-50 p-6 flex-row justify-between items-center space-y-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">{selectedChat.name}</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[8px] border-slate-200 uppercase font-black">{selectedChat.role}</Badge>
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black uppercase text-slate-400">Online</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-400">
                                    <Info className="w-5 h-5" />
                                </Button>
                            </CardHeader>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                                {currentMessages.map((msg) => (
                                    <div key={msg.id} className={cn(
                                        "flex flex-col gap-1",
                                        msg.sender === 'parent' ? "items-end" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "max-w-[70%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                                            msg.sender === 'parent' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                                        )}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-slate-400 px-2">{msg.time}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-white border-t border-slate-50">
                                <div className="flex gap-4">
                                    <Input 
                                        placeholder="Type your message here..." 
                                        className="flex-1 h-14 rounded-2xl bg-slate-50 border-none font-medium px-6 focus:ring-2 focus:ring-indigo-600"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <Button className="h-14 w-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 p-0">
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
