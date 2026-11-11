"use client";

import React from "react";
import { FrontCard, BackCard } from "@/components/id-cards/IDCardTemplate1";
import { AlertCircle, ArrowDown, Scissors, ShieldAlert } from "lucide-react";

export interface TrayProfile {
    trayWidthMm: number;
    trayHeightMm: number;
    slot1XOffsetMm: number;
    slot1YOffsetMm: number;
    slot2XOffsetMm: number;
    slot2YOffsetMm: number;
    cardWidthMm: number;
    cardHeightMm: number;
    scalePercent: number;
    bleedMm: number;
    orientation: "portrait" | "landscape";
}

export const DEFAULT_CANON_TRAY_PROFILE: TrayProfile = {
    trayWidthMm: 130.00,
    trayHeightMm: 253.00,
    slot1XOffsetMm: 22.20,
    slot1YOffsetMm: 32.00,
    slot2XOffsetMm: 22.20,
    slot2YOffsetMm: 100.00,
    cardWidthMm: 85.60,
    cardHeightMm: 53.98,
    scalePercent: 100.00,
    bleedMm: 0.50,
    orientation: "portrait",
};

export interface Canon2CardTrayProps {
    trayNumber: number;
    slot1Card?: any;
    slot2Card?: any;
    side: "front" | "back";
    profile?: TrayProfile;
    isTestPattern?: boolean;
    showScreenGuides?: boolean;
}

