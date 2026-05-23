"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { 
    Bold, 
    Italic, 
    List, 
    ListOrdered, 
    Quote, 
    Undo, 
    Redo, 
    Link as LinkIcon,
    Underline as UnderlineIcon
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none max-w-none min-h-[400px] p-8 text-slate-700 bg-white',
            },
        },
    });

    // Sync content if changed externally (e.g., by AI generation)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-100">
                <Toggle 
                    size="sm" 
                    pressed={editor.isActive('bold')} 
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="w-4 h-4" />
                </Toggle>
                <Toggle 
                    size="sm" 
                    pressed={editor.isActive('italic')} 
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="w-4 h-4" />
                </Toggle>
                <Toggle 
                    size="sm" 
                    pressed={editor.isActive('underline')} 
                    onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <UnderlineIcon className="w-4 h-4" />
                </Toggle>
                <Separator orientation="vertical" className="h-4 mx-1" />
                <Toggle 
                    size="sm" 
                    pressed={editor.isActive('bulletList')} 
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="w-4 h-4" />
                </Toggle>
                <Toggle 
                    size="sm" 
                    pressed={editor.isActive('orderedList')} 
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="w-4 h-4" />
                </Toggle>
                <Separator orientation="vertical" className="h-4 mx-1" />
                <Toggle 
                    size="sm" 
                    pressed={editor.isActive('blockquote')} 
                    onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <Quote className="w-4 h-4" />
                </Toggle>
                <div className="flex-1" />
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo className="w-4 h-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo className="w-4 h-4" />
                </Button>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}

function Button({ className, ...props }: any) {
    return <button className={`p-2 hover:bg-slate-200 rounded-md disabled:opacity-30 ${className}`} {...props} />;
}
