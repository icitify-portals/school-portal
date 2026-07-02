"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Settings,
    Save,
    RotateCw,
    Clock,
    ShieldCheck,
    AlertTriangle,
    Timer,
    Calendar,
    Loader2
} from "lucide-react";
import { getAttendanceSettings, updateAttendanceSettings } from "@/actions/settings";
import { toast } from "sonner";

export default function AttendanceSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        safeThreshold: 75,
        warningThreshold: 60,
        eligibilityThreshold: 75,
        qrRotationInterval: 30,
        excuseWindowDays: 7,
        lateThresholdMinutes: 15,
    });

    useEffect(() => {
        getAttendanceSettings().then((s) => {
            setSettings(s);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const res = await updateAttendanceSettings(settings);
        if (res.success) {
            toast.success("Attendance settings saved successfully.");
        } else {
            toast.error(res.error || "Failed to save settings.");
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    const settingCards = [
        {
            title: "Safe Threshold",
            description: "Attendance % at or above this is considered safe (green).",
            icon: ShieldCheck,
            color: "emerald",
            key: "safeThreshold" as const,
            suffix: "%",
            min: 50,
            max: 100,
        },
        {
            title: "Warning Threshold",
            description: "Between this and safe threshold shows a warning (amber). Below this = at risk (red).",
            icon: AlertTriangle,
            color: "amber",
            key: "warningThreshold" as const,
            suffix: "%",
            min: 20,
            max: 100,
        },
        {
            title: "Exam Eligibility Threshold",
            description: "Minimum attendance % required for a student to be eligible to sit exams.",
            icon: ShieldCheck,
            color: "blue",
            key: "eligibilityThreshold" as const,
            suffix: "%",
            min: 30,
            max: 100,
        },
        {
            title: "QR Rotation Interval",
            description: "How often the QR code rotates during a live session (in seconds).",
            icon: RotateCw,
            color: "indigo",
            key: "qrRotationInterval" as const,
            suffix: "sec",
            min: 10,
            max: 120,
        },
        {
            title: "Excuse Submission Window",
            description: "Number of days after a session that a student can submit an excuse.",
            icon: Calendar,
            color: "purple",
            key: "excuseWindowDays" as const,
            suffix: "days",
            min: 1,
            max: 30,
        },
        {
            title: "Late Arrival Threshold",
            description: "Minutes after the session start time before marking a student as 'late'.",
            icon: Timer,
            color: "rose",
            key: "lateThresholdMinutes" as const,
            suffix: "min",
            min: 5,
            max: 60,
        },
    ];

    const colorMap: Record<string, string> = {
        emerald: "bg-emerald-50 border-emerald-200 text-emerald-600",
        amber: "bg-amber-50 border-amber-200 text-amber-600",
        blue: "bg-blue-50 border-blue-200 text-blue-600",
        indigo: "bg-indigo-50 border-indigo-200 text-indigo-600",
        purple: "bg-purple-50 border-purple-200 text-purple-600",
        rose: "bg-rose-50 border-rose-200 text-rose-600",
    };

    return (
        <div className="p-6 md:p-10 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 rounded-2xl">
                            <Settings className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                Attendance Settings
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">
                                Configure thresholds, timers, and policies for the attendance module.
                            </p>
                        </div>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-indigo-100"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settingCards.map((card) => {
                    const IconComp = card.icon;
                    const colors = colorMap[card.color] || colorMap.blue;
                    return (
                        <Card key={card.key} className="border-none shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-2xl border ${colors}`}>
                                        <IconComp className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">{card.title}</h3>
                                            <p className="text-[11px] text-slate-500 font-medium">{card.description}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="number"
                                                min={card.min}
                                                max={card.max}
                                                value={settings[card.key]}
                                                onChange={(e) => setSettings((prev) => ({
                                                    ...prev,
                                                    [card.key]: parseInt(e.target.value) || card.min,
                                                }))}
                                                className="w-24 h-10 rounded-xl font-bold text-center border-slate-200"
                                            />
                                            <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-xs">
                                                {card.suffix}
                                            </Badge>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                ({card.min}–{card.max})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Preview section */}
            <Card className="-to-br from-slate-900 to-slate-800 text-white overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-8">
                    <h3 className="font-black text-sm uppercase tracking-widest mb-6 opacity-50">Live Preview — Risk Levels</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black">{settings.safeThreshold}%+</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mt-1">Safe</div>
                        </div>
                        <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black">{settings.warningThreshold}–{settings.safeThreshold - 1}%</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mt-1">Warning</div>
                        </div>
                        <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black">&lt;{settings.warningThreshold}%</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-red-400 mt-1">At Risk</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
