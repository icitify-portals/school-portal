"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Shield, Activity, FileText, Lock, Users, AlertTriangle,
    Search, Download, ChevronLeft, ChevronRight, Filter
} from "lucide-react";
import { getActivityLogs, exportActivityLogs } from "@/actions/audit";
import { toast } from "sonner";

export default function AuditLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [actionFilter, setActionFilter] = useState('');
    const [actionTypes, setActionTypes] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        const result = await getActivityLogs({
            action: actionFilter || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            page,
            pageSize,
        });
        if (result && !result.error) {
            setLogs(result.logs || []);
            setTotal(result.total || 0);
            setActionTypes(result.actionTypes || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchLogs(); }, [page, actionFilter, startDate, endDate]);

    const handleExport = async () => {
        const result = await exportActivityLogs({
            action: actionFilter || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        });
        if (result?.csv) {
            const blob = new Blob([result.csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Audit logs exported");
        } else {
            toast.error(result?.error || "Export failed");
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    const actionColorMap: Record<string, string> = {
        login: 'bg-green-100 text-green-700',
        logout: 'bg-slate-100 text-slate-600',
        gdpr_data_export: 'bg-blue-100 text-blue-700',
        gdpr_anonymize: 'bg-red-100 text-red-700',
        update_grade: 'bg-amber-100 text-amber-700',
        delete_user: 'bg-red-100 text-red-700',
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-indigo-600" />
                        Audit Logs
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Track all system activities and user actions</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" /> Export CSV
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Filters</span>
                        </div>
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-700"
                        >
                            <option value="">All Actions</option>
                            {actionTypes.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-700"
                            placeholder="Start Date"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-700"
                            placeholder="End Date"
                        />
                        {(actionFilter || startDate || endDate) && (
                            <button
                                onClick={() => { setActionFilter(''); setStartDate(''); setEndDate(''); setPage(1); }}
                                className="text-xs font-bold text-indigo-600 hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-4 py-3 text-left font-black text-xs uppercase text-slate-500">Time</th>
                                    <th className="px-4 py-3 text-left font-black text-xs uppercase text-slate-500">User</th>
                                    <th className="px-4 py-3 text-left font-black text-xs uppercase text-slate-500">Action</th>
                                    <th className="px-4 py-3 text-left font-black text-xs uppercase text-slate-500">Resource</th>
                                    <th className="px-4 py-3 text-left font-black text-xs uppercase text-slate-500">IP Address</th>
                                    <th className="px-4 py-3 text-left font-black text-xs uppercase text-slate-500">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No activity logs found</td></tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-25 transition-colors">
                                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-bold text-slate-700">{log.userName || 'System'}</div>
                                            <div className="text-[10px] text-slate-400">{log.userEmail}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${actionColorMap[log.action] || 'bg-slate-100 text-slate-600'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {log.resource && (
                                                <span>{log.resource}{log.resourceId ? ` #${log.resourceId}` : ''}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-400 font-mono">{log.ipAddress || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                                            {log.details ? JSON.stringify(JSON.parse(log.details)).substring(0, 80) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                            <span className="text-xs text-slate-500">
                                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-bold text-slate-600">Page {page} of {totalPages}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
