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
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Engine: Payroll</h1>
                    <p className="text-slate-500 mt-1 italic">Process monthly staff compensation with automated Ledger posting.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Control Panel */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all scale-150 rotate-12">
                        <Cpu className="w-32 h-32" />
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-xl">
                                <Zap className="w-6 h-6 fill-white text-white" />
                            </div>
                            <h2 className="text-xl font-bold uppercase tracking-widest text-blue-400">Run Engine</h2>
                        </div>

                        <form action={async (formData) => {
                            "use server"
                            const month = parseInt(formData.get("month") as string);
                            const year = parseInt(formData.get("year") as string);
                            await processPayroll(month, year);
                        }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Target Month</label>
                                    <select name="month" className="w-full bg-slate-800 border-none rounded-xl p-3 text-lg font-bold focus:ring-2 focus:ring-blue-500">
                                        {months.map((m, idx) => (
                                            <option key={m} value={idx + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Target Year</label>
                                    <select name="year" className="w-full bg-slate-800 border-none rounded-xl p-3 text-lg font-bold focus:ring-2 focus:ring-blue-500">
                                        <option value={currentYear}>{currentYear}</option>
                                        <option value={currentYear - 1}>{currentYear - 1}</option>
                                    </select>
                                </div>
                            </div>

                            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3">
                                <Play className="w-6 h-6 fill-white" />
                                DISBURSE PAYROLL
                            </button>
                        </form>

                        <div className="pt-8 border-t border-slate-800 flex items-center gap-4">
                            <div className="p-3 bg-slate-800 rounded-full">
                                <Database className="w-5 h-5 text-blue-400" />
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed italic">
                                * Warning: Executing this engine will auto-generate {staff.length} Journal Entries
                                and post them to the General Ledger as "Payroll Disbursement".
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status / Log */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-center text-center space-y-6">
                    <div className="mx-auto p-6 bg-slate-50 rounded-full">
                        <FileText className="w-12 h-12 text-slate-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Payroll Archives</h3>
                        <p className="text-slate-500 text-sm mt-2">Historical data for monthly disbursements will appear here after processing.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Last Run</p>
                            <p className="font-bold text-slate-700">None</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Batch ID</p>
                            <p className="font-bold text-slate-700">N/A</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
