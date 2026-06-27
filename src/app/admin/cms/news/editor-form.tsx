"use client";

import { useState, useEffect } from "react";
import { 
    Save, 
    ChevronLeft, 
    Loader2, 
    ImagePlus, 
    Sparkles, 
    Wand2, 
    Newspaper, 
    Tags, 
    Stamp,
    Clock,
    Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { upsertNews } from "@/actions/cms-publishing";
import { getTerms, getEntityTerms } from "@/actions/cms-taxonomy";
import { getMediaLibrary } from "@/actions/cms-media";
import TiptapEditor from "@/components/cms/Editor";
import MediaPicker from "@/components/cms/MediaPicker";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NewsEditorForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: initialData?.id || undefined,
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        termIds: [], // Taxonomy terms
        teaser: initialData?.teaser || "",
        content: initialData?.content || "",
        featuredImageId: initialData?.featuredImageId || undefined,
        status: initialData?.status || "draft",
    });

    useEffect(() => {
        if (!formData.id && formData.title) {
            setFormData(prev => ({ ...prev, slug: prev.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') }));
        }
    }, [formData.title, formData.id]);

    const [availableTerms, setAvailableTerms] = useState<any[]>([]);
    
    useEffect(() => {
        getTerms('news_categories').then(res => {
            if (res.success && res.data) setAvailableTerms(res.data);
        });

        if (initialData?.id) {
            getEntityTerms('news', initialData.id).then(res => {
                if (res.success && res.data) {
                    setFormData(prev => ({ ...prev, termIds: res.data.map(r => r.termId) }));
                }
            });
        }
    }, [initialData?.id]);

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            toast.error("Headline and Content are required");
            return;
        }
        setLoading(true);
        const res = await upsertNews(formData);
        if (res.success) {
            toast.success("News saved successfully");
            router.push("/admin/cms");
        } else {
            toast.error(res.error || "Failed to save news");
        }
        setLoading(false);
    };

    const handleAIGenerateTeaser = async () => {
        if (!formData.content) {
            toast.error("Add content first to generate a teaser");
            return;
        }
        setAiLoading(true);
        const aiAction = (await import("@/actions/cms-ai")).generateSEOMetadata;
        const res = await aiAction(formData.title, formData.content);
        if (res.success) {
            setFormData(prev => ({ ...prev, teaser: res.data.metaDescription }));
            toast.success("AI generated a compelling teaser!");
        }
        setAiLoading(false);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="rounded-xl border border-slate-200">
                            <Link href="/admin/cms"><ChevronLeft className="w-5 h-5" /></Link>
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 italic flex items-center gap-2">
                                <Newspaper className="w-6 h-6 text-indigo-600" />
                                {formData.id ? "Edit Press Release" : "New Official Hub Post"}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Institutional News Engine</p>
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
                                    const res = await upsertNews({ ...formData, status: 'pending_review' });
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
                        <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] pl-1">Headline</Label>
                                    <Input 
                                        placeholder="University attains top 5 ranking..."
                                        className="h-14 text-xl font-bold rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 italic"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] pl-1">Body Content</Label>
                                    <TiptapEditor 
                                        value={formData.content} 
                                        onChange={(c) => setFormData({ ...formData, content: c })} 
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classification (Taxonomy)</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableTerms.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No categories created yet in Taxonomy Manager.</p>
                                        ) : (
                                            availableTerms.map(term => {
                                                const isSelected = (formData.termIds as number[]).includes(term.id);
                                                return (
                                                    <Badge 
                                                        key={term.id} 
                                                        variant={isSelected ? "default" : "outline"}
                                                        className={cn(
                                                            "cursor-pointer transition-colors",
                                                            isSelected ? "bg-indigo-600 hover:bg-indigo-700" : "hover:bg-slate-100"
                                                        )}
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                termIds: isSelected 
                                                                    ? (prev.termIds as number[]).filter(id => id !== term.id)
                                                                    : [...(prev.termIds as number[]), term.id]
                                                            }));
                                                        }}
                                                    >
                                                        {term.name}
                                                    </Badge>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI News Teaser</Label>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={handleAIGenerateTeaser}
                                            disabled={aiLoading}
                                            className="h-6 text-[9px] font-black uppercase text-indigo-500 hover:bg-indigo-50 p-0"
                                        >
                                            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                            Generate
                                        </Button>
                                    </div>
                                    <Textarea 
                                        placeholder="Compelling short summary..."
                                        className="rounded-2xl bg-slate-50 border-none text-xs font-medium leading-relaxed resize-none"
                                        rows={4}
                                        value={formData.teaser}
                                        onChange={(e) => setFormData({ ...formData, teaser: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Featured Image</Label>
                                <MediaPicker 
                                    value={formData.featuredImageId}
                                    onChange={(id, url) => setFormData({ ...formData, featuredImageId: id })}
                                />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
