"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Wrench, Clock, CheckCircle2,
    AlertCircle, AlertTriangle,
    MessageSquare, User, Home,
    Loader2, Search, Filter,
    Hammer, Zap, Droplets, LayoutList
} from "lucide-react";
import {
    getAdminMaintenanceRequests,
    updateMaintenanceStatus
} from "@/actions/hostels";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function MaintenanceDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState("");

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        const data = await getAdminMaintenanceRequests();
        setRequests(data);
        setLoading(false);
    };

    const handleUpdateStatus = async (id: number, status: any) => {
        setUpdating(id);
        const res = await updateMaintenanceStatus(id, {
            status,
            resolutionNotes: status === 'resolved' ? resolutionNotes : undefined
        });
        if (res.success) {
            toast.success(res.message);
            setSelectedRequest(null);
            setResolutionNotes("");
            loadRequests();
        } else {
            toast.error(res.error || "Update failed");
        }
        setUpdating(null);
    };

    const filteredRequests = requests.filter(req => {
        const matchesStatus = filterStatus === "all" || req.status === filterStatus;
        const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'plumbing': return Droplets;
            case 'electrical': return Zap;
            case 'carpentry': return Hammer;
            case 'masonry': return LayoutList;
            default: return Wrench;
        }
    };

    if (loading) {
        return (
            <div className="py-40 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4 opacity-20" />
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Scanning Maintenance Queue...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pending', count: requests.filter(r => r.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'In Progress', count: requests.filter(r => r.status === 'in-progress').length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Resolved', count: requests.filter(r => r.status === 'resolved').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Total Requests', count: requests.length, color: 'text-slate-600', bg: 'bg-slate-50' },
                ].map((stat, i) => (
                    <Card key={i} className={cn("p-6 border-none shadow-sm rounded-2xl", stat.bg)}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <p className={cn("text-3xl font-black", stat.color)}>{stat.count}</p>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search by student name, room, or issue..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 rounded-2xl border-slate-100 bg-white"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'in-progress', 'resolved'].map((s) => (
                        <Button
                            key={s}
                            variant="ghost"
                            onClick={() => setFilterStatus(s)}
                            className={cn(
                                "rounded-xl h-12 px-6 text-[10px] font-black uppercase tracking-widest",
                                filterStatus === s ? "bg-slate-900 text-white" : "bg-white text-slate-400 hover:bg-slate-50"
                            )}
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredRequests.map((req) => {
                    const Icon = getCategoryIcon(req.category);
                    return (
                        <Card key={req.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-[2.5rem] overflow-hidden border border-slate-50 group">
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 duration-500",
                                            req.status === 'pending' ? "bg-amber-50 text-amber-500" :
                                                req.status === 'in-progress' ? "bg-indigo-50 text-indigo-500" :
                                                    req.status === 'resolved' ? "bg-emerald-50 text-emerald-500" :
                                                        "bg-slate-50 text-slate-400"
                                        )}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h5 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{req.title}</h5>
                                            <div className="flex items-center gap-2">
                                                <Badge className={cn(
                                                    "rounded-md text-[8px] font-black uppercase px-2 py-0.5",
                                                    req.status === 'pending' ? "bg-amber-100 text-amber-700" :
                                                        req.status === 'in-progress' ? "bg-indigo-100 text-indigo-700" :
                                                            req.status === 'resolved' ? "bg-emerald-100 text-emerald-700" :
                                                                "bg-slate-100 text-slate-600"
                                                )}>
                                                    {req.status}
                                                </Badge>
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                                                    req.priority === 'urgent' ? "bg-red-100 text-red-700" :
                                                        req.priority === 'high' ? "bg-orange-100 text-orange-700" :
                                                            "bg-slate-100 text-slate-600"
                                                )}>
                                                    {req.priority} PRIORITY
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Room</p>
                                        <p className="text-lg font-black text-slate-900">{req.room.roomNumber}</p>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase">{req.room.block.name}</p>
                                    </div>
                                </div>

                                <Card className="p-4 border-none bg-slate-50 rounded-2xl">
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                                        "{req.description}"
                                    </p>
                                </Card>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                                <User className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-900 leading-none">{req.student.user.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{req.student.matricNumber || 'Applicant'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {req.status === 'pending' && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateStatus(req.id, 'in-progress')}
                                                disabled={updating === req.id}
                                                className="rounded-xl bg-slate-900 hover:bg-black text-[10px] font-black uppercase tracking-widest h-9 px-5 gap-2"
                                            >
                                                {updating === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                                                Acknowledge
                                            </Button>
                                        )}
                                        {req.status === 'in-progress' && (
                                            <Button
                                                size="sm"
                                                onClick={() => setSelectedRequest(req)}
                                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-widest h-9 px-5 gap-2"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Resolve
                                            </Button>
                                        )}
                                        {req.status === 'resolved' && (
                                            <div className="flex items-center gap-2 text-emerald-600">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Fixed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {filteredRequests.length === 0 && (
                    <div className="lg:col-span-2 py-40 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                        <CheckCircle2 className="w-16 h-16 text-slate-100" />
                        <div className="space-y-1">
                            <h4 className="text-xl font-black text-slate-900">Zero Issues Found</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No maintenance requests matching your current filters</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Resolve Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden mt-20">
                        <div className="p-10 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">Resolve Request</h4>
                                    <p className="text-slate-500 text-sm font-medium">Issue: {selectedRequest.title}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(null)} className="rounded-full">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Resolution Notes</label>
                                <Textarea
                                    placeholder="Briefly describe the fix (e.g. Swapped broken breaker)"
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    className="rounded-2xl border-slate-100 focus:ring-indigo-500 h-32 p-4 text-sm font-medium"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setSelectedRequest(null)}
                                    variant="ghost"
                                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-slate-100"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleUpdateStatus(selectedRequest.id, 'resolved')}
                                    disabled={updating === selectedRequest.id}
                                    className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-emerald-100"
                                >
                                    {updating === selectedRequest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Mark as Resolved
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

function X(props: any) {
    return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
}
