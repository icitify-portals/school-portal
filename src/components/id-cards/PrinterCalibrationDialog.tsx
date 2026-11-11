"use client";

import React, { useState } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Sliders, Printer, RotateCcw, Check, Save, Sparkles, HelpCircle, AlertTriangle, Crosshair
} from "lucide-react";
import { toast } from "sonner";
import { savePrinterProfile, resetDefaultPrinterProfiles, setDefaultPrinterProfile } from "@/actions/id-card-printer";
import Canon2CardTray, { DEFAULT_CANON_TRAY_PROFILE, TrayProfile } from "@/components/id-cards/Canon2CardTray";

interface PrinterCalibrationDialogProps {
    profiles: any[];
    activeProfileId: number;
    onProfileChange?: (profile: any) => void;
    onRefreshProfiles?: () => void;
}

export default function PrinterCalibrationDialog({
    profiles = [],
    activeProfileId,
    onProfileChange,
    onRefreshProfiles,
}: PrinterCalibrationDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState<number>(activeProfileId || (profiles[0]?.id || 1));
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);

    const currentProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0] || {};

    const [formState, setFormState] = useState<TrayProfile>({
        trayWidthMm: Number(currentProfile.trayWidthMm || 130),
        trayHeightMm: Number(currentProfile.trayHeightMm || 253),
        slot1XOffsetMm: Number(currentProfile.slot1XOffsetMm || 22.2),
        slot1YOffsetMm: Number(currentProfile.slot1YOffsetMm || 32.0),
        slot2XOffsetMm: Number(currentProfile.slot2XOffsetMm || 22.2),
        slot2YOffsetMm: Number(currentProfile.slot2YOffsetMm || 100.0),
        cardWidthMm: Number(currentProfile.cardWidthMm || 85.6),
        cardHeightMm: Number(currentProfile.cardHeightMm || 53.98),
        scalePercent: Number(currentProfile.scalePercent || 100),
        bleedMm: Number(currentProfile.bleedMm || 0.5),
        orientation: currentProfile.orientation || "portrait",
    });

    const handleSelectProfile = (pId: number) => {
        setSelectedProfileId(pId);
        const p = profiles.find((item) => item.id === pId);
        if (p) {
            setFormState({
                trayWidthMm: Number(p.trayWidthMm || 130),
                trayHeightMm: Number(p.trayHeightMm || 253),
                slot1XOffsetMm: Number(p.slot1XOffsetMm || 22.2),
                slot1YOffsetMm: Number(p.slot1YOffsetMm || 32.0),
                slot2XOffsetMm: Number(p.slot2XOffsetMm || 22.2),
                slot2YOffsetMm: Number(p.slot2YOffsetMm || 100.0),
                cardWidthMm: Number(p.cardWidthMm || 85.6),
                cardHeightMm: Number(p.cardHeightMm || 53.98),
                scalePercent: Number(p.scalePercent || 100),
                bleedMm: Number(p.bleedMm || 0.5),
                orientation: p.orientation || "portrait",
            });
            if (onProfileChange) onProfileChange(p);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await savePrinterProfile({
                id: currentProfile.id,
                name: currentProfile.name,
                printerModel: currentProfile.printerModel,
                carrierType: currentProfile.carrierType,
                ...formState,
            });
            if (res.success) {
                toast.success(res.message);
                if (onRefreshProfiles) onRefreshProfiles();
            } else {
                toast.error(res.error);
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("Are you sure you want to reset all profiles to factory defaults?")) return;
        setResetting(true);
        try {
            const res = await resetDefaultPrinterProfiles();
            if (res.success) {
                toast.success(res.message);
                setFormState(DEFAULT_CANON_TRAY_PROFILE);
                if (onRefreshProfiles) onRefreshProfiles();
            } else {
                toast.error(res.error);
            }
        } finally {
            setResetting(false);
        }
    };

    const handlePrintTestPattern = () => {
        // Open a window with test pattern
        const testWindow = window.open("", "_blank");
        if (!testWindow) return toast.error("Pop-up blocked. Please allow pop-ups for this site.");

        testWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Canon Calibration Test Pattern (130mm x 253mm)</title>
                <style>
                    @page {
                        size: ${formState.trayWidthMm}mm ${formState.trayHeightMm}mm portrait;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: #ffffff;
                        font-family: monospace;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .tray-box {
                        width: ${formState.trayWidthMm}mm;
                        height: ${formState.trayHeightMm}mm;
                        position: relative;
                        box-sizing: border-box;
                        border: 0.5mm solid #000000;
                    }
                    .slot {
                        position: absolute;
                        width: ${formState.cardWidthMm}mm;
                        height: ${formState.cardHeightMm}mm;
                        border: 0.5mm solid #000000;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    .slot-1 {
                        left: ${formState.slot1XOffsetMm}mm;
                        top: ${formState.slot1YOffsetMm}mm;
                    }
                    .slot-2 {
                        left: ${formState.slot2XOffsetMm}mm;
                        top: ${formState.slot2YOffsetMm}mm;
                    }
                    .crosshair {
                        position: absolute;
                        width: 10mm;
                        height: 10mm;
                        border-top: 0.2mm solid #000;
                        border-left: 0.2mm solid #000;
                    }
                    .ruler-x {
                        position: absolute;
                        top: 2mm;
                        left: 5mm;
                        right: 5mm;
                        height: 4mm;
                        border-bottom: 0.2mm solid #000;
                    }
                </style>
            </head>
            <body>
                <div class="tray-box">
                    <div style="padding: 3mm; font-size: 8pt; font-weight: bold;">
                        CANON TS704a / TS705a TRAY CALIBRATION TEST PATTERN<br/>
                        Tray: ${formState.trayWidthMm}mm x ${formState.trayHeightMm}mm | Scale: ${formState.scalePercent}%
                    </div>
                    <div class="slot slot-1">
                        <strong>SLOT 1 (LEAD)</strong>
                        <span>85.6mm x 54.0mm</span>
                        <span>X: ${formState.slot1XOffsetMm}mm | Y: ${formState.slot1YOffsetMm}mm</span>
                    </div>
                    <div class="slot slot-2">
                        <strong>SLOT 2 (TRAIL)</strong>
                        <span>85.6mm x 54.0mm</span>
                        <span>X: ${formState.slot2XOffsetMm}mm | Y: ${formState.slot2YOffsetMm}mm</span>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        testWindow.document.close();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Printer Calibration
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                        <Crosshair className="w-5 h-5 text-indigo-600" />
                        Canon PIXMA TS704a / TS705a Carrier Calibration Studio
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Calibrate physical card positioning, tray offsets, and bleed for the 2-Card Inksystem MP Tray.
                    </DialogDescription>
                </DialogHeader>

                {/* Profile Selector Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-600 mr-1">Active Profile:</span>
                    {profiles.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProfile(p.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                p.id === selectedProfileId
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                        >
                            <Printer className="w-3.5 h-3.5" />
                            {p.name}
                            {p.isDefault && <Badge variant="secondary" className="ml-1 text-[9px] py-0 px-1">Default</Badge>}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-3">
                    {/* Left: Offset Controls (7 cols) */}
                    <div className="md:col-span-7 space-y-4">
                        {/* Slot 1 Offsets */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase text-indigo-950 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                                    Slot 1 (Lead / Top Card)
                                </h4>
                                <span className="text-[10px] font-mono text-slate-500">85.6mm &times; 54.0mm</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <Label className="text-[11px] font-bold text-slate-600">Horizontal Offset X (mm)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formState.slot1XOffsetMm}
                                        onChange={(e) => setFormState({ ...formState, slot1XOffsetMm: parseFloat(e.target.value) || 0 })}
                                        className="h-8 text-xs font-mono font-bold mt-1"
                                    />
                                    <span className="text-[10px] text-slate-400">Default: 22.2 mm</span>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold text-slate-600">Vertical Offset Y (mm)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formState.slot1YOffsetMm}
                                        onChange={(e) => setFormState({ ...formState, slot1YOffsetMm: parseFloat(e.target.value) || 0 })}
                                        className="h-8 text-xs font-mono font-bold mt-1"
                                    />
                                    <span className="text-[10px] text-slate-400">Default: 32.0 mm</span>
                                </div>
                            </div>
                        </div>

                        {/* Slot 2 Offsets */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase text-indigo-950 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                                    Slot 2 (Trail / Bottom Card)
                                </h4>
                                <span className="text-[10px] font-mono text-slate-500">85.6mm &times; 54.0mm</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <Label className="text-[11px] font-bold text-slate-600">Horizontal Offset X (mm)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formState.slot2XOffsetMm}
                                        onChange={(e) => setFormState({ ...formState, slot2XOffsetMm: parseFloat(e.target.value) || 0 })}
                                        className="h-8 text-xs font-mono font-bold mt-1"
                                    />
                                    <span className="text-[10px] text-slate-400">Default: 22.2 mm</span>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold text-slate-600">Vertical Offset Y (mm)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formState.slot2YOffsetMm}
                                        onChange={(e) => setFormState({ ...formState, slot2YOffsetMm: parseFloat(e.target.value) || 0 })}
                                        className="h-8 text-xs font-mono font-bold mt-1"
                                    />
                                    <span className="text-[10px] text-slate-400">Default: 100.0 mm</span>
                                </div>
                            </div>
                        </div>

                        {/* Scale & Bleed Controls */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <h4 className="text-xs font-black uppercase text-slate-800">Print Scaling &amp; Bleed</h4>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <Label className="text-[11px] font-bold text-slate-600">Overall Scale (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="95"
                                        max="105"
                                        value={formState.scalePercent}
                                        onChange={(e) => setFormState({ ...formState, scalePercent: parseFloat(e.target.value) || 100 })}
                                        className="h-8 text-xs font-mono font-bold mt-1"
                                    />
                                    <span className="text-[10px] text-slate-400">100.0% = Exact CR80</span>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold text-slate-600">Edge Bleed (mm)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="3"
                                        value={formState.bleedMm}
                                        onChange={(e) => setFormState({ ...formState, bleedMm: parseFloat(e.target.value) || 0 })}
                                        className="h-8 text-xs font-mono font-bold mt-1"
                                    />
                                    <span className="text-[10px] text-slate-400">0.5 mm eliminates white borders</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                disabled={resetting}
                                className="h-8 text-xs gap-1 text-slate-600"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset Factory Defaults
                            </Button>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrintTestPattern}
                                    className="h-8 text-xs font-bold gap-1 text-indigo-700 border-indigo-200"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    Print Test Pattern
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-8 text-xs font-bold gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {saving ? "Saving..." : "Save Calibration"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Live Visual Tray Simulation (5 cols) */}
                    <div className="md:col-span-5 flex flex-col items-center justify-start bg-slate-100 p-4 rounded-2xl border border-slate-200/80">
                        <span className="text-[11px] font-black uppercase text-slate-500 mb-2 tracking-wider">
                            Live Tray Geometry Simulation
                        </span>
                        <div className="scale-[0.8] origin-top">
                            <Canon2CardTray
                                trayNumber={1}
                                side="front"
                                profile={formState}
                                isTestPattern={true}
                                showScreenGuides={false}
                            />
                        </div>
                        <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 text-center mt-3 max-w-[280px]">
                            💡 <strong>Tip</strong>: Print the Test Pattern on plain paper cut to 130&times;253mm or taped to the tray. Measure physical offsets with a ruler, then adjust here.
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
