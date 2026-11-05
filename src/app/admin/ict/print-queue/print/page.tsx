"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import bwipjs from "bwip-js";
import QRCode from "qrcode";
import { Printer, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPrintCardsByIds, bulkUpdatePrintStatus } from "@/actions/ict-manager";
import { FrontCard, BackCard } from "@/components/id-cards/IDCardTemplate1";

type Side = "both" | "front" | "back";

// CR80 = 85.6mm x 53.98mm; the card component is designed at 504x318px.
const SCALE = 323.52 / 504;

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

function Sheet({ children }: { children: React.ReactNode }) {
    return (
        <div className="pvc-page">
            <div className="pvc-scale">{children}</div>
        </div>
    );
}

function PrintContent() {
    const params = useSearchParams();
    const ids = (params.get("ids") || "").split(",").map(Number).filter(Boolean);
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [side, setSide] = useState<Side>("both");
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        if (!ids.length) { setLoading(false); return; }
        getPrintCardsByIds(ids).then((res) => {
            if (res.success) setCards(res.data);
            else toast.error(res.error);
            setLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    async function markPrinted() {
        setMarking(true);
        const res = await bulkUpdatePrintStatus(ids, "printed");
        setMarking(false);
        if (res.success) toast.success(res.message);
        else toast.error(res.error);
    }

    return (
        <div className="min-h-screen bg-slate-100">
            <style>{`
                .id-pvc-card { width:504px; height:318px; position:relative; overflow:hidden; background:#fff;
                    border-radius:18px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
                .pvc-page { width:85.6mm; height:53.98mm; overflow:hidden; background:#fff; margin:0 auto 16px; box-shadow:0 2px 10px rgba(0,0,0,.2); }
                .pvc-scale { width:504px; height:318px; transform:scale(${SCALE}); transform-origin:top left; }
                @media print {
                    @page { size: 85.6mm 53.98mm; margin: 0; }
                    html, body { margin:0 !important; padding:0 !important; background:#fff !important; }
                    .no-print { display:none !important; }
                    body * { visibility:hidden !important; }
                    .pvc-wrap, .pvc-wrap * { visibility:visible !important; }
                    .pvc-wrap { position:absolute; left:0; top:0; padding:0 !important; }
                    .pvc-page { margin:0 !important; box-shadow:none !important; page-break-after:always; break-after:page;
                        -webkit-print-color-adjust:exact; print-color-adjust:exact; }
                    .id-pvc-card { border-radius:0 !important; box-shadow:none !important; }
                }
            `}</style>

            <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 p-3 flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => window.close()} className="gap-1">
                    <ArrowLeft className="w-4 h-4" /> Close
                </Button>
                <span className="text-sm font-bold text-slate-700">{cards.length} card(s) ready (CR80 PVC)</span>
                <select
                    value={side}
                    onChange={(e) => setSide(e.target.value as Side)}
                    className="h-9 rounded-lg border border-slate-300 px-2 text-sm"
                >
                    <option value="both">Front + Back (duplex printer)</option>
                    <option value="front">Front side only</option>
                    <option value="back">Back side only</option>
                </select>
                <Button size="sm" onClick={() => window.print()} disabled={!cards.length} className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Printer className="w-4 h-4" /> Print
                </Button>
                <Button size="sm" variant="outline" onClick={markPrinted} disabled={marking || !cards.length} className="gap-1">
                    {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Mark as Printed
                </Button>
                <span className="text-xs text-slate-500">
                    In the print dialog: select the PVC printer, paper size CR80 / 85.6×54 mm, margins None, scale 100%, enable background graphics.
                </span>
            </div>

            <div className="pvc-wrap p-6">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                ) : cards.length === 0 ? (
                    <p className="text-center text-slate-500 p-12">No cards selected.</p>
                ) : (
                    cards.map((c) => (
                        <div key={c.id}>
                            {side !== "back" && (
                                <Sheet>
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
                                </Sheet>
                            )}
                            {side !== "front" && (
                                <Sheet>
                                    <CardBack card={c} />
                                </Sheet>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function PrintCardsPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center">Loading…</div>}>
            <PrintContent />
        </Suspense>
    );
}
