import { processPayroll, getStaffProfiles } from "@/actions/hr";
import {
    Cpu,
    Play,
    FileText,
    CheckCircle2,
    AlertCircle,
    Database,
    Zap
} from "lucide-react";

export default async function HRPayrollPage() {
    const staff = await getStaffProfiles();
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const currentYear = new Date().getFullYear();

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-650/30 to-blue-650/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Cpu className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Payroll Engine
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Generate monthly payroll batches for Finance approval and disbursement
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Control Panel */}
            <div className="bg-slate-950/95 border border-slate-800 rounded-[3rem] p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all scale-150 rotate-12 duration-500">
                    <Cpu className="w-32 h-32" />
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600/90 border border-indigo-500/50 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-indigo-500/10">
                            <Zap className="w-6 h-6 fill-white text-white" />
                        </div>
                        <h2 className="text-lg font-black uppercase tracking-widest text-indigo-400">Run Engine</h2>
                    </div>

                    <form action={async (formData) => {
                        "use server"
                        const month = parseInt(formData.get("month") as string);
                        const year = parseInt(formData.get("year") as string);
                        await processPayroll(month, year);
                    }} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Target Month</label>
                                <select name="month" className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 h-12 text-sm font-bold focus:bg-slate-900 outline-none transition-all">
                                    {months.map((m, idx) => (
                                        <option key={m} value={idx + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Target Year</label>
                                <select name="year" className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 h-12 text-sm font-bold focus:bg-slate-900 outline-none transition-all">
                                    <option value={currentYear}>{currentYear}</option>
                                    <option value={currentYear - 1}>{currentYear - 1}</option>
                                </select>
                            </div>
                        </div>

                        <button className="w-full bg-indigo-650 hover:bg-indigo-700 text-white py-5 rounded-[1.5rem] font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-3">
                            <Play className="w-5 h-5 fill-white" />
                            GENERATE PAYROLL BATCH
                        </button>
                    </form>

                    <div className="pt-8 border-t border-slate-800/80 flex items-center gap-4">
                        <div className="p-3 bg-slate-900 rounded-full border border-slate-800">
                            <Database className="w-5 h-5 text-indigo-400" />
                        </div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider pl-2 leading-relaxed">
                            * Notice: Executing this engine will generate a pending batch for {staff.length} staff members. It will be sent to Finance for approval and disbursement.
                        </p>
                    </div>
                </div>
            </div>

            {/* Status / Log */}
            <div className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8 lg:p-10 flex flex-col justify-center text-center space-y-6">
                <div className="mx-auto p-6 bg-slate-50 border border-slate-100 rounded-full shadow-inner">
                    <FileText className="w-12 h-12 text-slate-350" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Payroll Archives</h3>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2 leading-relaxed">Historical data for monthly disbursements will appear here after processing.</p>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="p-6 bg-white/50 border border-white/60 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Last Run</p>
                        <p className="text-lg font-black text-slate-700 uppercase">None</p>
                    </div>
                    <div className="p-6 bg-white/50 border border-white/60 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Batch ID</p>
                        <p className="text-lg font-black text-indigo-650 uppercase">N/A</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
