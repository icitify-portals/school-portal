"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Trash2, Check, PenTool } from "lucide-react";
import { toast } from "sonner";
import { updateOfficerSignature } from "@/actions/officers";

interface Props {
    userId: number;
    currentSignature?: string | null;
    isCurrentDigital?: boolean;
    onComplete?: () => void;
}

export default function SignatureCapture({ userId, currentSignature, isCurrentDigital, onComplete }: Props) {
    const [uploadMode, setUploadMode] = useState<"upload" | "draw">("draw");
    const [preview, setPreview] = useState<string | null>(currentSignature || null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Canvas state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
            }
        }
    }, [uploadMode]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            // Simplified: we'll grab the data URL when saving
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ("touches" in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearCanvas = () => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const saveSignature = async () => {
        setIsSaving(true);
        let signatureData = preview;

        if (uploadMode === "draw" && canvasRef.current) {
            signatureData = canvasRef.current.toDataURL("image/png");
        }

        if (!signatureData) {
            toast.error("No signature provided");
            setIsSaving(false);
            return;
        }

        const res = await updateOfficerSignature(userId, signatureData, uploadMode === "draw");
        if (res.success) {
            toast.success("Signature updated successfully");
            if (onComplete) onComplete();
        } else {
            //@ts-ignore
            toast.error(res.error || "Failed to update signature");
        }
        setIsSaving(false);
    };

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-4">
                <Tabs defaultValue="draw" onValueChange={(v) => setUploadMode(v as any)}>
                    <TabsList className="bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger value="draw" className="rounded-lg gap-2 data-[state=active]:bg-white">
                            <PenTool className="w-4 h-4" /> Draw Digitally
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="rounded-lg gap-2 data-[state=active]:bg-white">
                            <Upload className="w-4 h-4" /> Upload Image
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="draw" className="space-y-4 mt-4">
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-white overflow-hidden">
                            <canvas
                                ref={canvasRef}
                                width={500}
                                height={200}
                                className="w-full cursor-crosshair h-[200px]"
                                onMouseDown={startDrawing}
                                onMouseUp={stopDrawing}
                                onMouseMove={draw}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchEnd={stopDrawing}
                                onTouchMove={draw}
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Draw directly in the box above</p>
                            <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-rose-500 font-bold uppercase text-[10px]">
                                <Trash2 className="w-3 h-3 mr-2" /> Clear
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4 mt-4">
                        <div className="aspect-[5/2] border-2 border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center justify-center p-4 relative group">
                            {preview && uploadMode === 'upload' ? (
                                <img src={preview} alt="Signature Preview" className="max-h-full object-contain" />
                            ) : (
                                <>
                                    <div className="p-3 bg-slate-50 rounded-full mb-2">
                                        <Upload className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500">Click to upload scan</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">PNG or JPG (Max 2MB)</p>
                                </>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={handleFileUpload} 
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <Button 
                    className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[11px]"
                    onClick={saveSignature}
                    disabled={isSaving}
                >
                    {isSaving ? "Saving..." : <><Check className="w-4 h-4 mr-2" /> Use This Signature</>}
                </Button>
            </CardContent>
        </Card>
    );
}
