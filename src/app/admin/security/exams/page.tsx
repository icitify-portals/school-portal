"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Shield, Lock, Eye, EyeOff, Monitor, Camera, Clock, Hash,
    Copy, Shuffle, AlertTriangle, Save, Loader2
} from "lucide-react";
import { getExamSecuritySettings, saveExamSecuritySettings } from "@/actions/exam-security";
import { toast } from "sonner";

export default function ExamSecurityPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getExamSecuritySettings().then(result => {
            if (result?.settings) setSettings(result.settings);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const result = await saveExamSecuritySettings({
            disableCopyPaste: settings.disableCopyPaste,
            fullScreenRequired: settings.fullScreenRequired,
            autoSubmitOnTabSwitch: settings.autoSubmitOnTabSwitch,
            randomizeQuestions: settings.randomizeQuestions,
            randomizeOptions: settings.randomizeOptions,
            maxAttempts: settings.maxAttempts,
            showResultsImmediately: settings.showResultsImmediately,
            ipWhitelist: settings.ipWhitelist || '',
            browserLockdown: settings.browserLockdown,
            webcamProctoring: settings.webcamProctoring,
            screenshotInterval: settings.screenshotInterval,
            maxIdleTime: settings.maxIdleTime,
        });
        if (result?.success) {
            toast.success("Exam security settings saved");
        } else {
            toast.error(result?.error || "Save failed");
        }
        setSaving(false);
    };

    const toggleSetting = (key: string) => {
        setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading || !settings) return (
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    const sections = [
        {
            title: "Browser Security",
            icon: Monitor,
            items: [
                { key: 'disableCopyPaste', label: 'Disable Copy & Paste', desc: 'Prevent students from copying exam content', icon: Copy },
                { key: 'fullScreenRequired', label: 'Full Screen Required', desc: 'Force exam to run in full-screen mode', icon: Monitor },
                { key: 'browserLockdown', label: 'Browser Lockdown', desc: 'Lock student to examination browser only', icon: Lock },
                { key: 'autoSubmitOnTabSwitch', label: 'Auto-Submit on Tab Switch', desc: 'Automatically submit exam if student switches tabs', icon: AlertTriangle },
            ],
        },
        {
            title: "Question Security",
            icon: Shuffle,
            items: [
                { key: 'randomizeQuestions', label: 'Randomize Questions', desc: 'Show questions in random order per student', icon: Shuffle },
                { key: 'randomizeOptions', label: 'Randomize Options', desc: 'Shuffle answer options for each question', icon: Hash },
                { key: 'showResultsImmediately', label: 'Show Results Immediately', desc: 'Display scores right after exam completion', icon: Eye },
            ],
        },
        {
            title: "Proctoring",
            icon: Camera,
            items: [
                { key: 'webcamProctoring', label: 'Webcam Proctoring', desc: 'Require webcam to be active during exams', icon: Camera },
            ],
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-indigo-600" />
                        Exam Security Settings
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Configure security controls for CBT examinations</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Settings
                </Button>
            </div>

            {/* Toggle Sections */}
            {sections.map(section => (
                <Card key={section.title}>
                    <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <section.icon className="w-4 h-4" />
                            {section.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 p-6">
                        {section.items.map(item => (
                            <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <item.icon className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{item.label}</p>
                                        <p className="text-xs text-slate-400">{item.desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleSetting(item.key)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${settings[item.key] ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings[item.key] ? 'left-[26px]' : 'left-0.5'}`} />
                                </button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            {/* Numeric Settings */}
            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Limits & Timers
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase">Max Attempts</label>
                            <input
                                type="number"
                                min={1}
                                value={settings.maxAttempts}
                                onChange={e => setSettings((prev: any) => ({ ...prev, maxAttempts: parseInt(e.target.value) || 1 }))}
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase">Max Idle Time (seconds)</label>
                            <input
                                type="number"
                                min={60}
                                value={settings.maxIdleTime}
                                onChange={e => setSettings((prev: any) => ({ ...prev, maxIdleTime: parseInt(e.target.value) || 300 }))}
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase">Screenshot Interval (seconds)</label>
                            <input
                                type="number"
                                min={0}
                                value={settings.screenshotInterval || ''}
                                onChange={e => setSettings((prev: any) => ({ ...prev, screenshotInterval: parseInt(e.target.value) || null }))}
                                placeholder="Disabled"
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* IP Whitelist */}
            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> IP Whitelist
                    </CardTitle>
                </CardHeader>
                <CardContent className=" p-6">
                    <p className="text-xs text-slate-400 mb-2">Comma-separated IP addresses. Leave empty to allow all.</p>
                    <textarea
                        value={settings.ipWhitelist || ''}
                        onChange={e => setSettings((prev: any) => ({ ...prev, ipWhitelist: e.target.value }))}
                        placeholder="e.g., 192.168.1.0/24, 10.0.0.1"
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 font-mono"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
