"use client";

import { useState, useEffect, useRef } from "react";
import { 
    getTicketWithMessagesAction, 
    addMessageAction, 
    updateTicketStatusAction,
    assignTicketAction,
    getHelpdeskOverviewMetricsAction
} from "@/actions/support-tickets";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
    LifeBuoy, 
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
    UserPlus,
    Tag,
    ChevronRight,
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
    creatorName: string;
    creatorEmail: string;
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
    creatorRole?: string;
    creatorPhone?: string;
}

interface Staff {
    id: number;
    name: string;
    email: string;
    jobTitle?: string | null;
}

interface Metrics {
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    totalActive: number;
    totalClosed: number;
    urgentQueue: number;
    avgResolutionHours: number;
    customerSatisfactionRate: number;
}

interface Props {
    initialTickets: Ticket[];
    supportStaff: Staff[];
    initialMetrics: Metrics;
    session: any;
}

export default function AdminSupportClient({ initialTickets, supportStaff, initialMetrics, session }: Props) {
    const router = useRouter();
    const currentUserId = Number(session?.user?.id);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
    const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Search and filters
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    // Reply state
    const [replyText, setReplyText] = useState("");
    const [replyAttachment, setReplyAttachment] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    // Assignment & Status state
    const [assigneeId, setAssigneeId] = useState("");
    const [statusVal, setStatusVal] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('open');
    const [savingSettings, setSavingSettings] = useState(false);

    // Load ticket detail
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
                    const detail = res.data as any;
                    setTicketDetail(detail);
                    setAssigneeId(detail.assignedToId ? String(detail.assignedToId) : "");
                    setStatusVal(detail.status);
                } else {
                    toast.error(res.error || "Failed to load ticket details");
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
                             t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
                             t.creatorName.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
        return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
    });

    // Refresh dashboard stats
    const refreshDashboard = async () => {
        try {
            const res = await getHelpdeskOverviewMetricsAction();
            if (res.success && res.data) {
                setMetrics(res.data as any);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Submit reply message
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

    // Save ticket configuration adjustments (assignee / status)
    const handleSaveSettings = async () => {
        if (!selectedTicketId || !ticketDetail) return;
        setSavingSettings(true);
        try {
            // 1. Assign ticket if changed
            const currentAssignee = ticketDetail.assignedToId ? String(ticketDetail.assignedToId) : "";
            if (assigneeId !== currentAssignee) {
                if (assigneeId) {
                    const res = await assignTicketAction(selectedTicketId, Number(assigneeId));
                    if (!res.success) {
                        const errorRes = res as { error: string };
                        toast.error(errorRes.error || "Failed to update ticket assignment");
                        setSavingSettings(false);
                        return;
                    }
                }
            }

            // 2. Update status if changed
            if (statusVal !== ticketDetail.status) {
                const res = await updateTicketStatusAction(selectedTicketId, statusVal);
                if (!res.success) {
                    const errorRes = res as { error: string };
                    toast.error(errorRes.error || "Failed to update ticket status");
                    setSavingSettings(false);
                    return;
                }
            }

            toast.success("Ticket details updated successfully.");
            
            // Refresh conversation
            const detailRes = await getTicketWithMessagesAction(selectedTicketId);
            if (detailRes.success && detailRes.data) {
                const detail = detailRes.data as any;
                setTicketDetail(detail);
                setAssigneeId(detail.assignedToId ? String(detail.assignedToId) : "");
                setStatusVal(detail.status);
            }
            
            // Refresh parent list & stats
            router.refresh();
            await refreshDashboard();

        } catch (err: any) {
            toast.error(err.message || "Failed to update settings");
        } finally {
            setSavingSettings(false);
        }
    };

    // Status badge style helper
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-2.5 py-0.5 rounded-full text-xs font-semibold">Open</Badge>;
            case "in_progress":
                return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none px-2.5 py-0.5 rounded-full text-xs font-semibold">In Progress</Badge>;
            case "resolved":
                return <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-none px-2.5 py-0.5 rounded-full text-xs font-semibold">Resolved</Badge>;
            case "closed":
                return <Badge className="bg-slate-400 text-white border-none px-2.5 py-0.5 rounded-full text-xs font-semibold">Closed</Badge>;
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Top KPIs counters */}
            <div className="col-span-1 lg:col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-6">
                <Card className="shadow-sm border-slate-200 bg-white/50 backdrop-blur-md">
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unresolved Queue</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{metrics.totalActive}</h3>
                            <p className="text-xxs text-emerald-600 font-semibold mt-1">● {metrics.openTickets} open • {metrics.inProgressTickets} in progress</p>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-2xl">
                            <Clock className="h-6 w-6 text-slate-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 bg-white/50 backdrop-blur-md">
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Urgent Cases</p>
                            <h3 className="text-3xl font-black text-rose-600 mt-1">{metrics.urgentQueue}</h3>
                            <p className="text-xxs text-rose-500 font-semibold mt-1">Requires immediate response</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-2xl">
                            <AlertCircle className="h-6 w-6 text-rose-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 bg-white/50 backdrop-blur-md">
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved Rate</p>
                            <h3 className="text-3xl font-black text-indigo-600 mt-1">{metrics.customerSatisfactionRate}%</h3>
                            <p className="text-xxs text-indigo-500 font-semibold mt-1">SLA Target resolution met</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <CheckCircle className="h-6 w-6 text-indigo-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 bg-white/50 backdrop-blur-md">
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Resolution</p>
                            <h3 className="text-3xl font-black text-blue-600 mt-1">{metrics.avgResolutionHours} hrs</h3>
                            <p className="text-xxs text-blue-500 font-semibold mt-1">Baseline SLA limit: 24.0 hrs</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <LifeBuoy className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Left Column: Tickets Queue List (4 cols) */}
            <div className="col-span-1 lg:col-span-4 space-y-4">
                <Card className="shadow-sm border-slate-200 bg-white/50 backdrop-blur-md">
                    <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-lg font-bold text-slate-800">IT Support Queue</CardTitle>
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-semibold text-xxs px-2.5 py-1 rounded-full">
                            {filteredTickets.length} cases
                        </Badge>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search student name, title, ticket #..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white rounded-xl text-sm"
                            />
                        </div>

                        {/* Filters Grid */}
                        <div className="grid grid-cols-3 gap-1.5">
                            <select 
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="text-xxs font-bold bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 focus:outline-none focus:border-slate-300"
                            >
                                <option value="all">Category</option>
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
                                className="text-xxs font-bold bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 focus:outline-none focus:border-slate-300"
                            >
                                <option value="all">Status</option>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                            <select 
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="text-xxs font-bold bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 focus:outline-none focus:border-slate-300"
                            >
                                <option value="all">Priority</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        {/* Tickets List */}
                        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                            {filteredTickets.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <MessageSquare className="h-8 w-8 mx-auto stroke-1" />
                                    <p className="text-xs font-medium mt-2">No tickets found.</p>
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
                                        <p className="text-xxs font-semibold text-slate-500">Student: {t.creatorName}</p>
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
                    <Card className="shadow-sm border-slate-200 bg-white h-[580px] flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                            <p className="text-sm text-slate-500 font-medium">Fetching support thread...</p>
                        </div>
                    </Card>
                ) : ticketDetail ? (
                    <Card className="shadow-sm border-slate-200 bg-white flex flex-col h-[650px]">
                        
                        {/* Header Details */}
                        <div className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between bg-slate-50/30 gap-4">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">{ticketDetail.ticketNumber}</span>
                                    {getStatusBadge(ticketDetail.status)}
                                    {getPriorityBadge(ticketDetail.priority)}
                                </div>
                                <h3 className="text-md font-extrabold text-slate-800 mt-1.5">{ticketDetail.title}</h3>
                                <p className="text-xxs text-slate-500 font-medium mt-1">
                                    Submitted by <strong>{ticketDetail.creatorName}</strong> ({ticketDetail.creatorEmail})
                                </p>
                            </div>
                        </div>

                        {/* Middle Action / Settings Panel */}
                        <div className="p-3 border-b bg-slate-50 border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-5 flex items-center gap-2">
                                <UserPlus className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <select 
                                    value={assigneeId}
                                    onChange={(e) => setAssigneeId(e.target.value)}
                                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Unassigned</option>
                                    {supportStaff.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.jobTitle || 'Agent'})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-4 flex items-center gap-2">
                                <Tag className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <select 
                                    value={statusVal}
                                    onChange={(e) => setStatusVal(e.target.value as any)}
                                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="sm:col-span-3">
                                <Button 
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xxs h-8 flex items-center gap-1.5"
                                    onClick={handleSaveSettings}
                                    disabled={savingSettings}
                                >
                                    {savingSettings ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    Save Changes
                                </Button>
                            </div>
                        </div>

                        {/* Thread Message List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
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
                                            <span>{m.senderName} ({m.senderRole})</span>
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
                                <Lock className="h-4 w-4" /> This support ticket is closed. Re-open status to write replies.
                            </div>
                        ) : (
                            <form onSubmit={handleSendReply} className="p-3 border-t bg-white space-y-2">
                                <Textarea 
                                    placeholder="Write helpdesk agent reply here..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={2}
                                    className="border-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm rounded-xl py-2 px-3 resize-none bg-slate-50/30"
                                />
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 flex items-center gap-2 relative">
                                        <Paperclip className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input 
                                            placeholder="Optional screenshot / document attachment URL..."
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
                    <Card className="shadow-sm border-slate-200 bg-white h-[580px] flex items-center justify-center p-8">
                        <div className="text-center max-w-sm space-y-4">
                            <div className="w-16 h-16 bg-slate-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                                <Shield className="h-8 w-8 stroke-1" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Agent Helpdesk Inbox</h3>
                                <p className="text-xs text-slate-500 leading-relaxed mt-2.5">
                                    Select an unresolved student support ticket from the inbox queue list to take ownership, assign agents, change priority levels, or write response messages.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
