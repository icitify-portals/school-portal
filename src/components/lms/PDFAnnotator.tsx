"use client";

import { useEffect, useState } from "react";
import { Tldraw, createShapeId, Editor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { Button } from "@/components/ui/button";
import { Save, Maximize2, Minimize2, Trash2 } from "lucide-react";

interface PDFAnnotatorProps {
    fileUrl: string;
    initialData?: string; // JSON snapshot
    onSave: (snapshot: string) => void;
}

export default function PDFAnnotator({ fileUrl, initialData, onSave }: PDFAnnotatorProps) {
    const [editor, setEditor] = useState<Editor | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Load initial data if provided
    useEffect(() => {
        if (editor && initialData) {
            try {
                const snapshot = JSON.parse(initialData);
                editor.loadSnapshot(snapshot);
            } catch (e) {
                console.error("Failed to load annotation snapshot", e);
            }
        }
    }, [editor, initialData]);

    const handleMount = (editor: Editor) => {
        setEditor(editor);
        
        // If it's a new annotation, maybe add the PDF as an image background?
        // Note: Direct PDF rendering in tldraw requires pdfjs. 
        // For now, we provide a clean clear canvas for notes.
    };

    const handleSave = () => {
        if (editor) {
            const snapshot = JSON.stringify(editor.getSnapshot());
            onSave(snapshot);
        }
    };

    const handleClear = () => {
        if (editor && confirm("Clear all annotations?")) {
            editor.selectAll().deleteShapes(editor.getSelectedShapeIds());
        }
    };

    return (
        <div className={`relative flex flex-col border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xl transition-all ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[600px]'}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white">
                <div className="flex items-center gap-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Annotation Workspace</h3>
                    <div className="h-4 w-px bg-slate-700" />
                    <p className="text-[10px] text-slate-500 font-medium">Draw directly to provide visual feedback</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleClear} className="text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 h-8">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="text-slate-400 hover:text-white hover:bg-white/10 h-8">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" onClick={handleSave} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-8 px-4">
                        <Save className="w-4 h-4 mr-2" /> Save Markups
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-slate-50">
                {/* PDF Background (Simplification: Show PDF below or as a link if not renderable as image) */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center">
                   <p className="text-sm font-medium text-slate-400">Annotation Layer Active</p>
                </div>

                <div className="absolute inset-0 z-10">
                    <Tldraw 
                        onMount={handleMount} 
                        inferDarkMode={false}
                        autoFocus={false}
                        // We can hide parts of the UI to make it feel more integrated
                        hideUi={false} 
                    />
                </div>
            </div>
            
            {!isFullscreen && (
                <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Annotation data is saved separately from text feedback.</span>
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline flex items-center gap-1">
                        View Original PDF <Maximize2 className="w-3 h-3" />
                    </a>
                </div>
            )}
        </div>
    );
}
