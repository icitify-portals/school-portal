"use client";

import { useState } from "react";
import bwipjs from "bwip-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, User as UserIcon } from "lucide-react";

interface BadgeData {
    name: string;
    role: string;
    id: string;
    barcode: string;
    imageUrl?: string;
}

export default function BadgeGenerator({ data }: { data: BadgeData }) {
    const [canvasUrl, setCanvasUrl] = useState<string | null>(null);

    const generateBarcode = () => {
        try {
            const canvas = document.createElement("canvas");
            bwipjs.toCanvas(canvas, {
                bcid: "code128",       // Barcode type
                text: data.barcode,    // Text to encode
                scale: 3,              // 3x scaling factor
                height: 10,            // Bar height, in millimeters
                includetext: true,     // Show human-readable text
                textxalign: "center",  // Always good to set this
            });
            return canvas.toDataURL("image/png");
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const handlePrint = () => {
        const barcodeUrl = generateBarcode();
        if (!barcodeUrl) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>ID Badge - ${data.name}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8fafc; }
                        .badge { 
                            width: 3.375in; height: 2.125in; 
                            background: white; 
                            border-radius: 12px; 
                            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                            padding: 20px;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            border: 1px solid #e2e8f0;
                            position: relative;
                            overflow: hidden;
                        }
                        .header { display: flex; gap: 15px; align-items: center; }
                        .photo { width: 60px; height: 60px; border-radius: 50%; background: #f1f5f9; border: 2px solid #3b82f6; overflow: hidden; }
                        .photo img { width: 100%; height: 100%; object-fit: cover; }
                        .info h3 { margin: 0; font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
                        .info p { margin: 0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
                        .barcode-container { width: 100%; display: flex; justify-content: center; }
                        .barcode-container img { max-width: 100%; height: 40px; }
                        .footer { font-size: 8px; font-weight: 800; color: #94a3b8; text-align: center; text-transform: uppercase; }
                        .accent { position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: #3b82f6; clip-path: polygon(100% 0, 0 0, 100% 100%); opacity: 0.1; }
                    </style>
                </head>
                <body>
                    <div class="badge">
                        <div class="accent"></div>
                        <div class="header">
                            <div class="photo">
                                ${data.imageUrl ? `<img src="${data.imageUrl}" />` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#cbd5e1"><svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>'}
                            </div>
                            <div class="info">
                                <h3>${data.name}</h3>
                                <p>${data.role} • ID: ${data.id}</p>
                            </div>
                        </div>
                        <div class="barcode-container">
                            <img src="${barcodeUrl}" />
                        </div>
                        <div class="footer">Institutional Security • Verify at Gate</div>
                    </div>
                    <script>window.onload = () => { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Card className="overflow-hidden rounded-2xl border-none shadow-xl bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-600" /> Digital Identity Badge
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 overflow-hidden shadow-inner">
                        {data.imageUrl ? (
                            <img src={data.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-8 h-8 text-slate-300" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-slate-900 uppercase italic">{data.name}</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{data.role}</p>
                        <div className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-black text-blue-600 border border-blue-100 uppercase">
                            ID: {data.id}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button 
                        onClick={handlePrint}
                        className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
                    >
                        <Printer className="w-4 h-4" /> Print Badge
                    </Button>
                    <Button 
                        variant="outline"
                        className="h-12 rounded-2xl border-slate-200 font-black uppercase text-[10px] tracking-widest gap-2 px-6"
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
