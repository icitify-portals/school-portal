import { getLeads } from "@/actions/admission_extended";
import { LeadsBoard } from "./leads-board";
import { Plus, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
    const leads = await getLeads();

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="w-12 h-12 text-blue-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    Prospective Student Leads
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Track inquiries and manage prospective student pipelines.
                            </p>
                        </div>
                        
                        <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner gap-2 flex-wrap">
                            <button className="flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap bg-blue-600 text-white hover:bg-blue-500 shadow-lg hover:-translate-y-1">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Lead
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-[3rem] p-8 overflow-hidden">
                    <LeadsBoard initialLeads={leads} />
                </div>
            </div>
        </div>
    );
}
