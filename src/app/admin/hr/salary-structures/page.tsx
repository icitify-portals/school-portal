import { db } from "@/db/db";
import { salaryStructures } from "@/db/schema";
import {
    Calculator,
    Plus,
    Trash2,
    Save,
    Banknote,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function HRSalaryStructuresPage() {
    const structures = await db.select().from(salaryStructures);

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-650/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Calculator className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Salary Structures
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Configure grade-level compensation, allowances, and mandatory deductions
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Form */}
            <div className="lg:col-span-1">
                <div className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl p-8 rounded-[2.5rem] sticky top-8">
                    <div className="flex items-center gap-3 mb-6 text-indigo-600">
                        <Plus className="w-5 h-5" />
                        <h2 className="text-lg font-black uppercase tracking-tight italic">Define Pay Scale</h2>
                    </div>

                    <form action={async (formData) => {
                        "use server"
                        const gradeLevel = formData.get("gradeLevel") as string;
                        const basePay = formData.get("basePay") as string;
                        const allowances = formData.get("allowances") as string;
                        const deductions = formData.get("deductions") as string;

                        await db.insert(salaryStructures).values({
                            gradeLevel,
                            basePay,
                            allowances,
                            deductions
                        });
                        revalidatePath("/admin/hr/salary-structures");
                    }} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Grade Level</label>
                            <input name="gradeLevel" type="text" placeholder="e.g. L1" required className="w-full px-4 h-11 border border-white/60 bg-white/60 focus:bg-white rounded-xl text-sm font-bold text-slate-800 outline-none transition-all shadow-inner" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Base Salary (Monthly)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₦</span>
                                <input name="basePay" type="number" step="0.01" required className="w-full pl-9 pr-4 h-11 border border-white/60 bg-white/60 focus:bg-white rounded-xl text-sm font-bold text-slate-800 outline-none transition-all shadow-inner" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-green-600 uppercase tracking-widest ml-2 flex items-center gap-1">
                                    <TrendingUp className="w-3.5 h-3.5" /> Allowances
                                </label>
                                <input name="allowances" type="number" step="0.01" defaultValue="0" className="w-full px-4 h-11 border border-white/60 bg-white/60 focus:bg-white rounded-xl text-sm font-bold text-slate-800 outline-none transition-all shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-rose-600 uppercase tracking-widest ml-2 flex items-center gap-1">
                                    <TrendingDown className="w-3.5 h-3.5" /> Deductions
                                </label>
                                <input name="deductions" type="number" step="0.01" defaultValue="0" className="w-full px-4 h-11 border border-white/60 bg-white/60 focus:bg-white rounded-xl text-sm font-bold text-slate-800 outline-none transition-all shadow-inner" />
                            </div>
                        </div>

                        <button className="w-full bg-indigo-650 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-wider h-12 gap-2 active:scale-95 transition-all shadow-md mt-4">
                            Save Structure
                        </button>
                    </form>
                </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2">
                <div className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                    <div className="p-8 border-b border-white/40 bg-white/40">
                        <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Current Pay Scales</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-white/20">
                        {structures.map((s) => (
                            <div key={s.id} className="p-6 rounded-[2rem] border border-white/40 bg-white/60 shadow-md hover:shadow-lg transition-all group relative">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase">{s.gradeLevel}</div>
                                    <button className="text-slate-400 hover:text-rose-600 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                                        <span>Base Pay:</span>
                                        <span className="font-mono font-black text-slate-800 text-base">₦{parseFloat(s.basePay).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-emerald-600">
                                        <span>(+) Allowances:</span>
                                        <span className="font-mono font-extrabold">₦{parseFloat(s.allowances || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-rose-500 border-b border-white/40 pb-3">
                                        <span>(-) Deductions:</span>
                                        <span className="font-mono font-extrabold">₦{parseFloat(s.deductions || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Net Take Home:</span>
                                        <span className="text-xl font-black text-indigo-600">₦{(parseFloat(s.basePay) + parseFloat(s.allowances || "0") - parseFloat(s.deductions || "0")).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
    );
}
