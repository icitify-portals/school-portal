"use client";

import { useEffect, useState } from "react";
import { 
    LayoutDashboard, 
    Plus, 
    Building2, 
    Users, 
    GraduationCap, 
    Activity, 
    ArrowRight,
    Search,
    Filter,
    Loader2,
    Globe,
    Award,
    Home,
    BookOpen,
    UserCheck,
    Library
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSuperAdminStats, onboardUnit } from "@/actions/super_admin";
import { cn } from "@/lib/utils";

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showOnboard, setShowOnboard] = useState(false);
    const [onboardData, setOnboardData] = useState({
        name: "",
        code: "",
        slug: "",
        type: "school" as any,
        academicTier: "k12" as any
    });

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        setLoading(true);
        const data = await getSuperAdminStats();
        setStats(data);
        setLoading(false);
    }

    const handleOnboard = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await onboardUnit(onboardData);
        if (res.success) {
            setShowOnboard(false);
            fetchStats();
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>;

    return (
        <div className="p-5 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
                        <Globe className="w-10 h-10 text-indigo-600" />
                        MASTER OVERWATCH
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                        Super-Admin Dashboard • Aggregate Analytics & Governance
                    </p>
                </div>
                <Button
                    onClick={() => setShowOnboard(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-6 rounded-2xl shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex gap-3 uppercase text-[10px] tracking-widest"
                >
                    <Plus className="w-5 h-5" /> Onboard New School
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Units" value={stats?.stats.units} icon={Building2} color="bg-blue-500" />
                <StatCard label="Total Students" value={stats?.stats.students} icon={GraduationCap} color="bg-indigo-500" />
                <StatCard label="Total Staff" value={stats?.stats.staff} icon={Users} color="bg-emerald-500" />
                <StatCard label="Organizations" value={stats?.stats.organizations} icon={Globe} color="bg-rose-500" />
                <StatCard label="Faculties" value={stats?.stats.faculties} icon={Award} color="bg-fuchsia-500" />
                <StatCard label="Depts & Units" value={stats?.stats.departments} icon={Home} color="bg-cyan-600" />
                <StatCard label="Programmes" value={stats?.stats.programmes} icon={BookOpen} color="bg-amber-500" />
                <StatCard label="Active Admissions" value={stats?.stats.admissions} icon={UserCheck} color="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Movement Log */}
                <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 bg-slate-900 text-white">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                <Activity className="w-6 h-6 text-indigo-400" />
                                Movement Tracking System
                            </CardTitle>
                            <Button variant="ghost" className="text-slate-400 hover:text-white uppercase text-[10px] font-black tracking-widest">
                                View Full Logs <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {stats?.recentMovements.map((log: any) => (
                                <div key={log.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-slate-100 rounded-2xl">
                                            {log.entityType === 'student' ? <GraduationCap className="w-6 h-6 text-indigo-600" /> : <Users className="w-6 h-6 text-emerald-600" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 italic">
                                                {log.entityType === 'student' ? 'Student Transfer' : 'Staff Assignment'}
                                            </p>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                {log.fromUnit || 'Onboarded'} → <span className="text-indigo-600">{log.toUnit}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">Processed By</p>
                                        <p className="text-xs font-black text-slate-900 italic">{log.movedBy}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions / Search */}
                <div className="space-y-6">
                    <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-indigo-600 text-white">
                        <h3 className="text-xl font-black italic uppercase tracking-tight mb-2">Global Search</h3>
                        <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-6 italic">Find any student or staff across all 600+ schools</p>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                            <Input 
                                placeholder="Matric, Name, or Email..." 
                                className="bg-white/10 border-white/20 text-white placeholder:text-indigo-200 rounded-2xl py-6 pl-12 font-bold focus:ring-white/50"
                            />
                        </div>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-white">
                        <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tight mb-6">Branch Governance</h3>
                        <div className="space-y-4">
                            <ActionBtn label="Audit All Sessions" icon={Activity} />
                            <ActionBtn label="Batch Result Publish" icon={Plus} />
                            <ActionBtn label="System Backups" icon={Filter} />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Onboarding Modal */}
            {showOnboard && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-300">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase italic">Onboard New Unit</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <form onSubmit={handleOnboard} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Unit Name</label>
                                    <Input
                                        placeholder="MIMS Secondary School, Oshodi"
                                        className="rounded-2xl border-slate-200 py-6 font-bold"
                                        value={onboardData.name}
                                        onChange={(e) => setOnboardData({...onboardData, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Code</label>
                                        <Input
                                            placeholder="MIMS-OSH"
                                            className="rounded-2xl border-slate-200 py-6 font-bold uppercase"
                                            value={onboardData.code}
                                            onChange={(e) => setOnboardData({...onboardData, code: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Slug (URL)</label>
                                        <Input
                                            placeholder="oshodi"
                                            className="rounded-2xl border-slate-200 py-6 font-bold lowercase"
                                            value={onboardData.slug}
                                            onChange={(e) => setOnboardData({...onboardData, slug: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Type</label>
                                        <select 
                                            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-black text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={onboardData.type}
                                            onChange={(e) => setOnboardData({...onboardData, type: e.target.value})}
                                        >
                                            <option value="school">Secondary School</option>
                                            <option value="campus">Primary School</option>
                                            <option value="college">College / Polytechnic</option>
                                            <option value="unit">University</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Academic Tier</label>
                                        <select 
                                            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-black text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={onboardData.academicTier}
                                            onChange={(e) => setOnboardData({...onboardData, academicTier: e.target.value})}
                                        >
                                            <option value="k12">K-12 (Primary/Secondary)</option>
                                            <option value="tertiary">Tertiary (Poly/Uni)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowOnboard(false)}
                                        className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        Onboard Unit
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6 flex items-center gap-5">
                <div className={cn("p-4 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6", color)}>
                    <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{value?.toLocaleString() || 0}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function ActionBtn({ label, icon: Icon }: any) {
    return (
        <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 group transition-all duration-300">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-slate-700 group-hover:text-indigo-900">{label}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </button>
    );
}
