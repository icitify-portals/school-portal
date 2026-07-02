"use client";

import { useState, useEffect, useRef } from "react";
import { 
    createSupportTicketAction, 
    getTicketWithMessagesAction, 
    addMessageAction, 
    updateTicketStatusAction 
} from "@/actions/support-tickets";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
    LifeBuoy, 
    Plus, 
    Search, 
    MessageSquare, 
    Paperclip, 
    Send, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    Shield, 
    User,
    Loader2,
    Lock,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
    id: number;
    ticketNumber: string;
    title: string;
    category: 'technical' | 'academic' | 'financial' | 'hostel' | 'administrative' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    createdAt: string;
    updatedAt: string;
}

interface Message {
    id: number;
    messageText: string;
    attachmentUrl?: string | null;
    createdAt: string;
    senderId: number;
    senderName: string;
    senderRole: string;
    senderImageUrl?: string | null;
}

interface TicketDetail extends Ticket {
    assignedToId?: number | null;
    assignedAgentName?: string | null;
    messages: Message[];
}

interface Props {
    initialTickets: Ticket[];
    session: any;
}

export default function SupportTicketsClient({ initialTickets, session }: Props) {
    const router = useRouter();
    const currentUserId = Number(session?.user?.id);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Filter states
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newCategory, setNewCategory] = useState<'technical' | 'academic' | 'financial' | 'hostel' | 'administrative' | 'other'>('technical');
    const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('low');
    const [attachmentUrl, setAttachmentUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Reply state
    const [replyText, setReplyText] = useState("");
    const [replyAttachment, setReplyAttachment] = useState("");
    const [sendingReply, setSendingReply] = useState(false);
    const [closingTicket, setClosingTicket] = useState(false);

    // Load ticket detail when selectedTicketId changes
    useEffect(() => {
        if (!selectedTicketId) {
            setTicketDetail(null);
            return;
        }

        const fetchDetail = async () => {
            setLoadingDetail(true);
            try {
                const res = await getTicketWithMessagesAction(selectedTicketId);
                if (res.success && res.data) {
                    setTicketDetail(res.data as any);
                } else {
                    toast.error(res.error || "Failed to load ticket conversation");
                }
            } catch (err: any) {
                toast.error(err.message || "An unexpected error occurred");
            } finally {
                setLoadingDetail(false);
            }
        };

        fetchDetail();
    }, [selectedTicketId]);

    // Scroll to bottom on message list updates
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticketDetail?.messages]);

    // Format Date helper
    const formatDate = (dateStr: string | Date) => {
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Filter tickets
    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                             t.ticketNumber.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Create Ticket handler
    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newDesc.trim()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await createSupportTicketAction({
                title: newTitle,
                description: newDesc,
                category: newCategory,
                priority: newPriority
            });

            if (res.success) {
                const successRes = res as { ticketId: number; ticketNumber: string };
                toast.success(`Ticket ${successRes.ticketNumber} created successfully! Routed to IT support queue.`);
                setIsCreateOpen(false);
                setNewTitle("");
                setNewDesc("");
                setNewCategory("technical");
                setNewPriority("low");
                setAttachmentUrl("");
                
                // Refresh list
                router.refresh();
                // Select new ticket
                setSelectedTicketId(successRes.ticketId);
            } else {
                const errorRes = res as { error: string };
                toast.error(errorRes.error || "Could not submit ticket");
            }
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    // Submit message response
    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() && !replyAttachment.trim() || !selectedTicketId) return;

        setSendingReply(true);
        try {
            const res = await addMessageAction(selectedTicketId, {
                messageText: replyText,
                attachmentUrl: replyAttachment || undefined
            });

            if (res.success) {
                setReplyText("");
                setReplyAttachment("");
                // Refresh conversation
                const detailRes = await getTicketWithMessagesAction(selectedTicketId);
                if (detailRes.success && detailRes.data) {
                    setTicketDetail(detailRes.data as any);
                }
            } else {
                const errorRes = res as { error: string };
                toast.error(errorRes.error || "Could not post message reply");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to send message");
        } finally {
            setSendingReply(false);
        }
    };

    // Close Ticket handler
    const handleCloseTicket = async () => {
        if (!selectedTicketId) return;
        setClosingTicket(true);
        try {
            const res = await updateTicketStatusAction(selectedTicketId, "closed");
            if (res.success) {
                toast.success("Ticket closed successfully.");
                // Refresh conversation
                const detailRes = await getTicketWithMessagesAction(selectedTicketId);
                if (detailRes.success && detailRes.data) {
                    setTicketDetail(detailRes.data as any);
                }
                // Refresh parent queue
                router.refresh();
            } else {
                const errorRes = res as { error: string };
                toast.error(errorRes.error || "Could not close ticket");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to close ticket");
        } finally {
            setClosingTicket(false);
        }
    };

    // Status badge style helper
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-2 py-0.5 rounded-full text-xs font-semibold">Open</Badge>;
            case "in_progress":
                return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none px-2 py-0.5 rounded-full text-xs font-semibold">In Progress</Badge>;
            case "resolved":
                return <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-none px-2 py-0.5 rounded-full text-xs font-semibold">Resolved</Badge>;
            case "closed":
                return <Badge className="bg-slate-400 text-white border-none px-2 py-0.5 rounded-full text-xs font-semibold">Closed</Badge>;
            default:
                return null;
        }
    };

    // Priority badge style helper
    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case "urgent":
                return <Badge className="bg-rose-500 text-white border-none px-2 py-0.5 text-xs font-medium uppercase">Urgent</Badge>;
            case "high":
                return <Badge className="bg-amber-500 text-white border-none px-2 py-0.5 text-xs font-medium uppercase">High</Badge>;
            case "medium":
                return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300 border-none px-2 py-0.5 text-xs font-medium uppercase">Medium</Badge>;
            default:
                return <Badge className="bg-slate-100 text-slate-600 border-none px-2 py-0.5 text-xs font-medium uppercase">Low</Badge>;
        }
    };

    // Category tag label helper
    const getCategoryLabel = (category: string) => {
        return category.charAt(0).toUpperCase() + category.slice(1);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Top Counters */}
            <div className="col-span-1 lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="-200 /50 backdrop-blur-md border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6 flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Tickets</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{tickets.length}</h3>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-2xl">
                            <LifeBuoy className="h-6 w-6 text-slate-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="-200 /50 backdrop-blur-md border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6 flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Queue</p>
                            <h3 className="text-3xl font-black text-emerald-600 mt-1">
                                {tickets.filter(t => t.status === "open" || t.status === "in_progress").length}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-2xl">
                            <Clock className="h-6 w-6 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="-200 /50 backdrop-blur-md border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6 flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Resolved Cases</p>
                            <h3 className="text-3xl font-black text-indigo-600 mt-1">
                                {tickets.filter(t => t.status === "resolved" || t.status === "closed").length}
                            </h3>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <CheckCircle className="h-6 w-6 text-indigo-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Left Column: Tickets Queue List (4 cols) */}
            <div className="col-span-1 lg:col-span-4 space-y-4">
                <Card className="-200 /50 backdrop-blur-md border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-lg font-bold text-slate-800">Support Inbox</CardTitle>
                        <Button 
                            size="sm" 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-1.5"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <Plus className="h-4 w-4" /> New Ticket
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3 p-6">
                        {/* Search & Filters */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search by ticket # or title..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white rounded-xl text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <select 
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-slate-300"
                            >
                                <option value="all">All Categories</option>
                                <option value="technical">Technical</option>
                                <option value="academic">Academic</option>
                                <option value="financial">Financial</option>
                                <option value="hostel">Hostel</option>
                                <option value="administrative">Administrative</option>
                                <option value="other">Other</option>
                            </select>
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-slate-300"
                            >
                                <option value="all">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        {/* Tickets List */}
                        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                            {filteredTickets.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <MessageSquare className="h-8 w-8 mx-auto stroke-1" />
                                    <p className="text-xs font-medium mt-2">No tickets found matches.</p>
                                </div>
                            ) : (
                                filteredTickets.map(t => (
                                    <div 
                                        key={t.id}
                                        onClick={() => setSelectedTicketId(t.id)}
                                        className={cn(
                                            "p-3 rounded-xl border border-slate-100 cursor-pointer transition-all duration-200 flex flex-col gap-2 hover:bg-slate-50/50 hover:border-slate-200/60",
                                            selectedTicketId === t.id ? "bg-slate-50 border-indigo-200 ring-2 ring-indigo-50" : "bg-white"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-indigo-600 tracking-wider uppercase">{t.ticketNumber}</span>
                                            {getStatusBadge(t.status)}
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{t.title}</h4>
                                        <div className="flex items-center justify-between text-xxs text-slate-400 font-semibold border-t pt-2 mt-1">
                                            <span>Category: {getCategoryLabel(t.category)}</span>
                                            <div className="flex items-center gap-1.5">
                                                {getPriorityBadge(t.priority)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Ticket Conversation details (8 cols) */}
            <div className="col-span-1 lg:col-span-8">
                {loadingDetail ? (
                    <Card className="-200 h-[580px] flex items-center justify-center border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className="text-center space-y-2">
                            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                            <p className="text-sm text-slate-500 font-medium">Fetching support thread...</p>
                        </div>
                    </Card>
                ) : ticketDetail ? (
                    <Card className="-200 flex flex-col h-[580px] border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        {/* Header Details */}
                        <div className="p-4 border-b flex items-center justify-between bg-slate-50/30">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">{ticketDetail.ticketNumber}</span>
                                    {getStatusBadge(ticketDetail.status)}
                                    {getPriorityBadge(ticketDetail.priority)}
                                </div>
                                <h3 className="text-md font-extrabold text-slate-800 mt-1.5">{ticketDetail.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {ticketDetail.status !== "closed" && ticketDetail.status !== "resolved" && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleCloseTicket}
                                        disabled={closingTicket}
                                        className="text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-100 rounded-xl"
                                    >
                                        {closingTicket ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                        Close Ticket
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Thread Message List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                            {ticketDetail.assignedAgentName && (
                                <div className="p-2 bg-indigo-50 border border-indigo-100/50 rounded-xl text-xxs font-medium text-indigo-800 flex items-center gap-1.5 justify-center">
                                    <Shield className="h-3.5 w-3.5" /> Support Agent <strong>{ticketDetail.assignedAgentName}</strong> has been assigned and is reviewing your ticket.
                                </div>
                            )}

                            {ticketDetail.messages.map((m, idx) => {
                                const isSenderMe = m.senderId === currentUserId;
                                return (
                                    <div 
                                        key={m.id || idx} 
                                        className={cn(
                                            "flex flex-col max-w-[85%]",
                                            isSenderMe ? "ml-auto items-end" : "mr-auto items-start"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5 text-xxs text-slate-400 font-semibold mb-1">
                                            <span>{m.senderName}</span>
                                            <span className="text-slate-300">•</span>
                                            <span>{formatDate(m.createdAt)}</span>
                                        </div>
                                        <div className={cn(
                                            "p-3 rounded-2xl text-sm leading-relaxed shadow-xxs",
                                            isSenderMe 
                                                ? "bg-indigo-600 text-white rounded-tr-none" 
                                                : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                                        )}>
                                            <p className="whitespace-pre-wrap font-medium">{m.messageText}</p>
                                            
                                            {/* File Attachment display */}
                                            {m.attachmentUrl && (
                                                <div className={cn(
                                                    "mt-2.5 pt-2 border-t flex items-center gap-2",
                                                    isSenderMe ? "border-indigo-500/50" : "border-slate-100"
                                                )}>
                                                    <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <a 
                                                        href={m.attachmentUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className={cn(
                                                            "text-xxs font-bold underline flex items-center gap-0.5",
                                                            isSenderMe ? "text-indigo-100 hover:text-white" : "text-indigo-600 hover:text-indigo-700"
                                                        )}
                                                    >
                                                        View Attachment <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Reply Form */}
                        {ticketDetail.status === "closed" ? (
                            <div className="p-4 border-t bg-slate-100 text-slate-500 flex items-center justify-center gap-1.5 text-xs font-semibold">
                                <Lock className="h-4 w-4" /> This support ticket is closed. Submit a new ticket if the issue persists.
                            </div>
                        ) : ticketDetail.status === "resolved" ? (
                            <div className="p-4 border-t bg-indigo-50 text-indigo-800 flex items-center justify-center gap-1.5 text-xs font-semibold">
                                <CheckCircle className="h-4 w-4 text-indigo-600" /> Ticket has been marked resolved. You can still reply to reopen or close.
                            </div>
                        ) : (
                            <form onSubmit={handleSendReply} className="p-3 border-t bg-white space-y-2">
                                <Textarea 
                                    placeholder="Write your response message here..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={2}
                                    className="border-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm rounded-xl py-2 px-3 resize-none bg-slate-50/30"
                                />
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 flex items-center gap-2 relative">
                                        <Paperclip className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input 
                                            placeholder="Optional attachment URL (e.g. screenshot link)..."
                                            value={replyAttachment}
                                            onChange={(e) => setReplyAttachment(e.target.value)}
                                            className="pl-9 py-1 bg-slate-50/50 border-slate-200 text-xs rounded-xl h-9"
                                        />
                                    </div>
                                    <Button 
                                        type="submit" 
                                        disabled={sendingReply || (!replyText.trim() && !replyAttachment.trim())}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs px-4 h-9 flex items-center gap-1"
                                    >
                                        {sendingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                        Send Reply
                                    </Button>
                                </div>
                            </form>
                        )}
                    </Card>
                ) : (
                    <Card className="-200 h-[580px] flex items-center justify-center p-8 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className="text-center max-w-sm space-y-4">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                                <LifeBuoy className="h-8 w-8 stroke-1" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Support Chat Center</h3>
                                <p className="text-xs text-slate-500 leading-relaxed mt-2.5">
                                    Select an active support ticket from your inbox queue to view messages and coordinate with support agents, or submit a new help ticket request.
                                </p>
                            </div>
                            <Button 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-1.5 mx-auto"
                                onClick={() => setIsCreateOpen(true)}
                            >
                                <Plus className="h-4 w-4" /> Open Support Ticket
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            {/* Submit New Ticket Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-800">Open Support Ticket</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Submit your issue. It will route directly to the IT Administration support queue.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Ticket Title *</label>
                            <Input 
                                placeholder="E.g., Unable to register course CSE 301"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="border-slate-200 bg-slate-50/50 rounded-xl"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                                <select 
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as any)}
                                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-slate-300"
                                >
                                    <option value="technical">Technical / Bug</option>
                                    <option value="academic">Academic / Enrollment</option>
                                    <option value="financial">Financial / Fees</option>
                                    <option value="hostel">Hostel Allocation</option>
                                    <option value="administrative">Administrative</option>
                                    <option value="other">Other Inquiry</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Priority Level</label>
                                <select 
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value as any)}
                                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-slate-300"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent / Blocked</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Describe your issue *</label>
                            <Textarea 
                                placeholder="Explain the issue in detail. If financial, specify transaction reference."
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                rows={4}
                                className="border-slate-200 bg-slate-50/50 rounded-xl resize-none text-sm leading-relaxed"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Attachment URL (Optional)</label>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Simulate upload or paste screenshot link..."
                                    value={attachmentUrl}
                                    onChange={(e) => setAttachmentUrl(e.target.value)}
                                    className="border-slate-200 bg-slate-50/50 rounded-xl text-xs flex-1"
                                />
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => {
                                        setAttachmentUrl("https://portal.school.com/uploads/screenshot_bug.png");
                                        toast.info("Simulated screenshot upload successfully!");
                                    }}
                                    className="text-xxs font-bold border-dashed border-indigo-300 hover:bg-indigo-50 text-indigo-600 rounded-xl px-3"
                                >
                                    Simulate Upload
                                </Button>
                            </div>
                        </div>

                        <DialogFooter className="pt-2 border-t">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsCreateOpen(false)}
                                className="border-slate-200 text-slate-600 font-semibold rounded-xl text-xs"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={submitting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs px-4"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Submit Support Ticket
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
