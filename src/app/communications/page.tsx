"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
    Mail,
    Send,
    Inbox,
    Search,
    Plus,
    User,
    Clock,
    CheckCircle,
    MoreVertical,
    ChevronRight,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getMessagingContext, sendMessage, markMessageRead } from "@/actions/direct-messages";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function CommunicationsPage() {
    const [context, setContext] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
    const [isComposing, setIsComposing] = useState(false);
    const [composeData, setComposeData] = useState({ recipientId: "", subject: "", content: "" });
    const [query, setQuery] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const res = await getMessagingContext();
        setContext(res);
        setLoading(false);
    };

    const handleSend = async () => {
        if (!composeData.recipientId || !composeData.subject || !composeData.content) {
            toast.error("Please fill all fields");
            return;
        }

        const res = await sendMessage({
            recipientId: parseInt(composeData.recipientId),
            subject: composeData.subject,
            content: composeData.content
        });

        if (res.success) {
            toast.success("Message sent successfully");
            setIsComposing(false);
            setComposeData({ recipientId: "", subject: "", content: "" });
            loadData();
        } else {
            toast.error((res as any).error || "Failed to send message");
        }
    };

    const handleSelectMessage = async (msg: any) => {
        setSelectedMessage(msg);
        if (!msg.isRead) {
            await markMessageRead(msg.id);
            // Update local state to show read
            setContext((prev: any) => ({
                ...prev,
                inbox: prev.inbox.map((m: any) => m.id === msg.id ? { ...m, isRead: true } : m)
            }));
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-pulse flex flex-col items-center">
                <Mail className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Loading messages...</p>
            </div>
        </div>
    );

    const filteredInbox = context?.inbox?.filter((m: any) =>
        m.subject.toLowerCase().includes(query.toLowerCase()) ||
        m.sender.name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar List */}
            <div className="w-full lg:w-96 border-r flex flex-col bg-slate-50/50">
                <div className="p-6 border-b bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">Communications</h1>
                        <Button size="sm" onClick={() => setIsComposing(true)} className="rounded-full">
                            <Plus className="w-4 h-4 mr-1" /> Compose
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search messages..."
                            className="pl-9 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredInbox?.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Inbox className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-slate-900 font-semibold mb-1">No messages found</h3>
                            <p className="text-slate-500 text-sm">Your inbox is currently empty.</p>
                        </div>
                    ) : (
                        filteredInbox?.map((msg: any) => (
                            <div
                                key={msg.id}
                                onClick={() => handleSelectMessage(msg)}
                                className={cn(
                                    "p-6 border-b cursor-pointer transition-all hover:bg-white relative",
                                    selectedMessage?.id === msg.id ? "bg-white shadow-sm z-10" : "",
                                    !msg.isRead ? "border-l-4 border-l-blue-600 bg-blue-50/30" : ""
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                            <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 font-semibold uppercase">
                                                {msg.sender.name.substring(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className={cn("text-sm font-semibold text-slate-900", !msg.isRead ? "font-bold" : "")}>
                                                {msg.sender.name}
                                            </p>
                                            <p className="text-xs text-slate-500">{msg.sender.role}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {formatDistanceToNow(new Date(msg.createdAt))} ago
                                    </span>
                                </div>
                                <h4 className={cn("text-sm text-slate-800 mb-1 truncate", !msg.isRead ? "font-semibold" : "")}>
                                    {msg.subject}
                                </h4>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    {msg.content}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Content View */}
            <div className="hidden lg:flex flex-1 flex-col bg-slate-50/30">
                {selectedMessage ? (
                    <div className="flex-1 flex flex-col p-8">
                        <Card className="flex-1 shadow-xl border-none ring-1 ring-slate-200 flex flex-col overflow-hidden rounded-2xl">
                            <div className="p-8 border-b bg-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-12 h-12 shadow-md">
                                        <AvatarFallback className="bg-blue-600 text-white font-bold text-lg">
                                            {selectedMessage.sender.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{selectedMessage.subject}</h2>
                                        <p className="text-sm text-slate-500 font-medium">
                                            From <span className="text-blue-600">{selectedMessage.sender.name}</span> • {selectedMessage.sender.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="rounded-full shadow-sm hover:bg-slate-50">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 p-10 bg-white overflow-y-auto">
                                <div className="max-w-3xl mx-auto">
                                    <div className="flex items-center gap-2 mb-8 p-3 bg-slate-50 rounded-xl w-fit">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-500">
                                            Received on {new Date(selectedMessage.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="prose prose-slate max-w-none">
                                        <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                                            {selectedMessage.content}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                                <Button variant="outline" className="rounded-xl px-6">Forward</Button>
                                <Button
                                    onClick={() => {
                                        setComposeData({
                                            recipientId: selectedMessage.senderId.toString(),
                                            subject: `Re: ${selectedMessage.subject}`,
                                            content: `\n\n--- Original Message ---\n${selectedMessage.content}`
                                        });
                                        setIsComposing(true);
                                    }}
                                    className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 h-10"
                                >
                                    <Send className="w-4 h-4 mr-2" /> Reply
                                </Button>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center mb-8 rotate-3">
                            <MessageSquare className="w-12 h-12 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Select a message</h2>
                        <p className="text-slate-500 max-w-sm">
                            Choose a conversation from the list or start a new message to get started.
                        </p>
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            {isComposing && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl shadow-2xl border-none rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Send className="w-5 h-5 text-blue-400" />
                                <h3 className="text-lg font-bold">New Message</h3>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsComposing(false)} className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0">
                                ✕
                            </Button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Recipient</label>
                                <select
                                    className="w-full p-3.5 bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900"
                                    value={composeData.recipientId}
                                    onChange={(e) => setComposeData({ ...composeData, recipientId: e.target.value })}
                                >
                                    <option value="">Select recipient...</option>
                                    {context?.validRecipients?.map((r: any) => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Topic</label>
                                <Input
                                    className="bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl p-6 focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="What is this regarding?"
                                    value={composeData.subject}
                                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Content</label>
                                <textarea
                                    className="w-full min-h-[220px] p-5 bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none text-slate-900 leading-relaxed"
                                    placeholder="Type your message here..."
                                    value={composeData.content}
                                    onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="ghost" onClick={() => setIsComposing(false)} className="rounded-xl px-8 h-12 font-semibold">Cancel</Button>
                                <Button onClick={handleSend} className="rounded-xl px-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold transition-transform active:scale-95">
                                    Send Message
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
