"use client";

import React, { useState, useEffect, useRef } from "react";
import bwipjs from "bwip-js";
import QRCode from "qrcode";
import { Printer, RotateCcw, ShieldCheck, CheckCircle2, ArrowRightLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface IDCardTemplate1Props {
    studentName?: string;
    matricNumber?: string;
    department?: string;
    programmeName?: string;
    currentLevel?: number | string;
    phoneNumber?: string;
    bloodGroup?: string;
    genotype?: string;
    photoUrl?: string;
    signatureUrl?: string;
    barcode?: string;
    verificationCode?: string;
    institutionName?: string;
    campusAddress?: string;
    showWatermark?: boolean;
    initialSide?: "front" | "back" | "both";
    showControls?: boolean;
    onPrint?: () => void;
}

const DEFAULTS = {
    institutionName: "FEDERAL SCHOOL OF STATISTICS, IBADAN",
    campusAddress: "P.M.B. 5065, DUGUP, IBADAN, OYO STATE",
    postalAddress: "OFFICIAL STUDENT IDENTIFICATION CREDENTIAL",
    phone: "0803 000 0000",
    bloodGroup: "O+",
    genotype: "AA",
    rectorSignatureText: "M. A. Oladipo",
};

export default function IDCardTemplate1({
    studentName = "OJUGBELE IGBABOSOWON ENIOLA",
    matricNumber = "DPP/HND/BAM/FSS/IB/2025/3841",
    department = "BUSINESS ADMINISTRATION",
    programmeName = "HND Business Administration",
    currentLevel = "HND 2",
    phoneNumber,
    bloodGroup,
    genotype,
    photoUrl,
    signatureUrl,
    barcode,
    verificationCode,
    institutionName = DEFAULTS.institutionName,
    campusAddress = DEFAULTS.campusAddress,
    showWatermark = false,
    initialSide = "front",
    showControls = true,
    onPrint,
}: IDCardTemplate1Props) {
    const [activeTab, setActiveTab] = useState<"front" | "back" | "both">(initialSide);
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const barcodeCanvasFrontRef = useRef<HTMLCanvasElement>(null);
    const barcodeCanvasBackRef = useRef<HTMLCanvasElement>(null);

    const barcodeValue = barcode || matricNumber || "FSS-STUDENT";
    const formattedLevel = typeof currentLevel === "number" ? `Level ${currentLevel}` : currentLevel;

    // Generate real-time verification QR Code
    useEffect(() => {
        const verifyPayload = verificationCode 
            ? `https://portal.fss.edu.ng/verify/id/${verificationCode}`
            : `FSS:ID:${matricNumber}:${studentName}`;

        QRCode.toDataURL(verifyPayload, {
            margin: 1,
            width: 140,
            color: { dark: "#1b5e20", light: "#ffffff" },
        })
            .then(setQrDataUrl)
            .catch((err) => console.error("QR Code error:", err));
    }, [verificationCode, matricNumber, studentName]);

    // Render Barcode via bwip-js Code 128
    const renderBarcode = (canvas: HTMLCanvasElement | null) => {
        if (!canvas || !barcodeValue) return;
        try {
            bwipjs.toCanvas(canvas, {
                bcid: "code128",
                text: barcodeValue,
                scale: 2,
                height: 8,
                includetext: true,
                textxalign: "center",
                textsize: 9,
                backgroundcolor: "ffffff",
                barcolor: "000000",
            });
        } catch (e) {
            console.error("Barcode render error:", e);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            renderBarcode(barcodeCanvasBackRef.current);
            renderBarcode(barcodeCanvasFrontRef.current);
        }, 80);
        return () => clearTimeout(timer);
    }, [barcodeValue, activeTab]);

    const handlePrint = () => {
        if (onPrint) {
            onPrint();
        } else {
            window.print();
        }
    };

    return (
        <div className="id-card-template-root flex flex-col items-center select-none">
            {/* Embedded styles for exact CR80 PVC Card specs and Print Engine */}
            <style jsx global>{`
                /* CR80 Standard ISO 7810 Card: 85.6mm x 53.98mm (Aspect ratio: ~1.586) */
                .id-pvc-card {
                    width: 504px;
                    height: 318px;
                    border-radius: 18px;
                    box-shadow: 0 16px 36px -8px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.08);
                    position: relative;
                    overflow: hidden;
                    background: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    transform-origin: center center;
                    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
                }

                .id-pvc-card:hover {
                    box-shadow: 0 20px 42px -6px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.12);
                }

                /* 3D Flip Card Container */
                .id-flip-perspective {
                    perspective: 1400px;
                }

                .id-flip-inner {
                    position: relative;
                    width: 504px;
                    height: 318px;
                    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-style: preserve-3d;
                }

                .id-flip-inner.is-flipped {
                    transform: rotateY(180deg);
                }

                .id-flip-face {
                    position: absolute;
                    inset: 0;
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                    border-radius: 18px;
                    overflow: hidden;
                }

                .id-flip-face.face-back {
                    transform: rotateY(180deg);
                }

                /* Print Engine overrides for thermal/dye-sub PVC Card Printers */
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .id-card-template-root,
                    .id-card-template-root * {
                        visibility: visible !important;
                    }
                    .id-card-template-root {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                    }
                    .no-print-controls {
                        display: none !important;
                    }
                    .id-pvc-card {
                        width: 85.6mm !important;
                        height: 53.98mm !important;
                        border-radius: 3.18mm !important;
                        box-shadow: none !important;
                        border: 0.2mm solid #d1d5db !important;
                        page-break-inside: avoid !important;
                        margin: 4mm auto !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-break-after {
                        page-break-after: always !important;
                    }
                }
            `}</style>

            {/* Interactive Control Tabs Bar */}
            {showControls && (
                <div className="no-print-controls flex flex-wrap items-center justify-between gap-3 w-full max-w-[540px] mb-5 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200">
                    {/* View Switcher Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setActiveTab("front")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                activeTab === "front"
                                    ? "bg-white text-indigo-700 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Front Side
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("back")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                activeTab === "back"
                                    ? "bg-white text-indigo-700 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Back Side
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("both")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                activeTab === "both"
                                    ? "bg-white text-indigo-700 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Both Sides
                        </button>
                    </div>

                    {/* Quick Flip & Print Buttons */}
                    <div className="flex items-center gap-2">
                        {activeTab !== "both" && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActiveTab(activeTab === "front" ? "back" : "front")}
                                className="h-8 text-xs font-bold text-slate-700 border-slate-200 gap-1.5 hover:bg-slate-50"
                                title="Flip Card 180°"
                            >
                                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                                Flip
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={handlePrint}
                            className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Print Card
                        </Button>
                    </div>
                </div>
            )}

            {/* CARD CONTAINER */}
            {activeTab === "both" ? (
                /* Side-by-side mode for batch inspection & double-sided printing */
                <div className="flex flex-wrap items-center justify-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <span className="no-print-controls text-[11px] font-black uppercase tracking-widest text-slate-400">
                            Front Side (CR80 PVC)
                        </span>
                        <FrontCard
                            studentName={studentName}
                            matricNumber={matricNumber}
                            department={department}
                            programmeName={programmeName}
                            formattedLevel={formattedLevel}
                            phoneNumber={phoneNumber}
                            bloodGroup={bloodGroup}
                            genotype={genotype}
                            photoUrl={photoUrl}
                            signatureUrl={signatureUrl}
                            institutionName={institutionName}
                            campusAddress={campusAddress}
                            showWatermark={showWatermark}
                        />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="no-print-controls text-[11px] font-black uppercase tracking-widest text-slate-400">
                            Back Side (Security Barcode)
                        </span>
                        <BackCard
                            barcodeCanvasRef={barcodeCanvasBackRef}
                            barcodeValue={barcodeValue}
                            qrDataUrl={qrDataUrl}
                            showWatermark={showWatermark}
                        />
                    </div>
                </div>
            ) : (
                /* Interactive 3D Flip Card View */
                <div className="id-flip-perspective p-2">
                    <div className={`id-flip-inner ${activeTab === "back" ? "is-flipped" : ""}`}>
                        {/* FRONT FACE */}
                        <div className="id-flip-face face-front">
                            <FrontCard
                                studentName={studentName}
                                matricNumber={matricNumber}
                                department={department}
                                programmeName={programmeName}
                                formattedLevel={formattedLevel}
                                phoneNumber={phoneNumber}
                                bloodGroup={bloodGroup}
                                genotype={genotype}
                                photoUrl={photoUrl}
                                signatureUrl={signatureUrl}
                                institutionName={institutionName}
                                campusAddress={campusAddress}
                                showWatermark={showWatermark}
                            />
                        </div>

                        {/* BACK FACE */}
                        <div className="id-flip-face face-back">
                            <BackCard
                                barcodeCanvasRef={barcodeCanvasBackRef}
                                barcodeValue={barcodeValue}
                                qrDataUrl={qrDataUrl}
                                showWatermark={showWatermark}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Scanner Notice Banner */}
            <div className="no-print-controls mt-4 max-w-[504px] w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-semibold">Code-128 Attendance Barcode Active</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-mono">
                    Scannable via USB/Laser Scanner
                </span>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// FRONT CARD COMPONENT
// ──────────────────────────────────────────────────────────────
function FrontCard({
    studentName,
    matricNumber,
    department,
    programmeName,
    formattedLevel,
    phoneNumber,
    bloodGroup,
    genotype,
    photoUrl,
    signatureUrl,
    institutionName,
    campusAddress,
    showWatermark,
}: {
    studentName: string;
    matricNumber: string;
    department: string;
    programmeName?: string;
    formattedLevel?: string;
    phoneNumber?: string;
    bloodGroup?: string;
    genotype?: string;
    photoUrl?: string;
    signatureUrl?: string;
    institutionName: string;
    campusAddress: string;
    showWatermark?: boolean;
}) {
    return (
        <section className="id-pvc-card relative flex flex-col justify-between">
            {/* Top Green Gradient Banner */}
            <div className="h-[105px] bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 px-4 py-2.5 flex items-center gap-3 text-white relative shadow-sm">
                {/* School Crest / Logo */}
                <div className="w-[66px] h-[66px] rounded-full bg-white p-1 border-2 border-emerald-300 shadow flex items-center justify-center shrink-0">
                    <img
                        src="/fss_logo.png"
                        alt="Logo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            // Fallback crest circle
                            e.currentTarget.style.display = "none";
                        }}
                    />
                    <span className="text-emerald-900 font-black text-xl tracking-tighter hidden only:inline">
                        FSS
                    </span>
                </div>

                {/* Institution Header Text */}
                <div className="flex-1 text-center pr-2">
                    <h2 className="text-[15px] font-black uppercase tracking-tight leading-tight text-white drop-shadow-sm">
                        {institutionName}
                    </h2>
                    <p className="text-[9.5px] font-medium text-emerald-100 uppercase tracking-wider mt-0.5 leading-snug">
                        {campusAddress}
                    </p>
                    <div className="mt-1 inline-block bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/30 text-[8.5px] font-black uppercase tracking-widest text-amber-200">
                        STUDENT IDENTITY CARD
                    </div>
                </div>
            </div>

            {/* Card Middle: Photo + Student Information */}
            <div className="flex-1 px-4 py-2.5 flex items-center gap-4 relative">
                {/* Background Watermark Seal */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.04] pointer-events-none">
                    <img src="/fss_logo.png" alt="" className="w-full h-full object-contain grayscale" />
                </div>

                {/* Photo Frame (105px x 122px) */}
                <div className="w-[102px] h-[122px] rounded-xl border-2 border-emerald-800 bg-slate-100 overflow-hidden shadow-md flex items-center justify-center shrink-0 relative">
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt={studentName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 mb-1">
                                {studentName.charAt(0)}
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-wider">No Photo</span>
                        </div>
                    )}
                </div>

                {/* Details Table */}
                <div className="flex-1 space-y-1 text-slate-800">
                    <div className="grid grid-cols-[85px_10px_1fr] text-[11px] leading-tight items-baseline">
                        <span className="font-bold text-emerald-950 uppercase">Name</span>
                        <span className="font-bold text-emerald-950">:</span>
                        <span className="font-black text-slate-950 uppercase truncate" title={studentName}>
                            {studentName}
                        </span>
                    </div>

                    <div className="grid grid-cols-[85px_10px_1fr] text-[11px] leading-tight items-baseline">
                        <span className="font-bold text-emerald-950 uppercase">Matric No.</span>
                        <span className="font-bold text-emerald-950">:</span>
                        <span className="font-mono font-black text-emerald-900 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 inline-block text-[10.5px]">
                            {matricNumber}
                        </span>
                    </div>

                    <div className="grid grid-cols-[85px_10px_1fr] text-[10.5px] leading-tight items-baseline">
                        <span className="font-bold text-emerald-950 uppercase">Department</span>
                        <span className="font-bold text-emerald-950">:</span>
                        <span className="font-semibold text-slate-800 truncate" title={department}>
                            {department}
                        </span>
                    </div>

                    <div className="grid grid-cols-[85px_10px_1fr] text-[10.5px] leading-tight items-baseline">
                        <span className="font-bold text-emerald-950 uppercase">Level</span>
                        <span className="font-bold text-emerald-950">:</span>
                        <span className="font-bold text-slate-800">
                            {formattedLevel}
                        </span>
                    </div>

                    <div className="grid grid-cols-[85px_10px_1fr] text-[10px] leading-tight items-baseline">
                        <span className="font-bold text-emerald-950 uppercase">Blood / Gen</span>
                        <span className="font-bold text-emerald-950">:</span>
                        <span className="font-bold text-red-700">
                            {bloodGroup || DEFAULTS.bloodGroup} &bull; {genotype || DEFAULTS.genotype}
                        </span>
                    </div>

                    <div className="grid grid-cols-[85px_10px_1fr] text-[10px] leading-tight items-baseline">
                        <span className="font-bold text-emerald-950 uppercase">Telephone</span>
                        <span className="font-bold text-emerald-950">:</span>
                        <span className="font-medium text-slate-600">
                            {phoneNumber || DEFAULTS.phone}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Bar: Anti-Cultism Motto + Student Signature */}
            <div className="h-[44px] bg-gradient-to-r from-emerald-800 to-green-700 px-4 flex items-center justify-between text-white text-[9px] relative">
                <span className="font-bold tracking-tight text-emerald-100 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-300" />
                    Say No To Cultism, Exam Malpractice &amp; Drugs
                </span>

                {/* Student Signature */}
                <div className="flex flex-col items-center">
                    <div className="w-[90px] h-[22px] flex items-center justify-center bg-white/10 rounded px-1">
                        {signatureUrl ? (
                            <img
                                src={signatureUrl}
                                alt="Signature"
                                className="max-w-full max-h-full object-contain filter invert brightness-200"
                            />
                        ) : (
                            <div className="w-full border-t border-white/60 mt-2" />
                        )}
                    </div>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-emerald-200">
                        Holder&apos;s Signature
                    </span>
                </div>
            </div>

            {showWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 rotate-[-25deg]">
                    <span className="text-4xl font-black text-red-600 border-4 border-red-600 px-6 py-2 rounded-2xl uppercase tracking-widest">
                        SAMPLE PROOF
                    </span>
                </div>
            )}
        </section>
    );
}

