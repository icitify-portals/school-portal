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
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">General Ledger</h2>
                    <p className="text-slate-500 mt-1">Institutional transaction log with full audit capability</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        placeholder="Search by description, account, or reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden border border-slate-100 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100">
                                <th className="px-8 py-5">Date / Batch</th>
                                <th className="px-8 py-5">Account</th>
                                <th className="px-8 py-5">Description</th>
                                <th className="px-8 py-5">Debit (NGN)</th>
                                <th className="px-8 py-5">Credit (NGN)</th>
                                <th className="px-8 py-5 text-right">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                                    </td>
                                </tr>
                            ) : filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic">No ledger entries found matching your search.</td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{new Date(entry.transactionDate).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-mono text-slate-300 group-hover:text-slate-500 truncate w-24">#{entry.batchId.split('-')[0]}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-400 font-mono">{entry.account?.code}</span>
                                                <span className="text-sm font-bold text-slate-800">{entry.account?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm text-slate-600 font-medium">{entry.description}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            {parseFloat(entry.debit) > 0 ? (
                                                <div className="flex items-center gap-2 text-indigo-600 font-extrabold">
                                                    <ArrowUpRight className="w-3 h-3 opacity-50" />
                                                    <span>{parseFloat(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            {parseFloat(entry.credit) > 0 ? (
                                                <div className="flex items-center gap-2 text-slate-900 font-extrabold">
                                                    <ArrowDownLeft className="w-3 h-3 opacity-30" />
                                                    <span>{parseFloat(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <Badge variant="outline" className="text-[10px] font-mono border-slate-200 text-slate-500 rounded-lg">
                                                {entry.reference || "N/A"}
                                            </Badge>
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