export default function Canon2CardTray({
    trayNumber,
    slot1Card,
    slot2Card,
    side = "front",
    profile = DEFAULT_CANON_TRAY_PROFILE,
    isTestPattern = false,
    showScreenGuides = true,
}: Canon2CardTrayProps) {
    const scaleFactor = (323.5275 / 504) * (profile.scalePercent / 100);

    return (
        <div
            className="canon-tray-sheet relative bg-white shadow-lg print:shadow-none overflow-hidden mx-auto transition-transform"
            style={{
                width: `${profile.trayWidthMm}mm`,
                height: `${profile.trayHeightMm}mm`,
                minWidth: `${profile.trayWidthMm}mm`,
                minHeight: `${profile.trayHeightMm}mm`,
                border: "1px solid #cbd5e1",
            }}
        >
            {/* Screen Tray Header Indicator */}
            {showScreenGuides && (
                <div className="no-print absolute top-2 left-0 right-0 flex items-center justify-between px-3 text-[10px] font-bold text-slate-400 select-none">
                    <span className="flex items-center gap-1 font-mono">
                        <ArrowDown className="w-3 h-3 text-indigo-500 animate-bounce" />
                        FEED ARROW (Top) &bull; Tray #{trayNumber}
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                        {side.toUpperCase()} PASS
                    </span>
                </div>
            )}

            {/* Test Pattern Overlays if Calibration Mode */}
            {isTestPattern && (
                <div className="absolute inset-0 pointer-events-none z-30">
                    {/* Millimeter Grid and Center Lines */}
                    <div className="w-full h-full border-2 border-dashed border-rose-300 relative">
                        <div className="absolute left-1/2 top-0 bottom-0 border-r border-rose-400" />
                        <div className="absolute top-[32mm] left-0 right-0 border-b border-rose-300" />
                        <div className="absolute top-[100mm] left-0 right-0 border-b border-rose-300" />

                        {/* Top Margin Ruler */}
                        <div className="absolute top-1 left-2 text-[9px] font-mono text-rose-700 font-bold">
                            CALIBRATION TEST PATTERN &bull; 130mm &times; 253mm
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                SLOT 1 (Top / Lead Card Slot)
                ══════════════════════════════════════════════════════════ */}
            <div
                className="canon-card-slot slot-1 absolute overflow-hidden"
                style={{
                    left: `${profile.slot1XOffsetMm}mm`,
                    top: `${profile.slot1YOffsetMm}mm`,
                    width: `${profile.cardWidthMm + profile.bleedMm * 2}mm`,
                    height: `${profile.cardHeightMm + profile.bleedMm * 2}mm`,
                    boxSizing: "border-box",
                }}
            >
                {slot1Card ? (
                    <div
                        className="pvc-scale flex items-center justify-center origin-center"
                        style={{
                            width: "504px",
                            height: "318px",
                            transform: `scale(${scaleFactor})`,
                            transformOrigin: "center center",
                        }}
                    >
                        {side === "front" ? (
                            <FrontCard
                                studentName={(slot1Card.studentName || "").toUpperCase()}
                                matricNumber={slot1Card.matricNumber || ""}
                                department={(slot1Card.deptName || "").toUpperCase()}
                                programmeName={`${slot1Card.programmeType || ""} ${slot1Card.deptName || ""}`}
                                programmeType={slot1Card.programmeType || undefined}
                                formattedLevel={slot1Card.currentLevel ? `${slot1Card.programmeType || ""} ${slot1Card.currentLevel}` : undefined}
                                phoneNumber={slot1Card.phone || slot1Card.phoneNumber || undefined}
                                photoUrl={slot1Card.photoUrl || undefined}
                                signatureUrl={slot1Card.signatureUrl || undefined}
                            />
                        ) : (
                            <BackCard
                                barcodeCanvasRef={{ current: null }}
                                barcodeValue={slot1Card.matricNumber || slot1Card.issueId || "FSS-STUDENT"}
                                qrDataUrl=""
                            />
                        )}
                    </div>
                ) : (
                    /* Blank Card Placeholder */
                    <div className="w-full h-full border-2 border-dashed border-amber-300 rounded-[3mm] flex flex-col items-center justify-center p-2 text-center bg-amber-50/60 text-amber-800">
                        <ShieldAlert className="w-4 h-4 text-amber-600 mb-1" />
                        <span className="text-[9px] font-black uppercase">Blank Card Placeholder</span>
                        <span className="text-[7.5px] text-amber-700 leading-tight">Insert blank card to balance feed</span>
                    </div>
                )}

                {/* Calibration Corner Brackets for Slot 1 */}
                {isTestPattern && (
                    <div className="absolute inset-0 pointer-events-none border border-rose-500">
                        <span className="absolute top-0.5 left-1 text-[8px] font-bold text-rose-700 font-mono">
                            SLOT 1 (85.6&times;54mm)
                        </span>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-t border-l border-rose-600" />
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════
                SLOT 2 (Bottom / Trail Card Slot)
                ══════════════════════════════════════════════════════════ */}
            <div
                className="canon-card-slot slot-2 absolute overflow-hidden"
                style={{
                    left: `${profile.slot2XOffsetMm}mm`,
                    top: `${profile.slot2YOffsetMm}mm`,
                    width: `${profile.cardWidthMm + profile.bleedMm * 2}mm`,
                    height: `${profile.cardHeightMm + profile.bleedMm * 2}mm`,
                    boxSizing: "border-box",
                }}
            >
                {slot2Card ? (
                    <div
                        className="pvc-scale flex items-center justify-center origin-center"
                        style={{
                            width: "504px",
                            height: "318px",
                            transform: `scale(${scaleFactor})`,
                            transformOrigin: "center center",
                        }}
                    >
                        {side === "front" ? (
                            <FrontCard
                                studentName={(slot2Card.studentName || "").toUpperCase()}
                                matricNumber={slot2Card.matricNumber || ""}
                                department={(slot2Card.deptName || "").toUpperCase()}
                                programmeName={`${slot2Card.programmeType || ""} ${slot2Card.deptName || ""}`}
                                programmeType={slot2Card.programmeType || undefined}
                                formattedLevel={slot2Card.currentLevel ? `${slot2Card.programmeType || ""} ${slot2Card.currentLevel}` : undefined}
                                phoneNumber={slot2Card.phone || slot2Card.phoneNumber || undefined}
                                photoUrl={slot2Card.photoUrl || undefined}
                                signatureUrl={slot2Card.signatureUrl || undefined}
                            />
                        ) : (
                            <BackCard
                                barcodeCanvasRef={{ current: null }}
                                barcodeValue={slot2Card.matricNumber || slot2Card.issueId || "FSS-STUDENT"}
                                qrDataUrl=""
                            />
                        )}
                    </div>
                ) : (
                    /* Blank Card Placeholder for Odd-Count Trays */
                    <div className="w-full h-full border-2 border-dashed border-amber-300 rounded-[3mm] flex flex-col items-center justify-center p-2 text-center bg-amber-50/60 text-amber-800">
                        <ShieldAlert className="w-4 h-4 text-amber-600 mb-1" />
                        <span className="text-[9px] font-black uppercase">Blank Card Placeholder</span>
                        <span className="text-[7.5px] text-amber-700 leading-tight">
                            &quot;Always Use 2 Cards&quot; &bull; Keep blank card in Slot 2
                        </span>
                    </div>
                )}

                {/* Calibration Corner Brackets for Slot 2 */}
                {isTestPattern && (
                    <div className="absolute inset-0 pointer-events-none border border-rose-500">
                        <span className="absolute top-0.5 left-1 text-[8px] font-bold text-rose-700 font-mono">
                            SLOT 2 (85.6&times;54mm)
                        </span>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-t border-l border-rose-600" />
                    </div>
                )}
            </div>

            {/* Tray Bottom Notice */}
            {showScreenGuides && (
                <div className="no-print absolute bottom-2 left-0 right-0 text-center text-[8px] font-bold text-slate-400 select-none">
                    Inksystem MP Tray &bull; Canon PIXMA TS704a / TS705a Multi-Purpose Tray Slot
                </div>
            )}
        </div>
    );
}
