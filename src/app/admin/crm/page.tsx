import { getLeads } from "@/actions/crm";
import { 
    Users, 
    Search, 
    Filter, 
    Plus, 
    MoreHorizontal, 
    Mail, 
    Phone, 
    Calendar,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function CRMDashboard() {
    const { leads, error } = await getLeads() as any;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'contacted': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'interested': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'converted': return 'bg-green-100 text-green-700 border-green-200';
            case 'junk': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                        Leads <span className="text-indigo-600">Management</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">Track and convert prospective students from all channels.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                    </button>
                    <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black transition-all hover:scale-105 shadow-xl shadow-indigo-600/20">
                        <Plus className="w-5 h-5" />
                        <span>Add New Lead</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Leads", value: leads?.length || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "New Today", value: "0", icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Interested", value: leads?.filter((l:any) => l.status === 'interested').length || 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Conversion Rate", value: "0%", icon: ArrowUpRight, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
                        <div className={cn("p-4 rounded-2xl", stat.bg)}>
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-indigo-500/5 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name, email or phone..." 
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-sm font-bold text-slate-400">Showing {leads?.length || 0} leads</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Lead Name</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Info</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Interest</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned To</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Created</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {leads?.map((lead: any) => (
                                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                                {lead.name[0]}
                                            </div>
                                            <span className="font-bold text-slate-900">{lead.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                <Mail className="w-3 h-3 text-slate-400" />
                                                {lead.email}
                                            </div>
                                            {lead.phone && (
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                    {lead.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <span className="text-sm font-bold text-slate-900">{lead.programmeName || "Unspecified"}</span>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{lead.unitName || "General"}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border", getStatusColor(lead.status))}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-slate-600">
                                        {lead.assignedTo || "Unassigned"}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Link 
                                            href={`/admin/crm/lead/${lead.id}`}
                                            className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-slate-100 flex items-center justify-center w-10 h-10"
                                        >
                                            <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {leads?.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-xl font-black text-slate-900">No Leads Found</h3>
                            <p className="text-slate-500 font-medium">Capture inquiries from your website or add them manually.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
