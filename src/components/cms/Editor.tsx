"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { toast } from 'sonner';
import { uploadMedia } from '@/actions/cms';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Link as LinkIcon,
    Image as ImageIcon,
    Youtube as YoutubeIcon,
    Undo,
    Redo,
    Heading1,
    Heading2,
    Heading3,
    Video,
    Music,
    UploadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        formData.append("subDir", "cms-content");

        toast.info(`Uploading ${type}...`);
        
        try {
            const res = await uploadMedia(formData); 
            if (res.success && res.url) {
                if (type === 'image') {
                    editor.chain().focus().setImage({ src: res.url }).run();
                } else if (type === 'video') {
                    editor.chain().focus().insertContent(`<video src="${res.url}" controls class="w-full rounded-xl shadow-lg my-4"></video>`).run();
                } else if (type === 'audio') {
                    editor.chain().focus().insertContent(`<audio src="${res.url}" controls class="w-full my-4"></audio>`).run();
                }
                toast.success("Uploaded successfully");
            } else {
                toast.error(res.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("An error occurred during upload");
        }
    };

    const addYoutube = () => {
        const url = window.prompt('YouTube URL');
        if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
    };

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
            <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
                <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
                <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()}>
                <UnderlineIcon className="h-4 w-4" />
            </Toggle>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Toggle size="sm" pressed={editor.isActive('heading', { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 className="h-4 w-4" />
            </Toggle>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
                <List className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered className="h-4 w-4" />
            </Toggle>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="sm" onClick={() => {
                 const url = window.prompt('URL');
                 if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }}>
                <LinkIcon className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button variant="ghost" size="sm" onClick={() => document.getElementById('img-upload')?.click()}>
                <ImageIcon className="h-4 w-4" />
                <input id="img-upload" type="file" hidden accept="image/*" onChange={(e) => handleUpload(e, 'image')} />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => document.getElementById('vid-upload')?.click()}>
                <Video className="h-4 w-4" />
                <input id="vid-upload" type="file" hidden accept="video/*" onChange={(e) => handleUpload(e, 'video')} />
            </Button>

            <Button variant="ghost" size="sm" onClick={addYoutube}>
                <YoutubeIcon className="h-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                <Redo className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default function TiptapEditor({
    value,
    onChange
}: {
    value: string;
    onChange: (content: string) => void
}) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({ openOnClick: false }),
            Image,
            Youtube,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] p-4',
            },
        },
    });

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
