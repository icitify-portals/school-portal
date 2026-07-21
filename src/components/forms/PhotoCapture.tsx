"use client";

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface PhotoCaptureProps {
    value?: string; // base64 string
    onChange: (value: string) => void;
    label: string;
}

export default function PhotoCapture({ value, onChange, label }: PhotoCaptureProps) {
    const [mode, setMode] = useState<'upload' | 'camera'>('upload');
    const [preview, setPreview] = useState<string | null>(value || null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isSecureContext, setIsSecureContext] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsSecureContext(window.isSecureContext);
            if (!window.isSecureContext) {
                setMode('upload');
            }
        }
    }, []);
    const [processing, setProcessing] = useState(false);
    const webcamRef = useRef<Webcam>(null);

    const processImage = (dataUrl: string, targetSize = 600): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetSize;
                canvas.height = targetSize;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(dataUrl);

                // Use high quality interpolation if available
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Calculate cropping to square (center crop)
                const size = Math.min(img.width, img.height);
                const startX = (img.width - size) / 2;
                const startY = (img.height - size) / 2;

                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, targetSize, targetSize);
                
                // Draw image cropped and scaled
                ctx.drawImage(img, startX, startY, size, size, 0, 0, targetSize, targetSize);
                
                // Iterative compression to ensure < 200KB (approx 270,000 base64 chars)
                let quality = 0.95;
                let result = canvas.toDataURL('image/jpeg', quality);
                
                while (result.length > 270000 && quality > 0.4) {
                    quality -= 0.1;
                    result = canvas.toDataURL('image/jpeg', quality);
                }
                
                resolve(result);
            };
            img.src = dataUrl;
        });
    };

    const capture = useCallback(async () => {
        if (webcamRef.current) {
            setProcessing(true);
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                const processed = await processImage(imageSrc);
                setPreview(processed);
                onChange(processed);
            }
            setProcessing(false);
        }
    }, [webcamRef, onChange]);

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                setUploadError("File size must be less than 5MB");
                e.target.value = '';
                return;
            }
            setUploadError(null);
            setProcessing(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const result = reader.result as string;
                const processed = await processImage(result);
                setPreview(processed);
                onChange(processed);
                setProcessing(false);
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
            <div className="relative border-2 border-indigo-100 rounded-2xl overflow-hidden bg-slate-50 w-full max-w-sm mx-auto aspect-square flex items-center justify-center">
                <Image src={preview} alt="Captured preview" layout="fill" objectFit="cover" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <Button type="button" onClick={clearPreview} variant="destructive" className="rounded-full w-12 h-12 p-0 shadow-lg">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <div className="absolute top-4 right-4 bg-green-500 text-white p-1 rounded-full shadow-md">
                    <Check className="w-4 h-4" />
                </div>
            </div>
        );
    }

    return (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 text-center space-y-6">
            {!isSecureContext && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs text-left mb-4 font-medium border border-amber-200">
                    Camera access requires a secure connection (HTTPS). Since you are accessing the site via HTTP, please use the <strong>Upload File</strong> option instead.
                </div>
            )}
            <div className="flex justify-center gap-4 border-b border-slate-200 pb-4">
                <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setMode('upload')}
                    className={cn("rounded-xl px-6 py-2 text-xs font-bold uppercase tracking-widest", mode === 'upload' ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100")}
                >
                    <Upload className="w-4 h-4 mr-2" /> Upload File
                </Button>
                <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setMode('camera')}
                    disabled={!isSecureContext}
                    className={cn("rounded-xl px-6 py-2 text-xs font-bold uppercase tracking-widest", mode === 'camera' ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100", !isSecureContext && "opacity-50 cursor-not-allowed")}
                >
                    <Camera className="w-4 h-4 mr-2" /> Use Camera
                </Button>
            </div>

            {mode === 'upload' ? (
                <div className="space-y-4 py-8">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700 uppercase">Select an image to upload</p>
                        <p className="text-xs text-slate-500">JPG, PNG up to 5MB</p>
                    </div>
                    {uploadError && <p className="text-xs text-rose-600 font-semibold">{uploadError}</p>}
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                        disabled={processing}
                        className="block w-full max-w-xs mx-auto text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                    />
                    {processing && <p className="text-xs text-indigo-600 animate-pulse font-bold">Processing Image...</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden aspect-square max-w-sm mx-auto bg-black">
                        <Webcam
                            key="webcam"
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "user" }}
                            className="w-full h-full object-cover"
                            mirrored={false}
                            onUserMedia={() => setUploadError(null)}
                            onUserMediaError={(err) => {
                                console.error("Camera error:", err);
                                setUploadError("Camera permission denied or device not found. Please allow camera access or use the upload tab.");
                            }}
                        />
                    </div>
                    <Button type="button" onClick={capture} disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-6 uppercase font-bold text-xs tracking-widest shadow-xl">
                        <Camera className="w-5 h-5 mr-2" /> {processing ? "Processing..." : "Capture Photo"}
                    </Button>
                    {uploadError && <p className="text-xs text-rose-600 font-semibold">{uploadError}</p>}
                </div>
            )}
        </div>
    );
}
