"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Settings2,
    Plus,
    Trash2,
    Save,
    Loader2,
    Shield,
    BookOpen,
} from "lucide-react";
import {
    getDepartmentCriteria,
    saveDepartmentCriteria,
    getDepartmentsList,
} from "@/actions/promotion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Rule {
    field: string;
    operator: string;
    value: number;
    message: string;
}

export default function CriteriaPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [minCgpa, setMinCgpa] = useState(1.0);
    const [minCredits, setMinCredits] = useState(25);
    const [rules, setRules] = useState<Rule[]>([]);
    const [isDefault, setIsDefault] = useState(true);

    useEffect(() => {
        getDepartmentsList().then(res => {
            if (res.success && res.departments) setDepartments(res.departments);
            setLoading(false);
        });
    }, []);

    const loadCriteria = async (deptId: number) => {
        setSelectedDept(deptId);
        const res = await getDepartmentCriteria(deptId);
        if (res.success && res.criteria) {
            setMinCgpa(parseFloat(res.criteria.minCgpa || '1.00'));
            setMinCredits(res.criteria.minCreditsPerSession || 25);
            setRules(res.criteria.additionalRules || []);
            setIsDefault(res.criteria.isDefault || false);
        }
    };

    const addRule = () => {
        setRules([...rules, { field: "cgpa", operator: ">=", value: 2.0, message: "" }]);
    };

    const removeRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const updateRule = (index: number, updates: Partial<Rule>) => {
        setRules(rules.map((r, i) => i === index ? { ...r, ...updates } : r));
    };

    const handleSave = async () => {
        if (!selectedDept) return;
        setSaving(true);
        const res = await saveDepartmentCriteria(selectedDept, {
            minCgpa,
            minCreditsPerSession: minCredits,
            additionalRules: rules,
        });
        if (res.success) {
            toast.success(res.message);
            setIsDefault(false);
        } else {
            toast.error(res.error || "Failed to save.");
        }
        setSaving(false);
    };

    return (
        <div className="p-6 md:p-10 max-w-[1600px] w-full mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg shadow-orange-200">
                    <Settings2 className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                        Promotion Criteria
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Set per-department promotion requirements
                    </p>
                </div>
            </div>

            {/* University Defaults */}
            <Card className="-to-br from-slate-50 to-slate-100 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-slate-600" />
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-600">
                            University Minimum (Cannot Be Lowered)
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min CGPA</p>
                            <p className="text-xl font-black text-slate-900">&gt; 1.00</p>
                            <p className="text-[10px] text-slate-500">Below = Withdraw</p>
                        </div>
                        <div className="bg-white rounded-xl p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min Credits/Session</p>
                            <p className="text-xl font-black text-slate-900">&gt; 25</p>
                            <p className="text-[10px] text-slate-500">Below = Withdraw</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Department List */}
                <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-4 space-y-2">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Departments
                        </h3>
                        {loading ? (
                            <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></div>
                        ) : (
                            departments.map((dept: any) => (
                                <button
                                    key={dept.id}
                                    onClick={() => loadCriteria(dept.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl font-bold text-xs transition-all",
                                        selectedDept === dept.id
                                            ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-300 shadow-md"
                                            : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                                    )}
                                >
                                    <span className="font-black text-[10px] uppercase tracking-wider">{dept.code}</span>
                                    <br />{dept.name}
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Criteria Editor */}
                <div className="md:col-span-2 space-y-4">
                    {selectedDept ? (
                        <>
                            <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                                <CardContent className="p-6 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-sm uppercase tracking-widest text-slate-700">
                                            Department Thresholds
                                        </h3>
                                        {isDefault && (
                                            <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[8px]">
                                                USING DEFAULTS
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                                Min CGPA (≥ 1.0)
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="1.0"
                                                value={minCgpa}
                                                onChange={e => setMinCgpa(Math.max(1.0, parseFloat(e.target.value) || 1.0))}
                                                className="rounded-xl h-11 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                                Min Credits/Session (≥ 25)
                                            </label>
                                            <Input
                                                type="number"
                                                min="25"
                                                value={minCredits}
                                                onChange={e => setMinCredits(Math.max(25, parseInt(e.target.value) || 25))}
                                                className="rounded-xl h-11 font-bold"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Rules */}
                            <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-sm uppercase tracking-widest text-slate-700">
                                            Additional Rules
                                        </h3>
                                        <Button
                                            variant="outline"
                                            onClick={addRule}
                                            className="h-9 rounded-xl font-black uppercase tracking-widest text-[9px] gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add Rule
                                        </Button>
                                    </div>

                                    {rules.length === 0 ? (
                                        <p className="text-xs text-slate-400 font-medium text-center py-4">
                                            No additional rules. Students are evaluated against the thresholds above only.
                                        </p>
                                    ) : (
                                        rules.map((rule, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                                                <select
                                                    value={rule.field}
                                                    onChange={e => updateRule(i, { field: e.target.value })}
                                                    className="h-9 rounded-lg border px-2 text-xs font-bold w-28"
                                                >
                                                    <option value="cgpa">CGPA</option>
                                                    <option value="credits">Credits</option>
                                                </select>
                                                <select
                                                    value={rule.operator}
                                                    onChange={e => updateRule(i, { operator: e.target.value })}
                                                    className="h-9 rounded-lg border px-2 text-xs font-bold w-16"
                                                >
                                                    <option value=">=">&ge;</option>
                                                    <option value=">">&gt;</option>
                                                    <option value="<=">&le;</option>
                                                    <option value="<">&lt;</option>
                                                </select>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={rule.value}
                                                    onChange={e => updateRule(i, { value: parseFloat(e.target.value) || 0 })}
                                                    className="h-9 rounded-lg w-20 font-bold text-xs"
                                                />
                                                <Input
                                                    placeholder="Failure message..."
                                                    value={rule.message}
                                                    onChange={e => updateRule(i, { message: e.target.value })}
                                                    className="h-9 rounded-lg flex-1 text-xs font-medium"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => removeRule(i)}
                                                    className="h-9 w-9 p-0 text-red-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>

                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-indigo-100"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Criteria
                            </Button>
                        </>
                    ) : (
                        <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardContent className="p-10 text-center">
                                <Settings2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-lg font-black text-slate-900 uppercase">Select a Department</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    Choose a department from the left to configure its promotion criteria.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
