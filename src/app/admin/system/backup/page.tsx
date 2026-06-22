"use client";

import { useState, useEffect } from "react";
import { runBackup, getBackupHistory } from "@/actions/backup";
import { 
    Database, 
    Cloud, 
    Download, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    HardDrive,
    ShieldCheck,
    RefreshCw,
    ExternalLink,
    Copy,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function BackupPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setRefreshing(true);
        const data = await getBackupHistory();
        setHistory(data);
        setRefreshing(false);
    };

    const handleBackup = async () => {
        setLoading(true);
        const res = await runBackup();
        if (res.success) {
            toast.success(res.message);
            fetchHistory();
        } else {
            toast.error(res.error || "Backup failed");
        }
        setLoading(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 space-y-12">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 italic">Security Management</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">System <br /> Backup</h1>
                </div>
                <Button 
                    onClick={handleBackup}
                    disabled={loading}
                    className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-8 flex gap-3 uppercase text-xs tracking-widest shadow-2xl shadow-indigo-100 transition-all active:scale-95"
                >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                    Generate New Backup
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Google Drive Config (Mirroring the PHP Snippet) */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-900 text-white p-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <Cloud className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black italic uppercase">Cloud Storage Integration</CardTitle>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Google Drive Sync (Auto-Backups)</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-12 space-y-10">
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backup Folder ID</p>
                                    <p className="text-sm font-black text-slate-900 font-mono">1Xy2Z...BackupFolder</p>
                                </div>
                                <Button variant="ghost" className="text-indigo-600 font-black flex gap-2">
                                    View in Drive <ExternalLink className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AWS S3 Status</label>
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest">Active</span>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group">
                                        <span className="text-sm font-bold text-slate-600 italic">Bucket: {process.env.AWS_S3_BUCKET || "school-backups"}</span>
                                        <Copy 
                                            className="w-4 h-4 text-slate-300 cursor-pointer hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100" 
                                            onClick={() => copyToClipboard(process.env.AWS_S3_BUCKET || "school-backups")}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wasabi Status</label>
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest">Active</span>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group">
                                        <span className="text-sm font-bold text-slate-600 italic">Bucket: {process.env.WASABI_BUCKET || "school-backups-wasabi"}</span>
                                        <Copy 
                                            className="w-4 h-4 text-slate-300 cursor-pointer hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100" 
                                            onClick={() => copyToClipboard(process.env.WASABI_BUCKET || "school-backups-wasabi")}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-indigo-500" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regulation Range</p>
                                        <p className="text-sm font-black text-slate-900 italic">30 Days (Retention)</p>
                                    </div>
                                </div>
                                <Button variant="outline" className="rounded-xl border-slate-200 text-slate-400 hover:text-slate-900 font-black uppercase text-[10px] tracking-widest px-6">
                                    Edit Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Local History */}
                    <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white">
                        <CardHeader className="p-10 flex flex-row justify-between items-center border-b border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 rounded-2xl">
                                    <Clock className="w-6 h-6 text-indigo-600" />
                                </div>
                                <CardTitle className="text-xl font-black italic uppercase">Backup History</CardTitle>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={fetchHistory}
                                className={cn("rounded-xl transition-all", refreshing && "animate-spin")}
                            >
                                <RefreshCw className="w-5 h-5 text-slate-400" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {history.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {history.map((file, idx) => (
                                        <div key={idx} className="p-8 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-white shadow-lg rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                                    {file.type === 'database' ? <Database className="w-6 h-6" /> : <HardDrive className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 italic uppercase tracking-tight">{file.name}</h4>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> {file.date}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                                            <HardDrive className="w-3 h-3" /> {file.size}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" className="rounded-xl hover:bg-white hover:shadow-lg p-3 transition-all">
                                                <Download className="w-5 h-5 text-slate-400 hover:text-indigo-600" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <AlertCircle className="w-12 h-12 text-slate-200 mx-auto" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">No local backups found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Status & Info Sidebar */}
                <div className="space-y-8">
                    <Card className="border-none shadow-2xl rounded-[3rem] bg-indigo-600 text-white p-10 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldCheck className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <h3 className="text-2xl font-black italic uppercase leading-none">Security <br /> Insight</h3>
                            <p className="text-indigo-100 font-bold italic text-sm leading-relaxed">
                                Our backup protocol encrypts and compresses your academic data before storage. We recommend generating a manual backup before major structural updates.
                            </p>
                            <div className="space-y-4 pt-4">
                                <StatusItem label="Database Status" value="Secure" icon={<CheckCircle2 className="w-4 h-4" />} />
                                <StatusItem label="Cloud Sync" value="Idle" icon={<Clock className="w-4 h-4" />} />
                                <StatusItem label="Disk Usage" value="12.4 GB" icon={<HardDrive className="w-4 h-4" />} />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[3rem] bg-white p-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 uppercase italic">Retention Policy</h4>
                        </div>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed italic uppercase tracking-wider">
                            The system maintains a rolling 30-day window for cloud backups. Local backups are stored indefinitely until manually purged.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatusItem({ label, value, icon }: { label: string, value: string, icon: any }) {
    return (
        <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-xs font-black">{value}</span>
                {icon}
            </div>
        </div>
    );
}

function Calendar({ className }: { className?: string }) {
    return <Clock className={className} />; // Fallback for lucide missing
}
