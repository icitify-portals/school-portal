"use client";
import { useState, useEffect } from "react";
import { getPaystackDbTransactions, deletePaystackDbTransaction } from "@/actions/paystack-payments-db";
import { Loader2, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function PaystackDbTable() {
    const [txs, setTxs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        const data = await getPaystackDbTransactions();
        setTxs(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this test transaction?")) return;
        const res = await deletePaystackDbTransaction(id);
        if (res.success) {
            toast.success("Transaction removed");
            loadData();
        } else {
            toast.error("Failed to delete");
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    if (txs.length === 0) return <div className="p-10 text-center text-slate-500 font-bold">No Paystack database transactions found.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b">
                    <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Student Name</th>
                        <th className="px-6 py-4">Purpose</th>
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {txs.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {tx.date}
                                </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800">{tx.studentName}</td>
                            <td className="px-6 py-4 text-slate-600 text-xs">{tx.purpose}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600">{tx.gatewayReference || '-'}</td>
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {tx.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-slate-900">
                                &#8358;{parseFloat(tx.amount).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => handleDelete(tx.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
