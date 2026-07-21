"use client";

import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Upload, X, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SignatureCaptureProps {
    value?: string; // S3 URL or base64 (fallback)
    onChange: (value: string) => void;
    label: string;
    applicationId?: number;
}

export default function SignatureCapture({ value, onChange, label, applicationId }: SignatureCaptureProps) {
    const [mode, setMode] = useState<'draw' | 'upload'>('draw');
    const [preview, setPreview] = useState<string | null>(value || null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initialize canvas context for drawing
    useEffect(() => {
        if (mode === 'draw' && !preview && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 3;
                // Fill with white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [mode, preview]);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!canvasRef.current) return null;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        
        // Scale coordinates based on actual size vs style size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); // Prevent scrolling on touch
        const coords = getCoordinates(e);
        if (!coords || !canvasRef.current) return;
        
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
            setIsDrawing(true);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;
        
        const coords = getCoordinates(e);
        if (!coords || !canvasRef.current) return;
        
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (isDrawing && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.closePath();
            setIsDrawing(false);
        }
    };

    const clearCanvas = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.beginPath();
            }
        }
    };

    const uploadToWasabi = async (fileBlob: Blob, type: string) => {
        if (!applicationId) {
            setUploadError("Application ID missing. Save draft first or contact admin.");
            return;
        }
        setIsUploading(true);
        setUploadError(null);
        try {
            const formData = new FormData();
            formData.append("applicationId", applicationId.toString());
            formData.append("type", type);
            const file = new File([fileBlob], `${type}_upload.jpg`, { type: 'image/jpeg' });
            formData.append("file", file);

            const res = await fetch('/api/applicant/upload-form-asset', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Upload failed");
            }

            const data = await res.json();
            if (data.success && data.url) {
                setPreview(data.url);
                onChange(data.url);
            }
        } catch (err: any) {
            console.error("Upload error:", err);
            setUploadError(err.message || "Failed to upload signature. Make sure payments are complete.");
            setPreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const saveDrawing = () => {
        if (canvasRef.current) {
            canvasRef.current.toBlob(async (blob) => {
                if (blob) {
                    await uploadToWasabi(blob, 'signature');
                }
            }, 'image/jpeg', 0.95);
        }
    };

    const processAndUploadImage = (dataUrl: string): Promise<void> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const targetWidth = 600;
                const targetHeight = (img.height / img.width) * targetWidth;
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve();

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, targetWidth, targetHeight);
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        await uploadToWasabi(blob, 'signature');
                    }
                    resolve();
                }, 'image/jpeg', 0.95);
            };
            img.src = dataUrl;
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setUploadError("File size must be less than 5MB");
                e.target.value = '';
                return;
            }
            setUploadError(null);
            setIsUploading(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const result = reader.result as string;
                await processAndUploadImage(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearPreview = () => {
        setPreview(null);
        onChange("");
    };

    if (preview) {
        return (
            <div className="relative border-2 border-indigo-100 rounded-2xl overflow-hidden bg-white w-full max-w-md mx-auto h-48 flex items-center justify-center">
                <Image src={preview} alt="Signature preview" layout="fill" objectFit="contain" className="p-4" />
                <div className="absolute inset-0 bg-slate-900/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <Button type="button" onClick={clearPreview} variant="destructive" className="rounded-full w-12 h-12 p-0 shadow-lg">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-md">
                    <Check className="w-4 h-4" />
                </div>
            </div>
        );
    }

    return (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 sm:p-6 bg-slate-50 text-center space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 border-b border-slate-200 pb-4">
                <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setMode('draw')}
                    className={cn("w-full sm:w-auto rounded-xl px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest", mode === 'draw' ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100")}
                >
                    <PenTool className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Draw Signature
                </Button>
                <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setMode('upload')}
                    className={cn("w-full sm:w-auto rounded-xl px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest", mode === 'upload' ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100")}
                >
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Upload Photo
                </Button>
            </div>

            {mode === 'upload' ? (
                <div className="space-y-4 py-8">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700 uppercase">Select a photo of your signature</p>
                        <p className="text-xs text-slate-500">Ensure the paper is white and ink is dark</p>
                    </div>
                    {uploadError && <p className="text-xs text-rose-600 font-semibold">{uploadError}</p>}
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="block w-full max-w-xs mx-auto text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                    />
                    {isUploading && <p className="text-xs text-indigo-600 animate-pulse font-bold">Uploading...</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="text-left">
                        <p className="text-xs font-bold text-slate-500 uppercase">Draw in the box below</p>
                    </div>
                    <div className="relative border-2 border-slate-300 rounded-xl overflow-hidden bg-white max-w-md mx-auto touch-none">
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={250}
                            className="w-full h-auto cursor-crosshair touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseOut={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>
                    <div className="flex justify-center gap-4 pt-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={clearCanvas}
                            disabled={isUploading}
                            className="rounded-xl border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold uppercase tracking-widest px-6"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Clear
                        </Button>
                        <Button 
                            type="button" 
                            onClick={saveDrawing}
                            disabled={isUploading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest px-8 shadow-lg"
                        >
                            <Check className="w-4 h-4 mr-2" /> {isUploading ? "Uploading..." : "Save Signature"}
                        </Button>
                    </div>
                    {uploadError && <p className="text-xs text-rose-600 font-semibold">{uploadError}</p>}
                </div>
            )}
        </div>
    );
}
