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
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-slate-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <FolderTree className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Chart of Accounts
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Manage and categorize the institution's financial ledger heads
                </p>
            </div>
            
            <Button
                onClick={() => setIsAdding(!isAdding)}
                className="relative z-10 bg-indigo-600 border border-indigo-500/50 hover:bg-indigo-700 text-white px-8 py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all gap-2"
            >
                <Plus className="w-4 h-4" />
                New Account
            </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Button
                variant={filterCategory === null ? "default" : "outline"}
                onClick={() => setFilterCategory(null)}
                className={cn(
                    "h-10 rounded-full px-6 text-xs font-black uppercase tracking-wider transition-all",
                    filterCategory === null ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white/60 border-white/40 text-slate-600 hover:bg-white"
                )}
            >
                All Accounts
            </Button>
            {categories.map(cat => (
                <Button
                    key={cat.value}
                    variant={filterCategory === cat.value ? "default" : "outline"}
                    onClick={() => setFilterCategory(cat.value)}
                    className={cn(
                        "h-10 rounded-full px-6 text-xs font-black uppercase tracking-wider transition-all",
                        filterCategory === cat.value ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-white/60 border-white/40 text-slate-600 hover:bg-white"
                    )}
                >
                    {cat.label}
                </Button>
            ))}
        </div>

        {isAdding && (
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden animate-in slide-in-from-top-8 duration-500">
                <CardHeader className="p-8 lg:p-10 border-b border-white/40 bg-white/40">
                    <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Register New Account</CardTitle>
                </CardHeader>
                <CardContent className="p-8 lg:p-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Account Code</label>
                                <input
                                    required
                                    className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800"
                                    placeholder="e.g. 1100"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Account Name</label>
                                <input
                                    required
                                    className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800"
                                    placeholder="e.g. Cash at Bank"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Category</label>
                                <select
                                    className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800 h-[52px]"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as any)}
                                >
                                    {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Description</label>
                                <input
                                    className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800 h-[52px]"
                                    placeholder="Optional account use case"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button 
                              type="submit" 
                              disabled={submitting} 
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Account"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )}

        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-800">
                            <th className="px-8 py-6">Code</th>
                            <th className="px-8 py-6">Account Name</th>
                            <th className="px-8 py-6">Category</th>
                            <th className="px-8 py-6">Description</th>
                            <th className="px-8 py-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40 bg-white/20">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600" />
                                </td>
                            </tr>
                        ) : filteredAccounts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No accounts found in this category.</td>
                            </tr>
                        ) : (
                            filteredAccounts.map((account) => (
                                <tr key={account.id} className="hover:bg-white/40 transition-colors group">
                                    <td className="px-8 py-6 font-mono text-sm font-black text-indigo-600">
                                        {account.code}
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-base font-black text-slate-800">{account.name}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border shadow-sm inline-block",
                                            categories.find(c => c.value === account.category)?.bg === "bg-blue-50" ? "bg-blue-100 text-blue-700 border-blue-200" :
                                            categories.find(c => c.value === account.category)?.bg === "bg-red-50" ? "bg-red-100 text-red-700 border-red-200" :
                                            categories.find(c => c.value === account.category)?.bg === "bg-purple-50" ? "bg-purple-100 text-purple-700 border-purple-200" :
                                            categories.find(c => c.value === account.category)?.bg === "bg-green-50" ? "bg-green-100 text-green-700 border-green-200" :
                                            "bg-orange-100 text-orange-700 border-orange-200"
                                        )}>
                                            {account.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-slate-500 font-bold italic">
                                        {account.description || "-"}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 bg-white/80 rounded-xl border border-white/60 text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
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
    </div>
    );
}
