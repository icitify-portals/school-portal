"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import bwipjs from "bwip-js";
import QRCode from "qrcode";
import {
    Printer, Loader2, CheckCircle2, ArrowLeft, Settings2,
    HelpCircle, FileText, CreditCard, Scissors, Sparkles, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPrintCardsByIds, bulkUpdatePrintStatus } from "@/actions/ict-manager";
import { FrontCard, BackCard } from "@/components/id-cards/IDCardTemplate1";

type Side = "both" | "front" | "back";
type PaperMode = "pvc" | "a4";
type A4Arrangement = "pair" | "sequential";

// CR80 standard: 85.60mm x 53.98mm. Card design is 504px x 318px.
// 85.6mm at 96 DPI = 323.5275px. 323.5275 / 504 = 0.64192.
const BASE_SCALE = 323.5275 / 504;

function levelLabel(card: any) {
    if (!card.currentLevel) return "";
    return `${card.programmeType || ""} ${card.currentLevel}`.trim();
}

function CardBack({ card }: { card: any }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [qr, setQr] = useState("");
    const barcodeValue = card.matricNumber || card.issueId || "FSS-STUDENT";

    useEffect(() => {
        const payload = card.verificationCode
            ? `https://portal.fss.edu.ng/verify/id/${card.verificationCode}`
            : `FSS:ID:${card.matricNumber}:${card.studentName}`;
        QRCode.toDataURL(payload, { margin: 1, width: 140, color: { dark: "#1b5e20", light: "#ffffff" } })
            .then(setQr)
            .catch(() => {});
    }, [card]);

    useEffect(() => {
        if (!canvasRef.current) return;
        try {
            bwipjs.toCanvas(canvasRef.current, {
                bcid: "code128", text: barcodeValue, scale: 2, height: 8,
                includetext: true, textxalign: "center", textsize: 9,
                backgroundcolor: "ffffff", barcolor: "000000",
            });
        } catch (e) {
            console.error("Barcode error", e);
        }
    }, [barcodeValue]);

    return <BackCard barcodeCanvasRef={canvasRef} barcodeValue={barcodeValue} qrDataUrl={qr} />;
}

// Single scaled card wrapper that ensures exact CR80 physical dimensions
function ScaledCardBox({
    children,
    effectiveScale,
    showCutGuide = false
}: {
    children: React.ReactNode;
    effectiveScale: number;
    showCutGuide?: boolean;
}) {
    return (
        <div className={`pvc-scale-box ${showCutGuide ? "with-cut-guide" : ""}`}>
            {showCutGuide && (
                <div className="cut-corner-markers pointer-events-none">
                    <span className="cut-marker cut-tl" />
                    <span className="cut-marker cut-tr" />
                    <span className="cut-marker cut-bl" />
                    <span className="cut-marker cut-br" />
                </div>
            )}
            <div
                className="pvc-scale"
                style={{
                    transform: `scale(${effectiveScale})`,
                    transformOrigin: "center center",
                }}
            >
                {children}
            </div>
        </div>
    );
}

