"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ClipboardList,
    Download,
    Users,
    LogIn,
    Clock,
    History,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCircle2,
    ArrowRightLeft
} from "lucide-react";
import { getAttendanceAnalysis } from "@/actions/attendance";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AttendanceReportsPage() {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalysis();
    }, []);

    const fetchAnalysis = async () => {
        setLoading(true);
        const res = await getAttendanceAnalysis();
        if (res.success) setAnalysis(res.data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-slate-500 font-medium">Analyzing Attendance Records...</p>
            </div>
        );
    }

    const { summary, hourlyTrend, historicalTrend, detailedLogs } = analysis;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <ClipboardList className="w-8 h-8 text-primary" />
                        </div>
                        Attendance Analysis
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium">Real-time school presence and punctuality monitoring</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 rounded-xl h-11 border-slate-200" onClick={fetchAnalysis}>
                        <History className="w-4 h-4" /> Refresh
                    </Button>
                    <Button className="rounded-xl h-11 px-6 gap-2 shadow-lg shadow-primary/20">
                        <Download className="w-4 h-4" /> Export Report
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card className="border-none shadow-sm bg-blue-50/50 border border-blue-100 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="w-16 h-16 text-blue-600" />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Total Present Today</p>
                        <h3 className="text-4xl font-black text-blue-900">{summary.totalPresentToday}</h3>
                        <p className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Unique users detected
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-emerald-50/50 border border-emerald-100 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <LogIn className="w-16 h-16 text-emerald-600" />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Currently In School</p>
                        <h3 className="text-4xl font-black text-emerald-900">{summary.currentlyIn}</h3>
                        <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Status
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-orange-50/50 border border-orange-100 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Clock className="w-16 h-16 text-orange-600" />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1">Late Arrivals</p>
                        <h3 className="text-4xl font-black text-orange-900">{summary.lateArrivals}</h3>
                        <p className="text-xs text-orange-600 font-bold mt-2">After 8:30 AM threshold</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Hourly Trend (Bar Chart) */}
                <Card className="lg:col-span-2 border-none shadow-sm border border-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50/50">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <LogIn className="w-4 h-4" /> Hourly Entry Activity
                        </CardTitle>
                        <Badge variant="secondary" className="bg-slate-100 text-[10px] uppercase font-black">Today</Badge>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-64 flex items-end justify-between gap-1 overflow-x-auto pb-6 custom-scrollbar">
                            {hourlyTrend.map((h: any) => {
                                const maxCount = Math.max(...hourlyTrend.map((x: any) => x.count), 1);
                                const height = (h.count / maxCount) * 100;
                                return (
                                    <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 min-w-[20px]">
                                        <div
                                            className={cn(
                                                "w-full rounded-t-sm transition-all duration-500 relative group",
                                                h.count > 0 ? "bg-primary" : "bg-slate-100"
                                            )}
                                            style={{ height: `${height}%`, minHeight: h.count > 0 ? '4px' : '0px' }}
                                        >
                                            {h.count > 0 && (
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
                                                    {h.count}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold -rotate-45 md:rotate-0 mt-1">{h.hour.split(':')[0]}h</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Historical Trend */}
                <Card className="border-none shadow-sm border border-slate-100">
                    <CardHeader className="border-b border-slate-50/50">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Last 7 Days
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            {historicalTrend.map((day: any) => (
                                <div key={day.date} className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                        <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${(day.count / (summary.totalPresentToday || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">{day.count}</span>
                                </div>
                            ))}
                            {historicalTrend.length === 0 && (
                                <p className="text-xs text-slate-400 italic text-center py-8">No historical data available yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card className="border-none shadow-sm overflow-hidden border border-slate-100">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4" /> Raw Attendance Logs
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                                <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                                <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {detailedLogs.map((log: any) => (
                                <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800">{log.userName}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">ID: {log.id}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <Badge
                                            className={cn(
                                                "rounded-lg uppercase text-[9px] font-black px-2",
                                                log.type === 'in' ? "bg-blue-500 text-white" : "bg-orange-500 text-white"
                                            )}
                                        >
                                            {log.type}
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-6 text-center text-xs font-mono text-slate-500">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase px-3 hover:bg-slate-100 rounded-lg">
                                            View Profile
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {detailedLogs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-slate-400 italic">
                                        No attendance logs found for today
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
