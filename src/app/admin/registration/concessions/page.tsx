"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck,
    Clock,
    CheckCircle2,
    XCircle,
    MessageSquare,
    UserCheck,
    CalendarSearch
} from "lucide-react";
import { getPendingConcessions, approveConcession, rejectConcession } from "@/actions/concessions";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function RegistrationConcessionsPage() {
    const [concessions, setConcessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConcessions();
    }, []);

    const loadConcessions = async () => {
        setLoading(true);
        const data = await getPendingConcessions();
        setConcessions(data);
        setLoading(false);
    };

    const handleApprove = async (id: number) => {
        const res = await approveConcession(id);
        if (res.success) {
            toast.success("Concession approved successfully");
            loadConcessions();
        } else {
            toast.error(res.error || "Failed to approve");
        }
    };

    const handleReject = async (id: number) => {
        const res = await rejectConcession(id);
        if (res.success) {
            toast.success("Concession request rejected");
            loadConcessions();
        } else {
            toast.error(res.error || "Failed to reject");
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Loading Concessions Queue...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
            <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic uppercase tracking-tight">
                        <ShieldCheck className="w-12 h-12 text-rose-600" />
                        DVC Concessions Dashboard
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Executive Review of Registration Overrides</p>
                </div>
                <Badge className="bg-slate-900 text-white py-3 px-6 rounded-2xl font-black text-xs">
                    {concessions.length} PENDING REQUESTS
                </Badge>
            </header>

            <div className="grid gap-6">
                {concessions.map((con) => (
                    <Card key={con.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                        <div className="flex flex-col md:flex-row">
                            <div className="p-10 flex-1 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-400 border border-slate-100 uppercase italic">
                                            {con.student?.user?.name?.charAt(0) || "S"}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black italic uppercase tracking-tight text-slate-800">
                                                {con.student?.user?.name}
                                            </h3>
                                            <div className="flex gap-3 items-center mt-1">
                                                <Badge variant="outline" className="font-bold text-[10px] tracking-widest uppercase border-slate-200">
                                                    {con.student?.matricNumber || "NO MATRIC"}
                                                </Badge>
                                                <Badge variant="secondary" className="font-bold text-[10px] tracking-widest uppercase bg-indigo-50 text-indigo-600">
                                                    {con.student?.currentLevel} LEVEL
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                            <CalendarSearch className="w-3 h-3" />
                                            {con.session?.name} SESSION
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(con.createdAt), "dd MMM yyyy HH:mm")}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex gap-4">
                                    <MessageSquare className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Reason for Concession</span>
                                        <p className="text-slate-600 font-medium leading-relaxed">
                                            {con.reason}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 md:w-80 border-l border-slate-100 p-8 flex flex-col justify-center gap-4">
                                <Button
                                    onClick={() => handleApprove(con.id)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-8 rounded-2xl shadow-lg border-b-4 border-emerald-700 flex gap-3 uppercase text-xs tracking-widest transition-all hover:-translate-y-1"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Grant Access
                                </Button>
                                <Button
                                    onClick={() => handleReject(con.id)}
                                    variant="outline"
                                    className="hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border-slate-200 text-slate-500 font-black py-8 rounded-2xl flex gap-3 uppercase text-xs tracking-widest transition-all"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Deny Request
                                </Button>
                                <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-widest px-4 leading-loose mt-2">
                                    Approved concessions provide immediate portal access for 48 hours.
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}

                {concessions.length === 0 && (
                    <div className="p-32 text-center space-y-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                            <UserCheck className="w-10 h-10 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight text-slate-400">Queue is Clear</h3>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">No pending registration concessions require attention.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