function PrintContent() {
    const params = useSearchParams();
    const ids = useMemo(() => (params.get("ids") || "").split(",").map(Number).filter(Boolean), [params]);
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [side, setSide] = useState<Side>("both");
    const [paperMode, setPaperMode] = useState<PaperMode>("pvc");
    const [scalePercent, setScalePercent] = useState<number>(100);
    const [a4Arrangement, setA4Arrangement] = useState<A4Arrangement>("pair");
    const [marking, setMarking] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [testSingleOnly, setTestSingleOnly] = useState(false);

    useEffect(() => {
        if (!ids.length) { setLoading(false); return; }
        getPrintCardsByIds(ids).then((res) => {
            if (res.success) setCards(res.data);
            else toast.error(res.error);
            setLoading(false);
        });
    }, [ids]);

    async function markPrinted() {
        setMarking(true);
        const res = await bulkUpdatePrintStatus(ids, "printed");
        setMarking(false);
        if (res.success) toast.success(res.message);
        else toast.error(res.error);
    }

    const deptSummary = cards.reduce((acc: Record<string, number>, c: any) => {
        const d = (c.deptName || "General").trim();
        acc[d] = (acc[d] || 0) + 1;
        return acc;
    }, {});
    const deptKeys = Object.keys(deptSummary);

    // Compute effective CSS scale
    const effectiveScale = BASE_SCALE * (scalePercent / 100);

    // Filter cards if test-single mode is enabled
    const displayedCards = testSingleOnly && cards.length > 0 ? [cards[0]] : cards;

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white text-slate-900">
            {/* Dynamic Print Stylesheet */}
            <style>{`
                /* Base Screen and Reset Styles */
                .id-pvc-card {
                    width: 504px !important;
                    height: 318px !important;
                    min-width: 504px !important;
                    min-height: 318px !important;
                    max-width: 504px !important;
                    max-height: 318px !important;
                    position: relative;
                    overflow: hidden;
                    background: #fff;
                    border-radius: 18px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    box-shadow: none !important;
                }

                /* Scaled Container: exactly 85.60mm x 53.98mm physical size */
                .pvc-scale-box {
                    width: 85.6mm;
                    height: 53.98mm;
                    min-width: 85.6mm;
                    max-width: 85.6mm;
                    min-height: 53.98mm;
                    max-height: 53.98mm;
                    overflow: hidden;
                    position: relative;
                    background: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                }

                .pvc-scale {
                    width: 504px;
                    height: 318px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                /* A4 Cut Guidelines & Corner Markers */
                .with-cut-guide {
                    outline: 1px dashed #cbd5e1;
                    border-radius: 3.18mm;
                }

                .cut-corner-markers {
                    position: absolute;
                    inset: 0;
                    z-index: 50;
                }
                .cut-marker {
                    position: absolute;
                    width: 5mm;
                    height: 5mm;
                    border-color: #94a3b8;
                    border-style: solid;
                }
                .cut-tl { top: 0; left: 0; border-width: 1px 0 0 1px; }
                .cut-tr { top: 0; right: 0; border-width: 1px 1px 0 0; }
                .cut-bl { bottom: 0; left: 0; border-width: 0 0 1px 1px; }
                .cut-br { bottom: 0; right: 0; border-width: 0 1px 1px 0; }

                /* Screen Display Cards */
                .pvc-preview-card {
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
                    border-radius: 3.18mm;
                    background: #ffffff;
                }

                /* ────────────────────────────────────────────────────────
                   PRINT MEDIA ENGINE
                   ──────────────────────────────────────────────────────── */
                @media print {
                    ${paperMode === "pvc" ? `
                        @page {
                            size: 85.6mm 53.98mm landscape;
                            margin: 0mm;
                        }
                    ` : `
                        @page {
                            size: A4 portrait;
                            margin: 10mm 8mm;
                        }
                    `}

                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    .print-root, .print-root * {
                        visibility: visible !important;
                    }

                    .print-root {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: #ffffff !important;
                    }

                    /* PVC Card Mode Print Behavior */
                    .pvc-card-page {
                        width: 85.6mm !important;
                        height: 53.98mm !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }
                    .pvc-card-page .id-pvc-card {
                        border-radius: 0 !important;
                    }

                    /* A4 Sheet Grid Print Behavior */
                    .a4-sheet-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, 85.6mm) !important;
                        column-gap: 8mm !important;
                        row-gap: 5.5mm !important;
                        justify-content: center !important;
                        align-content: start !important;
                        page-break-inside: auto !important;
                    }

                    .a4-card-item {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>

            {/* Print Header Controls Toolbar */}
            <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
                <div className="max-w-[1500px] mx-auto p-3 flex flex-wrap items-center justify-between gap-3">
                    {/* Left: Back & Badge */}
                    <div className="flex items-center gap-2.5">
                        <Button variant="ghost" size="sm" onClick={() => window.close()} className="h-8 gap-1 text-xs">
                            <ArrowLeft className="w-4 h-4" /> Close
                        </Button>
                        <div className="h-5 w-px bg-slate-200" />
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {cards.length} Card{cards.length === 1 ? "" : "s"} Ready
                        </span>
                        {deptKeys.length > 0 && (
                            <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                                {deptKeys.length === 1 ? `Batch: ${deptKeys[0]}` : `${deptKeys.length} Departments`}
                            </span>
                        )}
                    </div>

                    {/* Middle: Configuration Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Paper / Printer Mode Selector */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setPaperMode("pvc")}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                    paperMode === "pvc"
                                        ? "bg-white text-indigo-700 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                                title="Dedicated PVC Card Printer (Zebra, Evolis, Fargo)"
                            >
                                <CreditCard className="w-3.5 h-3.5" />
                                PVC Printer (CR80)
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaperMode("a4")}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                    paperMode === "a4"
                                        ? "bg-white text-indigo-700 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                                title="Standard A4 Paper / Photo Paper for Cutting & Laminating"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                A4 Sheet (Cut &amp; Laminate)
                            </button>
                        </div>

                        {/* Duplex / Side Selector */}
                        <select
                            value={side}
                            onChange={(e) => setSide(e.target.value as Side)}
                            className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="both">Front &amp; Back</option>
                            <option value="front">Front Only</option>
                            <option value="back">Back Only</option>
                        </select>

                        {/* A4 Arrangement (if A4 mode) */}
                        {paperMode === "a4" && side === "both" && (
                            <select
                                value={a4Arrangement}
                                onChange={(e) => setA4Arrangement(e.target.value as A4Arrangement)}
                                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                                title="Pair Front & Back side-by-side for folding into pouches"
                            >
                                <option value="pair">Side-by-Side (Fold &amp; Laminate)</option>
                                <option value="sequential">Sequential (All Fronts then Backs)</option>
                            </select>
                        )}

                        {/* Scale / Bleed Fine-Tuning */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                            <span className="text-[11px] font-bold text-slate-500">Scale:</span>
                            <select
                                value={scalePercent}
                                onChange={(e) => setScalePercent(Number(e.target.value))}
                                className="h-7 text-xs font-bold bg-transparent text-slate-800 border-none focus:outline-hidden cursor-pointer"
                                title="Adjust scale to remove white slivers or adapt to printer driver margins"
                            >
                                <option value={100}>100% (Exact CR80: 85.6×54mm)</option>
                                <option value={102}>102% (+1mm Bleed - Zero White Borders)</option>
                                <option value={104}>104% (+2mm Extra Bleed)</option>
                                <option value={98}>98% (-1mm Safe Inset)</option>
                            </select>
                        </div>

                        {/* Test Single Card Checkbox */}
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none px-1">
                            <input
                                type="checkbox"
                                checked={testSingleOnly}
                                onChange={(e) => setTestSingleOnly(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Test 1 card only
                        </label>
                    </div>

                    {/* Right: Print Actions & Guide Toggle */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowGuide(!showGuide)}
                            className={`h-8 gap-1.5 text-xs font-bold border-amber-300 ${
                                showGuide ? "bg-amber-100 text-amber-900" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                            }`}
                        >
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                            Print Setup Guide
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => window.print()}
                            disabled={!cards.length}
                            className="h-8 gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Print Now {testSingleOnly ? "(1 Sample)" : `(${displayedCards.length})`}
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={markPrinted}
                            disabled={marking || !cards.length}
                            className="h-8 gap-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                            {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            Mark Printed
                        </Button>
                    </div>
                </div>

                {/* Expandable Print Settings Guide Banner */}
                {showGuide && (
                    <div className="bg-amber-50 border-t border-amber-200 px-4 py-3">
                        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-amber-950">
                            <div className="flex items-start gap-2.5">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-black uppercase tracking-wider text-amber-900">
                                        Mandatory Browser Print Settings (To prevent cards printing small):
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-1.5 font-medium">
                                        <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                                            <span className="font-bold block text-slate-900">1. Paper Size</span>
                                            {paperMode === "pvc" ? "Select CR80 / Credit Card (85.6 × 54mm)" : "Select A4 (210 × 297mm)"}
                                        </div>
                                        <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                                            <span className="font-bold block text-slate-900">2. Margins</span>
                                            <strong className="text-red-700 font-black">Set to NONE</strong> (Default margins shrink cards!)
                                        </div>
                                        <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                                            <span className="font-bold block text-slate-900">3. Scale</span>
                                            <strong className="text-emerald-700 font-black">100% / Actual Size</strong> (Do not use &quot;Fit to paper&quot;)
                                        </div>
                                        <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                                            <span className="font-bold block text-slate-900">4. Background Graphics</span>
                                            <strong className="text-indigo-700 font-black">Check the Box</strong> (Ensures crest &amp; color banners print)
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowGuide(false)}
                                className="text-amber-800 hover:bg-amber-200/50 text-xs font-bold"
                            >
                                Dismiss
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-16 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <span className="text-sm font-semibold text-slate-600">Loading batch cards...</span>
                    </div>
                ) : cards.length === 0 ? (
                    <div className="text-center p-16 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto">
                        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-900 text-base">No Cards Selected</h3>
                        <p className="text-xs text-slate-500 mt-1">Please return to the print queue and select cards to print.</p>
                        <Button size="sm" onClick={() => window.close()} className="mt-4 text-xs">
                            Return to Print Queue
                        </Button>
                    </div>
                ) : paperMode === "pvc" ? (
                    /* ══════════════════════════════════════════════════════════════
                       PVC CARD PRINTER LAYOUT (CR80: 85.6mm x 53.98mm)
                       ══════════════════════════════════════════════════════════════ */
                    <div className="print-root flex flex-col items-center gap-6">
                        <div className="no-print text-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                CR80 PVC Mode &bull; Scale: {scalePercent}% &bull; {displayedCards.length} Card{displayedCards.length === 1 ? "" : "s"}
                            </span>
                        </div>

                        {displayedCards.map((c) => (
                            <div key={`pvc-${c.id}`} className="flex flex-col items-center gap-4">
                                {side !== "back" && (
                                    <div className="pvc-card-page pvc-preview-card">
                                        <ScaledCardBox effectiveScale={effectiveScale} showCutGuide={false}>
                                            <FrontCard
                                                studentName={(c.studentName || "").toUpperCase()}
                                                matricNumber={c.matricNumber || ""}
                                                department={(c.deptName || "").toUpperCase()}
                                                programmeName={`${c.programmeType || ""} ${c.deptName || ""}`}
                                                programmeType={c.programmeType || undefined}
                                                formattedLevel={levelLabel(c)}
                                                phoneNumber={c.phoneNumber || undefined}
                                                photoUrl={c.photoUrl || undefined}
                                                signatureUrl={c.signatureUrl || undefined}
                                            />
                                        </ScaledCardBox>
                                    </div>
                                )}
                                {side !== "front" && (
                                    <div className="pvc-card-page pvc-preview-card">
                                        <ScaledCardBox effectiveScale={effectiveScale} showCutGuide={false}>
                                            <CardBack card={c} />
                                        </ScaledCardBox>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* ══════════════════════════════════════════════════════════════
                       A4 SHEET MULTI-CARD GRID (CUT & LAMINATE)
                       ══════════════════════════════════════════════════════════════ */
                    <div className="print-root max-w-[210mm] mx-auto bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="no-print flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Scissors className="w-4 h-4 text-indigo-600" />
                                <span className="font-bold text-slate-800">A4 Sheet Layout (2 Columns)</span>
                                <span>&bull; Exact 1:1 physical card scale with scissor cut guides</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">
                                85.6mm &times; 53.98mm per card
                            </span>
                        </div>

                        <div className="a4-sheet-grid">
                            {paperMode === "a4" && side === "both" && a4Arrangement === "pair" ? (
                                /* Paired Side-by-Side: Front on Left, Back on Right for same student */
                                displayedCards.flatMap((c) => [
                                    <div key={`a4-front-${c.id}`} className="a4-card-item">
                                        <ScaledCardBox effectiveScale={effectiveScale} showCutGuide={true}>
                                            <FrontCard
                                                studentName={(c.studentName || "").toUpperCase()}
                                                matricNumber={c.matricNumber || ""}
                                                department={(c.deptName || "").toUpperCase()}
                                                programmeName={`${c.programmeType || ""} ${c.deptName || ""}`}
                                                programmeType={c.programmeType || undefined}
                                                formattedLevel={levelLabel(c)}
                                                phoneNumber={c.phoneNumber || undefined}
                                                photoUrl={c.photoUrl || undefined}
                                                signatureUrl={c.signatureUrl || undefined}
                                            />
                                        </ScaledCardBox>
                                    </div>,
                                    <div key={`a4-back-${c.id}`} className="a4-card-item">
                                        <ScaledCardBox effectiveScale={effectiveScale} showCutGuide={true}>
                                            <CardBack card={c} />
                                        </ScaledCardBox>
                                    </div>,
                                ])
                            ) : (
                                /* Sequential or Single-Sided */
                                <>
                                    {side !== "back" &&
                                        displayedCards.map((c) => (
                                            <div key={`a4-seq-front-${c.id}`} className="a4-card-item">
                                                <ScaledCardBox effectiveScale={effectiveScale} showCutGuide={true}>
                                                    <FrontCard
                                                        studentName={(c.studentName || "").toUpperCase()}
                                                        matricNumber={c.matricNumber || ""}
                                                        department={(c.deptName || "").toUpperCase()}
                                                        programmeName={`${c.programmeType || ""} ${c.deptName || ""}`}
                                                        programmeType={c.programmeType || undefined}
                                                        formattedLevel={levelLabel(c)}
                                                        phoneNumber={c.phoneNumber || undefined}
                                                        photoUrl={c.photoUrl || undefined}
                                                        signatureUrl={c.signatureUrl || undefined}
                                                    />
                                                </ScaledCardBox>
                                            </div>
                                        ))}
                                    {side !== "front" &&
                                        displayedCards.map((c) => (
                                            <div key={`a4-seq-back-${c.id}`} className="a4-card-item">
                                                <ScaledCardBox effectiveScale={effectiveScale} showCutGuide={true}>
                                                    <CardBack card={c} />
                                                </ScaledCardBox>
                                            </div>
                                        ))}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function PrintCardsPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500 font-semibold">Loading print engine…</div>}>
            <PrintContent />
        </Suspense>
    );
}
