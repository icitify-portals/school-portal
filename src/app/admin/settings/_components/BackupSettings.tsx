"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Database, Cloud, CheckCircle, XCircle, RefreshCw, HardDrive } from "lucide-react";
import { getPortalSettings, updateSystemSetting } from "@/actions/settings";
import { runBackup, getBackupHistory } from "@/actions/backup";
import { toast } from "sonner";

export default function BackupSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [backingUp, setBackingUp] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    
    // Config States
    const [s3Config, setS3Config] = useState({
        region: "",
        accessKey: "",
        secretKey: "",
        bucket: ""
    });
    
    const [wasabiConfig, setWasabiConfig] = useState({
        region: "",
        accessKey: "",
        secretKey: "",
        bucket: ""
    });

    useEffect(() => {
        const fetchConfig = async () => {
            const settings = await getPortalSettings();
            const find = (key: string) => settings.find(s => s.key === key)?.value || "";
            
            setS3Config({
                region: find("aws_s3_region"),
                accessKey: find("aws_s3_access_key"),
                secretKey: "", // Don't show
                bucket: find("aws_s3_bucket")
            });
            
            setWasabiConfig({
                region: find("wasabi_region"),
                accessKey: find("wasabi_access_key"),
                secretKey: "", // Don't show
                bucket: find("wasabi_bucket")
            });
            
            const hist = await getBackupHistory();
            setHistory(hist);
            setLoading(false);
        };
        fetchConfig();
    }, []);

    const handleSaveS3 = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateSystemSetting("aws_s3_region", s3Config.region, "backup"),
                updateSystemSetting("aws_s3_access_key", s3Config.accessKey, "backup"),
                s3Config.secretKey ? updateSystemSetting("aws_s3_secret_key", s3Config.secretKey, "backup", true) : Promise.resolve(),
                updateSystemSetting("aws_s3_bucket", s3Config.bucket, "backup")
            ]);
            toast.success("S3 configuration saved");
        } catch (e) {
            toast.error("Failed to save S3 config");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveWasabi = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateSystemSetting("wasabi_region", wasabiConfig.region, "backup"),
                updateSystemSetting("wasabi_access_key", wasabiConfig.accessKey, "backup"),
                wasabiConfig.secretKey ? updateSystemSetting("wasabi_secret_key", wasabiConfig.secretKey, "backup", true) : Promise.resolve(),
                updateSystemSetting("wasabi_bucket", wasabiConfig.bucket, "backup")
            ]);
            toast.success("Wasabi configuration saved");
        } catch (e) {
            toast.error("Failed to save Wasabi config");
        } finally {
            setSaving(false);
        }
    };

    const handleRunBackup = async () => {
        setBackingUp(true);
        toast.info("Backup started... this may take a few minutes.");
        try {
            const result = await runBackup();
            if (result.success) {
                toast.success("Backup completed successfully!");
                const hist = await getBackupHistory();
                setHistory(hist);
            } else {
                toast.error("Backup failed: " + result.error);
            }
        } catch (e) {
            toast.error("Backup failed");
        } finally {
            setBackingUp(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-600" />
                        System Backup
                    </h2>
                    <p className="text-sm text-slate-500">Configure cloud storage for automated database and file backups.</p>
                </div>
                <Button 
                    onClick={handleRunBackup} 
                    disabled={backingUp}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                >
                    {backingUp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Backing up...</> : <><RefreshCw className="w-4 h-4 mr-2" /> Run Backup Now</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AWS S3 */}
                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Cloud className="w-4 h-4 text-orange-500" />
                            Amazon S3
                        </CardTitle>
                        <CardDescription>Primary cloud backup storage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="space-y-1">
                            <Label>Region</Label>
                            <Input value={s3Config.region} onChange={e => setS3Config({...s3Config, region: e.target.value})} placeholder="us-east-1" />
                        </div>
                        <div className="space-y-1">
                            <Label>Access Key</Label>
                            <Input value={s3Config.accessKey} onChange={e => setS3Config({...s3Config, accessKey: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <Label>Secret Key</Label>
                            <Input type="password" value={s3Config.secretKey} onChange={e => setS3Config({...s3Config, secretKey: e.target.value})} placeholder="Leave blank to keep current" />
                        </div>
                        <div className="space-y-1">
                            <Label>Bucket Name</Label>
                            <Input value={s3Config.bucket} onChange={e => setS3Config({...s3Config, bucket: e.target.value})} />
                        </div>
                        <Button className="w-full mt-2 font-bold" size="sm" onClick={handleSaveS3} disabled={saving}>
                            {saving ? "Saving..." : "Save S3 Config"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Wasabi */}
                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Cloud className="w-4 h-4 text-green-500" />
                            Wasabi Hot Storage
                        </CardTitle>
                        <CardDescription>Secondary redundant backup storage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="space-y-1">
                            <Label>Region</Label>
                            <Input value={wasabiConfig.region} onChange={e => setWasabiConfig({...wasabiConfig, region: e.target.value})} placeholder="us-east-1" />
                        </div>
                        <div className="space-y-1">
                            <Label>Access Key</Label>
                            <Input value={wasabiConfig.accessKey} onChange={e => setWasabiConfig({...wasabiConfig, accessKey: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <Label>Secret Key</Label>
                            <Input type="password" value={wasabiConfig.secretKey} onChange={e => setWasabiConfig({...wasabiConfig, secretKey: e.target.value})} placeholder="Leave blank to keep current" />
                        </div>
                        <div className="space-y-1">
                            <Label>Bucket Name</Label>
                            <Input value={wasabiConfig.bucket} onChange={e => setWasabiConfig({...wasabiConfig, bucket: e.target.value})} />
                        </div>
                        <Button className="w-full mt-2 font-bold" size="sm" onClick={handleSaveWasabi} disabled={saving}>
                            {saving ? "Saving..." : "Save Wasabi Config"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Backup History */}
            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle className="text-base flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-slate-500" />
                        Local Backup History
                    </CardTitle>
                    <CardDescription>Recent backups stored on the server.</CardDescription>
                </CardHeader>
                <CardContent className=" p-6">
                    <div className="divide-y divide-slate-100">
                        {history.length === 0 ? (
                            <p className="py-4 text-center text-sm text-slate-400 font-mono italic">No backup records found.</p>
                        ) : (
                            history.map(item => (
                                <div key={item.name} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${item.type === 'database' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {item.type === 'database' ? <Database className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{item.date} • {item.size}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge label="S3" success={true} />
                                        <StatusBadge label="Wasabi" success={true} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatusBadge({ label, success }: { label: string, success: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${success ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
            {label} {success ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
        </span>
    );
}
