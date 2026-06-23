"use client";

import { useState, useEffect } from "react";
import { getDeductionRules, saveDeductionRule, deleteDeductionRule } from "@/actions/hr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShieldAlert, Loader2, DollarSign, Percent } from "lucide-react";
import { toast } from "sonner";

export default function DeductionRulesPage() {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [type, setType] = useState<"fixed" | "percentage">("percentage");
    const [value, setValue] = useState("");
    const [category, setCategory] = useState("Tax");

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        const res = await getDeductionRules();
        if (res.success) setRules(res.data || []);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await saveDeductionRule({ name, type, value: parseFloat(value), category });
        if (res.success) {
            toast.success("Rule added successfully.");
            setName("");
            setValue("");
            fetchRules();
        } else {
            toast.error(res.error || "Failed to add rule.");
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;
        const res = await deleteDeductionRule(id);
        if (res.success) {
            toast.success("Rule deleted.");
            fetchRules();
        } else {
            toast.error("Failed to delete rule.");
        }
    };

    return (
        <div className="p-8 max-w-[1000px] w-full mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Payroll Rules Engine</h1>
                <p className="text-slate-500">Configure dynamic deduction rules like PAYE and Pension.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Rules List */}
                <div className="md:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                    ) : rules.length === 0 ? (
                        <Card className="border-dashed bg-slate-50">
                            <CardContent className="p-12 text-center text-slate-500">
                                No rules configured. Add a new rule to get started.
                            </CardContent>
                        </Card>
                    ) : (
                        rules.map(rule => (
                            <Card key={rule.id} className="shadow-sm border-slate-200">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                            {rule.type === 'percentage' ? <Percent className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{rule.name}</h3>
                                            <p className="text-sm text-slate-500 uppercase font-semibold tracking-wider">{rule.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-slate-900">
                                                {rule.type === 'percentage' ? `${rule.value}%` : `₦${parseFloat(rule.value).toLocaleString()}`}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Add Rule Form */}
                <Card className="shadow-sm h-fit">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-lg">Add New Rule</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Rule Name</label>
                                <Input required placeholder="e.g. PAYE Tax" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tax">Tax</SelectItem>
                                        <SelectItem value="Pension">Pension</SelectItem>
                                        <SelectItem value="Union Dues">Union Dues</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Type</label>
                                    <Select value={type} onValueChange={(val: any) => setType(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Value</label>
                                    <Input required type="number" step="0.01" min="0" placeholder="0.00" value={value} onChange={e => setValue(e.target.value)} />
                                </div>
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Add Rule
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
