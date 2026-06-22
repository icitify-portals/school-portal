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
    Search
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
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
                        <Briefcase className="w-10 h-10 text-indigo-600" />
                        SIWES Management
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Industrial Work Experience Scheme Administration</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-black text-white px-6 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Configuration
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl rounded-2xl bg-indigo-600 text-white p-8 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Active Placements</p>
                    <h3 className="text-4xl font-black italic">{placements.length}</h3>
                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest italic tracking-tight">Across all programmes</p>
                </Card>
                <Card className="border-none shadow-xl rounded-2xl bg-white p-8 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Logbooks</p>
                    <h3 className="text-4xl font-black italic text-indigo-600">
                        {placements.reduce((acc, p) => acc + p.logbooks?.filter((l: any) => l.status === 'submitted').length, 0)}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Awaiting Officer Review</p>
                </Card>
                <Card className="border-none shadow-xl rounded-2xl bg-white p-8 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company Partners</p>
                    <h3 className="text-4xl font-black italic text-emerald-600">{companies.length}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic italic">Approved Organizations</p>
                </Card>
            </div>

            <Tabs defaultValue="placements" className="space-y-6">
                <TabsList className="bg-white p-1 rounded-2xl shadow-lg border-none h-14 w-full md:w-auto">
                    <TabsTrigger value="placements" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Active Placements</TabsTrigger>
                    <TabsTrigger value="companies" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Partner Companies</TabsTrigger>
                    <TabsTrigger value="configs" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Eligibility Config</TabsTrigger>
                </TabsList>

                <TabsContent value="placements">
                    <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest italic border-b border-slate-50">
                                        <th className="px-10 py-6">Student</th>
                                        <th className="px-10 py-6">Company</th>
                                        <th className="px-10 py-6">Duration</th>
                                        <th className="px-10 py-6">Status</th>
                                        <th className="px-10 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {placements.map((p) => (
                                        <tr key={p.id} className="group hover:bg-slate-50 transition-all">
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 uppercase italic">{p.student?.user?.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{p.student?.matricNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{p.company?.name}</span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase">{p.startDate ? new Date(p.startDate).toLocaleDateString() : 'NOT SET'}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <Badge className={cn(
                                                    "rounded-full text-[9px] font-black uppercase tracking-widest italic px-4 py-1.5",
                                                    p.status === 'accepted' ? "bg-emerald-50 text-emerald-600 border-none" :
                                                        p.status === 'applied' ? "bg-amber-50 text-amber-600 border-none" :
                                                            "bg-slate-100 text-slate-400 border-none"
                                                )}>
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <Button size="sm" className="bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all">
                                                    Review Logbook
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="companies">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map((c) => (
                            <Card key={c.id} className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 group hover:scale-[1.02] transition-transform">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Building2 className="w-8 h-8" />
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-600 rounded-full font-black uppercase text-[8px] tracking-widest">
                                        Verified
                                    </Badge>
                                </div>
                                <h4 className="text-lg font-black text-slate-800 uppercase italic mb-2 tracking-tight">{c.name}</h4>
                                <p className="text-xs text-slate-500 font-medium mb-6 line-clamp-2">{c.address}</p>
                                <div className="space-y-3 pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Active Partnerships: 12</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="configs">
                    <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-800 uppercase italic">Active Configurations</h3>
                        </div>
                        <div className="space-y-4">
                            {configs.map((conf) => (
                                <div key={conf.id} className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-indigo-600 font-black italic uppercase text-xs">
                                            {conf.programme?.code || 'GEN'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 uppercase italic">
                                                {conf.programme?.name || 'All Eligibility'}
                                            </p>
                                            <div className="flex gap-4 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semester {conf.semester}</span>
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{conf.durationMonths} Months</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" className="rounded-xl font-black uppercase text-rose-500 hover:bg-rose-50 text-[10px]">Deactivate</Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
