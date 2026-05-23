"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Save,
    Trash2,
    ArrowUp,
    ArrowDown,
    Image as ImageIcon,
    Layout,
    Sliders,
    Grid,
    Eye,
    Loader2,
    Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    getHomePageSections,
    upsertSection,
    updateSectionOrder,
    uploadMedia,
    deletePage
} from "@/actions/cms";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function HomepageBuilder() {
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSection, setEditingSection] = useState<any>(null);
    const [mediaManagerSection, setMediaManagerSection] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        const res = await getHomePageSections();
        if (res.success && res.data) {
            setSections(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;

        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];

        // Update orders
        const updatedOrders = newSections.map((s, i) => ({ id: s.id, order: i }));
        setSections(newSections);

        const res = await updateSectionOrder(updatedOrders);
        if (!res.success) toast.error("Failed to update order");
    };

    const handleSaveSection = async (data: any) => {
        const res = await upsertSection(data);
        if (res.success) {
            toast.success("Section updated");
            setEditingSection(null);
            fetchData();
        } else {
            toast.error(res.error || "Failed to save");
        }
    };

    const sectionIcons: any = {
        slider: Sliders,
        hero: Layout,
        gallery: Grid,
        content: ImageIcon,
        features: Settings2
    };

    const handleDeleteSection = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this section?")) return;
        // reuse deletePage or implement deleteSection in cms.ts
        // For now I'll use a generic delete section if I had one, or I'll add it.
        toast.error("Delete functionality coming soon (need to add action)");
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Homepage Builder</h1>
                        <p className="text-slate-500 mt-1">Design your landing page by adding and reordering content blocks.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-xl font-bold font-bold">Preview Page</Button>
                        <Button onClick={() => setEditingSection({ type: 'content', content: JSON.stringify({}), order: sections.length, isActive: true })} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 rounded-xl transition-all h-11 px-6 font-bold">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Section
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                    ) : sections.length === 0 ? (
                        <Card className="rounded-2xl border-dashed border-2 bg-slate-50/50 p-12 text-center">
                            <div className="text-slate-400 font-medium">No sections added yet. Start building your homepage!</div>
                        </Card>
                    ) : (
                        sections.map((section, index) => {
                            const Icon = sectionIcons[section.type] || Layout;
                            const mediaCount = section.media?.length || 0;
                            return (
                                <Card key={section.id} className="rounded-2xl border-none shadow-sm bg-white overflow-hidden group hover:ring-2 hover:ring-indigo-500/10 transition-all">
                                    <div className="flex items-center p-4">
                                        <div className="flex flex-col gap-1 mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                                                <ArrowUp className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, 'down')} disabled={index === sections.length - 1}>
                                                <ArrowDown className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 mr-4">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-slate-900 capitalize text-sm uppercase tracking-wider">{section.type} Section</h3>
                                                <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Order: {section.order}</Badge>
                                                {mediaCount > 0 && (
                                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-[9px] uppercase font-bold tracking-widest border-emerald-100">{mediaCount} Media Items</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                                                {section.title || (section.type === 'slider' ? "Multiple sliding hero banners" : section.type === 'gallery' ? "Photo grid display" : "Dynamic content block")}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" className="rounded-lg h-9 font-bold" onClick={() => setEditingSection(section)}>
                                                Settings
                                            </Button>
                                            <Button variant="outline" className="rounded-lg h-9 font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50 h-[36px]" onClick={() => setMediaManagerSection(section)}>
                                                {['slider', 'gallery'].includes(section.type) ? "Manage Media" : "Background/Media"}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteSection(section.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            {mediaManagerSection && (
                <MediaManager
                    section={mediaManagerSection}
                    onClose={() => setMediaManagerSection(null)}
                    onSave={async (media: any[]) => {
                        const res = await upsertSection(mediaManagerSection, media);
                        if (res.success) {
                            toast.success("Media updated");
                            setMediaManagerSection(null);
                            fetchData();
                        } else {
                            toast.error(res.error || "Failed to save media");
                        }
                    }}
                />
            )}
        </div>
    );
}

function MediaManager({ section, onClose, onSave }: any) {
    const [mediaItems, setMediaItems] = useState<any[]>(section.media || []);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", file.type.split('/')[0]);
        formData.append("subDir", `homepage/${section.type}`);

        try {
            const res = await uploadMedia(formData);
            if (res.success && res.url) {
                const newItem = {
                    url: res.url,
                    mediaType: file.type.split('/')[0],
                    mimeType: file.type,
                    fileSize: file.size,
                    caption: "",
                    order: mediaItems.length
                };
                setMediaItems([...mediaItems, newItem]);
                toast.success("Uploaded!");
            } else {
                toast.error(res.error || "Upload failed");
            }
        } catch (error) {
            toast.error("Upload failed");
        }
        setUploading(false);
    };

    const removeMedia = (index: number) => {
        setMediaItems(mediaItems.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-widest">Manage Section Media</DialogTitle>
                    <DialogDescription>Add images, videos, or audio to your {section.type} block.</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Items: {mediaItems.length}</div>
                        <Button 
                            variant="default" 
                            disabled={uploading}
                            className="bg-indigo-600 rounded-xl"
                            onClick={() => document.getElementById('media-upload-btn')?.click()}
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            Upload New Media
                            <input id="media-upload-btn" type="file" hidden onChange={handleUpload} />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {mediaItems.map((item, index) => (
                            <div key={index} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                {item.mediaType === 'image' ? (
                                    <img src={item.url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200">
                                        <Sliders className="w-8 h-8 text-slate-400" />
                                        <span className="text-[10px] font-bold uppercase mt-2">{item.mediaType}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeMedia(index)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="absolute bottom-0 inset-x-0 p-2 bg-black/60 translate-y-full group-hover:translate-y-0 transition-transform">
                                    <Input 
                                        value={item.caption || ''} 
                                        onChange={(e) => {
                                            const newItems = [...mediaItems];
                                            newItems[index].caption = e.target.value;
                                            setMediaItems(newItems);
                                        }}
                                        placeholder="Caption..."
                                        className="h-7 text-[10px] bg-white/10 border-none text-white placeholder:text-white/40"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
                    <Button onClick={() => onSave(mediaItems)} className="bg-indigo-600 rounded-xl px-8 font-bold">
                        Save Media Library
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SectionEditor({ section, onClose, onSave }: any) {
    const [title, setTitle] = useState(section.title || '');
    const [subtitle, setSubtitle] = useState(section.subtitle || '');
    const [content, setContent] = useState<any>(JSON.parse(section.content || '{}'));
    const [settings, setSettings] = useState<any>(JSON.parse(section.settings || '{}'));
    const [type, setType] = useState(section.type);

    const handleSave = () => {
        onSave({ 
            ...section, 
            type, 
            title, 
            subtitle, 
            content: JSON.stringify(content), 
            settings: JSON.stringify(settings) 
        });
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-widest text-indigo-600">Configure {type} Section</DialogTitle>
                    <DialogDescription>Customize the content and behavior of this homepage block.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] pl-1">Block Type</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {['slider', 'hero', 'gallery', 'content', 'cta'].map(t => (
                                <Button
                                    key={t}
                                    variant={type === t ? 'default' : 'outline'}
                                    onClick={() => setType(t)}
                                    className="capitalize rounded-xl font-bold h-10 transition-all text-xs"
                                >
                                    {t}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] pl-1">Primary Title</Label>
                                <Input 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    placeholder="e.g. Welcome to our Institution"
                                    className="h-11 rounded-xl bg-slate-50 border-none font-bold placeholder:text-slate-300" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] pl-1">Secondary Subtitle</Label>
                                <Textarea 
                                    value={subtitle} 
                                    onChange={e => setSubtitle(e.target.value)} 
                                    placeholder="A brief description appearing below the title..."
                                    className="min-h-[80px] rounded-xl bg-slate-50 border-none resize-none placeholder:text-slate-300" 
                                />
                            </div>
                        </div>

                        {type === 'hero' && (
                            <div className="p-4 rounded-2xl bg-indigo-50/50 space-y-4">
                                <Label className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">Hero Specifics</Label>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Image URL</Label>
                                    <Input value={content.imageUrl || ''} onChange={e => setContent({ ...content, imageUrl: e.target.value })} className="bg-white rounded-xl" placeholder="https://..." />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold">CTA Text</Label>
                                        <Input value={content.ctaText || ''} onChange={e => setContent({ ...content, ctaText: e.target.value })} className="bg-white rounded-xl" placeholder="Get Started" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold">CTA Link</Label>
                                        <Input value={content.ctaLink || ''} onChange={e => setContent({ ...content, ctaLink: e.target.value })} className="bg-white rounded-xl" placeholder="/register" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {type === 'content' && (
                            <div className="space-y-2">
                                <Label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] pl-1">Rich Text Body (HTML)</Label>
                                <Textarea 
                                    value={content.body || ''} 
                                    onChange={e => setContent({ ...content, body: e.target.value })} 
                                    className="min-h-[200px] rounded-xl bg-slate-50 border-none font-medium placeholder:text-slate-300" 
                                    placeholder="<p>Enter your content here...</p>"
                                />
                                <p className="text-[10px] text-slate-400 italic">This area supports HTML tags for custom layouts.</p>
                            </div>
                        )}

                        {type === 'cta' && (
                            <div className="p-4 rounded-2xl bg-indigo-500/5 space-y-4 border border-indigo-100">
                                <Label className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">Call to Action Configuration</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold">Button Text</Label>
                                        <Input value={content.ctaText || ''} onChange={e => setContent({ ...content, ctaText: e.target.value })} className="bg-white rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold">Button Link</Label>
                                        <Input value={content.ctaLink || ''} onChange={e => setContent({ ...content, ctaLink: e.target.value })} className="bg-white rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {['slider', 'gallery'].includes(type) && (
                            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center space-y-2">
                                <ImageIcon className="w-8 h-8 text-slate-300" />
                                <p className="text-sm font-bold text-slate-500">Manage Imagery After Saving</p>
                                <p className="text-[11px] text-slate-400 max-w-[200px]">Use the 'Edit Images' button on the main builder to manage {type} assets.</p>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 h-11 font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 transition-all">
                        Update Block
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Separator() {
    return <div className="h-px bg-slate-100 w-full" />;
}