// ──────────────────────────────────────────────────────────────
// BACK CARD COMPONENT (WITH ATTENDANCE CLOCK-IN/OUT BARCODE)
// ──────────────────────────────────────────────────────────────
function BackCard({
    barcodeCanvasRef,
    barcodeValue,
    qrDataUrl,
    showWatermark,
}: {
    barcodeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    barcodeValue: string;
    qrDataUrl: string;
    showWatermark?: boolean;
}) {
    return (
        <section className="id-pvc-card relative flex flex-col justify-between p-3.5 bg-gradient-to-b from-white via-emerald-50/20 to-slate-50 border border-slate-200">
            {/* Top Terms / Legal Statement */}
            <div className="space-y-1.5 text-center px-2">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-emerald-950 border-b border-emerald-200 pb-1">
                    FEDERAL SCHOOL OF STATISTICS &bull; CONDITIONS OF USE
                </h3>
                <p className="text-[8.5px] text-slate-600 leading-tight">
                    This card certifies that the bearer whose photograph and specimen signature appear overleaf is an authorized student of this institution.
                </p>
                <p className="text-[8px] text-slate-500 leading-tight">
                    This card remains institutional property. If lost and found, please surrender to the Registrar&apos;s Office or nearest Police Station.
                </p>
            </div>

            {/* Middle Section: Rector Signature + Verification QR */}
            <div className="flex items-center justify-around px-4 py-1 border-y border-dashed border-slate-200">
                {/* Authority Signatory */}
                <div className="flex flex-col items-center">
                    <div className="font-serif italic text-base text-slate-800 font-bold tracking-tight">
                        {DEFAULTS.rectorSignatureText}
                    </div>
                    <div className="w-24 border-t border-slate-700 mt-0.5" />
                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-900 mt-0.5">
                        REGISTRAR / RECTOR
                    </span>
                </div>

                {/* Instant Verification QR */}
                <div className="flex flex-col items-center">
                    <div className="w-[58px] h-[58px] bg-white p-1 rounded-lg border border-slate-200 shadow-xs flex items-center justify-center">
                        {qrDataUrl ? (
                            <img src={qrDataUrl} alt="Verify QR" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[7px] text-slate-400">
                                QR
                            </div>
                        )}
                    </div>
                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-500 mt-0.5">
                        SCAN TO VERIFY
                    </span>
                </div>
            </div>

            {/* Bottom Section: Scannable Attendance Code-128 Barcode */}
            <div className="flex flex-col items-center justify-center bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-center overflow-hidden">
                    <canvas
                        ref={barcodeCanvasRef}
                        className="max-h-[38px] max-w-[380px] object-contain"
                    />
                </div>
                <div className="flex items-center justify-between w-full px-2 mt-1">
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-emerald-900">
                        ATTENDANCE &amp; SECURITY CLOCK-IN / OUT BARCODE
                    </span>
                    <span className="text-[7.5px] font-mono text-slate-400">
                        CODE-128 STANDARD
                    </span>
                </div>
            </div>

            {showWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 rotate-[-25deg]">
                    <span className="text-4xl font-black text-red-600 border-4 border-red-600 px-6 py-2 rounded-2xl uppercase tracking-widest">
                        SAMPLE PROOF
                    </span>
                </div>
            )}
        </section>
    );
}
