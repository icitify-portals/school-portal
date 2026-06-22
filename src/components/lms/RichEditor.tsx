"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { useState, useRef } from "react";
import { uploadFile } from "@/actions/upload";
import { 
    Bold, 
    Italic, 
    Underline as UnderlineIcon, 
    Heading1, 
    Heading2, 
    List, 
    ListOrdered, 
    Link as LinkIcon, 
    Quote, 
    Code, 
    Undo, 
    Redo, 
    Image as ImageIcon, 
    Video as VideoIcon, 
    Music, 
    Youtube as YoutubeIcon, 
    Table as TableIcon, 
    Trash2, 
    Loader2, 
    FileUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function RichEditor({ value, onChange }: RichEditorProps) {
    const [uploading, setUploading] = useState(false);
    const [activeUploadType, setActiveUploadType] = useState<string | null>(null);

    // Refs for hidden file inputs
    const imageRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLInputElement>(null);
    const docRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2],
                },
            }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-indigo-600 underline hover:text-indigo-800 transition-colors",
                },
            }),
            Image.configure({
                inline: true,
                HTMLAttributes: {
                    class: "rounded-2xl max-h-[400px] w-auto mx-auto object-cover my-6 shadow-md transition-all hover:scale-[1.01]",
                },
            }),
            Youtube.configure({
                width: 640,
                height: 480,
                HTMLAttributes: {
                    class: "rounded-2xl aspect-video w-full my-6 shadow-lg border border-slate-100",
                },
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio' | 'doc') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setActiveUploadType(type);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await uploadFile(formData);

            if (res.success && res.url) {
                if (type === 'image') {
                    editor.chain().focus().setImage({ src: res.url }).run();
                } else if (type === 'video') {
                    // Embed a native HTML5 video player with modern Tailwind classes
                    const videoHtml = `
                        <div class="my-6 relative group overflow-hidden rounded-2xl border border-slate-200/60 bg-black aspect-video max-h-[450px]">
                            <video controls class="w-full h-full object-contain" src="${res.url}" playsinline></video>
                        </div>
                    `;
                    editor.chain().focus().insertContent(videoHtml).run();
                } else if (type === 'audio') {
                    // Embed a native HTML5 audio player
                    const audioHtml = `
                        <div class="my-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                            <audio controls class="w-full h-10" src="${res.url}"></audio>
                        </div>
                    `;
                    editor.chain().focus().insertContent(audioHtml).run();
                } else if (type === 'doc') {
                    // Embed a styled download link for documents
                    const extension = file.name.split(".").pop()?.toLowerCase();
                    const docHtml = `
                        <div class="my-4 p-4 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between hover:border-indigo-200 transition-all shadow-sm">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-xs text-slate-500 uppercase">${extension || 'file'}</div>
                                <div>
                                    <p class="text-sm font-semibold text-slate-800 line-clamp-1">${file.name}</p>
                                    <p class="text-xs text-slate-400">Attached Learning Material</p>
                                </div>
                            </div>
                            <a href="${res.url}" target="_blank" download class="h-8 px-4 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center justify-center transition-colors">Download</a>
                        </div>
                    `;
                    editor.chain().focus().insertContent(docHtml).run();
                }
            } else {
                alert(`Upload failed: ${res.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("An error occurred during file upload.");
        } finally {
            setUploading(false);
            setActiveUploadType(null);
            if (e.target) e.target.value = "";
        }
    };

    const addYoutubeEmbed = () => {
        const url = prompt("Enter a YouTube video URL:");
        if (!url) return;

        // Simple validation or direct setting via TipTap extension
        try {
            editor.chain().focus().setYoutubeVideo({ src: url }).run();
        } catch (error) {
            alert("Please enter a valid YouTube URL.");
        }
    };

    const addLink = () => {
        const previousUrl = editor.getAttributes("link").href;
        const url = prompt("Enter URL:", previousUrl);

        // cancelled
        if (url === null) return;

        // empty
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    const insertTable = () => {
        const rows = prompt("Enter number of rows (e.g. 3):", "3");
        const cols = prompt("Enter number of columns (e.g. 3):", "3");
        
        if (!rows || !cols) return;

        const rowCount = parseInt(rows, 10);
        const colCount = parseInt(cols, 10);

        if (isNaN(rowCount) || isNaN(colCount) || rowCount <= 0 || colCount <= 0) {
            alert("Please enter valid positive numbers.");
            return;
        }

        // Build premium, responsive, styled HTML table code directly
        let tableHtml = `<div class="my-6 overflow-x-auto rounded-xl border border-slate-200"><table class="w-full text-sm text-left text-slate-500 border-collapse">`;
        
        // Header Row
        tableHtml += `<thead class="text-xs text-slate-700 uppercase bg-slate-50/80 border-b border-slate-200"><tr>`;
        for (let j = 0; j < colCount; j++) {
            tableHtml += `<th scope="col" class="px-6 py-3 border-r border-slate-200 font-bold">Header ${j + 1}</th>`;
        }
        tableHtml += `</tr></thead><tbody>`;

        // Data Rows
        for (let i = 0; i < rowCount - 1; i++) {
            tableHtml += `<tr class="bg-white border-b border-slate-200/60 hover:bg-slate-50/50">`;
            for (let j = 0; j < colCount; j++) {
                tableHtml += `<td class="px-6 py-4 border-r border-slate-200">Cell</td>`;
            }
            tableHtml += `</tr>`;
        }
        tableHtml += `</tbody></table></div>`;

        editor.chain().focus().insertContent(tableHtml).run();
    };

    return (
        <div className="w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            {/* Hidden Input Elements */}
            <input type="file" ref={imageRef} accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
            <input type="file" ref={videoRef} accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
            <input type="file" ref={audioRef} accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'audio')} />
            <input type="file" ref={docRef} className="hidden" onChange={(e) => handleFileUpload(e, 'doc')} />

            {/* Premium Glassmorphic Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50/70 border-b border-slate-200 backdrop-blur-sm">
                {/* Standard Formats */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg ${editor.isActive("bold") ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        title="Bold"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg ${editor.isActive("italic") ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        title="Italic"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg ${editor.isActive("underline") ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        title="Underline"
                    >
                        <UnderlineIcon className="h-4 w-4" />
                    </Button>
                </div>

                {/* Headings */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg ${editor.isActive("heading", { level: 1 }) ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        title="Heading 1"
                    >
                        <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg ${editor.isActive("heading", { level: 2 }) ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        title="Heading 2"
                    >
                        <Heading2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Text & Background Colors */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 px-1">Color</span>
                    <input
                        type="color"
                        className="w-6 h-6 p-0 border-0 cursor-pointer bg-transparent rounded"
                        onInput={(e) => {
                            editor.chain().focus().setColor((e.target as HTMLInputElement).value).run();
                        }}
                        value={editor.getAttributes("textStyle").color || "#000000"}
                        title="Text Color"
                    />
                    <input
                        type="color"
                        className="w-6 h-6 p-0 border-0 cursor-pointer bg-transparent rounded"
                        onInput={(e) => {
                            editor.chain().focus().toggleHighlight({ color: (e.target as HTMLInputElement).value }).run();
                        }}
                        value={editor.getAttributes("highlight").color || "#ffff00"}
                        title="Highlight Color"
                    />
                </div>

                {/* Lists & Quotes */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg ${editor.isActive("bulletList") ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        title="Bullet List"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg ${editor.isActive("orderedList") ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        title="Ordered List"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg ${editor.isActive("blockquote") ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        title="Blockquote"
                    >
                        <Quote className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg ${editor.isActive("codeBlock") ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        title="Code Block"
                    >
                        <Code className="h-4 w-4" />
                    </Button>
                </div>

                {/* Inline Media Uploads & Interactive Widgets */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                        onClick={() => imageRef.current?.click()}
                        disabled={uploading}
                        title="Insert Image"
                    >
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                        onClick={() => videoRef.current?.click()}
                        disabled={uploading}
                        title="Insert Video"
                    >
                        <VideoIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                        onClick={() => audioRef.current?.click()}
                        disabled={uploading}
                        title="Insert Audio"
                    >
                        <Music className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                        onClick={() => docRef.current?.click()}
                        disabled={uploading}
                        title="Attach Document"
                    >
                        <FileUp className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-red-500"
                        onClick={addYoutubeEmbed}
                        title="Embed YouTube Video"
                    >
                        <YoutubeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                        onClick={insertTable}
                        title="Insert Table"
                    >
                        <TableIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg ${editor.isActive("link") ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
                        onClick={addLink}
                        title="Insert Link"
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                </div>

                {/* History & Tools */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => {
                            if (confirm("Clear all editor contents?")) {
                                editor.chain().focus().clearContent().run();
                            }
                        }}
                        title="Clear All"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Upload Active Loading Overlay Spinner */}
                {uploading && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold animate-pulse border border-indigo-100 shadow-sm ml-auto">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Uploading {activeUploadType}...</span>
                    </div>
                )}
            </div>

            {/* Interactive Editor Area */}
            <div className="prose prose-slate max-w-none p-6 min-h-[350px] max-h-[500px] overflow-y-auto outline-none">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
