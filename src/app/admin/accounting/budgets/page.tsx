"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    PieChart,
    TrendingUp,
    AlertCircle,
    BadgeCheck,
    History,
    Search,
    Loader2,
    DollarSign,
    Building2,
    BarChart3
} from "lucide-react";
import { getBudgets, createBudget, getBudgetAnalysis } from "@/actions/budgets";
import { getDepartments } from "@/actions/departments";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function BudgetManagementPage() {
    const [budgets, setBudgets] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [selectedDept, setSelectedDept] = useState("");
    const [academicYear, setAcademicYear] = useState("2024/2025");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<any>("operating");
    const [notes, setNotes] = useState("");

    // Analysis State
    const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [budgetData, deptData] = await Promise.all([
            getBudgets(),
            getDepartments()
        ]);
        setBudgets(budgetData);
        setDepartments(deptData);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await createBudget({
            departmentId: parseInt(selectedDept),
            academicYear,
            amount,
            category,
            notes
        });

        if (res.success) {
            setIsAdding(false);
            setAmount("");
            setNotes("");
            fetchData();
        } else {
            alert(res.error);
        }
        setSubmitting(false);
    };

    const viewAnalysis = async (deptId: number, year: string) => {
        const analysis = await getBudgetAnalysis(deptId, year);
        setSelectedAnalysis({ deptId, year, ...analysis });
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Budget Registry</h2>
                    <p className="text-slate-500 mt-1">Institutional expenditure limits and allocation control</p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/20 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Set New Budget
                </Button>
            </div>

            {isAdding && (
                <Card className="mb-10 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-white border-b border-slate-100">
                        <CardTitle className="text-lg">New Budget Allocation</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={selectedDept}
                                        onChange={(e) => setSelectedDept(e.target.value)}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Academic Year</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={academicYear}
                                        onChange={(e) => setAcademicYear(e.target.value)}
                                    >
                                        <option value="2024/2025">2024/2025</option>
                                        <option value="2025/2026">2025/2026</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Amount (NGN)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="5000000"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="operating">Operating (Daily Expenses)</option>
                                        <option value="capital">Capital (Infrastructure/Equipment)</option>
                                        <option value="personnel">Personnel (Allowances)</option>
                                        <option value="research">Research Grants</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Notes (Optional)</label>
                                    <input
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Basis for this allocation..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="h-11 px-6 rounded-xl">Cancel</Button>
                                <Button type="submit" disabled={submitting} className="bg-slate-900 px-10 h-11 rounded-xl">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Budget"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="py-20 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                        </div>
                    ) : budgets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <PieChart className="w-12 h-12 text-slate-300 mb-4" />
                            <h4 className="text-lg font-bold text-slate-400">No budgets defined</h4>
                            <p className="text-sm text-slate-400 text-center max-w-xs px-4">Allocate funds to departments to start tracking utilization and preventing over-expenditure.</p>
                        </div>
                    ) : (
                        budgets.map((b) => (
                            <Card key={b.id} className="border-none shadow-sm group hover:shadow-md transition-all cursor-pointer overflow-hidden" onClick={() => viewAnalysis(b.departmentId, b.academicYear)}>
                                <CardContent className="p-0">
                                    <div className="flex items-center">
                                        <div className={cn(
                                            "w-2 self-stretch",
                                            b.category === 'capital' ? "bg-purple-500" :
                                                b.category === 'research' ? "bg-amber-500" :
                                                    b.category === 'personnel' ? "bg-rose-500" : "bg-indigo-500"
                                        )} />
                                        <div className="p-6 flex-1 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-extrabold text-slate-900">{b.department?.name}</h3>
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 border-slate-200">
                                                        {b.academicYear}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-500 capitalize">{b.category} Budget</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-slate-900">₦{parseFloat(b.amount).toLocaleString()}</p>
                                                <p className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                                                    <BadgeCheck className="w-3 h-3" />
                                                    Active Allocation
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="text-white overflow-hidden relative border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <BarChart3 className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-300" />
                                Instant Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className=" p-6">
                            {selectedAnalysis ? (
                                <div className="space-y-6 relative z-10">
                                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Utilization Rate</p>
                                        <div className="flex items-end gap-2">
                                            <p className="text-4xl font-black tracking-tighter">{selectedAnalysis.utilization.toFixed(1)}%</p>
                                            <p className="text-xs text-indigo-300 mb-1.5">Consumed</p>
                                        </div>
                                        <div className="mt-4 h-2 w-full bg-indigo-950 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    selectedAnalysis.utilization > 90 ? "bg-rose-500" : "bg-emerald-400"
                                                )}
                                                style={{ width: `${Math.min(selectedAnalysis.utilization, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-indigo-300 mb-1">Actual Spent</p>
                                            <p className="font-bold text-lg">₦{selectedAnalysis.actual.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-indigo-300 mb-1">Remaining</p>
                                            <p className="font-bold text-lg">₦{selectedAnalysis.remaining.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {selectedAnalysis.utilization > 90 && (
                                        <div className="bg-rose-500/20 border border-rose-500/30 p-3 rounded-xl flex gap-3">
                                            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
                                            <p className="text-xs text-rose-100 leading-tight font-medium">
                                                Critical: Budget threshold exceeded or nearly full. Expenditure controls will now block automated approvals for this department.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-10 text-center space-y-3">
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Search className="w-6 h-6 text-indigo-300" />
                                    </div>
                                    <p className="text-sm text-indigo-200">Select a budget on the left to view utilization analysis</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                            <CardTitle className="text-base text-slate-700 font-bold flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Recent Approvals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                    <BadgeCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Lab Chemicals</p>
                                    <p className="text-[10px] text-slate-500">₦240,000 • Chemistry Dept</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
