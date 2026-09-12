"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { viewableAssetUrl } from "@/lib/assets";

interface SiwesFileUploadProps {
    folder: string;
    onUploaded: (url: string) => void;
    value?: string | null;
    label?: string;
    accept?: string;
    compact?: boolean;
    className?: string;
}

export function SiwesFileUpload({ folder, onUploaded, value, label = "Upload file", accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx", compact, className }: SiwesFileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const displayUrl = value ? viewableAssetUrl(value) : undefined;

    const handleFile = async (file?: File | null) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setError("File exceeds the 10MB limit.");
            return;
        }
        setError(null);
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("type", folder);
            const res = await fetch("/api/siwes/upload", { method: "POST", body: fd });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Upload failed");
            }
            const data = await res.json();
            if (data.success && data.url) {
                onUploaded(data.url);
            } else {
                throw new Error("Upload failed");
            }
        } catch (e: any) {
            setError(e.message || "Upload failed");
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                    className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 flex items-center gap-2"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Uploading..." : label}
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />
                {value && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="max-w-[160px] truncate">File attached</span>
                        <button
                            type="button"
                            onClick={() => onUploaded("")}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
                            title="Remove file"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
            {displayUrl && (
                <a
                    href={displayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                >
                    <FileText className="w-3.5 h-3.5" /> View current file
                </a>
            )}
            {error && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{error}</p>}
        </div>
    );
}