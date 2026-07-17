"use client";

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X, Check, RefreshCw } from 'lucide-react';
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
    const webcamRef = useRef<Webcam>(null);

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setPreview(imageSrc);
                onChange(imageSrc);
            }
        }
    }, [webcamRef, onChange]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreview(result);
                onChange(result);
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
            <div className="relative border-2 border-indigo-100 rounded-2xl overflow-hidden bg-slate-50 w-full max-w-sm mx-auto aspect-[3/4] flex items-center justify-center">
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
                    className={cn("rounded-xl px-6 py-2 text-xs font-bold uppercase tracking-widest", mode === 'camera' ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100")}
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
                        <p className="text-xs text-slate-500">JPG, PNG up to 2MB</p>
                    </div>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                        className="block w-full max-w-xs mx-auto text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden aspect-[3/4] max-w-sm mx-auto bg-black">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "user" }}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <Button type="button" onClick={capture} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-6 uppercase font-bold text-xs tracking-widest shadow-xl">
                        <Camera className="w-5 h-5 mr-2" /> Capture Photo
                    </Button>
                </div>
            )}
        </div>
    );
}
