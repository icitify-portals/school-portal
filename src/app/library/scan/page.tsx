"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkoutBook } from "@/actions/library";
import { toast } from "sonner";
import { Book, Camera, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ScanToBorrowPage() {
    const { data: session } = useSession();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear scanner", error);
                });
            }
        };
    }, []);

    async function onScanSuccess(decodedText: string) {
        if (isProcessing) return;
        
        setScanResult(decodedText);
        setIsProcessing(true);
        
        // Pause scanning while processing
        if (scannerRef.current) {
            // html5-qrcode doesn't have a simple pause, but we can prevent re-scans via state
        }

        try {
            // Note: In a real self-checkout, we use the logged-in user's ID
            // If it's a staff member scanning for a student, they'd need a student selector.
            // For now, we assume student self-checkout using their own session.
            const studentId = session?.user?.id ? parseInt(session.user.id) : null;
            
            if (!studentId) {
                setStatus("error");
                setErrorMessage("You must be logged in to borrow books.");
                return;
            }

            const result = await checkoutBook(decodedText, studentId);
            
            if (result.success) {
                setStatus("success");
                toast.success("Book borrowed successfully!");
            } else {
                setStatus("error");
                setErrorMessage(result.error || "Failed to borrow book.");
                toast.error(result.error || "Failed to borrow book.");
            }
        } catch (error) {
            setStatus("error");
            setErrorMessage("An unexpected error occurred.");
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    }

    function onScanFailure(error: any) {
        // Silently ignore scan failures (common when no barcode is in view)
    }

    const resetScanner = () => {
        setScanResult(null);
        setStatus("idle");
        setErrorMessage("");
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                        <Camera className="text-indigo-500" /> Scan to Borrow
                    </h1>
                    <p className="text-slate-400 font-medium">Point your camera at the book barcode</p>
                </div>

                <Card className="-800 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-0">
                        {status === "idle" && (
                            <div id="reader" className="w-full overflow-hidden" />
                        )}

                        {status === "success" && (
                            <div className="p-10 text-center space-y-4 animate-in zoom-in-95 duration-300">
                                <div className="flex justify-center">
                                    <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Successful!</h3>
                                <p className="text-slate-400">Barcode: <span className="text-indigo-400 font-mono">{scanResult}</span></p>
                                <Button onClick={resetScanner} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold">
                                    Scan Another
                                </Button>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="p-10 text-center space-y-4 animate-in zoom-in-95 duration-300">
                                <div className="flex justify-center">
                                    <div className="h-20 w-20 bg-red-500/20 rounded-full flex items-center justify-center">
                                        <XCircle className="h-10 w-10 text-red-500" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Oops!</h3>
                                <p className="text-slate-400">{errorMessage}</p>
                                <Button onClick={resetScanner} className="w-full bg-slate-800 hover:bg-slate-700 h-12 rounded-xl font-bold">
                                    Try Again
                                </Button>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
                                <p className="font-bold text-white tracking-widest uppercase text-xs">Processing Loan...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-3">
                     <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex gap-3 items-center">
                        <Book className="h-5 w-5 text-indigo-400" />
                        <p className="text-xs font-bold text-indigo-300">Ensure the barcode is well-lit and fits within the frame.</p>
                     </div>
                     <Button variant="ghost" onClick={() => window.history.back()} className="text-slate-500 hover:text-white">
                        Back to Library
                     </Button>
                </div>
            </div>
        </div>
    );
}
