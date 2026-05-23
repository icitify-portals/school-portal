"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users, CheckCircle, XCircle, Clock,
    CreditCard, Building, Loader2, Home,
    LogIn, LogOut
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    approveHostelApplication,
    allocateStudentToRoom,
    checkInApplicant,
    checkOutApplicant
} from "@/actions/hostels";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ApplicationManagement({ applications, rooms, onRefresh }: {
    applications: any[],
    rooms: any[],
    onRefresh: () => void
}) {
    const [loading, setLoading] = useState<number | null>(null);

    const handleAction = async (id: number, action: () => Promise<any>) => {
        setLoading(id);
        const res = await action();
        if (res.success) {
            toast.success(res.message);
            onRefresh();
        } else {
            toast.error(res.error);
        }
        setLoading(null);
    };

    const handleApprove = (id: number) => handleAction(id, () => approveHostelApplication(id));
    const handleAllocate = (appId: number, roomId: number) => handleAction(appId, () => allocateStudentToRoom(appId, roomId));
    const handleCheckIn = (id: number) => handleAction(id, () => checkInApplicant(id));
    const handleCheckOut = (id: number) => {
        if (confirm("Proceed with student check-out? This will free up the bed space.")) {
            handleAction(id, () => checkOutApplicant(id));
        }
    };

    return (
        <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[2rem]">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <th className="px-8 py-5">Applicant</th>
                            <th className="px-8 py-5">Priority</th>
                            <th className="px-8 py-5">Status / Payment</th>
                            <th className="px-8 py-5 text-right">Approval Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {applications.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 text-xs">
                                            {app.student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{app.student.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.student.matricNumber || 'NO MATRIC'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    {app.isPriority ? (
                                        <Badge variant="success" className="rounded-lg uppercase text-[9px] font-black tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100">
                                            Priority (100L/Final)
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="rounded-lg uppercase text-[9px] font-black tracking-widest text-slate-300 border-slate-100">
                                            Standard
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn(
                                                "rounded-md uppercase text-[9px] font-black px-2",
                                                app.status === 'pending' ? "bg-amber-50 text-amber-600" :
                                                    app.status === 'approved' ? "bg-indigo-50 text-indigo-600" :
                                                        app.status === 'allocated' ? "bg-emerald-50 text-emerald-600" :
                                                            "bg-slate-50 text-slate-400"
                                            )}>
                                                {app.status}
                                            </Badge>
                                            <Badge variant={app.paymentStatus === 'paid' ? 'success' : 'secondary'} className="rounded-md uppercase text-[9px] font-black px-2">
                                                {app.paymentStatus}
                                            </Badge>
                                        </div>
                                        {app.paymentDeadline && (
                                            <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                Expires {format(new Date(app.paymentDeadline), 'MMM dd, HH:mm')}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        {app.status === 'pending' && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(app.id)}
                                                disabled={loading === app.id}
                                                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-9 px-5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 gap-2"
                                            >
                                                {loading === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                                Grant Approval
                                            </Button>
                                        )}
                                        {app.status === 'approved' && app.paymentStatus === 'paid' && (
                                            <select
                                                className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                onChange={(e) => handleAllocate(app.id, parseInt(e.target.value))}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Select Room to Allocate</option>
                                                {rooms.filter(r => r.occupiedCount < r.capacity && r.gender === app.student.gender).map(r => (
                                                    <option key={r.id} value={r.id}>
                                                        Room {r.roomNumber} ({r.capacity - r.occupiedCount} slots free)
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {app.status === 'allocated' && (
                                            <div className="flex gap-2">
                                                {!app.checkedInAt ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleCheckIn(app.id)}
                                                        disabled={loading === app.id}
                                                        className="rounded-xl bg-slate-900 hover:bg-black h-9 px-5 text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-slate-200"
                                                    >
                                                        {loading === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                                                        Check In
                                                    </Button>
                                                ) : !app.checkedOutAt ? (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleCheckOut(app.id)}
                                                        disabled={loading === app.id}
                                                        className="rounded-xl h-9 px-5 text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-red-100"
                                                    >
                                                        {loading === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                                                        Check Out
                                                    </Button>
                                                ) : (
                                                    <Badge variant="outline" className="rounded-xl h-9 px-5 border-slate-100 text-slate-300 text-[10px] font-black uppercase gap-2">
                                                        Workflow Complete
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
