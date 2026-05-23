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
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Salary Structures</h1>
                    <p className="text-slate-500 mt-1">Configure grade-level compensation, allowances, and mandatory deductions.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
                        <div className="flex items-center gap-2 mb-6 text-indigo-600">
                            <Plus className="w-5 h-5" />
                            <h2 className="font-semibold">Define Pay Scale</h2>
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
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Grade Level</label>
                                <input name="gradeLevel" type="text" placeholder="e.g. L1" required className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Base Salary (Monthly)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
                                    <input name="basePay" type="number" step="0.01" required className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 text-green-600 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> Allowances
                                    </label>
                                    <input name="allowances" type="number" step="0.01" defaultValue="0" className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 text-red-600 flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3" /> Deductions
                                    </label>
                                    <input name="deductions" type="number" step="0.01" defaultValue="0" className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                                </div>
                            </div>

                            <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-100">
                                Save Structure
                            </button>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800">Current Pay Scales</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                            {structures.map((s) => (
                                <div key={s.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-slate-900 text-white px-3 py-1 rounded-md text-xs font-bold tracking-widest">{s.gradeLevel}</div>
                                        <button className="text-slate-300 hover:text-red-500 transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Base Pay:</span>
                                            <span className="font-mono font-bold text-slate-900">₦{parseFloat(s.basePay).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-green-600">
                                            <span>(+) Allowances:</span>
                                            <span className="font-mono">+₦{parseFloat(s.allowances || "0").toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-red-500 border-b border-slate-100 pb-2">
                                            <span>(-) Deductions:</span>
                                            <span className="font-mono">-₦{parseFloat(s.deductions || "0").toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-xs font-bold uppercase text-slate-400">Net Take Home:</span>
                                            <span className="text-lg font-extrabold text-slate-900">₦{(parseFloat(s.basePay) + parseFloat(s.allowances || "0") - parseFloat(s.deductions || "0")).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
