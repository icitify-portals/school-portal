"use client";

import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadZoneProps {
    onUpload: (file: File) => Promise<void>;
    accept?: Record<string, string[]>;
    maxSize?: number;
    uploading?: boolean;
    currentUrl?: string;
    label?: string;
}

export default function FileUploadZone({
    onUpload,
    accept,
    maxSize = 50 * 1024 * 1024, // 50MB default
    uploading = false,
    currentUrl,
    label = "Drag & drop your file here, or click to browse"
}: FileUploadZoneProps) {
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            await onUpload(acceptedFiles[0]);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple: false
    });

    return (
        <div className="space-y-2">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[160px]",
                    isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50",
                    uploading && "opacity-50 pointer-events-none"
                )}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                        <p className="text-sm font-medium text-slate-600">Uploading file...</p>
                    </div>
                ) : (
                    <>
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 text-indigo-600">
                            <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-900 text-center">{label}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            {accept ? `Supported: ${Object.values(accept).flat().join(", ")}` : "All file types supported"}
                        </p>
                    </>
                )}
            </div>

            {currentUrl && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border rounded-lg">
                    <div className="w-8 h-8 bg-white border rounded flex items-center justify-center text-slate-400">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-600 truncate">{currentUrl}</p>
                    </div>
                    <a
                        href={currentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-indigo-600 uppercase hover:underline"
                    >
                        View
                    </a>
                </div>
            )}

            {fileRejections.length > 0 && (
                <p className="text-xs text-red-500 font-medium">
                    File rejected. Please check size and type.
                </p>
            )}
        </div>
    );
}
