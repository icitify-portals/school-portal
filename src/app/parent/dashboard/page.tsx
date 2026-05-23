import { getParentChildren } from "@/actions/parent";
import { ShieldCheck, Plus, User, GraduationCap, MapPin, ArrowRight, Wallet, ClipboardList } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ParentDashboard() {
    const { children, error } = await getParentChildren() as any;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl shadow-indigo-500/5">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                        Parent <span className="text-indigo-600">Dashboard</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Manage and monitor your children's academic progress across all branches.</p>
                </div>
                <Link 
                    href="/parent/add-child"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-600/20 w-fit"
                >
                    <Plus className="w-5 h-5" />
                    <span>Link New Child</span>
                </Link>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl font-medium">
                    {error}
                </div>
            )}

            {/* Children Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {children?.map((child: any) => (
                    <div 
                        key={child.id}
                        className="group bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all overflow-hidden flex flex-col"
                    >
                        {/* Top Accent */}
                        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                        
                        <div className="p-8 space-y-6 flex-1">
                            <div className="flex items-start justify-between">
                                <div className="p-4 bg-indigo-50 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                    <User className="w-8 h-8 text-indigo-600" />
                                </div>
                                <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                                    {child.relationship}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                    {child.firstName} {child.lastName}
                                </h3>
                                <p className="text-slate-400 font-bold text-sm tracking-tight">{child.matricNumber}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <MapPin className="w-4 h-4 text-indigo-400" />
                                    <span className="text-sm font-bold">{child.unitName}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                                    <span className="text-sm font-bold">{child.programmeName}</span>
                                </div>
                            </div>

                            {/* Stats Preview */}
                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Level</p>
                                    <p className="text-lg font-black text-slate-900">{child.currentLevel}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dept</p>
                                    <p className="text-sm font-black text-slate-900 truncate">{child.deptName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="p-4 bg-slate-50 flex items-center justify-between">
                            <div className="flex gap-2">
                                <div className="p-2 bg-white rounded-lg border border-slate-200" title="Finance">
                                    <Wallet className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="p-2 bg-white rounded-lg border border-slate-200" title="Attendance">
                                    <ClipboardList className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                            <Link 
                                href={`/parent/child/${child.id}`}
                                className="flex items-center gap-2 text-indigo-600 font-black text-sm group-hover:translate-x-1 transition-transform"
                            >
                                <span>View Portal</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                ))}

                {children?.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="p-6 bg-slate-100 rounded-full mb-4">
                            <User className="w-12 h-12 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No Children Linked</h3>
                        <p className="text-slate-500 mb-6 font-medium">You haven't linked any children to your account yet.</p>
                        <Link 
                            href="/parent/add-child"
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg"
                        >
                            Link My First Child
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
