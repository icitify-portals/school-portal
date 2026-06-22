"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User, Building2, MapPin } from "lucide-react";
import bwipjs from "bwip-js";
import { cn } from "@/lib/utils";

interface IdentityCardProps {
    name: string;
    id: string; // Matric or Staff ID
    role: "student" | "staff";
    department?: string;
    photoUrl?: string;
    barcode: string;
    className?: string;
}

export function IdentityCard({ name, id, role, department, photoUrl, barcode, className }: IdentityCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && barcode) {
            try {
                bwipjs.toCanvas(canvasRef.current, {
                    bcid: "code128",       // Barcode type
                    text: barcode,         // Text to encode
                    scale: 3,              // 3x scaling factor
                    height: 10,            // Bar height, in millimeters
                    includetext: true,     // Show human-readable text
                    textxalign: "center",  // Always good to set this
                    backgroundcolor: "ffffff"
                });
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }
    }, [barcode]);

    return (
        <Card className={cn(
            "w-[350px] h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl border-none relative bg-white group transition-all hover:scale-[1.02]",
            className
        )}>
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-32 bg-slate-900 overflow-hidden">
                <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[200%] bg-gradient-to-br from-blue-600/20 to-transparent rotate-12" />
                <div className="absolute bottom-4 right-6 flex items-center gap-2 text-white/20">
                    <ShieldCheck className="w-12 h-12" />
                </div>
            </div>

            <CardContent className="p-0 flex flex-col items-center relative h-full">
                {/* Profile Photo Area */}
                <div className="mt-16 relative">
                    <div className="w-32 h-32 rounded-2xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                        {photoUrl ? (
                            <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-16 h-16 text-slate-300" />
                        )}
                    </div>
                    <div className={cn(
                        "absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-md",
                        role === "student" ? "bg-blue-600" : "bg-slate-900"
                    )}>
                        <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                </div>

                {/* Identity Info */}
                <div className="mt-6 text-center px-8 space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none italic">{name}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{role === "student" ? "Undergraduate Scholar" : "Active Academic Staff"}</p>

                    <div className="flex justify-center gap-2 mt-4">
                        <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-tighter h-5 px-2">
                            {id}
                        </Badge>
                        <Badge className={cn(
                            "font-black uppercase text-[9px] tracking-tighter h-5 px-2 border-none",
                            role === "student" ? "bg-blue-600" : "bg-slate-900"
                        )}>
                            {role}
                        </Badge>
                    </div>
                </div>

                <div className="mt-8 w-full px-8 space-y-4">
                    <div className="flex items-center gap-4 text-slate-400">
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">{department || "General Administration"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">Main Campus • Block A</span>
                    </div>
                </div>

                {/* Barcode Footer */}
                <div className="mt-auto w-full bg-slate-50 p-6 flex flex-col items-center gap-3 border-t border-slate-100">
                    <canvas ref={canvasRef} className="w-full max-h-16 h-auto" />
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Verification Required</div>
                </div>
            </CardContent>
        </Card>
    );
}
