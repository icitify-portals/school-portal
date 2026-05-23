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
        { label: "Active Frameworks", value: frameworks.length, icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Aligned Topics", value: "1,240", icon: Library, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "ITS Lessons", value: "450", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Compliance Score", value: "94%", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        <GraduationCap className="w-3 h-3" />
                        Curriculum Authority
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Academic <span className="text-indigo-600">Standards</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-xl">
                        Manage national and institutional frameworks across K-12, Universities, Polytechnics, and Colleges of Education.
                    </p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest gap-3">
                    <Plus className="w-5 h-5" />
                    Create New Framework
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all bg-white">
                        <CardContent className="p-8 flex items-center gap-6">
                            <div className={cn("p-4 rounded-2xl", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Frameworks List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-indigo-600 rounded-full" />
                        Regulatory Frameworks
                    </h2>
                    <div className="flex gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input className="pl-12 bg-white border-slate-100 rounded-xl focus:ring-indigo-500" placeholder="Search frameworks..." />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {frameworks.map((fw) => (
                        <Card key={fw.id} className="border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden group hover:border-indigo-200 transition-all">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row items-center p-8 gap-8">
                                    <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shrink-0 shadow-2xl">
                                        <FileText className="w-10 h-10" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic">{fw.name}</h3>
                                            <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-[9px] uppercase tracking-widest px-3 py-1">
                                                {fw.regulatoryBody}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                                            {fw.description || "Standardized curriculum mapping for academic progression and institutional compliance."}
                                        </p>
                                        <div className="flex gap-6 pt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{fw.level} Level</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active System</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                            <Settings className="w-6 h-6" />
                                        </Button>
                                        <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-indigo-600 transition-all font-black uppercase text-xs tracking-widest gap-3">
                                            View Mapping
                                            <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {frameworks.length === 0 && (
                        <div className="p-20 text-center space-y-4 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <Library className="w-16 h-16 text-slate-200 mx-auto" />
                            <h2 className="text-2xl font-black text-slate-900 uppercase italic">No Frameworks Defined</h2>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                Initialize your curriculum by creating a regulatory framework for your institutional level.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
