"use client";

import { useState, useRef, useEffect } from "react";
import { logAttendance } from "@/actions/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    ScanBarcode,
    Camera,
    Keyboard,
    RefreshCw,
    ShieldCheck,
    Clock
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { cn } from "@/lib/utils";
import AttendanceAnalytics from "@/components/attendance/AttendanceAnalytics";
import { getAttendanceAnalysis } from "@/actions/attendance";
import Link from "next/link";
import { toast } from "sonner";

export default function AttendancePage() {
    const [scanMode, setScanMode] = useState<"camera" | "manual">("manual");
    const [barcode, setBarcode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        fetchAnalysisData();
    }, []);

    const fetchAnalysisData = async () => {
        const res = await getAttendanceAnalysis();
        if (res.success) setAnalysisData(res.data);
    };

    useEffect(() => {
        if (scanMode === "camera") {
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;
            
            html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess,
                onScanError
            ).catch(err => {
                console.error("Scanner start error:", err);
                toast.error("Camera access failed");
            });

            return () => {
                if (html5QrCode.isScanning) {
                    html5QrCode.stop().then(() => html5QrCode.clear()).catch(e => console.error(e));
                }
            };
        }
    }, [scanMode]);

    const onScanSuccess = (decodedText: string) => {
        handleLog(decodedText);
    };

    const onScanError = (err: string) => {
        // noise
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        handleLog(barcode);
    };

    const handleLog = async (code: string) => {
        if (!code || loading) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await logAttendance(code);
            setResult(res);
            setBarcode("");
            if (res.success) {
                toast.success(res.message);
                fetchAnalysisData();
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            setResult({ success: false, error: "System Connection Error" });
            toast.error("Failed to connect to server");
        } finally {
            setLoading(false);
            if (scanMode === "manual") {
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        }
    };

    return (
        <div className="p-8 space-y-12 max-w-[1600px] w-full mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic flex items-center justify-center md:justify-start gap-3">
                        <ScanBarcode className="w-10 h-10 text-blue-600" /> Attendance Control
                    </h1>
                    <div className="text-slate-500 font-medium">Institutional Identity Verification & Logging</div>
                </div>
                <div className="flex gap-4">
                    <Link href="/admin/attendance/kiosk" target="_blank">
                        <Button variant="outline" className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-slate-200 gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-600" /> Open Gate Kiosk
                        </Button>
                    </Link>
                </div>
            </div>

            {analysisData && <AttendanceAnalytics data={analysisData} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                        <Button
                            onClick={() => setScanMode("camera")}
                            className={cn(
                                "flex-1 gap-2 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl transition-all",
                                scanMode === "camera" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "bg-transparent text-slate-500 hover:bg-slate-200 shadow-none border-none"
                            )}
                        >
                            <Camera className="w-4 h-4" /> Camera Scanner
                        </Button>
                        <Button
                            onClick={() => setScanMode("manual")}
                            className={cn(
                                "flex-1 gap-2 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl transition-all",
                                scanMode === "manual" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "bg-transparent text-slate-500 hover:bg-slate-200 shadow-none border-none"
                            )}
                        >
                            <Keyboard className="w-4 h-4" /> Hardware / Manual
                        </Button>
                    </div>

                    <Card className="border-none shadow-2xl overflow-hidden rounded-[3rem] bg-white relative">
                        <CardHeader className="text-center p-8 bg-slate-50/50 border-b border-slate-100">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Active Monitoring</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            {scanMode === "camera" ? (
                                <div className="space-y-6">
                                    <div id="reader" className="overflow-hidden rounded-2xl border-4 border-slate-100 bg-slate-50 aspect-video" />
                                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase italic">
                                        Center your Identity Card QR/Barcode within the frame
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleManualSubmit} className="space-y-6">
                                    <div className="relative">
                                        <Input
                                            ref={inputRef}
                                            type="text"
                                            value={barcode}
                                            onChange={(e) => setBarcode(e.target.value)}
                                            placeholder="Ready for hardware scan..."
                                            className="text-center text-xl font-black h-20 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                                            autoComplete="off"
                                            disabled={loading}
                                            autoFocus
                                        />
                                        {loading && (
                                            <div className="absolute right-6 top-7">
                                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                </form>
                            )}

                            {result && (
                                <div
                                    className={cn(
                                        "mt-8 p-8 rounded-2xl flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 border-2",
                                        result.success ? "bg-blue-50/50 border-blue-100" : "bg-rose-50/50 border-rose-100"
                                    )}
                                >
                                    {result.success ? (
                                        <>
                                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-100">
                                                <ShieldCheck className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-2xl font-black text-slate-900 italic uppercase">{result.userName}</p>
                                                <div className="flex justify-center gap-2">
                                                    <Badge className="bg-slate-900 font-black uppercase text-[10px] tracking-widest h-6 px-3">{result.userRole}</Badge>
                                                    <Badge className={cn(
                                                        "font-black uppercase text-[10px] tracking-widest h-6 px-3 border-none",
                                                        result.type === "in" ? "bg-emerald-500" : "bg-orange-500"
                                                    )}>
                                                        {result.type?.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">{result.message}</div>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-16 h-16 text-rose-500" />
                                            <p className="font-black text-rose-900 uppercase italic text-center text-sm">{result.error}</p>
                                            <Button
                                                variant="outline"
                                                onClick={() => setResult(null)}
                                                className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest border-rose-200 text-rose-600 hover:bg-rose-50"
                                            >
                                                Try Again
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-xl font-black text-slate-900 uppercase italic flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-600" /> Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                {analysisData?.detailedLogs?.slice(0, 8).map((log: any) => (
                                    <div key={log.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase",
                                                log.type === 'in' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                            )}>
                                                {log.type}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{log.userName}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="bg-slate-50 text-slate-400 border-none px-3 py-1 font-black text-[10px] uppercase">
                                            Gate
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin-slow" /> Security Systems Live • V2.2.0
                </div>
            </div>
        </div>
    );
}
