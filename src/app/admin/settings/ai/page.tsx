"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrainCircuit, Save, Loader2, Key, ShieldCheck, Info } from "lucide-react";
import { getAISettings, updateSystemSetting } from "@/actions/settings";
import { toast } from "sonner";

export default function AISettingsPage() {
    const [settings, setSettings] = useState({
        OPENAI_API_KEY: "",
        GEMINI_API_KEY: "",
        DEEPSEEK_API_KEY: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getAISettings();
            setSettings(data as any);
            setLoading(false);
        }
        load();
    }, []);

    const handleSave = async (keyName: string) => {
        setSaving(true);
        const res = await updateSystemSetting(
            keyName,
            settings[keyName as keyof typeof settings],
            `API Key for ${keyName.split('_')[0]}`,
            true
        );
        if (res.success) {
            toast.success(`${keyName.split('_')[0]} Key updated successfully`);
        } else {
            toast.error(`Failed to update ${keyName.split('_')[0]} Key`);
        }
        setSaving(false);
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
                    <BrainCircuit className="w-10 h-10 text-indigo-600" />
                    AI CONFIGURATION
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Manage API keys for automated cbt grading</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {/* Information Alert */}
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex gap-4 items-start">
                    <Info className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                    <div>
                        <p className="font-bold text-amber-900 text-sm italic">Academic Integrity & Automation</p>
                        <p className="text-amber-700 text-xs leading-relaxed mt-1">
                            These keys are used to power AI-assisted grading for essay questions.
                            Ensure you have sufficient credits on your provider accounts.
                            Keys are stored securely in the system database.
                        </p>
                    </div>
                </div>

                {/* OpenAI Section */}
                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white p-6 flex flex-row items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <Key className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black italic uppercase">OpenAI (GPT-4o)</CardTitle>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">sk-...</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Secret Key</label>
                            <div className="flex gap-3">
                                <Input
                                    type="password"
                                    placeholder="Enter your OpenAI API key"
                                    value={settings.OPENAI_API_KEY}
                                    onChange={(e) => setSettings({ ...settings, OPENAI_API_KEY: e.target.value })}
                                    className="rounded-2xl border-slate-200 py-6 font-mono"
                                />
                                <Button
                                    onClick={() => handleSave('OPENAI_API_KEY')}
                                    disabled={saving}
                                    className="px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black h-[52px]"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Gemini Section */}
                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white p-6 flex flex-row items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <Key className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black italic uppercase">Google Gemini</CardTitle>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Gemini 1.5/2.0 Flash</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Secret Key</label>
                            <div className="flex gap-3">
                                <Input
                                    type="password"
                                    placeholder="Enter your Gemini API key"
                                    value={settings.GEMINI_API_KEY}
                                    onChange={(e) => setSettings({ ...settings, GEMINI_API_KEY: e.target.value })}
                                    className="rounded-2xl border-slate-200 py-6 font-mono"
                                />
                                <Button
                                    onClick={() => handleSave('GEMINI_API_KEY')}
                                    disabled={saving}
                                    className="px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black h-[52px]"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* DeepSeek Section */}
                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white p-6 flex flex-row items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <Key className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black italic uppercase">DeepSeek V3</CardTitle>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Powerful Open Weights AI</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Secret Key</label>
                            <div className="flex gap-3">
                                <Input
                                    type="password"
                                    placeholder="Enter your DeepSeek API key"
                                    value={settings.DEEPSEEK_API_KEY}
                                    onChange={(e) => setSettings({ ...settings, DEEPSEEK_API_KEY: e.target.value })}
                                    className="rounded-2xl border-slate-200 py-6 font-mono"
                                />
                                <Button
                                    onClick={() => handleSave('DEEPSEEK_API_KEY')}
                                    disabled={saving}
                                    className="px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black h-[52px]"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Badge */}
                <div className="flex justify-center items-center gap-2 text-slate-400 pb-10">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Keys are encrypted at rest and never exposed to the client-side beyond this secure portal</span>
                </div>
            </div>
        </div>
    );
}
