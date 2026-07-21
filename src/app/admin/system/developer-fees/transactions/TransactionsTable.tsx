"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { verifyDeveloperFee } from "@/actions/paystack-developer-subscription";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function TransactionsTable({ transactions }: { transactions: any[] }) {
    const [requeryingId, setRequeryingId] = useState<number | null>(null);
    const router = useRouter();

    const handleRequery = async (id: number, reference: string) => {
        setRequeryingId(id);
        const res = await verifyDeveloperFee(reference);
        if (res.success) {
            toast.success("Transaction successfully verified!");
            router.refresh();
        } else {
            toast.error(res.error || "Failed to verify transaction");
        }
        setRequeryingId(null);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                        <th className="px-6 py-4 font-semibold tracking-wider">Date</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Reference</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Type / ID</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Amount</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                        <th className="px-6 py-4 font-semibold tracking-wider text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                        <tr key={tx.id} className="bg-white hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                {new Date(tx.createdAt).toLocaleDateString()} <br />
                                <span className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                {tx.reference}
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-slate-900 capitalize">{tx.type.replace("_", " ")}</div>
                                <div className="text-xs text-slate-500">Ref ID: {tx.identifier}</div>
                                {tx.applicant && (
                                    <div className="text-xs font-semibold text-emerald-600">
                                        {tx.applicant.name} ({tx.applicant.email})
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">
                                ₦{Number(tx.amount).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                                <Badge variant="outline" className={`capitalize shadow-sm ${
                                    tx.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    tx.status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                    {tx.status}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {tx.status === 'pending' && (
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={requeryingId === tx.id}
                                        onClick={() => handleRequery(tx.id, tx.reference)}
                                        className="h-8 shadow-sm border-slate-200 text-slate-600 hover:bg-slate-50"
                                    >
                                        {requeryingId === tx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RotateCcw className="w-3.5 h-3.5 mr-1" />}
                                        Re-query
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                                No processing fee transactions found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
