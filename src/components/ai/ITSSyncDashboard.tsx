"use client";

import { useState, useEffect } from "react";
import { 
    CloudDownload, 
    CheckCircle2, 
    AlertCircle, 
    Database, 
    HardDrive,
    RefreshCw,
    Play,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { offlineManager } from "@/lib/offline-manager";

export function ITSSyncDashboard() {
    const [syncing, setSyncing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState<any>(null);
    const [lessons, setLessons] = useState<any[]>([]);

    useEffect(() => {
        refreshStats();
    }, []);

    const refreshStats = async () => {
        if (!offlineManager) return;
        const usage = await offlineManager.getStorageUsage();
        const stored = await offlineManager.getAllLessons();
        setStats(usage);
        setLessons(stored);
    };

    const handleSync = async () => {
        setSyncing(true);
        setProgress(0);
        
        // Simulated batch download of lessons
        for (let i = 1; i <= 5; i++) {
            setProgress(i * 20);
            await new Promise(r => setTimeout(r, 800)); // Simulate network latency
        }
        
        setSyncing(false);
        refreshStats();
    };

    const clearCache = async () => {
        if (!offlineManager) return;
        for (const lesson of lessons) {
            await offlineManager.deleteLesson(lesson.id);
        }
        refreshStats();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">ITS <span className="text-indigo-600">Sync Center</span></h2>
                    <p className="text-slate-500 font-medium">Manage offline readiness for your current academic session.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={clearCache} className="h-12 px-6 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 transition-all">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Local Data
                    </Button>
                    <Button onClick={handleSync} disabled={syncing} className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 gap-3">
                        {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                        {syncing ? "Syncing..." : "Initialize Batch Sync"}
                    </Button>
                </div>
            </div>

            {/* Storage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-slate-900 text-white overflow-hidden">
                    <CardContent className="p-8 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl">
                                <HardDrive className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Local Storage</p>
                                <h3 className="text-2xl font-black">{stats ? (stats.usage / 1024 / 1024).toFixed(1) : 0} MB <span className="text-sm font-medium text-white/40">used</span></h3>
                            </div>
                        </div>
                        <Progress value={stats?.percentage || 0} className="h-1.5 bg-white/10" />
                        <p className="text-[9px] font-medium text-white/40 uppercase tracking-widest text-right">Quota: {stats ? (stats.quota / 1024 / 1024 / 1024).toFixed(1) : 0} GB</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden">
                    <CardContent className="p-8 flex items-center gap-6 h-full">
                        <div className="p-4 bg-indigo-50 rounded-2xl">
                            <Database className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cached Lessons</p>
                            <h3 className="text-3xl font-black text-slate-900">{lessons.length}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden">
                    <CardContent className="p-8 flex items-center gap-6 h-full">
                        <div className="p-4 bg-emerald-50 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Readiness Status</p>
                            <h3 className="text-3xl font-black text-slate-900">{lessons.length > 0 ? "OPTIMAL" : "SYNC NEEDED"}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sync List */}
            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3 px-1">
                    <RefreshCw className="w-4 h-4" />
                    Asset Synchronization Log
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    {lessons.map((lesson) => (
                        <div key={lesson.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                    <Play className="w-5 h-5 ml-1" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 uppercase italic leading-none">{lesson.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Synced {new Date(lesson.syncedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Offline Ready</Badge>
                                <Button variant="ghost" size="icon" onClick={() => offlineManager?.deleteLesson(lesson.id).then(refreshStats)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {lessons.length === 0 && !syncing && (
                        <div className="p-12 text-center space-y-4 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <CloudDownload className="w-12 h-12 text-slate-200 mx-auto" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No curriculum assets found in local storage</p>
                        </div>
                    )}

                    {syncing && (
                        <div className="space-y-4 p-8 bg-indigo-50/50 rounded-[3rem] border border-indigo-100">
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Synchronizing Curriculum Batch...
                                </p>
                                <p className="text-xs font-black text-indigo-600">{progress}%</p>
                            </div>
                            <Progress value={progress} className="h-2 bg-indigo-100" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
