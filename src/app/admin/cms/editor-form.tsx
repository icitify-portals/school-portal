"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Save,
    ArrowLeft,
    Globe,
    Settings,
    Eye,
    Loader2,
    Check,
    ImagePlus,
    Link2,
    Code2,
    BarChart3,
    Sparkles,
    Wand2,
    AlertCircle,
    CheckCircle,
    AlertTriangle,
    Zap,
    Copy,
    Menu,
    ExternalLink,
    Stamp,
    Languages,
    Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { upsertPage, duplicatePage, getMenus, upsertMenu } from "@/actions/cms";
import TiptapEditor from "@/components/cms/Editor";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PageEditorForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [auditLoading, setAuditLoading] = useState(false);
    const [menuLoading, setMenuLoading] = useState(false);
    const [auditData, setAuditData] = useState<any>(null);
    const [aiSuggestions, setAiSuggestions] = useState<any>(null);
    const [allMenus, setAllMenus] = useState<any[]>([]);
    const [transLoading, setTransLoading] = useState(false);
    const [isLinked, setIsLinked] = useState(false);
    const [formData, setFormData] = useState({
        id: initialData?.id || undefined,
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        content: initialData?.content || "",
        metaTitle: initialData?.metaTitle || "",
        metaDescription: initialData?.metaDescription || "",
        keywords: initialData?.keywords || "",
        ogImage: initialData?.ogImage || "",
        canonicalUrl: initialData?.canonicalUrl || "",
        structuredData: initialData?.structuredData || "",
        status: initialData?.status || "draft",
        locale: initialData?.locale || "en",
        translationGroupId: initialData?.translationGroupId || undefined,
    });

    useEffect(() => {
        getMenus().then(res => {
            if (res.success && res.data) {
                setAllMenus(res.data);
                // Check if this slug is linked in any menu
                const linked = res.data.some((m: any) => 
                    m.href === `/${formData.slug}` || 
                    (m.children && m.children.some((c: any) => c.href === `/${formData.slug}`))
                );
                setIsLinked(linked);
            }
        });
    }, [formData.slug]);

    const handleSave = async () => {
        if (!formData.title || !formData.slug) {
            toast.error("Title and Slug are required");
            return;
        }

        setLoading(true);
        const res = await upsertPage(formData);
        if (res.success) {
            toast.success("Page saved successfully");
            router.push("/admin/cms");
        } else {
            toast.error(res.error || "Failed to save page");
        }
        setLoading(false);
    };

    // Auto-generate slug from title if slug is empty
    useEffect(() => {
        if (!formData.id && formData.title && !formData.slug) {
            const generatedSlug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, slug: generatedSlug }));
        }
    }, [formData.title, formData.id, formData.slug]);

    const handleAIGenerate = async () => {
        if (!formData.title || !formData.content) {
            toast.error("Please provide a title and some content first");
            return;
        }
        setAiLoading(true);
        const res = await (await import("@/actions/cms-ai")).generateSEOMetadata(formData.title, formData.content);
        if (res.success) {
            setAiSuggestions(res.data);
            toast.success("AI has prepared SEO suggestions!");
        } else {
            toast.error(res.error || "AI Generation failed");
        }
        setAiLoading(false);
    };

    const handleAudit = async () => {
        if (!formData.content) {
            toast.error("Add some content to audit");
            return;
        }
        setAuditLoading(true);
        const res = await (await import("@/actions/cms-ai")).performSEOAudit(formData.content, formData.keywords.split(',')[0]);
        if (res.success) {
            setAuditData(res.data);
        } else {
            toast.error("SEO Audit failed");
        }
        setAuditLoading(false);
    };

    const applyAISet = () => {
        if (!aiSuggestions) return;
        setFormData(prev => ({
            ...prev,
            metaTitle: aiSuggestions.metaTitle,
            metaDescription: aiSuggestions.metaDescription,
            keywords: aiSuggestions.keywords.join(', ')
        }));
        setAiSuggestions(null);
        toast.success("SEO signals optimized!");
    };

    const handleBulkTranslate = async () => {
        if (!formData.id) {
            toast.error("Save the page first before translating");
            return;
        }
        setTransLoading(true);
        const res = await (await import("@/actions/cms-translation")).translateToAllLocales('page', formData.id);
        if (res.success) {
            toast.success(`Successfully generated ${res.count} translations: ${res.languages?.join(', ') || ''}`);
            router.refresh();
        } else {
            toast.error(res.error || "Translation failed");
        }
        setTransLoading(false);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="rounded-full">
                            <Link href="/admin/cms">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {formData.id ? "Edit Page" : "Create New Page"}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" asChild className="rounded-xl font-bold border-slate-200">
                            <Link href="/admin/cms">Cancel</Link>
                        </Button>
                        {formData.id && (
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    const res = await duplicatePage(formData.id);
                                    if (res.success) {
                                        toast.success("Duplicated! Redirecting...");
                                        router.push(`/admin/cms/${res.id}/edit`);
                                    }
                                }}
                                className="rounded-xl font-bold border-slate-200 gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Save as Copy
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 rounded-xl transition-all h-11 px-6 font-bold"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            {formData.id ? "Save Changes" : "Publish Page"}
                        </Button>
                        {!initialData?.isSystemPage && formData.status !== 'published' && (
                            <Button
                                onClick={async () => {
                                    setLoading(true);
                                    const res = await upsertPage({ ...formData, status: 'pending_review' });
                                    if (res.success) {
                                        toast.success("Submitted for Institutional Review!");
                                        router.push("/admin/cms");
                                    }
                                    setLoading(false);
                                }}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 rounded-xl transition-all h-11 px-6 font-bold gap-2"
                            >
                                <Stamp className="w-5 h-5" />
                                Submit for Review
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-slate-700 font-bold uppercase text-[11px] tracking-widest pl-1">Page Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. About Us"
                                        className="h-12 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 text-lg font-bold"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold uppercase text-[11px] tracking-widest pl-1 text-[11px] tracking-widest pl-1">Main Content</Label>
                                    <TiptapEditor
                                        value={formData.content}
                                        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar / Settings Area */}
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-widest">Publishing Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-slate-500 text-xs font-bold uppercase tracking-widest">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                                    >
                                        <SelectTrigger id="status" className="h-11 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="draft" className="font-medium">Draft</SelectItem>
                                            <SelectItem value="published" className="font-medium">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="text-slate-500 text-xs font-bold uppercase tracking-widest">Slug (URL Path)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">/</span>
                                        <Input
                                            id="slug"
                                            placeholder="about-us"
                                            className="pl-6 h-11 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                            value={formData.slug}
                                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 pl-1 italic">URL will be: domain.com/{formData.slug || "..."}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Tabs defaultValue="seo" className="w-full">
                            <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
                                <TabsList className="w-full bg-slate-50/50 p-1 h-auto flex rounded-none border-b border-slate-50">
                                    <TabsTrigger value="seo" className="flex-1 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">SEO Optimization</TabsTrigger>
                                    <TabsTrigger value="locales" className="flex-1 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
                                        <Globe className="w-3 h-3 mr-2" /> Pan-African Hub
                                    </TabsTrigger>
                                </TabsList>
                                <CardContent className="p-6">
                                    <TabsContent value="seo" className="mt-0 space-y-6">
                                        {/* AI Assistant Panel */}
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-200 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-white/20 rounded-lg">
                                                        <Sparkles className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest">AI SEO Assistant</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        variant="secondary" 
                                                        size="sm" 
                                                        onClick={handleAIGenerate}
                                                        disabled={aiLoading}
                                                        className="h-8 rounded-lg bg-white/10 hover:bg-white/20 border-none text-white text-[10px] font-bold uppercase tracking-widest"
                                                    >
                                                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Wand2 className="w-3 h-3 mr-1.5" />}
                                                        Generate Tags
                                                    </Button>
                                                    <Button 
                                                        variant="secondary" 
                                                        size="sm" 
                                                        onClick={handleAudit}
                                                        disabled={auditLoading}
                                                        className="h-8 rounded-lg bg-white/10 hover:bg-white/20 border-none text-white text-[10px] font-bold uppercase tracking-widest"
                                                    >
                                                        {auditLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <BarChart3 className="w-3 h-3 mr-1.5" />}
                                                        Run Audit
                                                    </Button>
                                                </div>
                                            </div>

                                            {aiSuggestions && (
                                                <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                    <div className="text-[10px] font-bold uppercase opacity-80 flex items-center gap-1">
                                                        <Zap className="w-3 h-3" /> AI Suggestions Ready
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-[11px] font-medium leading-tight line-clamp-2"><span className="opacity-60">Title:</span> {aiSuggestions.metaTitle}</p>
                                                        <p className="text-[11px] font-medium leading-tight line-clamp-2"><span className="opacity-60">Desc:</span> {aiSuggestions.metaDescription}</p>
                                                    </div>
                                                    <Button 
                                                        onClick={applyAISet}
                                                        className="w-full h-8 bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-[10px] uppercase tracking-widest rounded-lg"
                                                    >
                                                        Apply AI Suggestions
                                                    </Button>
                                                </div>
                                            )}

                                            {auditData && (
                                                <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">SEO Audit Score</span>
                                                        <span className={cn(
                                                            "text-xl font-black italic tracking-tighter",
                                                            auditData.score > 80 ? "text-emerald-400" : auditData.score > 50 ? "text-amber-400" : "text-red-400"
                                                        )}>{auditData.score}%</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {auditData.checks.slice(0, 3).map((check: any, i: number) => (
                                                            <div key={i} className="flex gap-2 items-start opacity-90">
                                                                {check.status === 'pass' ? <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5" /> : <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5" />}
                                                                <p className="text-[10px] leading-tight">{check.label}: {check.message}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="pt-2 border-t border-white/10">
                                                        <div className="text-[9px] font-bold uppercase opacity-60 mb-1">Quick Fixes:</div>
                                                        <p className="text-[10px] leading-relaxed italic opacity-90">{auditData.suggestions}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="mtitle" className="text-slate-500 text-xs font-bold uppercase tracking-widest">Browser Title (Meta)</Label>
                                            <Input
                                                id="mtitle"
                                                placeholder="Page Title | Website Name"
                                                className="h-11 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20"
                                                value={formData.metaTitle}
                                                onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mdesc" className="text-slate-500 text-xs font-bold uppercase tracking-widest">Meta Description</Label>
                                            <Textarea
                                                id="mdesc"
                                                placeholder="A brief summary for search results..."
                                                className="min-h-[100px] rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                                value={formData.metaDescription}
                                                onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="kw" className="text-slate-500 text-xs font-bold uppercase tracking-widest">Keywords</Label>
                                            <Input
                                                id="kw"
                                                placeholder="portal, about, institution"
                                                className="h-11 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20"
                                                value={formData.keywords}
                                                onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Social & Advanced</h4>
                                            
                                            <div className="space-y-2">
                                                <Label className="text-slate-500 text-xs font-bold uppercase tracking-widest pl-1">Social Sharing Image (OG)</Label>
                                                <div className="space-y-3">
                                                    {formData.ogImage ? (
                                                        <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 group">
                                                            <img src={formData.ogImage} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                <Button 
                                                                    variant="secondary" 
                                                                    size="sm" 
                                                                    className="rounded-lg h-8 text-[10px] font-bold uppercase tracking-widest"
                                                                    onClick={() => setFormData(p => ({ ...p, ogImage: "" }))}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-200 transition-all cursor-pointer group">
                                                            <div className="p-3 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform">
                                                                <ImagePlus className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                                            </div>
                                                            <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Upload Social Image</span>
                                                            <input 
                                                                type="file" 
                                                                className="hidden" 
                                                                accept="image/*"
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file) return;
                                                                    const fd = new FormData();
                                                                    fd.append("file", file);
                                                                    fd.append("type", "image");
                                                                    fd.append("subDir", "seo");
                                                                    const res = await (await import("@/actions/cms")).uploadMedia(fd);
                                                                    if (res.success && res.url) setFormData(p => ({ ...p, ogImage: res.url! }));
                                                                }}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="canon" className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                    <Link2 className="w-3 h-3" /> Canonical URL
                                                </Label>
                                                <Input
                                                    id="canon"
                                                    placeholder="https://original-domain.com/page"
                                                    className="h-11 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20"
                                                    value={formData.canonicalUrl}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="sd" className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                                    <Code2 className="w-3 h-3" /> Custom Structured Data (JSON-LD)
                                                </Label>
                                                <Textarea
                                                    id="sd"
                                                    placeholder='{ "@context": "https://schema.org", "@type": "Person", ... }'
                                                    className="min-h-[120px] rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-[10px] resize-none"
                                                    value={formData.structuredData}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, structuredData: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    </TabsContent>
                                    <TabsContent value="preview" className="mt-0 space-y-4">
                                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                                            <div className="text-indigo-600 text-lg font-medium truncate">{formData.metaTitle || formData.title || "Meta Title Preview"}</div>
                                            <div className="text-emerald-700 text-xs flex items-center gap-1 mt-1 truncate">
                                                <Globe className="w-3 h-3" />
                                                https://portal.edu/{formData.slug}
                                            </div>
                                            <div className="text-slate-600 text-sm mt-2 line-clamp-3 leading-relaxed">
                                                {formData.metaDescription || "Provide a meta description to see how this page will appear in search results like Google and Bing."}
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Social Share Preview</span>
                                                <div className="flex gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                                                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                                                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                                <div className="aspect-video bg-slate-100 relative">
                                                    {formData.ogImage ? (
                                                        <img src={formData.ogImage} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <BarChart3 className="w-8 h-8 text-slate-200" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{new URL(process.env.NEXT_PUBLIC_APP_URL || "https://schoolportal.edu").hostname}</div>
                                                    <div className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">{formData.metaTitle || formData.title || "Meta Title Preview"}</div>
                                                    <div className="text-[11px] text-slate-500 line-clamp-1 h-4">{formData.metaDescription || "Meta description goes here..."}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="locales" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-6">
                                            <Card className="rounded-2xl border-none shadow-xl shadow-indigo-50/50 bg-indigo-600 text-white overflow-hidden relative">
                                                <CardContent className="p-8 relative z-10 space-y-6">
                                                    <div className="space-y-2">
                                                        <Badge className="bg-white/20 text-white border-none uppercase tracking-widest text-[10px] py-1 px-3 shadow-none">
                                                            Institutional Hub
                                                        </Badge>
                                                        <CardTitle className="inline-block lg:block text-2xl font-black italic tracking-tighter">Universal Translator</CardTitle>
                                                        <CardDescription className="text-indigo-100 font-medium text-xs">
                                                            Propagate this content across 12+ institutional languages using high-fidelity AI.
                                                        </CardDescription>
                                                    </div>
                                                    <Button 
                                                        onClick={handleBulkTranslate}
                                                        disabled={transLoading}
                                                        className="w-full h-12 bg-white text-indigo-600 hover:bg-slate-50 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-900/40 gap-3"
                                                    >
                                                        {transLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                                        Run Pan-African Sync
                                                    </Button>
                                                </CardContent>
                                                <Globe className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 rotate-12" />
                                            </Card>

                                            <div className="grid grid-cols-1 gap-4">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-4">Active Translations</Label>
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl">🇬🇧</span>
                                                            <span className="text-sm font-bold text-slate-900">English (Source)</span>
                                                        </div>
                                                        <Badge variant="outline" className="border-indigo-200 text-indigo-600 font-bold text-[10px]">CURRENT</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </CardContent>
                            </Card>
                        </Tabs>

                        {/* Menu Integration Card */}
                        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Menu className="w-4 h-4 text-indigo-500" /> Navigation Link
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                <div className={cn(
                                    "p-3 rounded-xl border flex items-center justify-between",
                                    isLinked ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-500"
                                )}>
                                    <div className="flex items-center gap-2">
                                        {isLinked ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            {isLinked ? "Linked in Menu" : "Not Linked"}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="icon" asChild className="h-7 w-7 rounded-lg">
                                        <Link href="/admin/cms/menus"><ExternalLink className="w-3 h-3" /></Link>
                                    </Button>
                                </div>
                                
                                {!isLinked && formData.id && (
                                    <Button 
                                        onClick={async () => {
                                            setMenuLoading(true);
                                            const res = await upsertMenu({
                                                label: formData.title,
                                                href: `/${formData.slug}`,
                                                order: 99,
                                                isActive: true
                                            });
                                            if (res.success) {
                                                toast.success("Added to Primary Menu!");
                                                setIsLinked(true);
                                            }
                                            setMenuLoading(false);
                                        }}
                                        disabled={menuLoading}
                                        className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest gap-2"
                                    >
                                        {menuLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Add to Menu
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
