"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Lock,
    Unlock,
    Calendar,
    Settings2,
    ShieldCheck
} from "lucide-react";
import { getAcademicSessions } from "@/actions/portal";
import { getLevelControls, setLevelControl } from "@/actions/concessions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LEVELS = [100, 200, 300, 400, 500, 600, 700, 800];

export default function RegistrationControlsPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<number | "">("");
    const [controls, setControls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (selectedSessionId) {
            loadControls();
        }
    }, [selectedSessionId]);

    const loadSessions = async () => {
        const data = await getAcademicSessions();
        setSessions(data);
        const current = data.find(s => s.isCurrent);
        if (current) setSelectedSessionId(current.id);
        setLoading(false);
    };

    const loadControls = async () => {
        if (!selectedSessionId) return;
        const data = await getLevelControls(Number(selectedSessionId));
        setControls(data);
    };

    const handleToggle = async (level: number, currentStatus: boolean) => {
        if (!selectedSessionId) return;
        const res = await setLevelControl(Number(selectedSessionId), level, !currentStatus);
        if (res.success) {
            toast.success(`${level}L registration ${!currentStatus ? "opened" : "closed"}`);
            loadControls();
        } else {
            toast.error(res.error || "Failed to update");
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Loading Controls...</div>;

    const session = sessions.find(s => s.id === Number(selectedSessionId));

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
            <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic uppercase tracking-tight">
                        <Settings2 className="w-12 h-12 text-indigo-600" />
                        Access Infrastructure
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Selective Level-Based Registration Enforcement</p>
                </div>
                <div className="flex gap-4">
                    <select
                        value={selectedSessionId}
                        onChange={e => setSelectedSessionId(e.target.value ? Number(e.target.value) : "")}
                        className="rounded-2xl border border-slate-200 p-4 font-black text-sm bg-slate-50"
                    >
                        {sessions.map(s => (
                            <option key={s.id} value={s.id}>{s.name} Session</option>
                        ))}
                    </select>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    <CardHeader className="p-10 border-b border-slate-50 flex flex-row justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Global Status</CardTitle>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">Master switch for the entire institution</p>
                        </div>
                        <Badge variant={session?.isRegistrationOpen ? "default" : "secondary"} className="py-2 px-4 rounded-xl font-black">
                            {session?.isRegistrationOpen ? "PORTAL OPEN" : "PORTAL LOCKED"}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-dashed border-slate-200 flex gap-6 items-center">
                            <div className={cn(
                                "p-6 rounded-[1.5rem] shadow-2xl transition-all",
                                session?.isRegistrationOpen ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                            )}>
                                {session?.isRegistrationOpen ? <Unlock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                            </div>
                            <div>
                                <h4 className="font-black italic uppercase text-slate-600">Global Enrollment State</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {session?.isRegistrationOpen
                                        ? "All students have access unless restricted by level."
                                        : "Only students with level-specific access or DVC concessions can register."}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-slate-900 text-white">
                    <CardHeader className="p-10 border-b border-white/10">
                        <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Level Exceptions</CardTitle>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-[9px] mt-1">Specific access rules for student levels</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {LEVELS.map(lvl => {
                                const control = controls.find(c => c.level === lvl);
                                const isOpen = control?.isOpen || false;
                                return (
                                    <div key={lvl} className="p-6 flex justify-between items-center hover:bg-white/5 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-black italic text-indigo-400">
                                                {lvl}L
                                            </div>
                                            <div>
                                                <span className="font-black italic text-sm uppercase tracking-tight">{lvl} Level Students</span>
                                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                                                    Current Status: {isOpen ? "Override Open" : "Standard Control"}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => handleToggle(lvl, isOpen)}
                                            className={cn(
                                                "rounded-xl font-black px-6 py-2 uppercase text-[10px] tracking-widest transition-all",
                                                isOpen
                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                                    : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                            )}
                                        >
                                            {isOpen ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                                            {isOpen ? "Opened" : "Locked"}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4 max-w-xl">
                        <h3 className="text-3xl font-black italic uppercase tracking-tight">Need specific student access?</h3>
                        <p className="text-indigo-100 font-medium text-sm">
                            If a student requires registration access outside of global or level-based rules,
                            they must apply for a <strong>DVC Special Concession</strong>.
                            Approved concessions provide individual-level overrides.
                        </p>
                    </div>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-10 py-8 rounded-2xl font-black uppercase text-xs tracking-[0.2em]">
                        View Concessions Queue
                    </Button>
                </div>
                <Users className="absolute -right-12 -bottom-12 w-64 h-64 opacity-10 group-hover:scale-110 transition-transform duration-700" />
            </div>
        </div>
    );
}
