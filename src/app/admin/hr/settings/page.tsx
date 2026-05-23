"use client";

import { useState, useEffect } from "react";
import {
    Settings,
    Mail,
    Building2,
    Save,
    Loader2,
    CheckCircle,
    Info,
    BellRing
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getHRSettings, updateHRSettings } from "@/actions/hr_settings";
import { cn } from "@/lib/utils";

export default function HRSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const data = await getHRSettings();
        setSettings(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const res = await updateHRSettings(settings);
        if (res.success) {
            setMessage({ type: 'success', text: "Institutional parameters updated successfully." });
        } else {
            setMessage({ type: 'error', text: res.error || "Failed to update settings." });
        }
        setIsSaving(false);
    };

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                        <Settings className="w-8 h-8 text-indigo-600" />
                        HR Configurations
                    </h1>
                    <p className="text-slate-500 font-medium italic">Define institutional identity and automated communication parameters</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white py-6">
                        <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-indigo-400" />
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] italic">Automated Email Identity (Resend)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                    Institutional Sender Name
                                    <Info className="w-3 h-3 text-slate-300" />
                                </label>
                                <input
                                    value={settings['institutional_name'] || ''}
                                    onChange={(e) => handleChange('institutional_name', e.target.value)}
                                    placeholder="e.g. Imperial Heritage HR"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                    Resend API Key
                                    <Info className="w-3 h-3 text-slate-300" />
                                </label>
                                <input
                                    type="password"
                                    value={settings['resend_api_key'] || ''}
                                    onChange={(e) => handleChange('resend_api_key', e.target.value)}
                                    placeholder="re_..."
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                    Verified From Email
                                    <BellRing className="w-3 h-3 text-indigo-300" />
                                </label>
                                <input
                                    value={settings['sender_email'] || ''}
                                    onChange={(e) => handleChange('sender_email', e.target.value)}
                                    placeholder="e.g. payroll@imperialheritage.com"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                                <p className="text-[10px] text-slate-400 italic">Note: This email must be verified in your Resend dashboard.</p>
                            </div>
                        </div>

                        <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                            <div className="bg-white p-3 rounded-2xl shadow-sm">
                                <Mail className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 italic">Email Delivery Status</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                                    Emails are triggered automatically during salary processing. Ensure your <span className="font-mono text-indigo-600">RESEND_API_KEY</span> is correctly set in the server environment.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm overflow-hidden border-t-4 border-emerald-500">
                    <CardHeader className="bg-white">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional Metadata</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6 pt-0">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">HR Support Contact</label>
                            <input
                                value={settings['support_contact'] || ''}
                                onChange={(e) => handleChange('support_contact', e.target.value)}
                                placeholder="e.g. +234 800 123 4567 or hr@school.com"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-4">
                    {message && (
                        <div className={cn(
                            "p-4 rounded-2xl flex items-center gap-3 text-sm font-bold italic animate-in fade-in slide-in-from-top-2",
                            message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                        )}>
                            <CheckCircle className="w-5 h-5" />
                            {message.text}
                        </div>
                    )}
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-slate-900 hover:bg-black py-8 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Authorize & Save Configuration
                    </Button>
                </div>
            </form>
        </div>
    );
}
