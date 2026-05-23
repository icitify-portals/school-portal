"use client";

import { useState, useRef, useEffect } from "react";
import { scanLectureQR } from "@/actions/attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    ScanLine,
    Camera,
    RefreshCw,
    ShieldCheck,
    Clock,
    MapPin
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StudentAttendancePage() {
    const [loading, setLoading] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [result, setResult] = useState<{
        success?: boolean;
        message?: string;
        error?: string;
    } | null>(null);

    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        const html5QrCode = new Html5Qrcode("student-reader");
        scannerRef.current = html5QrCode;

        const config = { fps: 15, qrbox: { width: 280, height: 280 } };

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        ).catch(err => {
            console.error("Failed to start student scanner:", err);
            toast.error("Could not access camera. Please check permissions.");
        });

        return () => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                }).catch(err => console.error("Failed to stop student scanner:", err));
            }
        };
    }, []);

    const onScanSuccess = async (decodedText: string) => {
        if (loading || scanned) return;
        setLoading(true);
        setScanned(true);

        const res = await scanLectureQR(decodedText);
        setResult(res);
        setLoading(false);

        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.error);
            // Allow retry after 3 seconds
            setTimeout(() => setScanned(false), 3000);
        }
    };

    const onScanError = (errorMessage: string) => {
        // Suppress noise
    };

    return (
        <div className="p-4 md:p-8 max-w-lg mx-auto space-y-8 min-h-[90vh] flex flex-col justify-center">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center justify-center gap-3">
                    <ScanLine className="w-8 h-8 text-blue-600" /> Class Check-In
                </h1>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Physical Classroom Verification</p>
            </div>

            <Card className="border-none shadow-2xl overflow-hidden rounded-[3rem] bg-white relative">
                <CardHeader className="text-center p-8 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Scanner Active</span>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    {!result?.success ? (
                        <div className="space-y-6">
                            <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-slate-100 bg-slate-50 aspect-square">
                                <div id="student-reader" className="w-full h-full" />
                                {loading && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="text-center space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                    Scan the QR code displayed by the lecturer
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-100">
                                <ShieldCheck className="w-12 h-12 text-white" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Attendance Logged</h3>
                                <p className="text-sm font-bold text-slate-500">{result.message}</p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4 py-2 font-black uppercase tracking-widest text-[10px]">
                                Verified Attendance
                            </Badge>
                            <Button
                                onClick={() => window.location.reload()}
                                className="mt-4 rounded-xl w-full h-12 font-black uppercase tracking-widest text-[10px] bg-slate-900"
                            >
                                Done
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center text-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-[8px] font-black uppercase text-slate-400">Time Recorded</span>
                    <span className="text-xs font-bold text-slate-700">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center text-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <span className="text-[8px] font-black uppercase text-slate-400">Class Type</span>
                    <span className="text-xs font-bold text-slate-700">Physical Scan</span>
                </div>
            </div>
        </div>
    );
}
