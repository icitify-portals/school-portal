"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { getSuccessfulPaymentsGrouped } from "@/actions/successful-payments";
import { Loader2, Calendar, CreditCard, ChevronRight } from "lucide-react";

export default function SuccessfulPaymentsPage() {
    const [groupedData, setGroupedData] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('');

    useEffect(() => {
        getSuccessfulPaymentsGrouped().then((res) => {
            if (res.success && res.data) {
                setGroupedData(res.data);
                const keys = Object.keys(res.data);
                if (keys.length > 0) setActiveTab(keys[0]);
            }
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    const tabs = Object.keys(groupedData);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900">Successful Payments</h1>
                <p className="text-slate-500 font-medium mt-2">View all successful transactions grouped by payment item across ALATPay, Remita, and Paystack.</p>
            </div>

            {tabs.length === 0 ? (
                <Card className="p-10 text-center text-slate-500 font-bold">No successful payments found.</Card>
            ) : (
                <div className="space-y-6">
                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={\px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all \\}
                            >
                                {tab}
                                <span className={\ml-2 px-2 py-0.5 rounded-full text-[10px] \\}>
                                    {groupedData[tab].length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Reference</th>
                                        <th className="px-6 py-4">Gateway</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(groupedData[activeTab] || []).map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {tx.date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                                {tx.gatewayReference || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={\px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest \\}>
                                                    {tx.gateway}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900">
                                                ?{parseFloat(tx.amount).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
