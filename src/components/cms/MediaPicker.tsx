"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImagePlus, Search, Loader2, UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getMediaLibrary, registerMedia } from "@/actions/cms-media";
import { cn } from "@/lib/utils";

export default function MediaPicker({ value, onChange }: { value?: number, onChange: (id: number, url: string) => void }) {
    const [open, setOpen] = useState(false);
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getMediaLibrary().then(res => {
                if (res.success && res.data) setMedia(res.data);
                setLoading(false);
            });
        }
    }, [open]);

    // Initial load to fetch preview if we only have an ID
    useEffect(() => {
        if (value && !previewUrl && media.length > 0) {
            const m = media.find(x => x.id === value);
            if (m) setPreviewUrl(m.url);
        }
    }, [value, media, previewUrl]);

    const handleSimulatedUpload = async (e: any) => {
        // In a real app, you'd upload to S3/Wasabi here and get a URL back.
        // For this demo, we'll ask for an external URL and register it.
        const fileUrl = prompt("Enter an image URL (simulate upload):");
        if (!fileUrl) return;

        setUploading(true);
        const res = await registerMedia({
            filename: fileUrl.split('/').pop() || 'uploaded-file.jpg',
            url: fileUrl,
            mimeType: 'image/jpeg'
        });

        if (res.success && res.id) {
            onChange(res.id, fileUrl);
            setPreviewUrl(fileUrl);
            setOpen(false);
        }
        setUploading(false);
    };

    return (
        <div className="space-y-4">
            <div className={cn(
                "aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all relative overflow-hidden",
                previewUrl ? "border-indigo-100 bg-indigo-50/30" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
            )} onClick={() => setOpen(true)}>
                {previewUrl ? (
                    <img src={previewUrl} alt="Featured" className="w-full h-full object-cover" />
                ) : (
                    <>
                        <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Media</span>
                    </>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center pr-6">
                            <span>Central Media Library</span>
                            <Button size="sm" onClick={handleSimulatedUpload} disabled={uploading}>
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                                Upload New
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input placeholder="Search media by filename..." className="pl-9 h-10 rounded-xl" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {media.map(m => (
                                    <div 
                                        key={m.id} 
                                        className={cn(
                                            "relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:opacity-80",
                                            value === m.id ? "border-indigo-600 shadow-md scale-95" : "border-transparent"
                                        )}
                                        onClick={() => {
                                            onChange(m.id, m.url);
                                            setPreviewUrl(m.url);
                                            setOpen(false);
                                        }}
                                    >
                                        <img src={m.url} className="w-full h-full object-cover" alt={m.altText || m.filename} />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                            <p className="text-[10px] text-white truncate font-medium">{m.filename}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
