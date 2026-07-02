"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Briefcase,
    Building2,
    UserCheck,
    Settings2,
    Plus,
    CheckCircle2,
    XCircle,
    Calendar,
    Clock,
    Search,
    Loader2
} from "lucide-react";
import {
    getSiwesConfigs,
    getSiwesCompanies,
    getPlacementsForAdmin,
    assessPlacement
} from "@/actions/siwes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminSiwesDashboard() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [placements, setPlacements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const [confRes, compRes, placRes] = await Promise.all([
            getSiwesConfigs(),
            getSiwesCompanies(),
            getPlacementsForAdmin()
        ]);

        if (confRes.success && confRes.data) setConfigs(confRes.data);
        if (compRes.success && compRes.data) setCompanies(compRes.data);
        if (placRes.success && placRes.data) setPlacements(placRes.data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
            <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-650/30 to-purple-650/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <Briefcase className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                                SIWES Management
                            </h2>
                        </div>
                        <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                            Industrial Work Experience Scheme Administration
                        </p>
                    </div>
                    <div className="relative z-10 flex gap-3 shrink-0">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md border border-white/10 active:scale-95 transition-all">
                            <Plus className="w-4 h-4 mr-2" />
                            New Configuration
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8 hover:-translate-y-1 transition-all duration-300">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Placements</p>
                        <h3 className="text-4xl font-black italic text-slate-900 tracking-tighter">{placements.length}</h3>
                        <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mt-2">Across all programmes</p>
                    </Card>
                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8 hover:-translate-y-1 transition-all duration-300">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pending Logbooks</p>
                        <h3 className="text-4xl font-black italic text-indigo-650 tracking-tighter">
                            {placements.reduce((acc, p) => acc + p.logbooks?.filter((l: any) => l.status === 'submitted').length, 0)}
                        </h3>
                        <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mt-2">Awaiting Officer Review</p>
                    </Card>
                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8 hover:-translate-y-1 transition-all duration-300">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Company Partners</p>
                        <h3 className="text-4xl font-black italic text-emerald-600 tracking-tighter">{companies.length}</h3>
                        <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mt-2">Approved Organizations</p>
                    </Card>
                </div>

                <Tabs defaultValue="placements" className="space-y-6">
                    <TabsList className="bg-slate-200/50 backdrop-blur-xl rounded-2xl p-1 w-full md:w-auto h-14 border border-slate-200 shadow-inner">
                        <TabsTrigger value="placements" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md">Active Placements</TabsTrigger>
                        <TabsTrigger value="companies" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md">Partner Companies</TabsTrigger>
                        <TabsTrigger value="configs" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md">Eligibility Config</TabsTrigger>
                    </TabsList>

                    <TabsContent value="placements">
                        <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem]">
                            {loading ? (
                                <div className="py-20 text-center">
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                                </div>
                            ) : placements.length === 0 ? (
                                <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                    No active placements found
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-900 text-white">
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Student</th>
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Company</th>
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Duration</th>
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/40 bg-white/20">
                                            {placements.map((p) => (
                                                <tr key={p.id} className="group hover:bg-white/40 transition-colors">
                                                    <td className="px-10 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-black text-slate-800 uppercase">{p.student?.user?.name}</span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase mt-0.5">{p.student?.matricNumber}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">{p.company?.name}</span>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-2 text-slate-600 font-bold font-mono">
                                                            <Clock className="w-4 h-4 text-slate-400" />
                                                            <span className="text-xs uppercase">{p.startDate ? new Date(p.startDate).toLocaleDateString() : 'NOT SET'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <Badge className={cn(
                                                            "rounded-full text-[9px] font-black uppercase tracking-widest px-4 py-1.5 border",
                                                            p.status === 'accepted' ? "bg-emerald-50 border-emerald-250 text-emerald-600 shadow-sm" :
                                                                p.status === 'applied' ? "bg-amber-50 border-amber-250 text-amber-600 shadow-sm" :
                                                                    "bg-slate-100 border-slate-200 text-slate-400"
                                                        )}>
                                                            {p.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        <Button size="sm" className="bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 rounded-xl font-black uppercase tracking-widest text-[9px] px-4 py-4 shadow-sm transition-all">
                                                            Review Logbook
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </TabsContent>

                    <TabsContent value="companies">
                        {loading ? (
                            <div className="py-20 text-center">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                            </div>
                        ) : companies.length === 0 ? (
                            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                No partner companies registered
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {companies.map((c) => (
                                    <Card key={c.id} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-6 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                                                    <Building2 className="w-8 h-8" />
                                                </div>
                                                <Badge className="bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-full font-black uppercase text-[8px] tracking-widest">
                                                    Verified
                                                </Badge>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-800 uppercase italic mb-2 tracking-tight">{c.name}</h4>
                                            <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6 line-clamp-2">{c.address}</p>
                                        </div>
                                        <div className="space-y-3 pt-6 border-t border-white/40">
                                            <div className="flex items-center gap-3 text-slate-450">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Active Partnerships: 12</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="configs">
                        <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Active Configurations</h3>
                            </div>
                            {loading ? (
                                <div className="py-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                                </div>
                            ) : configs.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                    No SIWES configurations active
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {configs.map((conf) => (
                                        <div key={conf.id} className="flex items-center justify-between p-6 rounded-2xl bg-white border border-slate-200/70 group hover:border-indigo-300 transition-all shadow-sm">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-indigo-600 font-black italic uppercase text-xs shadow-inner">
                                                    {conf.programme?.code || 'GEN'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 uppercase">
                                                        {conf.programme?.name || 'All Eligibility'}
                                                    </p>
                                                    <div className="flex gap-4 mt-1 font-mono">
                                                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Semester {conf.semester}</span>
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{conf.durationMonths} Months</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" className="rounded-xl font-black uppercase text-rose-500 hover:bg-rose-50 text-[10px] tracking-wider">Deactivate</Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
