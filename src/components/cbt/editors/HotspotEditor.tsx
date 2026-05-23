"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Plus, Trash2, Crosshair } from "lucide-react";

interface HotspotEditorProps {
    question: any;
    updateQuestion: (updates: any) => void;
}

export function HotspotEditor({ question, updateQuestion }: HotspotEditorProps) {
    const config = typeof question.options === 'string'
        ? JSON.parse(question.options)
        : (question.options || { image: "", hotspots: [] });

    const [image, setImage] = useState(config.image);
    const [hotspots, setHotspots] = useState<any[]>(config.hotspots || []);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleImageUpload = (url: string) => {
        const newUrl = url || "";
        setImage(newUrl);
        updateQuestion({ options: JSON.stringify({ ...config, image: newUrl, hotspots }) });
    };

    const addHotspot = (e: React.MouseEvent) => {
        if (!imgRef.current) return;

        const rect = imgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newHotspots = [...hotspots, { x, y, radius: 5, label: `Point ${hotspots.length + 1}` }];
        setHotspots(newHotspots);
        updateQuestion({ options: JSON.stringify({ image, hotspots: newHotspots }) });
    };

    const removeHotspot = (index: number) => {
        const newHotspots = hotspots.filter((_, i) => i !== index);
        setHotspots(newHotspots);
        updateQuestion({ options: JSON.stringify({ image, hotspots: newHotspots }) });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Image URL</label>
                <div className="flex gap-3">
                    <Input
                        value={image}
                        onChange={(e) => handleImageUpload(e.target.value)}
                        placeholder="Paste image URL here..."
                        className="h-11 rounded-xl border-slate-200"
                    />
                </div>
            </div>

            {image ? (
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                        <Crosshair className="w-3 h-3 text-indigo-500" /> Click on the image to add correct hotspots
                    </p>
                    <div className="relative inline-block group cursor-crosshair rounded-2xl overflow-hidden border-4 border-slate-100 shadow-2xl">
                        <img
                            ref={imgRef}
                            src={image}
                            alt="Hotspot Source"
                            className="max-h-[500px] w-auto block select-none"
                            onClick={addHotspot}
                        />
                        {hotspots.map((h, i) => (
                            <div
                                key={i}
                                className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-4 border-white bg-indigo-600 shadow-xl flex items-center justify-center text-[10px] font-black text-white animate-in zoom-in-50 duration-200"
                                style={{ left: `${h.x}%`, top: `${h.y}%` }}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hotspots.map((h, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                <span className="text-xs font-black text-slate-400 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-100">
                                    {i + 1}
                                </span>
                                <div className="text-[10px] font-bold text-slate-600 px-3">
                                    X: {Math.round(h.x)}% | Y: {Math.round(h.y)}%
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeHotspot(i)}
                                    className="h-8 w-8 text-slate-300 hover:text-red-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-12">
                    <ImageIcon className="w-12 h-12 text-slate-200 mb-4" />
                    <h4 className="text-sm font-bold text-slate-400">No Image Provided</h4>
                    <p className="text-[10px] text-slate-300 max-w-xs mt-1">Please provide a valid image URL to start defining hotspots.</p>
                </div>
            )}
        </div>
    );
}
