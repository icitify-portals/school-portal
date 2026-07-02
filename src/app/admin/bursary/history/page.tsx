
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    History,
    Search,
    Loader2,
    RotateCcw,
    AlertCircle,
    BadgeCheck,
    XCircle,
    CreditCard,
    Filter
} from "lucide-react";
import { getTransactions, reverseTransaction } from "@/actions/bursary";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function TransactionHistoryPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'reversed'>('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getTransactions();
        setTransactions(data);
        setLoading(false);
    };

    const handleReverse = async (id: number) => {
        if (!confirm("Are you sure you want to REVERSE this transaction? This will mark it as reversed, update the student wallet, and add a counter-entry to the ledger for balancing.")) return;

        const res = await reverseTransaction(id);
        if (res.success) {
            alert("Transaction reversed successfully and ledger balanced.");
            fetchData();
        } else {
            alert((res as any).error || "Failed to reverse transaction");
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.purpose.toLowerCase().includes(search.toLowerCase()) ||
            tx.student?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            tx.student?.lastName?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || tx.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <History className="w-8 h-8 text-indigo-600" />
                        Transaction History
                    </h2>
                    <p className="text-slate-500 mt-1">Monitor all student payments and reverse entries if necessary</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Search by student name or purpose..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    {['all', 'completed', 'pending', 'reversed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                                filter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100">
                                <th className="px-8 py-5 text-center">Reference</th>
                                <th className="px-8 py-5">Student</th>
                                <th className="px-8 py-5">Purpose</th>
                                <th className="px-8 py-5">Amount</th>
                                <th className="px-8 py-5">Gateway</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" />
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center text-slate-400 italic">No transactions found matching your criteria.</td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-4 text-center">
                                            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">TX-{tx.id}</span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{tx.student?.firstName} {tx.student?.lastName}</span>
                                                <span className="text-[10px] text-slate-400">ID: {tx.student?.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-700">{tx.purpose}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">Recorded: {new Date(tx.createdAt).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 font-black text-slate-900">
                                            ₦{parseFloat(tx.amount).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-4 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="capitalize text-slate-600">{tx.gateway || 'manual'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <Badge
                                                variant={tx.status === 'completed' ? 'default' : tx.status === 'reversed' ? 'destructive' : 'secondary'}
                                                className={cn("text-[10px] uppercase font-black px-2.5",
                                                    tx.status === 'completed' && "bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-emerald-100"
                                                )}
                                            >
                                                {tx.status}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-4 text-right flex justify-end gap-2 items-center">
                                            {tx.status === 'completed' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-[10px] font-bold uppercase tracking-tight text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => window.open(`/finance/receipt/${tx.id}`, '_blank')}
                                                >
                                                    <CreditCard className="w-3 h-3" />
                                                    Receipt
                                                </Button>
                                            )}
                                            {tx.status !== 'reversed' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={tx.status === 'reversed'}
                                                    className="h-8 text-[10px] font-bold uppercase tracking-tight text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleReverse(tx.id)}
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    Reverse
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="mt-8 bg-amber-50 border border-amber-100 p-6 rounded-2xl flex gap-4 items-start shadow-sm">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <div className="space-y-1">
                    <h4 className="font-bold text-amber-900">Financial Integrity & Balancing</h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                        Reversing a transaction will:
                        (1) Update the transaction status to <span className="font-bold">reversed</span>.
                        (2) Increment the student's balance owed by creating a counter-debit in the ledger.
                        (3) Deduct the amount from the student's portal wallet.
                        This ensures the system remains balanced and provides a complete audit trail of all manual adjustments.
                    </p>
                </div>
            </div>
        </div>
    );
}
