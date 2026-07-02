import { getFrameworks } from "@/actions/curriculum";
import { 
    BookOpen, 
    Settings, 
    Plus, 
    Search, 
    ChevronRight, 
    GraduationCap, 
    Library, 
    ShieldCheck,
    Globe,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function CurriculumDashboard() {
    const frameworks = await getFrameworks();

    const stats = [
        { label: "Active Frameworks", value: frameworks.length, icon: Globe, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-400/30" },
        { label: "Aligned Topics", value: "1,240", icon: Library, color: "text-indigo-400", bg: "bg-indigo-500/20", border: "border-indigo-400/30" },
        { label: "ITS Lessons", value: "450", icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-400/30" },
        { label: "Compliance Score", value: "94%", icon: ShieldCheck, color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-400/30" },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 mb-4 backdrop-blur-md shadow-inner">
                                <GraduationCap className="w-3.5 h-3.5" />
                                Curriculum Authority
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase flex items-center gap-4">
                                Academic <span className="text-indigo-400">Standards</span>
                            </h1>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90 mt-2">
                                Manage national and institutional frameworks across K-12, Universities, Polytechnics, and Colleges of Education.
                            </p>
                        </div>
                        
                        <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner gap-2 flex-wrap">
                            <button className="flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg hover:-translate-y-1">
                                <Plus className="w-4 h-4" /> Create Framework
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid - Bento Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <Card key={i} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500">
                            <CardContent className="p-8 flex items-center gap-6">
                                <div className={cn("p-5 rounded-2xl border backdrop-blur-md shadow-inner", stat.bg, stat.border)}>
                                    <stat.icon className={cn("w-8 h-8", stat.color)} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Frameworks List */}
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="border-b border-white/40 bg-white/40 p-8 lg:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <CardTitle className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                                <Library className="w-6 h-6" />
                            </div>
                            Regulatory Frameworks
                        </CardTitle>
                        <div className="flex gap-4">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input className="pl-12 bg-white/80 backdrop-blur-md border-white/40 shadow-inner rounded-xl h-12 focus:ring-indigo-500 font-bold text-slate-900" placeholder="Search frameworks..." />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 lg:p-10">
                        <div className="grid grid-cols-1 gap-6">
                            {frameworks.map((fw) => (
                                <div key={fw.id} className="group border border-slate-200/60 bg-white/80 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all rounded-[2.5rem] overflow-hidden">
                                    <div className="flex flex-col md:flex-row items-center p-8 gap-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors" />
                                        
                                        <div className="w-24 h-24 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] flex items-center justify-center text-indigo-300 shrink-0 shadow-xl shadow-slate-900/20 group-hover:scale-110 transition-transform duration-500 border border-slate-700">
                                            <FileText className="w-10 h-10" />
                                        </div>
                                        
                                        <div className="flex-1 space-y-3 relative z-10">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <h3 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tighter">{fw.name}</h3>
                                                <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                                                    {fw.regulatoryBody}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                                                {fw.description || "Standardized curriculum mapping for academic progression and institutional compliance."}
                                            </p>
                                            <div className="flex flex-wrap gap-6 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{fw.level} Level</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active System</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 relative z-10 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                                            <button className="h-12 w-12 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-inner transition-all">
                                                <Settings className="w-5 h-5" />
                                            </button>
                                            <button className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg">
                                                View Mapping
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {frameworks.length === 0 && (
                                <div className="p-20 text-center space-y-4 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-300">
                                    <Library className="w-20 h-20 text-slate-300 mx-auto" />
                                    <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">No Frameworks Defined</h2>
                                    <p className="text-slate-500 font-medium max-w-sm mx-auto text-lg">
                                        Initialize your curriculum by creating a regulatory framework for your institutional level.
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
