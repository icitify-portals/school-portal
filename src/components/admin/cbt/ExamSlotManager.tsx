"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Plus, 
    Calendar, 
    Clock, 
    Trash2, 
    Edit, 
    Search,
    Loader2,
    CalendarDays,
    Settings2,
    CheckCircle2
} from "lucide-react";
import { 
    getExamSlots, 
    createExamSlot, 
    updateExamSlot, 
    deleteExamSlot,
    getActiveSessions
} from "@/actions/exam-slots";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ExamSlotManager() {
    const [slots, setSlots] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        sessionId: 0,
        semester: "1" as "1" | "2",
        startTime: "",
        endTime: "",
        type: "exam" as "quiz" | "exam"
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [slotsRes, sessionsRes] = await Promise.all([
            getExamSlots(),
            getActiveSessions()
        ]);
        
        if (slotsRes.success) setSlots(slotsRes.data || []);
        if (sessionsRes.success) setSessions(sessionsRes.sessions || []);
        
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            ...formData,
            sessionId: Number(formData.sessionId),
            startTime: new Date(formData.startTime),
            endTime: new Date(formData.endTime)
        };

        const res = editingId 
            ? await updateExamSlot(editingId, payload)
            : await createExamSlot(payload);

        if (res.success) {
            setIsEditing(false);
            setEditingId(null);
            setFormData({
                title: "",
                sessionId: sessions[0]?.id || 0,
                semester: "1",
                startTime: "",
                endTime: "",
                type: "exam"
            });
            loadData();
        } else {
            alert("Error saving slot");
        }
        setSaving(false);
    };

    const handleEdit = (slot: any) => {
        setEditingId(slot.id);
        setFormData({
            title: slot.title,
            sessionId: slot.sessionId,
            semester: slot.semester,
            startTime: format(new Date(slot.startTime), "yyyy-MM-dd'T'HH:mm"),
            endTime: format(new Date(slot.endTime), "yyyy-MM-dd'T'HH:mm"),
            type: slot.type
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this exam slot?")) return;
        const res = await deleteExamSlot(id);
        if (res.success) loadData();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                            <CalendarDays className="w-8 h-8" />
                        </div>
                        Exam Time Slots
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Manage global time windows for examinations and scheduled quizzes.</p>
                </div>
                {!isEditing && (
                    <Button 
                        onClick={() => setIsEditing(true)} 
                        className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-bold gap-2 shadow-xl shadow-indigo-100 transition-all hover:scale-105"
                    >
                        <Plus className="w-5 h-5" /> Create New Slot
                    </Button>
                )}
            </div>

            {/* Form Card */}
            {isEditing && (
                <Card className="border-none shadow-2xl shadow-indigo-100/50 rounded-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <CardHeader className="bg-slate-900 text-white p-8">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                                <Settings2 className="w-6 h-6 text-indigo-400" />
                                {editingId ? "Modify Slot Configuration" : "New Slot Configuration"}
                            </CardTitle>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsEditing(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2 col-span-full">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Slot Identification</label>
                                <Input 
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g., 2024/2025 First Semester - Morning Session A"
                                    className="h-14 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 transition-all font-bold text-lg px-6"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Academic Session</label>
                                <select 
                                    className="w-full h-14 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 transition-all font-bold px-6 bg-white outline-none"
                                    value={formData.sessionId}
                                    onChange={e => setFormData({...formData, sessionId: Number(e.target.value)})}
                                    required
                                >
                                    <option value="">Select Session</option>
                                    {sessions.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Semester</label>
                                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                                    {(['1', '2'] as const).map(sem => (
                                        <button
                                            key={sem}
                                            type="button"
                                            onClick={() => setFormData({...formData, semester: sem})}
                                            className={cn(
                                                "flex-1 py-3 rounded-xl font-black transition-all",
                                                formData.semester === sem ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            Semester {sem}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Start Date & Time</label>
                                <div className="relative">
                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <Input 
                                        type="datetime-local"
                                        value={formData.startTime}
                                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                                        className="h-14 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 transition-all font-bold pl-14 pr-6"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">End Date & Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <Input 
                                        type="datetime-local"
                                        value={formData.endTime}
                                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                                        className="h-14 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 transition-all font-bold pl-14 pr-6"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 col-span-full">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Slot Purpose</label>
                                <div className="flex gap-4">
                                    {['exam', 'quiz'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setFormData({...formData, type: t as any})}
                                            className={cn(
                                                "flex-1 p-6 rounded-2xl border-2 transition-all flex items-center justify-between group",
                                                formData.type === t ? "border-indigo-600 bg-indigo-50/50" : "border-slate-100 bg-white hover:border-slate-200"
                                            )}
                                        >
                                            <div className="text-left">
                                                <p className={cn("font-black uppercase tracking-tight text-xl transition-colors", formData.type === t ? "text-indigo-600" : "text-slate-400")}>
                                                    {t === 'exam' ? 'Proper Examination' : 'Scheduled Quiz'}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    {t === 'exam' ? 'Strict simultaneous submission' : 'Flexible teacher scheduling'}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                                formData.type === t ? "bg-indigo-600 text-white scale-125" : "bg-slate-100 text-slate-300 group-hover:scale-110"
                                            )}>
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-full pt-4 flex justify-end gap-3">
                                <Button 
                                    type="submit" 
                                    disabled={saving}
                                    className="h-14 px-12 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase tracking-widest text-xs gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {editingId ? "Update Configuration" : "Save Slot"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* List Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                        <p className="font-bold uppercase tracking-widest text-xs">Synchronizing Schedule Data...</p>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                        <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">No Time Slots Defined</h3>
                        <p className="text-slate-400 text-sm mt-1">Start by creating a new examination or quiz window.</p>
                    </div>
                ) : (
                    slots.map(slot => (
                        <Card key={slot.id} className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] p-8 space-y-6 hover:shadow-indigo-100 transition-all border-2 border-transparent hover:border-indigo-100 group relative overflow-hidden bg-white">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors" />
                            
                            <div className="relative flex justify-between items-start">
                                <div className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    slot.type === 'exam' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                )}>
                                    {slot.type === 'exam' ? 'Examination' : 'Scheduled Quiz'}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(slot)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(slot.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1 relative">
                                <h4 className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{slot.title}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Session {sessions.find(s => s.id === slot.sessionId)?.name || 'N/A'} • Semester {slot.semester}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 relative">
                                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group-hover:bg-indigo-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Start Window</p>
                                            <p className="text-xs font-bold text-slate-700">{format(new Date(slot.startTime), "MMM dd, yyyy @ HH:mm")}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group-hover:bg-red-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-red-600 shadow-sm">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Hard Cutoff</p>
                                            <p className="text-xs font-bold text-slate-700">{format(new Date(slot.endTime), "MMM dd, yyyy @ HH:mm")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
