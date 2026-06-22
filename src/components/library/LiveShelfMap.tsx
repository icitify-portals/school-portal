"use client";

import React, { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Compass, HelpCircle, MapPin, Navigation } from "lucide-react";

interface LiveShelfMapProps {
    isOpen: boolean;
    onClose: () => void;
    shelfLocation: string;
    bookTitle: string;
}

export default function LiveShelfMap({ isOpen, onClose, shelfLocation, bookTitle }: LiveShelfMapProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Extract Row (A, B, C, D) and Cabinet number (1, 2, 3, etc.)
    const matches = shelfLocation.match(/Shelf\s+([A-Z])-?(\d+)/i) || shelfLocation.match(/([A-Z])-?(\d+)/i);
    const row = matches ? matches[1].toUpperCase() : "A";
    const cabinet = matches ? parseInt(matches[2]) : 1;

    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let pulseAngle = 0;

        const drawMap = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Library Floor Grid (Dark futuristic theme)
            ctx.fillStyle = "#0f172a"; // slate-900 background
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw grid dots
            ctx.fillStyle = "rgba(99, 102, 241, 0.15)"; // Indigo dots
            for (let x = 20; x < canvas.width; x += 30) {
                for (let y = 20; y < canvas.height; y += 30) {
                    ctx.beginPath();
                    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Draw Walls / Corridors
            ctx.strokeStyle = "rgba(79, 70, 229, 0.3)";
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

            // Draw Entrance & Help Desk
            ctx.fillStyle = "#1e293b"; // slate-800
            ctx.strokeStyle = "#38bdf8"; // Light sky border
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(canvas.width / 2 - 40, canvas.height - 50, 80, 30, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 9px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("ENTRANCE", canvas.width / 2, canvas.height - 32);

            // Bookcases configurations
            const rows = ["A", "B", "C", "D"];
            const startX = 40;
            const startY = 40;
            const rowWidth = 25;
            const rowHeight = 120;
            const spacingX = 65;

            // Compute glowing alpha for dynamic pulsing
            pulseAngle += 0.05;
            const pulseAlpha = 0.4 + Math.sin(pulseAngle) * 0.4;

            rows.forEach((r, idx) => {
                const x = startX + idx * spacingX;
                const isTargetRow = r === row;

                // Draw standard bookcase row
                ctx.fillStyle = isTargetRow ? "rgba(79, 70, 229, 0.25)" : "rgba(30, 41, 59, 0.8)";
                ctx.strokeStyle = isTargetRow ? `rgba(99, 102, 241, ${0.4 + pulseAlpha * 0.6})` : "rgba(71, 85, 105, 0.5)";
                ctx.lineWidth = isTargetRow ? 3 : 1.5;

                ctx.beginPath();
                ctx.roundRect(x, startY, rowWidth, rowHeight, 6);
                ctx.fill();
                ctx.stroke();

                // Draw individual shelves inside bookcase row (e.g. 5 cabinets)
                const numCabinets = 5;
                const cabHeight = rowHeight / numCabinets;

                for (let c = 0; c < numCabinets; c++) {
                    const cabY = startY + c * cabHeight;
                    const isTargetCabinet = isTargetRow && (c + 1 === cabinet || (cabinet > numCabinets && c === numCabinets - 1));

                    ctx.strokeStyle = isTargetCabinet ? `rgba(244, 63, 94, ${0.5 + pulseAlpha * 0.5})` : "rgba(71, 85, 105, 0.25)";
                    ctx.lineWidth = isTargetCabinet ? 2 : 0.8;
                    ctx.strokeRect(x, cabY, rowWidth, cabHeight);

                    if (isTargetCabinet) {
                        // Drawing glowing pin in cabinet
                        ctx.fillStyle = "#f43f5e"; // rose-500
                        ctx.beginPath();
                        ctx.arc(x + rowWidth / 2, cabY + cabHeight / 2, 5, 0, Math.PI * 2);
                        ctx.fill();

                        // Ring pulse
                        ctx.strokeStyle = `rgba(244, 63, 94, ${1 - pulseAlpha})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(x + rowWidth / 2, cabY + cabHeight / 2, 5 + pulseAlpha * 12, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }

                // Row Labels
                ctx.fillStyle = isTargetRow ? "#c084fc" : "#94a3b8";
                ctx.font = "black 12px sans-serif";
                ctx.fillText(`Row ${r}`, x + rowWidth / 2, startY - 10);
            });

            // Draw current location map pin
            ctx.fillStyle = "#10b981"; // emerald pin
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height - 80, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#10b981";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("You are here", canvas.width / 2, canvas.height - 68);

            // Draw a smooth visual path line from current location to target bookcase
            const targetX = startX + rows.indexOf(row) * spacingX + rowWidth / 2;
            const targetY = startY + (Math.min(cabinet, 5) - 0.5) * (rowHeight / 5);

            ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, canvas.height - 80);
            ctx.lineTo(canvas.width / 2, targetY + 20);
            ctx.lineTo(targetX, targetY + 20);
            ctx.lineTo(targetX, targetY);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash

            animationFrameId = requestAnimationFrame(drawMap);
        };

        drawMap();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isOpen, row, cabinet]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-950 text-white border-slate-800 sm:max-w-[420px] rounded-[2.5rem] overflow-hidden">
                <DialogHeader className="p-2 pb-0">
                    <DialogTitle className="text-xl font-black flex items-center gap-2">
                        <MapPin className="text-rose-500 animate-bounce" /> Visual Book Finder
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 p-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                        <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Compass className="h-3.5 w-3.5 shrink-0" /> Real-time Aisle Routing
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-100 line-clamp-1">{bookTitle}</h4>
                        <div className="flex gap-2 items-center pt-1">
                            <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold uppercase tracking-wider text-[10px]">
                                Cabinet {cabinet}
                            </Badge>
                            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider text-[10px]">
                                Bookcase Row {row}
                            </Badge>
                            <Badge className="bg-slate-800 text-slate-300 font-mono text-[10px] ml-auto">
                                {shelfLocation}
                            </Badge>
                        </div>
                    </div>

                    {/* Canvas Floor Mapper */}
                    <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-inner flex justify-center bg-slate-900">
                        <canvas 
                            ref={canvasRef} 
                            width={320} 
                            height={260} 
                            className="block max-w-full"
                        />
                    </div>

                    <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 flex gap-3 items-center">
                        <Navigation className="h-5 w-5 text-indigo-400 shrink-0 rotate-45 animate-pulse" />
                        <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                            Walk past the Entrance Help Desk down **Aisle {row}**, count **{cabinet} cabinet sections** on your left. The copies are located on the middle shelves.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
