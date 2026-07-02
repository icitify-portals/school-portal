"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Shield, Download, Trash2, Users, FileText, Clock,
    Search, AlertTriangle, Loader2, CheckCircle, Eye
} from "lucide-react";
import { exportUserData, anonymizeUser, getGdprSummary, getDataRetentionSettings } from "@/actions/gdpr";
import { toast } from "sonner";

export default function GdprPage() {
    const [summary, setSummary] = useState<any>(null);
    const [retention, setRetention] = useState<any>(null);
    const [searchEmail, setSearchEmail] = useState('');
    const [searchUserId, setSearchUserId] = useState<number | null>(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [anonymizeLoading, setAnonymizeLoading] = useState(false);
    const [confirmAnonymize, setConfirmAnonymize] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getGdprSummary(), getDataRetentionSettings()]).then(([s, r]) => {
            if (s && !s.error) setSummary(s.summary);
            if (r && !r.error) setRetention(r.settings);
            setLoading(false);
        });
    }, []);

    const handleExport = async () => {
        if (!searchUserId) { toast.error("Enter a user ID"); return; }
        setExportLoading(true);
        const result = await exportUserData(searchUserId);
        if (result?.data) {
            const blob = new Blob([result.data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user-data-${searchUserId}-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("User data exported");
        } else {
            toast.error(result?.error || "Export failed");
        }
        setExportLoading(false);
    };

    const handleAnonymize = async () => {
        if (!searchUserId) { toast.error("Enter a user ID"); return; }
        setAnonymizeLoading(true);
        const result = await anonymizeUser(searchUserId);
        if (result?.success) {
            toast.success(result.message);
            setConfirmAnonymize(false);
            // Refresh summary
            const s = await getGdprSummary();
            if (s && !s.error) setSummary(s.summary);
        } else {
            toast.error(result?.error || "Anonymization failed");
        }
        setAnonymizeLoading(false);
    };

    if (loading) return (
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-indigo-600" />
                    GDPR Compliance Tools
                </h1>
                <p className="text-sm text-slate-500 mt-1">Data protection, portability, and right to be forgotten</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="-to-br from-indigo-50 to-white -100 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-xl">
                                <Users className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">{summary?.totalUsers || 0}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase">Total Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="-to-br from-red-50 to-white -100 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-xl">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">{summary?.anonymizedUsers || 0}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase">Anonymized</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="-to-br from-amber-50 to-white -100 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-xl">
                                <FileText className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">{summary?.totalActivityLogs || 0}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase">Activity Records</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User Data Actions */}
            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">User Data Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">User ID</label>
                            <input
                                type="number"
                                value={searchUserId || ''}
                                onChange={e => setSearchUserId(parseInt(e.target.value) || null)}
                                placeholder="Enter user ID"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={handleExport} disabled={exportLoading || !searchUserId} variant="outline" className="gap-2">
                                {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Export Data
                            </Button>
                            {!confirmAnonymize ? (
                                <Button
                                    onClick={() => setConfirmAnonymize(true)}
                                    disabled={!searchUserId}
                                    variant="outline"
                                    className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Anonymize
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={handleAnonymize}
                                        disabled={anonymizeLoading}
                                        className="bg-red-600 hover:bg-red-700 gap-2"
                                    >
                                        {anonymizeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                                        Confirm
                                    </Button>
                                    <Button onClick={() => setConfirmAnonymize(false)} variant="outline">Cancel</Button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <strong>Warning:</strong> Anonymization is irreversible. Personal data (name, email, phone) will be permanently removed while preserving academic records for institutional integrity.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Data Retention */}
            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Data Retention Policy
                    </CardTitle>
                </CardHeader>
                <CardContent className=" p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs font-bold text-slate-500 uppercase">Graduated Student Data</p>
                            <p className="text-xl font-black text-slate-900 mt-1">{retention?.retainGraduatedYears} years</p>
                            <p className="text-xs text-slate-400 mt-1">After graduation</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs font-bold text-slate-500 uppercase">Withdrawn Student Data</p>
                            <p className="text-xl font-black text-slate-900 mt-1">{retention?.retainWithdrawnYears} years</p>
                            <p className="text-xs text-slate-400 mt-1">After withdrawal</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs font-bold text-slate-500 uppercase">Activity Logs</p>
                            <p className="text-xl font-black text-slate-900 mt-1">{retention?.retainActivityLogsMonths} months</p>
                            <p className="text-xs text-slate-400 mt-1">Rolling retention</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs font-bold text-slate-500 uppercase">Auto-Deletion</p>
                            <p className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                                {retention?.autoDeleteEnabled ? (
                                    <><CheckCircle className="w-5 h-5 text-green-500" /> Enabled</>
                                ) : (
                                    <><AlertTriangle className="w-5 h-5 text-amber-500" /> Disabled</>
                                )}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Automatic purging of expired data</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
