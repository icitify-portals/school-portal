"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    History,
    Search,
    Loader2,
    RotateCcw,
    CreditCard
} from "lucide-react";
import { getAllUnifiedTransactions, requeryUnifiedTransaction, UnifiedTransaction } from "@/actions/bursary";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function UnifiedTransactionsPage() {
    const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'fee_payment' | 'wallet_topup' | 'wallet_usage'>('all');
    
    const [selectedTx, setSelectedTx] = useState<UnifiedTransaction | null>(null);
    const [requeryingId, setRequeryingId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bursary/transactions', { cache: 'no-store' });
            const result = await res.json();
            if (result.success) {
                setTransactions(result.data);
            } else {
                toast.error(`Failed to load transactions: ${result.error}`);
            }
        } catch (error) {
            toast.error("An error occurred while loading transactions.");
        } finally {
            setLoading(false);
        }
    };

    const handleRequery = async (e: React.MouseEvent, tx: UnifiedTransaction) => {
        e.stopPropagation(); // prevent modal opening
        if (!tx.gateway || !tx.gatewayReference || tx.sourceTable === 'wallet_transactions') return;
        
        setRequeryingId(tx.id);
        const toastId = toast.loading(`Re-querying transaction ${tx.gatewayReference}...`);
        
        const res = await requeryUnifiedTransaction(tx.id, tx.sourceTable, tx.gateway, tx.gatewayReference);
        
        if (res.success) {
            toast.success(`Transaction status updated to ${res.status}`, { id: toastId });
            // Update local state instead of full refetch
            setTransactions(prev => prev.map(t => 
                (t.id === tx.id && t.sourceTable === tx.sourceTable) 
                    ? { ...t, status: res.status as string } 
                    : t
            ));
        } else {
            toast.error(`Re-query failed: ${res.error}`, { id: toastId });
        }
        
        setRequeryingId(null);
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.purpose.toLowerCase().includes(search.toLowerCase()) ||
            tx.student?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            tx.student?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            tx.gatewayReference?.toLowerCase().includes(search.toLowerCase());
            
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'completed' && ['completed', 'paid', 'success', 'successful'].includes(tx.status?.toLowerCase())) ||
            (statusFilter !== 'completed' && tx.status === statusFilter);
        
        let matchesCategory = true;
        if (categoryFilter === 'fee_payment') matchesCategory = tx.sourceTable === 'transactions';
        if (categoryFilter === 'wallet_topup') matchesCategory = tx.sourceTable === 'payment_transactions';
        if (categoryFilter === 'wallet_usage') matchesCategory = tx.sourceTable === 'wallet_transactions';
        
        return matchesSearch && matchesStatus && matchesCategory;
    });

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <History className="w-8 h-8 text-indigo-600" />
                        Unified Transactions
                    </h2>
                    <p className="text-slate-500 mt-1">Monitor all school fees, wallet top-ups, and internal transfers</p>
                </div>
                <Button onClick={fetchData} variant="outline" className="gap-2 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100">
                    <RotateCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Refresh Data
                </Button>
            </div>

            <div className="flex flex-col xl:flex-row gap-4 mb-8">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Search by student name, reference, or purpose..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                {/* Category Filters */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto">
                    {[
                        { id: 'all', label: 'All Categories' },
                        { id: 'fee_payment', label: 'Fee Payments' },
                        { id: 'wallet_topup', label: 'Wallet Top-ups' },
                        { id: 'wallet_usage', label: 'Internal Wallet' }
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setCategoryFilter(f.id as any)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                                categoryFilter === f.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Status Filters */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    {['all', 'completed', 'pending', 'failed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f as any)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                                statusFilter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group hover:shadow-2xl transition-all duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-5">Date</th>
                                <th className="px-6 py-5">Reference</th>
                                <th className="px-6 py-5">Student</th>
                                <th className="px-6 py-5">Category / Purpose</th>
                                <th className="px-6 py-5">Amount</th>
                                <th className="px-6 py-5">Gateway</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" />
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center text-slate-400 italic">No transactions found matching criteria.</td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx, idx) => (
                                    <tr key={`${tx.sourceTable}-${tx.id}-${idx}`} onClick={() => setSelectedTx(tx)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-mono font-bold text-slate-700">{tx.gatewayReference || `INT-${tx.id}`}</span>
                                                {tx.rrr && <span className="text-[10px] text-indigo-500 font-mono mt-0.5">RRR: {tx.rrr}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tx.student ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{tx.student.firstName} {tx.student.lastName}</span>
                                                    <span className="text-[10px] text-slate-400">{tx.student.matricNumber || tx.student.contactEmail || `ID: ${tx.student.id}`}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Unknown</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                                                    {tx.sourceTable === 'transactions' ? 'Fee Payment' : tx.sourceTable === 'payment_transactions' ? 'Wallet Top-up' : 'Internal Wallet'}
                                                </span>
                                                <span className="text-sm text-slate-700 font-medium">{tx.purpose}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-black text-slate-900 whitespace-nowrap">
                                            <span className={tx.type === 'debit' ? 'text-red-600' : 'text-emerald-600'}>
                                                {tx.type === 'debit' ? '-' : '+'} ₦{Number(tx.amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="capitalize text-slate-600 font-medium">{tx.gateway || 'manual'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant={tx.status === 'completed' || tx.status === 'success' ? 'default' : tx.status === 'failed' ? 'destructive' : 'secondary'}
                                                className={cn("text-[10px] uppercase font-black px-2.5",
                                                    (tx.status === 'completed' || tx.status === 'success') && "bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-emerald-100"
                                                )}
                                            >
                                                {tx.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {tx.status === 'pending' && tx.gateway && tx.gateway !== 'internal' ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={requeryingId === tx.id}
                                                    onClick={(e) => handleRequery(e, tx)}
                                                    className="h-8 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-transparent shadow-none"
                                                >
                                                    {requeryingId === tx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RotateCcw className="w-3.5 h-3.5 mr-1" />}
                                                    Re-query
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">No Action</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Transaction Details Modal */}
            <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
                <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="bg-slate-50 p-6 pb-4 border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            Transaction Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedTx && (
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Amount</div>
                                    <div className={cn("text-4xl font-black tracking-tight", selectedTx.type === 'debit' ? "text-red-600" : "text-emerald-600")}>
                                        {selectedTx.type === 'debit' ? '-' : '+'}₦{Number(selectedTx.amount).toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Status</div>
                                    <Badge
                                        variant={selectedTx.status === 'completed' || selectedTx.status === 'success' ? 'default' : selectedTx.status === 'failed' ? 'destructive' : 'secondary'}
                                        className={cn("text-xs uppercase font-black px-3 py-1",
                                            (selectedTx.status === 'completed' || selectedTx.status === 'success') && "bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-emerald-100"
                                        )}
                                    >
                                        {selectedTx.status}
                                    </Badge>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reference</div>
                                        <div className="text-sm font-mono font-medium text-slate-700 break-all">{selectedTx.gatewayReference || 'N/A'}</div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">RRR (Remita)</div>
                                        <div className="text-sm font-mono font-medium text-slate-700 break-all">{selectedTx.rrr || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Student</div>
                                    <div className="text-sm font-medium text-slate-800">
                                        {selectedTx.student ? `${selectedTx.student.firstName} ${selectedTx.student.lastName}` : 'N/A'}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {selectedTx.student ? (selectedTx.student.matricNumber || selectedTx.student.contactEmail) : ''}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Category</div>
                                        <div className="text-sm font-medium text-slate-800">
                                            {selectedTx.sourceTable === 'transactions' ? 'Fee Payment' : selectedTx.sourceTable === 'payment_transactions' ? 'Wallet Top-up' : 'Internal Wallet'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gateway</div>
                                        <div className="text-sm font-medium text-slate-800 capitalize">{selectedTx.gateway || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Purpose</div>
                                    <div className="text-sm font-medium text-slate-800">{selectedTx.purpose}</div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date Recorded</div>
                                    <div className="text-sm font-medium text-slate-800">
                                        {selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
