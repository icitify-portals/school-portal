"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    BarChart, 
    Bar,
    Cell
} from "recharts";
import { 
    Users, 
    Clock, 
    AlertTriangle, 
    TrendingUp,
    Calendar,
    ArrowUpRight
} from "lucide-react";

interface AnalyticsProps {
    data: {
        summary: {
            totalPresentToday: number;
            currentlyIn: number;
            lateArrivals: number;
        };
        hourlyTrend: any[];
        historicalTrend: any[];
    }
}

export default function AttendanceAnalytics({ data }: AnalyticsProps) {
    const stats = [
        { label: "Currently In", value: data.summary.currentlyIn, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Today Total", value: data.summary.totalPresentToday, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Late Arrivals", value: data.summary.lateArrivals, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Avg. Duration", value: "6.4h", icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
    ];

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
                                    <ArrowUpRight className="w-3 h-3" /> +12%
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-4xl font-black text-slate-900 italic uppercase">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hourly Trend */}
                <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-8">
                    <CardHeader className="px-0 pt-0 pb-8 flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-black text-slate-900 uppercase italic">Hourly Traffic</CardTitle>
                        <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none px-3 font-black text-[10px] uppercase tracking-widest">Today</Badge>
                    </CardHeader>
                    <CardContent className="px-0 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.hourlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="hour" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc', radius: 10}}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border-none">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">{payload[0].payload.hour}</p>
                                                    <p className="text-xl font-black italic">{payload[0].value} <span className="text-[10px] uppercase not-italic opacity-50">Logins</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={20}>
                                    {data.hourlyTrend.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3b82f6" : "#e2e8f0"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 7 Day Trend */}
                <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-8">
                    <CardHeader className="px-0 pt-0 pb-8 flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-black text-slate-900 uppercase italic">Weekly Overview</CardTitle>
                        <Calendar className="w-5 h-5 text-blue-600" />
                    </CardHeader>
                    <CardContent className="px-0 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.historicalTrend}>
                                <defs>
                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-4 rounded-2xl shadow-2xl border-2 border-slate-50">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].payload.date}</p>
                                                    <p className="text-xl font-black italic text-slate-900">{payload[0].value} <span className="text-[10px] uppercase not-italic opacity-50">Students</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#3b82f6" 
                                    strokeWidth={4} 
                                    dot={{ r: 6, fill: '#fff', stroke: '#3b82f6', strokeWidth: 3 }}
                                    activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
            {children}
        </div>
    );
}
