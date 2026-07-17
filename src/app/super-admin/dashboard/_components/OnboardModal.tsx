"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { onboardUnit } from "@/actions/super_admin";

export default function OnboardModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
    const [data, setData] = useState({
        name: "",
        code: "",
        slug: "",
        type: "school" as any,
        academicTier: "k12" as any
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await onboardUnit(data);
        setSubmitting(false);
        if (res.success) {
            setData({ name: "", code: "", slug: "", type: "school", academicTier: "k12" });
            onSuccess();
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg border-none shadow-2xl rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-300">
                <CardHeader className="bg-slate-900 text-white p-8">
                    <CardTitle className="text-2xl font-black italic uppercase">Onboard New Unit</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Unit Name</label>
                            <Input
                                placeholder="MIMS Secondary School, Oshodi"
                                className="rounded-2xl border-slate-200 py-6 font-bold"
                                value={data.name}
                                onChange={(e) => setData({...data, name: e.target.value})}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Code</label>
                                <Input
                                    placeholder="MIMS-OSH"
                                    className="rounded-2xl border-slate-200 py-6 font-bold uppercase"
                                    value={data.code}
                                    onChange={(e) => setData({...data, code: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Slug (URL)</label>
                                <Input
                                    placeholder="oshodi"
                                    className="rounded-2xl border-slate-200 py-6 font-bold lowercase"
                                    value={data.slug}
                                    onChange={(e) => setData({...data, slug: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Type</label>
                                <select
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-black text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={data.type}
                                    onChange={(e) => setData({...data, type: e.target.value})}
                                >
                                    <option value="school">Secondary School</option>
                                    <option value="campus">Primary School</option>
                                    <option value="college">College / Polytechnic</option>
                                    <option value="unit">University</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Academic Tier</label>
                                <select
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-black text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={data.academicTier}
                                    onChange={(e) => setData({...data, academicTier: e.target.value})}
                                >
                                    <option value="k12">K-12 (Primary/Secondary)</option>
                                    <option value="tertiary">Tertiary (Poly/Uni)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose}
                                className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Onboard Unit"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
