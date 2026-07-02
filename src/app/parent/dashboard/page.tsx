import { getParentChildren } from "@/actions/parent";
import { ShieldCheck, Plus, User, GraduationCap, MapPin, ArrowRight, Wallet, ClipboardList, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default async function ParentDashboard() {
    const { children, error } = await getParentChildren() as any;

    return (
        <div className="p-4 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 animate-in fade-in duration-700">
            {/* Bento Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-5 blur-2xl">
                    <User className="w-[500px] h-[500px] transform translate-x-1/4 -translate-y-1/4" />
                </div>
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-black uppercase tracking-widest text-indigo-300 mb-4">
                        Guardian Portal
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
                        Parent Overview
                    </h1>
                    <p className="text-slate-400 font-medium text-sm max-w-lg">Monitor academics, finance, and attendance records securely.</p>
                </div>
                <div className="relative z-10">
                    <Link 
                        href="/parent/add-child"
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/50 text-xs"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Link New Child</span>
                    </Link>
                </div>
            </div>

            {error && (
                <div className="p-5 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl font-bold flex items-center gap-3">
                    <Activity className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Bento Children Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {children?.map((child: any) => (
                    <Card 
                        key={child.id}
                        className="border-none bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-shadow overflow-hidden p-2 group"
                    >
                        <CardContent className="p-0">
                            <div className="flex flex-col lg:flex-row gap-2 h-full">
                                
                                {/* Main Identity Bento Block */}
                                <div className="bg-slate-50 rounded-[1.5rem] p-8 flex-1 flex flex-col justify-between">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="p-4 bg-white shadow-sm rounded-[1.2rem] group-hover:scale-105 transition-transform duration-300">
                                            <User className="w-8 h-8 text-indigo-600" />
                                        </div>
                                        <span className="px-4 py-2 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                                            {child.relationship}
                                        </span>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                                            {child.firstName} {child.lastName}
                                        </h3>
                                        <div className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-500 font-bold text-xs font-mono mb-6">
                                            {child.matricNumber}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mt-auto">
                                        <div className="flex items-center gap-3 text-slate-600 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                            <MapPin className="w-5 h-5 text-indigo-400" />
                                            <span className="text-xs font-bold">{child.unitName}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                            <GraduationCap className="w-5 h-5 text-indigo-400" />
                                            <span className="text-xs font-bold truncate">{child.programmeName}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Stats Bento Blocks */}
                                <div className="w-full lg:w-[240px] flex flex-col gap-2">
                                    {/* Level & Dept */}
                                    <div className="bg-indigo-600 text-white rounded-[1.5rem] p-6 flex flex-col justify-center relative overflow-hidden flex-1">
                                        <div className="absolute -right-4 -bottom-4 opacity-10">
                                            <GraduationCap className="w-24 h-24" />
                                        </div>
                                        <div className="relative z-10 mb-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Current Level</p>
                                            <p className="text-4xl font-black">{child.currentLevel}</p>
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Department</p>
                                            <p className="text-sm font-bold truncate">{child.deptName}</p>
                                        </div>
                                    </div>

                                    {/* Action Links */}
                                    <div className="bg-slate-900 rounded-[1.5rem] p-4 flex flex-col justify-between h-[120px]">
                                        <div className="flex gap-2 justify-center">
                                            <div className="flex-1 bg-white/10 rounded-xl flex items-center justify-center py-2 tooltip" title="Finance Overview">
                                                <Wallet className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div className="flex-1 bg-white/10 rounded-xl flex items-center justify-center py-2 tooltip" title="Attendance">
                                                <ClipboardList className="w-5 h-5 text-blue-400" />
                                            </div>
                                        </div>
                                        <Link 
                                            href={`/parent/child/${child.id}`}
                                            className="w-full bg-white text-slate-900 rounded-xl py-3 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                        >
                                            <span>Enter Portal</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {children?.length === 0 && (
                    <div className="xl:col-span-2 min-h-[50vh] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-none shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                            <User className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Wards Linked</h3>
                        <p className="text-slate-500 mb-8 font-medium">You haven't linked any children to your parent account yet.</p>
                        <Link 
                            href="/parent/add-child"
                            className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs"
                        >
                            Link My First Child
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
