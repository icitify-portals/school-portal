"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Zap, Calculator, RefreshCw, Layers } from "lucide-react";
import { triggerCacheWarm, triggerRankingBatch } from "@/actions/academic-jobs";
import { TaskProgress } from "@/components/academic/TaskProgress";
import { toast } from "sonner";

export default function AcademicEnginePage() {
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [isTriggering, setIsTriggering] = useState(false);

    const handleCacheWarm = async () => {
        setIsTriggering(true);
        const res = await triggerCacheWarm(1, 1); // Mock IDs for now
        if (res.error) {
            toast.error(res.error);
        } else if (res.taskId) {
            setActiveTaskId(res.taskId);
            toast.success("Cache warming job started!");
        }
        setIsTriggering(false);
    };

    const handleRankingBatch = async () => {
        setIsTriggering(true);
        const res = await triggerRankingBatch(100, 1, 1); // Mock JSS1 level
        if (res.error) {
            toast.error(res.error);
        } else if (res.taskId) {
            setActiveTaskId(res.taskId);
            toast.success("Ranking calculation started!");
        }
        setIsTriggering(false);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                    Academic <span className="text-indigo-600">Engine</span> Control Center
                </h1>
                <p className="text-slate-500 font-medium mt-2">Manage high-performance background analytics and caching</p>
            </header>

            {activeTaskId && (
                <div className="mb-10">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Active System Operation</h3>
                    <TaskProgress taskId={activeTaskId} onComplete={() => toast.success("System update complete!")} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-2xl bg-white overflow-hidden group">
                    <CardHeader className="bg-slate-900 text-white pb-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Academic Cache</CardTitle>
                        </div>
                        <CardDescription className="text-slate-400 font-medium italic">Warms up Redis with term data for instant report card generation.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Database className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">Active Store: Redis v7.0</span>
                                </div>
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded border border-emerald-100 uppercase tracking-widest">Connected</span>
                            </div>
                            
                            <Button 
                                onClick={handleCacheWarm} 
                                disabled={isTriggering || !!activeTaskId}
                                className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 text-white font-black uppercase tracking-widest text-sm transition-all hover:-translate-y-1 active:scale-95"
                            >
                                <RefreshCw className={`w-5 h-5 mr-3 ${isTriggering ? 'animate-spin' : ''}`} />
                                Force Cache Warm-up
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl bg-white overflow-hidden group">
                    <CardHeader className="bg-indigo-600 text-white pb-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform text-indigo-600">
                                <Calculator className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Ranking Processor</CardTitle>
                        </div>
                        <CardDescription className="text-indigo-100 font-medium italic">Recalculates cohort positions and GPAs for the selected term.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Layers className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">Context: End-of-Term</span>
                                </div>
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded border border-indigo-100 uppercase tracking-widest">Standby</span>
                            </div>

                            <Button 
                                onClick={handleRankingBatch} 
                                disabled={isTriggering || !!activeTaskId}
                                className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-black shadow-xl shadow-slate-200 text-white font-black uppercase tracking-widest text-sm transition-all hover:-translate-y-1 active:scale-95"
                            >
                                <Calculator className="w-5 h-5 mr-3" />
                                Recompute Batch Ranks
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <footer className="mt-16 p-8 bg-slate-900 rounded-[2rem] text-white">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                        <Zap className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest">Automation Engine Logs</h4>
                </div>
                <div className="font-mono text-[10px] text-slate-400 space-y-2 opacity-50">
                    <p>[SYSTEM] Academic engine initialized with optimized Redis drivers.</p>
                    <p>[SCHEDULER] Periodic cache warming set for 02:00 AM daily.</p>
                    <p>[SCHEDULER] Periodic ranking computation set for 03:00 AM daily.</p>
                </div>
            </footer>
        </div>
    );
}
