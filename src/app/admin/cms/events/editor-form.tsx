"use client";

import { useState, useEffect } from "react";
import { 
    Save, 
    ChevronLeft, 
    Loader2, 
    Calendar as CalendarIcon, 
    MapPin, 
    Video, 
    Link as LinkIcon, 
    Clock, 
    Stamp,
    ImagePlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { upsertEvent } from "@/actions/cms-publishing";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function EventEditorForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: initialData?.id || undefined,
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        description: initialData?.description || "",
        location: initialData?.location || "",
        startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : "",
        endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : "",
        isVirtual: initialData?.isVirtual || false,
        eventLink: initialData?.eventLink || "",
        featuredImage: initialData?.featuredImage || "",
        status: initialData?.status || "draft",
    });

    useEffect(() => {
        if (!formData.id && formData.title) {
            setFormData(prev => ({ ...prev, slug: prev.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') }));
        }
    }, [formData.title, formData.id]);

    const handleSave = async () => {
        if (!formData.title || !formData.startDate || !formData.endDate) {
            toast.error("Title and Start/End dates are required");
            return;
        }
        setLoading(true);
        const res = await upsertEvent({
            ...formData,
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate)
        });
        if (res.success) {
            toast.success("Event saved successfully");
            router.push("/admin/cms");
        } else {
            toast.error(res.error || "Failed to save event");
        }
        setLoading(false);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="rounded-xl border border-slate-200">
                            <Link href="/admin/cms"><ChevronLeft className="w-5 h-5" /></Link>
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 italic flex items-center gap-2">
                                <CalendarIcon className="w-6 h-6 text-amber-500" />
                                {formData.id ? "Modify Calendar Event" : "Create Institutional Event"}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest text-[10px]">Academic & Administrative Calendar</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            onClick={handleSave} 
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 rounded-xl transition-all h-11 px-6 font-bold"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            Save Draft
                        </Button>
                        {formData.status !== 'published' && (
                            <Button 
                                onClick={async () => {
                                    setLoading(true);
                                    const res = await upsertEvent({  ...formData, status: 'pending_review', startDate: new Date(formData.startDate), endDate: new Date(formData.endDate) });
                                    if (res.success) {
                                        toast.success("Submitted for institutional review!");
                                        router.push("/admin/cms");
                                    }
                                    setLoading(false);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 rounded-xl transition-all h-11 px-6 font-bold gap-2"
                            >
                                <Stamp className="w-5 h-5" />
                                Submit for Review
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] pl-1">Event Title</Label>
                                        <Input 
                                            placeholder="e.g. 15th Convocation Ceremony"
                                            className="h-14 text-xl font-bold rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] pl-1">Description</Label>
                                        <Textarea 
                                            placeholder="Outline the event schedule, speakers, and objectives..."
                                            className="rounded-2xl bg-slate-50 border-none text-sm font-medium leading-relaxed min-h-[200px]"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] pl-1">Commences At</Label>
                                        <Input 
                                            type="datetime-local"
                                            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] pl-1">Concludes At</Label>
                                        <Input 
                                            type="datetime-local"
                                            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-slate-900">Virtual Event</Label>
                                        <p className="text-[10px] text-slate-500 font-medium">Conducted over Zoom/Teams</p>
                                    </div>
                                    <Switch 
                                        checked={formData.isVirtual} 
                                        onCheckedChange={(v) => setFormData({ ...formData, isVirtual: v })} 
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> Location / Venue
                                    </Label>
                                    <Input 
                                        placeholder={formData.isVirtual ? "URL of meeting" : "Main Auditorium"}
                                        className="h-11 rounded-xl bg-slate-50 border-none font-bold"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <LinkIcon className="w-3 h-3" /> Registration Portal
                                    </Label>
                                    <Input 
                                        placeholder="https://..."
                                        className="h-11 rounded-xl bg-slate-50 border-none font-mono text-xs"
                                        value={formData.eventLink}
                                        onChange={(e) => setFormData({ ...formData, eventLink: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Poster / Cover</Label>
                                <div className={cn(
                                    "aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                                    formData.featuredImage ? "border-indigo-100 bg-indigo-50/30" : "border-slate-100 bg-slate-50 hover:bg-slate-100/50"
                                )}>
                                    {formData.featuredImage ? (
                                        <img src={formData.featuredImage} alt="Event" className="w-full h-full object-cover rounded-[22px]" />
                                    ) : (
                                        <>
                                            <ImagePlus className="w-8 h-8 text-slate-300" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add Poster</span>
                                        </>
                                    )}
                                </div>
                                <Input 
                                    placeholder="Media URL"
                                    className="h-10 rounded-xl bg-slate-50 border-none text-[10px] font-mono"
                                    value={formData.featuredImage}
                                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                                />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
