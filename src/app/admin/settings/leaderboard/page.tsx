"use client";

import { useState, useEffect } from "react";
import { getLeaderboardMetrics, updateLeaderboardMetrics } from "@/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trophy, Award, GraduationCap, Save, Loader2, RefreshCcw } from "lucide-react";

export default function LeaderboardSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [metrics, setMetrics] = useState({
        certWeight: 100,
        badgeWeight: 50,
        cgpaWeight: 100
    });

    useEffect(() => {
        getLeaderboardMetrics().then(res => {
            setMetrics(res);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const res = await updateLeaderboardMetrics(metrics);
        if (res.success) {
            toast.success("Leaderboard metrics updated successfully");
        } else {
            toast.error(res.error || "Failed to update metrics");
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Leaderboard Metrics</h1>
                    <p className="text-slate-500 font-medium">Configure how points are calculated for the gamified ranking system.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest h-12 px-8 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Certificates Weight */}
                <Card className="-[32px] overflow-hidden group hover: transition-all border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="h-2 bg-amber-400" />
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-amber-100 group-hover:scale-110 transition-transform">
                            <Award className="w-6 h-6 text-amber-600" />
                        </div>
                        <CardTitle className="text-lg font-black uppercase italic tracking-tight">Course Certificates</CardTitle>
                        <CardDescription className="text-xs font-medium">Points awarded per verified course certification.</CardDescription>
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    value={metrics.certWeight}
                                    onChange={(e) => setMetrics({ ...metrics, certWeight: parseInt(e.target.value) || 0 })}
                                    className="text-2xl font-black h-14 rounded-2xl border-slate-200 focus:ring-amber-500"
                                />
                                <span className="font-black text-slate-300 uppercase italic">PTS</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-normal">
                                    Impact: High. Each completed course significantly boosts rank.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Badges Weight */}
                <Card className="-[32px] overflow-hidden group hover: transition-all border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="h-2 bg-indigo-500" />
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-indigo-100 group-hover:scale-110 transition-transform">
                            <Trophy className="w-6 h-6 text-indigo-600" />
                        </div>
                        <CardTitle className="text-lg font-black uppercase italic tracking-tight">Skill Badges</CardTitle>
                        <CardDescription className="text-xs font-medium">Points awarded for each earned digital badge.</CardDescription>
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    value={metrics.badgeWeight}
                                    onChange={(e) => setMetrics({ ...metrics, badgeWeight: parseInt(e.target.value) || 0 })}
                                    className="text-2xl font-black h-14 rounded-2xl border-slate-200 focus:ring-indigo-500"
                                />
                                <span className="font-black text-slate-300 uppercase italic">PTS</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-normal">
                                    Impact: Medium. Encourages participation in micro-learning.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* GPA/Academic Weight */}
                <Card className="-[32px] overflow-hidden group hover: transition-all border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="h-2 bg-emerald-500" />
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-emerald-100 group-hover:scale-110 transition-transform">
                            <GraduationCap className="w-6 h-6 text-emerald-600" />
                        </div>
                        <CardTitle className="text-lg font-black uppercase italic tracking-tight">Academic CGPA</CardTitle>
                        <CardDescription className="text-xs font-medium">Weight applied to the student's cumulative GPA.</CardDescription>
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    value={metrics.cgpaWeight}
                                    onChange={(e) => setMetrics({ ...metrics, cgpaWeight: parseInt(e.target.value) || 0 })}
                                    className="text-2xl font-black h-14 rounded-2xl border-slate-200 focus:ring-emerald-500"
                                />
                                <span className="font-black text-slate-300 uppercase italic">multiplier</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-normal">
                                    Example: A 4.0 CGPA x {metrics.cgpaWeight} = {4.0 * metrics.cgpaWeight} PTS.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-200 flex items-center justify-between">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                        <RefreshCcw className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black uppercase italic text-slate-900 tracking-tight">Real-time Recalculation</h4>
                        <p className="text-sm text-slate-500 font-medium">Saving these changes will immediately update player ranks across the portal.</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Formula</p>
                    <code className="bg-slate-900 text-indigo-400 px-4 py-2 rounded-xl font-bold text-sm">
                        (Certs * {metrics.certWeight}) + (Badges * {metrics.badgeWeight}) + (CGPA * {metrics.cgpaWeight})
                    </code>
                </div>
            </div>
        </div>
    );
}
