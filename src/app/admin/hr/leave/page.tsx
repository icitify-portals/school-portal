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
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-indigo-600" />
                        Leave Management
                    </h1>
                    <p className="text-slate-500 font-medium italic">Review and process institutional leave applications</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {['pending', 'approved', 'rejected', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === f ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map((item) => {
                        const { request, user, staff } = item;
                        const start = new Date(request.startDate);
                        const end = new Date(request.endDate);
                        const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                        return (
                            <Card key={request.id} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Left Side: Avatar & Basic Info */}
                                        <div className="p-6 md:w-64 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner mb-3">
                                                <User className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="font-black text-slate-800 tracking-tight leading-none">{user.name}</h3>
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1">{staff.jobTitle}</p>
                                            <p className="text-[9px] font-mono text-slate-400 mt-2">{staff.staffId}</p>
                                        </div>

                                        {/* Center: Leave Details */}
                                        <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
                                            <div className="flex items-center gap-4">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic",
                                                    request.status === 'pending' ? "bg-amber-100 text-amber-600" :
                                                        request.status === 'approved' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                                )}>
                                                    {request.status}
                                                </span>
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-tighter decoration-indigo-400 decoration-2 underline-offset-4 underline">
                                                    {request.type} Leave
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <p className="text-sm font-bold text-slate-700">
                                                        {start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        <span className="mx-2 text-slate-300">→</span>
                                                        {end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900 italic">
                                                    {days} Days
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                                                <p className="text-xs text-slate-500 font-medium italic italic">"{request.reason}"</p>
                                            </div>

                                            {request.comments && (
                                                <div className="flex gap-2 items-start mt-2">
                                                    <MessageSquare className="w-3 h-3 text-indigo-400 mt-1" />
                                                    <p className="text-[10px] text-indigo-600 font-bold">HR NOTE: {request.comments}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Actions */}
                                        {request.status === 'pending' && (
                                            <div className="p-6 md:w-48 flex flex-col justify-center gap-2 bg-white border-l border-slate-50">
                                                <Button
                                                    onClick={() => handleAction(request.id, 'approved')}
                                                    disabled={processingId === request.id}
                                                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-emerald-100"
                                                >
                                                    {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>}
                                                </Button>
                                                <Button
                                                    onClick={() => handleAction(request.id, 'rejected')}
                                                    disabled={processingId === request.id}
                                                    variant="outline"
                                                    className="w-full h-11 border-rose-200 text-rose-600 hover:bg-rose-50 font-black uppercase text-[10px] tracking-widest rounded-xl"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" /> Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No matching leave requests found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
