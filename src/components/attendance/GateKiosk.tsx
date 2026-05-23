"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { generateKioskToken } from "@/actions/attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, QrCode as QrIcon } from "lucide-react";

export default function GateKiosk() {
    const [token, setToken] = useState<string | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [loading, setLoading] = useState(true);

    const refreshToken = async () => {
        setLoading(true);
        const res = await generateKioskToken();
        if (res.success && res.token) {
            setToken(res.token);
            const url = await QRCode.toDataURL(res.token, {
                width: 400,
                margin: 2,
                color: {
                    dark: "#0f172a",
                    light: "#ffffff",
                },
            });
            setQrDataUrl(url);
            setTimeLeft(30);
        }
        setLoading(false);
    };

    useEffect(() => {
        refreshToken();
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    refreshToken();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="w-full max-w-md mx-auto overflow-hidden rounded-[3rem] border-none shadow-2xl bg-white">
            <CardContent className="p-12 flex flex-col items-center gap-8">
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                        <QrIcon className="w-8 h-8" />
                        <span className="font-black uppercase tracking-widest text-sm">Gate Kiosk V2</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 italic uppercase leading-tight">
                        Scan to <span className="text-blue-600">Check-In/Out</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Open your mobile app and scan this code at the gate</p>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" />
                    <div className="relative bg-white p-6 rounded-[2.5rem] border-4 border-slate-50 shadow-inner min-w-[300px] min-h-[300px] flex items-center justify-center">
                        {loading && !qrDataUrl ? (
                            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                        ) : (
                            qrDataUrl && (
                                <img 
                                    src={qrDataUrl} 
                                    alt="Attendance QR" 
                                    className="w-full h-full object-contain rounded-2xl animate-in zoom-in-95 duration-500" 
                                />
                            )
                        )}
                        
                        {loading && qrDataUrl && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-[2.5rem]">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Security Rotation</span>
                        <span className={timeLeft < 10 ? "text-rose-500" : "text-blue-600"}>
                            Refreshing in {timeLeft}s
                        </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
                            style={{ width: `${(timeLeft / 30) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase italic">
                    <RefreshCw className="w-3 h-3 animate-spin-slow" />
                    Last Updated: {new Date().toLocaleTimeString()}
                </div>
            </CardContent>
        </Card>
    );
}
