"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Settings, Clock, Target,
    ShieldAlert, Save, Loader2
} from "lucide-react";
import { updateHostelSettings, clearHostelAllocations } from "@/actions/hostels";
import { toast } from "sonner";
import { AlertCircle, Trash2 } from "lucide-react";

export default function HostelSettingsForm({ hostelId, initialSettings }: {
    hostelId: number,
    initialSettings: any
}) {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState(initialSettings || {
        paymentWindowDays: 3,
        allocationStrategy: 'manual',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await updateHostelSettings(hostelId, settings);
        if (res.success) {
            toast.success("Settings updated successfully");
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    const handleClearance = async () => {
        const confirmed = confirm("CRITICAL ACTION: This will expire all current applications and reset all room occupancies for this hostel to zero. This cannot be undone. Proceed?");
        if (!confirmed) return;

        setLoading(true);
        const res = await clearHostelAllocations(hostelId);
        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="bg-indigo-50/50 border-b border-indigo-100/50 pb-4">
                        <CardTitle className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Payment Window
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-xs text-slate-500 font-medium">Specify how many days a student has to pay for their approved hostel application before it expires.</p>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                value={settings.paymentWindowDays}
                                onChange={(e) => setSettings({ ...settings, paymentWindowDays: parseInt(e.target.value) })}
                                className="w-24 h-12 rounded-xl border border-slate-200 px-4 font-black text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Standard Days</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Target className="w-4 h-4" /> Allocation Policy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-xs text-slate-500 font-medium">Choose how rooms are assigned. Manual allows selective placement, Dynamic fills available slots automatically.</p>
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, allocationStrategy: 'manual' })}
                                className={cn(
                                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    settings.allocationStrategy === 'manual' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                                )}
                            >
                                Manual
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, allocationStrategy: 'dynamic' })}
                                className={cn(
                                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    settings.allocationStrategy === 'dynamic' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                                )}
                            >
                                Dynamic
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-8 border-t border-slate-100">
                <Card className="border-2 border-dashed border-red-100 bg-red-50/30 rounded-[2.5rem] overflow-hidden">
                    <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                                <ShieldAlert className="w-8 h-8 text-red-600" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-lg font-black text-red-900 tracking-tight">Hostel Clearance Zone</h4>
                                <p className="text-red-600/60 text-xs font-bold uppercase tracking-wide max-w-md">
                                    Expiring all active allocations and resetting room occupancy to zero for the next academic session.
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            onClick={handleClearance}
                            disabled={loading}
                            variant="destructive"
                            className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl shadow-red-100 transition-all hover:scale-105 active:scale-95"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Execute Hostel Clearance
                        </Button>
                    </div>
                </Card>
            </div>

            <div className="flex justify-end p-2">
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-indigo-100 ring-4 ring-white"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Policy Settings
                </Button>
            </div>
        </form>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
