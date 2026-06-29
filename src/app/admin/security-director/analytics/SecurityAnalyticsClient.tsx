"use client";

import { Card } from "@/components/ui/card";
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line 
} from "recharts";
import { Building2, Key, HelpCircle, AlertCircle } from "lucide-react";

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SecurityAnalyticsClient({ 
    data,
    showVisitors = true,
    showKeys = true,
    showLostFound = true,
    showTickets = true
}: { 
    data: any;
    showVisitors?: boolean;
    showKeys?: boolean;
    showLostFound?: boolean;
    showTickets?: boolean;
}) {

    // Helper to render a quick empty state if no data
    const EmptyState = ({ message }: { message: string }) => (
        <div className="h-[300px] w-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">
            {message}
        </div>
    );

    return (
        <div className="space-y-12">
            
            {/* VISITOR DYNAMICS */}
            {showVisitors && (
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl"><Building2 className="w-5 h-5" /></div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Visitor Dynamics</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6 rounded-[2rem] border-slate-100 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Visitor Volume (Last 7 Days)</h3>
                        {data.visitors.timeline.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer>
                                    <LineChart data={data.visitors.timeline}>
                                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                        <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <EmptyState message="Not enough visitor timeline data" />}
                    </Card>

                    <Card className="p-6 rounded-[2rem] border-slate-100 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Top Visited Destinations</h3>
                        {data.visitors.topDestinations.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer>
                                    <BarChart data={data.visitors.topDestinations} layout="vertical" margin={{ left: 50 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="destinationName" type="category" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none'}} />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <EmptyState message="No destination data" />}
                    </Card>
                </div>
            </section>
            )}

            {/* KEY MANAGEMENT */}
            {showKeys && (
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-xl"><Key className="w-5 h-5" /></div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Key Accountability</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="p-6 rounded-[2rem] border-slate-100 shadow-sm col-span-1">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Key Status Distribution</h3>
                        {data.keys.statusBreakdown.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={data.keys.statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                                            {data.keys.statusBreakdown.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{borderRadius: '1rem', border: 'none'}} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <EmptyState message="No key status data" />}
                    </Card>

                    <Card className="p-6 rounded-[2rem] border-slate-100 shadow-sm col-span-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Most Frequently Checked Out Keys</h3>
                        {data.keys.topKeys.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer>
                                    <BarChart data={data.keys.topKeys}>
                                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                        <YAxis hide />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none'}} />
                                        <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <EmptyState message="No key usage data" />}
                    </Card>
                </div>
            </section>
            )}

            {/* LOST AND FOUND & SUPPORT TICKETS */}
            <section className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Lost and Found */}
                    {showLostFound && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Lost & Found Efficacy</h2>
                        </div>
                        <Card className="p-6 rounded-[2rem] border-slate-100 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Resolution Status</h3>
                            {data.lostFound.statusBreakdown.length > 0 ? (
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer>
                                        <BarChart data={data.lostFound.statusBreakdown}>
                                            <XAxis dataKey="status" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none'}} />
                                            <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : <EmptyState message="No lost/found data" />}
                        </Card>
                    </div>
                    )}

                    {/* Support Tickets */}
                    {showTickets && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl"><HelpCircle className="w-5 h-5" /></div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Support Tickets Overview</h2>
                        </div>
                        <Card className="p-6 rounded-[2rem] border-slate-100 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Tickets by Category</h3>
                            {data.tickets.categoryBreakdown.length > 0 ? (
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={data.tickets.categoryBreakdown} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                                                {data.tickets.categoryBreakdown.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{borderRadius: '1rem', border: 'none'}} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : <EmptyState message="No ticketing data" />}
                        </Card>
                    </div>
                    )}

                </div>
            </section>

        </div>
    );
}
