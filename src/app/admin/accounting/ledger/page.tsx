"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    BookOpen,
    Search,
    Loader2,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Filter,
    ArrowUpDown,
    Hash
} from "lucide-react";
import { getLedgerEntries } from "@/actions/accounting";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function LedgerPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getLedgerEntries();
        setEntries(data);
        setLoading(false);
    };

    const filteredEntries = entries.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.account?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.account?.code.includes(searchTerm)
    );

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-slate-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <BookOpen className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        General Ledger
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Institutional transaction log with full audit capability
                </p>
            </div>
            
            <div className="relative z-10 w-full md:w-96">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-[1.5rem] text-sm font-bold text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 outline-none transition-all shadow-inner"
                    placeholder="Search by description, account..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-800">
                            <th className="px-8 py-6">Date / Batch</th>
                            <th className="px-8 py-6">Account</th>
                            <th className="px-8 py-6">Description</th>
                            <th className="px-8 py-6">Debit (NGN)</th>
                            <th className="px-8 py-6">Credit (NGN)</th>
                            <th className="px-8 py-6 text-right">Reference</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40 bg-white/20">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600" />
                                </td>
                            </tr>
                        ) : filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No ledger entries found matching your search.</td>
                            </tr>
                        ) : (
                            filteredEntries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-white/40 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-base font-black text-slate-800">{new Date(entry.transactionDate).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5 truncate w-24">#{entry.batchId.split('-')[0]}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest font-mono">{entry.account?.code}</span>
                                            <span className="text-base font-black text-slate-800 mt-0.5">{entry.account?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm text-slate-600 font-bold">{entry.description}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        {parseFloat(entry.debit) > 0 ? (
                                            <div className="flex items-center gap-2 text-indigo-600 font-black text-base">
                                                <ArrowUpRight className="w-4 h-4 text-indigo-500 drop-shadow-sm" />
                                                <span>₦{parseFloat(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 font-bold">-</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        {parseFloat(entry.credit) > 0 ? (
                                            <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                                                <ArrowDownLeft className="w-4 h-4 text-slate-400" />
                                                <span>₦{parseFloat(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 font-bold">-</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="px-3 py-1.5 rounded-[1rem] border border-white/60 bg-white/85 text-[10px] font-black uppercase tracking-wider font-mono text-slate-600 shadow-sm">
                                            {entry.reference || "N/A"}
                                        </span>
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
