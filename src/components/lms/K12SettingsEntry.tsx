"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    CalendarDays,
    CalendarRange,
    Save,
    Clock,
    CheckCircle2,
    Loader2,
    Calendar
} from "lucide-react";
import { updateSchoolSchedule, getSchoolSchedule } from "@/actions/teachers";
import { getAcademicSessions } from "@/actions/portal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function K12SettingsEntry() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedTerm, setSelectedTerm] = useState<'1' | '2' | '3'>('1');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Settings State
    const [daysOpen, setDaysOpen] = useState<number>(0);
    const [termStart, setTermStart] = useState("");
    const [termEnd, setTermEnd] = useState("");
    const [nextTermStart, setNextTermStart] = useState("");
    const [nextTermEnd, setNextTermEnd] = useState("");

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedSession && selectedTerm) {
            fetchSettings();
        }
    }, [selectedSession, selectedTerm]);

    const fetchInitialData = async () => {
        const data = await getAcademicSessions();
        setSessions(data);
        if (data.length > 0) setSelectedSession(data[0].id.toString());
        setLoading(false);
    };

    const fetchSettings = async () => {
        setLoading(true);
        const data = await getSchoolSchedule(parseInt(selectedSession), selectedTerm);
        if (data) {
            setDaysOpen(data.daysOpen || 0);
            setTermStart(data.termStart ? new Date(data.termStart).toISOString().split('T')[0] : "");
            setTermEnd(data.termEnd ? new Date(data.termEnd).toISOString().split('T')[0] : "");
            setNextTermStart(data.nextTermStart ? new Date(data.nextTermStart).toISOString().split('T')[0] : "");
            setNextTermEnd(data.nextTermEnd ? new Date(data.nextTermEnd).toISOString().split('T')[0] : "");
        } else {
            setDaysOpen(0);
            setTermStart("");
            setTermEnd("");
            setNextTermStart("");
            setNextTermEnd("");
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!selectedSession) return toast.error("Select a session");
        
        setSaving(true);
        const res = await updateSchoolSchedule({
            sessionId: parseInt(selectedSession),
            term: selectedTerm,
            daysOpen,
            termStart: termStart ? new Date(termStart) : null,
            termEnd: termEnd ? new Date(termEnd) : null,
            nextTermStart: nextTermStart ? new Date(nextTermStart) : null,
            nextTermEnd: nextTermEnd ? new Date(nextTermEnd) : null,
        });

        if (res.success) {
            toast.success("Schedule settings updated successfully");
        } else {
            toast.error("Failed to update settings");
        }
        setSaving(false);
    };

    if (loading && sessions.length === 0) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Academic Schedule</h2>
                    <p className="text-slate-500 mt-1">Configure term dates and operational days for K-12 report cards</p>
                </div>
                <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <select 
                        value={selectedSession} 
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="bg-transparent border-none font-bold text-sm focus:ring-0 text-slate-700"
                    >
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="w-[1px] h-6 bg-slate-200 self-center" />
                    <select 
                        value={selectedTerm} 
                        onChange={(e) => setSelectedTerm(e.target.value as any)}
                        className="bg-transparent border-none font-bold text-sm focus:ring-0 text-slate-700"
                    >
                        <option value="1">First Term</option>
                        <option value="2">Second Term</option>
                        <option value="3">Third Term</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* School Operational Area */}
                <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-indigo-600 text-white p-8">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="w-8 h-8" />
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight">Time Statistics</CardTitle>
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Operational Benchmarks</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total School Days Opened</Label>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    value={daysOpen}
                                    onChange={(e) => setDaysOpen(parseInt(e.target.value) || 0)}
                                    className="rounded-2xl h-14 border-slate-100 bg-slate-50/50 focus:bg-white text-xl font-black pl-14"
                                />
                                <Clock className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                            </div>
                            <p className="text-xs text-slate-400 italic">This number will be used to calculate student absence automatically when teachers enter presence.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Term Schedule Area */}
                <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-emerald-600 text-white p-8">
                        <div className="flex items-center gap-3">
                            <CalendarRange className="w-8 h-8" />
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight">Date Milestones</CardTitle>
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Key Academic Boundaries</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Term Starts</Label>
                                <Input type="date" value={termStart} onChange={(e) => setTermStart(e.target.value)} className="rounded-xl border-slate-100 h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Term Ends</Label>
                                <Input type="date" value={termEnd} onChange={(e) => setTermEnd(e.target.value)} className="rounded-xl border-slate-100 h-12" />
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">
                                <Calendar className="w-4 h-4" />
                                PROJECTION FOR NEXT TERM
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resumption Date</Label>
                                    <Input type="date" value={nextTermStart} onChange={(e) => setNextTermStart(e.target.value)} className="rounded-xl border-slate-100 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vacation Date</Label>
                                    <Input type="date" value={nextTermEnd} onChange={(e) => setNextTermEnd(e.target.value)} className="rounded-xl border-slate-100 h-12" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-4">
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-slate-900 hover:bg-slate-800 text-white h-14 px-12 rounded-2xl font-black shadow-xl shadow-slate-200 transition-all gap-3"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Lock & Save Settings
                </Button>
            </div>
        </div>
    );
}
