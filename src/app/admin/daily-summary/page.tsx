"use client";

import React, { useState, useEffect } from "react";
import { getDailySummary } from "@/actions/daily-summary";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Activity, 
    Banknote, 
    GraduationCap, 
    Users, 
    ShieldAlert, 
    Calendar,
    ArrowRight,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AdminDailySummaryPage() {
    const router = useRouter();
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getDailySummary(date);
                if (res.success) {
                    setSummary(res.data);
                } else {
                    setError(res.message || "Failed to load summary");
                    if (res.message?.includes("Unauthorized")) {
                        // In a real app we might redirect, but for now just show the error.
                    }
                }
            } catch (err: any) {
                setError("An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [date]);

    if (error && error.includes("Unauthorized")) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <ShieldAlert className="w-16 h-16 text-red-500" />
                <h1 className="text-3xl font-black text-slate-900">Access Denied</h1>
                <p className="text-slate-500 font-medium max-w-md text-center">
                    This page is restricted to Developers and Super Administrators. You do not have the required permissions to view daily metrics.
                </p>
                <Button onClick={() => router.push("/admin")} className="mt-4 rounded-xl font-bold bg-slate-900">
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-inner">
                <div className="space-y-4">
                    <Badge className="bg-indigo-100 text-indigo-700 border-none px-4 py-1.5 rounded-full uppercase tracking-widest text-[10px] font-black">
                        System Diagnostics
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <Activity className="w-10 h-10 text-indigo-600" />
                        Daily Operations Summary
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg">
                        Real-time heartbeat of the institution. Monitor financial velocity, academic registrations, and support metrics for any given day.
                    </p>
                </div>
                
                <div className="bg-white p-2 rounded-2xl shadow-xl shadow-indigo-100/50 flex items-center gap-2 border border-slate-100">
                    <div className="bg-indigo-50 p-3 rounded-xl">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="px-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Select Date</label>
                        <Input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)}
                            className="border-none shadow-none h-8 p-0 text-lg font-bold text-slate-900 focus-visible:ring-0 w-[140px]"
                        />
                    </div>
                    <Button onClick={() => {}} className="bg-indigo-600 hover:bg-indigo-700 h-12 w-12 rounded-xl p-0 flex items-center justify-center">
                        <Search className="w-5 h-5 text-white" />
                    </Button>
                </div>
            </div>

            {/* Error State */}
            {error && !error.includes("Unauthorized") && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-bold border border-red-100 flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5" /> {error}
                </div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 pt-4">
                
                {/* Finance Metric */}
                <Card className="col-span-1 md:col-span-2 xl:col-span-2 border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-indigo-600 to-indigo-900 text-white group overflow-hidden hover:shadow-2xl hover:shadow-indigo-900/20 transition-all duration-300 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                    <CardHeader className="relative z-10 pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                <Banknote className="w-6 h-6 text-indigo-100" />
                            </div>
                            <Badge variant="outline" className="border-white/20 text-white/80 text-[10px] uppercase tracking-widest font-black">Finance</Badge>
                        </div>
                        <CardTitle className="text-sm font-bold text-indigo-200 uppercase tracking-widest mt-6">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tighter">
                                {loading ? "..." : `₦${Number(summary?.payments?.revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                            </span>
                        </div>
                        <div className="mt-4 text-sm font-medium text-indigo-200 flex items-center gap-2">
                            Across <span className="text-white font-bold">{loading ? "-" : summary?.payments?.count}</span> completed transactions
                        </div>
                    </CardContent>
                </Card>

                {/* Academics Metric */}
                <Card className="border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300 relative">
                    <div className="h-2 w-full bg-emerald-500 absolute top-0 left-0" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-emerald-50 rounded-2xl">
                                <GraduationCap className="w-6 h-6 text-emerald-600" />
                            </div>
                            <Badge variant="outline" className="border-slate-100 text-slate-400 text-[10px] uppercase tracking-widest font-black">Academics</Badge>
                        </div>
                        <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-6">New Registrations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">
                            {loading ? "..." : summary?.academics?.newStudents}
                        </div>
                        <div className="mt-4 text-sm font-medium text-slate-500">
                            + {loading ? "-" : summary?.academics?.newEnrollments} course enrollments
                        </div>
                    </CardContent>
                </Card>

                {/* Support Metric */}
                <Card className="border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300 relative">
                    <div className="h-2 w-full bg-amber-500 absolute top-0 left-0" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-amber-50 rounded-2xl">
                                <Users className="w-6 h-6 text-amber-600" />
                            </div>
                            <Badge variant="outline" className="border-slate-100 text-slate-400 text-[10px] uppercase tracking-widest font-black">Support</Badge>
                        </div>
                        <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-6">Tickets Raised</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">
                            {loading ? "..." : summary?.support?.newTickets}
                        </div>
                        <div className="mt-4 text-sm font-medium text-amber-600 flex items-center gap-1 cursor-pointer hover:underline">
                            View Helpdesk <ArrowRight className="w-3 h-3" />
                        </div>
                    </CardContent>
                </Card>

                {/* System Usage Metric */}
                <Card className="border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300 relative">
                    <div className="h-2 w-full bg-blue-500 absolute top-0 left-0" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-blue-50 rounded-2xl">
                                <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                            <Badge variant="outline" className="border-slate-100 text-slate-400 text-[10px] uppercase tracking-widest font-black">System</Badge>
                        </div>
                        <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-6">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">
                            {loading ? "..." : summary?.usage?.activeUsers}
                        </div>
                        <div className="mt-4 text-sm font-medium text-slate-500 flex items-center justify-between">
                            <span>Unique Logins</span>
                            <span className="text-slate-300">+{loading ? "-" : summary?.security?.newVisitors} Visitors</span>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
