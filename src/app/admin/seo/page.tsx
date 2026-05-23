"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Search, 
    TrendingUp, 
    MousePointer2, 
    BarChart3, 
    MonitorCheck, 
    Globe, 
    Zap,
    Sparkles,
    Settings,
    FileText
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";

const mockPerformanceData = [
    { name: 'Mon', impressions: 4000, clicks: 240 },
    { name: 'Tue', impressions: 3000, clicks: 139 },
    { name: 'Wed', impressions: 2000, clicks: 980 },
    { name: 'Thu', impressions: 2780, clicks: 390 },
    { name: 'Fri', impressions: 1890, clicks: 480 },
    { name: 'Sat', impressions: 2390, clicks: 380 },
    { name: 'Sun', impressions: 3490, clicks: 430 },
];

export default function SEOAnalyticsDashboard() {
    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 italic">SEO Intelligence Dashboard</h1>
                    <p className="text-slate-500 font-bold">Search performance and visibility metrics for the entire platform.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-2xl font-black bg-white">
                        <Settings className="mr-2 h-4 w-4" /> SEO Settings
                    </Button>
                    <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-600/20">
                        <Globe className="mr-2 h-4 w-4" /> View Sitemap
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Impressions", value: "84.2k", change: "+12.5%", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Search Clicks", value: "3.1k", change: "+5.2%", icon: MousePointer2, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Average Position", value: "12.4", change: "-1.2", icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Indexed Pages", value: "1,245", change: "+42", icon: MonitorCheck, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-black text-[10px]">{stat.change}</Badge>
                            </div>
                            <div className="mt-4">
                                <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Performance Chart */}
                <Card className="md:col-span-2 border-none shadow-sm rounded-[40px] bg-white p-8 overflow-hidden relative">
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-xl font-black flex items-center gap-2 italic">
                            <Zap className="h-5 w-5 text-indigo-600 fill-current" /> Performance Over Time
                        </CardTitle>
                    </CardHeader>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockPerformanceData}>
                                <defs>
                                    <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 600, fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip />
                                <Area type="monotone" dataKey="impressions" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorImpressions)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Top Keywords / Queries */}
                <Card className="border-none shadow-sm rounded-[40px] bg-white p-8">
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-xl font-black italic">Top Search Queries</CardTitle>
                    </CardHeader>
                    <div className="space-y-6">
                        {[
                            { query: "university journal portal", clicks: 420, pos: 1.2 },
                            { query: "jamb physics past questions", clicks: 380, pos: 3.4 },
                            { query: "how to cite journal of advanced materials", clicks: 210, pos: 4.1 },
                            { query: "engineering library catalogs", clicks: 156, pos: 2.8 },
                            { query: "digital scholarly archives", clicks: 124, pos: 5.6 },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <div className="font-bold text-slate-800 text-sm italic line-clamp-1">{item.query}</div>
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pos: {item.pos}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-indigo-600">{item.clicks}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Clicks</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-8 rounded-2xl font-black text-indigo-600">View Full Console Data</Button>
                </Card>
            </div>

            {/* AI Optimization Suggestions */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600 fill-current" />
                    <h2 className="text-2xl font-black tracking-tight italic text-slate-900">AI SEO Recommendations</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: "Meta Description Missing", count: "14 Articles", desc: "AI can auto-generate descriptions based on abstracts.", action: "Auto-Fix Now" },
                        { title: "Low-Performing Keywords", count: "8 Pages", desc: "Suggesting long-tail keyword variations for better ranking.", action: "View Suggestions" },
                        { title: "Broken Internal Links", count: "3 Modules", desc: "Found 12 opportunities to link library books to courses.", action: "Link Modules" },
                    ].map((rec, i) => (
                        <div key={i} className="p-8 bg-white border border-slate-100 rounded-[35px] shadow-sm space-y-4 hover:border-indigo-600/30 transition-all">
                             <div className="flex justify-between items-center">
                                <Badge className="bg-amber-100 text-amber-700 font-black">{rec.count}</Badge>
                                <FileText className="h-5 w-5 text-slate-300" />
                             </div>
                             <div className="space-y-1">
                                <h3 className="font-black text-lg text-slate-900">{rec.title}</h3>
                                <p className="text-sm text-slate-500 italic">{rec.desc}</p>
                             </div>
                             <Button className="w-full rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black border-none">
                                {rec.action}
                             </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
