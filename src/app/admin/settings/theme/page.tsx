"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Palette, Sun, Moon, Type, Layout, Sidebar as SidebarIcon,
    Save, Loader2, RotateCcw, Eye
} from "lucide-react";
import { getBrandingSettings, updateBrandingSettings } from "@/actions/settings";
import { toast } from "sonner";

const FONT_OPTIONS = [
    { value: 'Inter', label: 'Inter (Default)' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Outfit', label: 'Outfit' },
    { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
    { value: 'DM Sans', label: 'DM Sans' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Nunito', label: 'Nunito' },
];

const PRESET_THEMES = [
    { name: 'Indigo', primary: '#4f46e5', secondary: '#0f172a', accent: '#6366f1' },
    { name: 'Emerald', primary: '#059669', secondary: '#064e3b', accent: '#34d399' },
    { name: 'Rose', primary: '#e11d48', secondary: '#1c1917', accent: '#fb7185' },
    { name: 'Amber', primary: '#d97706', secondary: '#1c1917', accent: '#fbbf24' },
    { name: 'Cyan', primary: '#0891b2', secondary: '#0c4a6e', accent: '#22d3ee' },
    { name: 'Purple', primary: '#7c3aed', secondary: '#1e1b4b', accent: '#a78bfa' },
];

export default function ThemeSettingsPage() {
    const [settings, setSettings] = useState({
        COLOR_PRIMARY: '#4f46e5',
        COLOR_SECONDARY: '#0f172a',
        COLOR_ACCENT: '#6366f1',
        FONT_FAMILY: 'Inter',
        SIDEBAR_STYLE: 'dark',
        LAYOUT_DENSITY: 'comfortable',
        DARK_MODE_DEFAULT: 'false',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getBrandingSettings().then(data => {
            setSettings(prev => ({
                ...prev,
                COLOR_PRIMARY: data.COLOR_PRIMARY || '#4f46e5',
                COLOR_SECONDARY: data.COLOR_SECONDARY || '#0f172a',
                COLOR_ACCENT: data.COLOR_ACCENT || '#6366f1',
                FONT_FAMILY: data.FONT_FAMILY || 'Inter',
                SIDEBAR_STYLE: data.SIDEBAR_STYLE || 'dark',
                LAYOUT_DENSITY: data.LAYOUT_DENSITY || 'comfortable',
                DARK_MODE_DEFAULT: data.DARK_MODE_DEFAULT || 'false',
            }));
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        // format expected by updateBrandingSettings: Record<string, string>
        const data = Object.fromEntries(
            Object.entries(settings).filter(([_, v]) => v !== undefined)
        );
        const result = await updateBrandingSettings(data as any);
        if (result?.success) {
            toast.success("Theme settings saved. Refresh to see changes.");
        } else {
            toast.error(result?.error || "Save failed");
        }
        setSaving(false);
    };

    const applyPreset = (preset: typeof PRESET_THEMES[0]) => {
        setSettings(prev => ({
            ...prev,
            COLOR_PRIMARY: preset.primary,
            COLOR_SECONDARY: preset.secondary,
            COLOR_ACCENT: preset.accent,
        }));
    };

    const updateSetting = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return (
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <Palette className="w-6 h-6 text-indigo-600" />
                        Theme Customization
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Customize the look and feel of your portal</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Theme
                </Button>
            </div>

            {/* Live Preview */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Live Preview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl overflow-hidden border border-slate-200" style={{ fontFamily: settings.FONT_FAMILY }}>
                        {/* Mock sidebar + content */}
                        <div className="flex h-32">
                            <div className="w-48 p-3" style={{
                                backgroundColor: settings.SIDEBAR_STYLE === 'dark' ? settings.COLOR_SECONDARY : settings.SIDEBAR_STYLE === 'light' ? '#f8fafc' : 'transparent',
                                color: settings.SIDEBAR_STYLE === 'dark' ? 'white' : '#334155',
                            }}>
                                <div className="text-xs font-bold opacity-70 mb-2">Navigation</div>
                                <div className="space-y-1">
                                    <div className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: settings.COLOR_PRIMARY, color: 'white' }}>Dashboard</div>
                                    <div className="text-[10px] px-2 py-1 rounded opacity-60">Courses</div>
                                    <div className="text-[10px] px-2 py-1 rounded opacity-60">Students</div>
                                </div>
                            </div>
                            <div className="flex-1 bg-white p-3">
                                <div className="text-sm font-bold mb-2" style={{ color: settings.COLOR_SECONDARY }}>Dashboard</div>
                                <div className="flex gap-2">
                                    <div className="rounded-lg px-3 py-2 text-white text-[10px] font-bold" style={{ backgroundColor: settings.COLOR_PRIMARY }}>Primary Button</div>
                                    <div className="rounded-lg px-3 py-2 text-white text-[10px] font-bold" style={{ backgroundColor: settings.COLOR_ACCENT }}>Accent</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preset Themes */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Preset Themes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {PRESET_THEMES.map(preset => (
                            <button key={preset.name} onClick={() => applyPreset(preset)}
                                className="p-2 rounded-xl border-2 border-slate-100 hover:border-slate-300 transition-all text-center">
                                <div className="flex gap-1 justify-center mb-1">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600">{preset.name}</span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Colors */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Palette className="w-4 h-4" /> Colors
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { key: 'COLOR_PRIMARY', label: 'Primary', desc: 'Buttons, links, active states' },
                            { key: 'COLOR_SECONDARY', label: 'Secondary', desc: 'Sidebar, headings, dark areas' },
                            { key: 'COLOR_ACCENT', label: 'Accent', desc: 'Highlights, badges, decorative' },
                        ].map(c => (
                            <div key={c.key} className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 uppercase">{c.label}</label>
                                <p className="text-[10px] text-slate-400">{c.desc}</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={(settings as any)[c.key]}
                                        onChange={e => updateSetting(c.key, e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={(settings as any)[c.key]}
                                        onChange={e => updateSetting(c.key, e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono text-slate-700"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Typography & Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Type className="w-4 h-4" /> Typography
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Font Family</label>
                        <select
                            value={settings.FONT_FAMILY}
                            onChange={e => updateSetting('FONT_FAMILY', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700"
                        >
                            {FONT_OPTIONS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                        <p className="mt-3 text-sm p-3 bg-slate-50 rounded-lg" style={{ fontFamily: settings.FONT_FAMILY }}>
                            The quick brown fox jumps over the lazy dog. <strong>Bold text here.</strong>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Layout className="w-4 h-4" /> Layout
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Sidebar Style</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['dark', 'light', 'transparent'].map(s => (
                                    <button key={s} onClick={() => updateSetting('SIDEBAR_STYLE', s)}
                                        className={`px-3 py-2 rounded-lg border-2 text-xs font-bold capitalize transition-all ${settings.SIDEBAR_STYLE === s ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Density</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['compact', 'comfortable', 'spacious'].map(d => (
                                    <button key={d} onClick={() => updateSetting('LAYOUT_DENSITY', d)}
                                        className={`px-3 py-2 rounded-lg border-2 text-xs font-bold capitalize transition-all ${settings.LAYOUT_DENSITY === d ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
