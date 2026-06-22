"use client";

import { useState, useEffect } from "react";
import { createAnnouncement, getAnnouncements } from "@/actions/communication";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Megaphone,
    Plus,
    Trash2,
    Tag,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Users
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
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Megaphone className="w-8 h-8 text-indigo-600" />
                        Announcements
                    </h1>
                    <p className="text-slate-500 font-medium">Broadcast news and updates to the school community</p>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 bg-slate-900 shadow-lg"
                >
                    {showForm ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Announcement</>}
                </Button>
            </div>

            {showForm && (
                <Card className="border-none shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-slate-800 tracking-tight">Create Announcement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. End of Semester Examinations"
                                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Audience</label>
                                <select
                                    className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 text-sm font-bold"
                                    value={formData.targetType}
                                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
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
                                    className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 text-sm font-bold"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                                className="rounded-xl min-h-[150px] bg-slate-50 border-none p-4 font-medium"
                            />
                        </div>
                        <Button
                            onClick={handleSubmit}
                            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-indigo-100 shadow-xl transition-all"
                        >
                            Publish Announcement
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6">
                {list.map((item) => (
                    <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                        <div className={cn(
                            "h-1 w-full",
                            item.priority === 'high' ? "bg-rose-500" :
                                item.priority === 'low' ? "bg-slate-300" : "bg-indigo-500"
                        )} />
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                            item.priority === 'high' ? "bg-rose-100 text-rose-600" :
                                                item.priority === 'low' ? "bg-slate-100 text-slate-600" : "bg-indigo-100 text-indigo-600"
                                        )}>
                                            {item.priority}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                                    <p className="text-slate-600 leading-relaxed max-w-3xl">{item.content}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl shrink-0">
                                    <Users className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
