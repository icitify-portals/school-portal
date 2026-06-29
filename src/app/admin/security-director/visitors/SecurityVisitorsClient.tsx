"use client";

import { Card } from "@/components/ui/card";
import { Users, UserCheck, Clock, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function SecurityVisitorsClient({ initialActiveVisitors, initialTotalToday }: { initialActiveVisitors: any[], initialTotalToday: number }) {

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 rounded-[2rem] bg-emerald-800 text-white shadow-lg border-none flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-8">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <Users className="w-6 h-6 text-emerald-50" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Live</span>
                    </div>
                    <div>
                        <div className="text-4xl font-black mb-1">{initialActiveVisitors.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Currently on Campus</div>
                    </div>
                </Card>

                <Card className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-8">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <UserCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Today</span>
                    </div>
                    <div>
                        <div className="text-4xl font-black mb-1 text-slate-800">{initialTotalToday}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Checked In Today</div>
                    </div>
                </Card>

                <a href="/admin/security-director/visitors/analytics" className="block h-full">
                    <Card className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm flex flex-col justify-between h-full hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <Building2 className="w-6 h-6 text-indigo-50" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black mb-1">View Analytics</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Historical Trends & Demographics</div>
                        </div>
                    </Card>
                </a>
            </div>

            <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" /> Live Visitor Log
                </h3>
                
                <div className="overflow-x-auto rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="p-6">Visitor</th>
                                <th className="p-6">Destination</th>
                                <th className="p-6">Purpose</th>
                                <th className="p-6 text-right">Checked In At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {initialActiveVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                                        No active visitors on campus.
                                    </td>
                                </tr>
                            ) : (
                                initialActiveVisitors.map(v => (
                                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6">
                                            <div className="font-black text-slate-800">{v.visitor?.name}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">{v.visitor?.phone || 'No phone'}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-700">
                                                {v.destinationName}
                                            </span>
                                        </td>
                                        <td className="p-6 text-xs text-slate-600">
                                            {v.purpose}
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="text-xs font-bold text-slate-700 flex items-center justify-end gap-1">
                                                <Clock className="w-3 h-3 text-emerald-600" />
                                                {format(new Date(v.visitStartTime), 'p')}
                                            </div>
                                            <div className="text-[9px] uppercase tracking-widest text-slate-400 mt-1">Today</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
