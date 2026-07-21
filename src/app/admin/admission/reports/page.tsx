// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
    BarChart3, 
    Users, 
    CheckCircle, 
    Clock, 
    TrendingUp,
    PieChart,
    ChevronRight,
    Loader2,
    Calendar,
    GraduationCap
} from "lucide-react";
import { getAdmissionSummary } from "@/actions/admission_v2";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell,
    PieChart as RePieChart,
    Pie
} from "recharts";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function AdmissionReportsPage() {
    const [summary, setSummary] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        setLoading(true);
        const data = await getAdmissionSummary();
        setSummary(data);
        setLoading(false);
    };

    const totalApplications = summary.reduce((acc, s) => acc + s.total, 0);
    const totalPaid = summary.reduce((acc, s) => acc + s.paid, 0);
    const totalPending = summary.reduce((acc, s) => acc + s.pending, 0);

    const chartData = summary.map(s => ({
        name: s.name,
        total: s.total,
        paid: s.paid
    }));

    const pieData = [
        { name: 'Paid', value: totalPaid },
        { name: 'Pending', value: totalPending }
    ];

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
                        <BarChart3 className="w-10 h-10 text-indigo-600" />
                        INTAKE ANALYTICS
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Comprehensive overview of active admission cycles</p>
                </div>
                <div className="flex gap-4">
                    <Card className="border-none shadow-sm bg-indigo-50 px-6 py-3 flex items-center gap-3 rounded-2xl">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 italic">2026/2027 Cycle</span>
                    </Card>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white p-8 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-white/10 rounded-2xl">
                            <Users className="w-6 h-6 text-indigo-400" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Global Submissions</p>
                        <h2 className="text-5xl font-black italic mt-2">{totalApplications.toLocaleString()}</h2>
                    </div>
                </Card>

                <Card className="border-none shadow-xl rounded-[2.5rem] bg-emerald-600 text-white p-8 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-white/10 rounded-2xl">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 italic">Confirmed Revenue</p>
                        <h2 className="text-5xl font-black italic mt-2">{totalPaid.toLocaleString()}</h2>
                    </div>
                </Card>

                <Card className="border-none shadow-xl rounded-[2.5rem] bg-amber-500 text-white p-8 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-white/10 rounded-2xl">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100 italic">Awaiting Clearance</p>
                        <h2 className="text-5xl font-black italic mt-2">{totalPending.toLocaleString()}</h2>
                    </div>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 border-none shadow-xl rounded-[3rem] bg-white p-10 overflow-hidden">
                    <h3 className="text-xl font-black italic uppercase italic mb-10 flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                        Volume by Admission Template
                    </h3>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="total" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                                <Bar dataKey="paid" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="lg:col-span-4 border-none shadow-xl rounded-[3rem] bg-white p-10">
                    <h3 className="text-xl font-black italic uppercase italic mb-10 flex items-center gap-3 text-center justify-center">
                        <PieChart className="w-6 h-6 text-indigo-600" />
                        Payment Split
                    </h3>
                    <div className="h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Paid Rate</span>
                            <span className="text-3xl font-black text-slate-900 italic">
                                {totalApplications > 0 ? Math.round((totalPaid / totalApplications) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                    <div className="space-y-4 mt-8">
                        {pieData.map((entry, index) => (
                            <div key={entry.name} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{entry.name}</span>
                                </div>
                                <span className="text-sm font-black italic">{entry.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Template Table Summary */}
            <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-xl font-black italic uppercase italic flex items-center gap-3">
                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                        Template performance
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Form Level & Name</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Total Apps</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Paid</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Conversion</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {summary.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{t.level} LEVEL</span>
                                            <span className="text-lg font-black text-slate-900 italic uppercase">{t.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 font-black text-slate-700 italic text-xl">
                                        {t.total}
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-emerald-600 italic">{t.paid} confirmed</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.pending} pending</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                                            <div 
                                                className="bg-indigo-600 h-full rounded-full" 
                                                style={{ width: `${t.total > 0 ? (t.paid / t.total) * 100 : 0}%` }} 
                                            />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 block">
                                            {t.total > 0 ? Math.round((t.paid / t.total) * 100) : 0}% success
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <Link href={`/admin/admission/forms/${t.id}`}>
                                            <Button variant="ghost" className="rounded-2xl hover:bg-white hover:shadow-lg p-4 group transition-all">
                                                <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-600" />
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
