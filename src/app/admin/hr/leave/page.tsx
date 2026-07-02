"use client";

import { useState, useEffect } from "react";
import {
    CheckCircle,
    XCircle,
    Clock,
    MessageSquare,
    User,
    Calendar,
    Loader2,
    Search,
    Filter
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllLeaveRequests, updateLeaveStatus } from "@/actions/hr_leave";
import { cn } from "@/lib/utils";

export default function AdminLeaveManagementPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        const data = await getAllLeaveRequests();
        setRequests(data);
        setLoading(false);
    };

    const handleAction = async (requestId: number, status: 'approved' | 'rejected') => {
        const comments = prompt(`Enter ${status} comments (optional):`) || "";
        setProcessingId(requestId);
        const res = await updateLeaveStatus(requestId, status, comments);
        if (res.success) {
            fetchRequests();
        } else {
            alert(res.error);
        }
        setProcessingId(null);
    };

    const filtered = requests.filter(r => filter === 'all' || r.request.status === filter);

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-650/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Calendar className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Leave Management
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Review and process institutional leave applications
                </p>
            </div>
            
            <div className="relative z-10 flex bg-white/10 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/10 shrink-0">
                {['pending', 'approved', 'rejected', 'all'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-6 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === f ? "bg-white text-slate-950 shadow-lg" : "text-white/60 hover:text-white"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-650" /></div>
        ) : (
            <div className="grid grid-cols-1 gap-6">
                {filtered.map((item) => {
                    const { request, user, staff } = item;
                    const start = new Date(request.startDate);
                    const end = new Date(request.endDate);
                    const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                    return (
                        <Card key={request.id} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden group hover:shadow-2xl transition-all">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/40">
                                    {/* Left Side: Avatar & Basic Info */}
                                    <div className="p-8 md:w-80 bg-white/20 flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-indigo-600/90 border border-indigo-500/50 text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-indigo-500/10 mb-4">
                                            <User className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">{user.name}</h3>
                                        <span className="mt-2 bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                                            {staff.jobTitle}
                                        </span>
                                        <p className="text-[10px] font-black text-slate-400 font-mono mt-3 uppercase tracking-wider">{staff.staffId}</p>
                                    </div>

                                    {/* Center: Leave Details */}
                                    <div className="p-8 flex-1 flex flex-col justify-center space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm",
                                                request.status === 'pending' ? "bg-amber-100 border-amber-250 text-amber-700" :
                                                    request.status === 'approved' ? "bg-emerald-100 border-emerald-250 text-emerald-700" : "bg-rose-100 border-rose-250 text-rose-700"
                                            )}>
                                                {request.status}
                                            </span>
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2 border-l border-white/50">
                                                {request.type} Leave Request
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-6 flex-wrap">
                                            <div className="flex items-center gap-2 text-slate-655 bg-white/55 border border-white/60 px-4 py-2 rounded-xl shadow-inner">
                                                <Calendar className="w-4 h-4 text-indigo-500" />
                                                <p className="text-sm font-bold">
                                                    {start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    <span className="mx-2 text-slate-300">→</span>
                                                    {end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="px-4 py-2 bg-indigo-650 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md">
                                                {days} Days Total
                                            </div>
                                        </div>

                                        <div className="bg-white/40 border border-white/60 p-4 rounded-[1.2rem] shadow-inner">
                                            <p className="text-sm text-slate-600 font-bold italic">"{request.reason}"</p>
                                        </div>

                                        {request.comments && (
                                            <div className="flex gap-2 items-start bg-indigo-50/50 border border-indigo-150 p-3 rounded-lg mt-2">
                                                <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                                <p className="text-[10px] text-indigo-700 font-black uppercase tracking-wide leading-relaxed">HR Action Note: {request.comments}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Side: Actions */}
                                    {request.status === 'pending' && (
                                        <div className="p-8 md:w-60 flex flex-col justify-center gap-3 bg-white/10">
                                            <Button
                                                onClick={() => handleAction(request.id, 'approved')}
                                                disabled={processingId === request.id}
                                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-md active:scale-95 transition-all gap-2"
                                            >
                                                {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Approve</>}
                                            </Button>
                                            <Button
                                                onClick={() => handleAction(request.id, 'rejected')}
                                                disabled={processingId === request.id}
                                                variant="outline"
                                                className="w-full h-11 border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/80 font-black uppercase text-xs tracking-wider rounded-xl active:scale-95 transition-all gap-2 shadow-sm"
                                            >
                                                <XCircle className="w-4 h-4" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="py-24 text-center bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50">
                        <Clock className="w-16 h-16 text-slate-350 mx-auto mb-4 animate-pulse" />
                        <h4 className="text-xl font-black text-slate-800 italic uppercase">No matching leave requests</h4>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">All leave applications have been processed.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
