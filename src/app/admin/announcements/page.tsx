"use client";

import { useState, useEffect } from "react";
import { createAnnouncement, getAnnouncements } from "@/actions/communication";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Megaphone,
    Plus,
    Trash2,
    Tag,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Users,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AnnouncementsPage() {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        targetType: "global" as any,
        priority: "normal" as any
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getAnnouncements();
        setList(data);
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.content) return toast.error("Please fill all fields");

        const res = await createAnnouncement(formData);
        if (res.success) {
            toast.success("Announcement published!");
            setShowForm(false);
            setFormData({ title: "", content: "", targetType: "global", priority: "normal" });
            fetchData();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
            <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-650/30 to-indigo-650/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <Megaphone className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                                Announcements
                            </h2>
                        </div>
                        <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                            Broadcast news and updates to the school community
                        </p>
                    </div>
                    <div className="relative z-10 flex gap-3 shrink-0">
                        <Button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md border border-white/10 active:scale-95 transition-all"
                        >
                            {showForm ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Announcement</>}
                        </Button>
                    </div>
                </div>

                {showForm && (
                    <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden p-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="text-xl font-black text-slate-800 uppercase italic">Create Announcement</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title</label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. End of Semester Examinations"
                                    className="rounded-xl h-12 bg-white border border-slate-200 font-bold px-4 shadow-sm"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Audience</label>
                                    <select
                                        className="w-full h-12 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={formData.targetType}
                                        onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
                                    >
                                        <option value="global">Global (Everyone)</option>
                                        <option value="faculty">Specific Faculty</option>
                                        <option value="department">Specific Department</option>
                                        <option value="course">Specific Course</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</label>
                                    <select
                                        className="w-full h-12 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="low">Low</option>
                                        <option value="high">High (Urgent)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content</label>
                                <Textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Provide full details of the notice..."
                                    className="rounded-xl min-h-[150px] bg-white border border-slate-200 p-4 font-medium shadow-sm"
                                />
                            </div>
                            <Button
                                onClick={handleSubmit}
                                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs shadow-indigo-150 shadow-xl transition-all active:scale-95 border border-white/10"
                            >
                                Publish Announcement
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6">
                    {loading ? (
                        <div className="py-20 text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                        </div>
                    ) : list.length === 0 ? (
                        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-12 text-center text-slate-450 font-bold uppercase tracking-wider text-xs">
                            No announcements published yet
                        </Card>
                    ) : (
                        list.map((item) => (
                            <Card key={item.id} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                                <div className={cn(
                                    "h-1.5 w-full",
                                    item.priority === 'high' ? "bg-rose-500" :
                                        item.priority === 'low' ? "bg-slate-300" : "bg-indigo-500"
                                )} />
                                <CardContent className="p-8">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <Badge className={cn(
                                                    "rounded-xl px-3 py-1 font-black uppercase text-[8px] tracking-widest border shadow-sm",
                                                    item.priority === 'high' ? "bg-rose-50 border-rose-200 text-rose-600" :
                                                        item.priority === 'low' ? "bg-slate-100 border-slate-200 text-slate-500" :
                                                            "bg-indigo-50 border-indigo-200 text-indigo-600"
                                                )}>
                                                    {item.priority}
                                                </Badge>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tight">{item.title}</h3>
                                            <p className="text-slate-650 leading-relaxed font-medium text-sm max-w-4xl">{item.content}</p>
                                        </div>
                                        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-inner shrink-0 self-start sm:self-center">
                                            <Users className="w-6 h-6 text-slate-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
