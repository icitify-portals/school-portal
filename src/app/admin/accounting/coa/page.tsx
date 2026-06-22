"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Search,
    Loader2,
    FolderTree,
    Hash,
    Tag,
    ChevronRight,
    Filter
} from "lucide-react";
import { getCOA, createAccount } from "@/actions/accounting";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const categories = [
    { label: "Assets", value: "asset", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Liabilities", value: "liability", color: "text-red-600", bg: "bg-red-50" },
    { label: "Equity", value: "equity", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Revenue", value: "revenue", color: "text-green-600", bg: "bg-green-50" },
    { label: "Expenses", value: "expense", color: "text-orange-600", bg: "bg-orange-50" }
];

export default function COAPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string | null>(null);

    // Form State
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [category, setCategory] = useState<'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('asset');
    const [description, setDescription] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getCOA();
        setAccounts(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await createAccount({ code, name, category, description });
        if (res.success) {
            setCode("");
            setName("");
            setDescription("");
            setIsAdding(false);
            fetchData();
        } else {
            alert(res.error);
        }
        setSubmitting(false);
    };

    const filteredAccounts = filterCategory
        ? accounts.filter(a => a.category === filterCategory)
        : accounts;

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Chart of Accounts</h2>
                    <p className="text-slate-500 mt-1">Manage and categorize the institution's financial ledger heads</p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/20 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Account
                </Button>
            </div>

            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                <Button
                    variant={filterCategory === null ? "default" : "outline"}
                    onClick={() => setFilterCategory(null)}
                    className="h-9 rounded-full px-5 text-xs font-bold"
                >
                    All Accounts
                </Button>
                {categories.map(cat => (
                    <Button
                        key={cat.value}
                        variant={filterCategory === cat.value ? "default" : "outline"}
                        onClick={() => setFilterCategory(cat.value)}
                        className={cn(
                            "h-9 rounded-full px-5 text-xs font-bold transition-all",
                            filterCategory === cat.value ? "bg-slate-900" : "text-slate-500"
                        )}
                    >
                        {cat.label}
                    </Button>
                ))}
            </div>

            {isAdding && (
                <Card className="mb-10 border-none shadow-md bg-slate-50">
                    <CardHeader>
                        <CardTitle className="text-lg">Register New Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Account Code</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                        placeholder="e.g. 1100"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Account Name</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                        placeholder="e.g. Cash at Bank"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as any)}
                                    >
                                        {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                                    <input
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11"
                                        placeholder="Optional account use case"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={submitting} className="bg-slate-900 px-10 h-11">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Account"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="border-none shadow-sm overflow-hidden border border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                                <th className="px-8 py-5">Code</th>
                                <th className="px-8 py-5">Account Name</th>
                                <th className="px-8 py-5">Category</th>
                                <th className="px-8 py-5">Description</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                                    </td>
                                </tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-mono text-sm">No accounts found in this category.</td>
                                </tr>
                            ) : (
                                filteredAccounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5 font-mono text-xs font-bold text-indigo-600">
                                            {account.code}
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-slate-700">{account.name}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <Badge className={cn(
                                                "text-[10px] font-bold h-6 border-none capitalize",
                                                categories.find(c => c.value === account.category)?.bg,
                                                categories.find(c => c.value === account.category)?.color
                                            )}>
                                                {account.category}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-slate-400 font-medium italic">
                                            {account.description || "-"}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="text-slate-300 hover:text-slate-600 transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
