"use client";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { getSuccessfulPaymentsGrouped, deleteTransaction, bulkDeleteTransactions } from "@/actions/successful-payments";
import { Loader2, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SuccessfulPaymentsPage() {
    const [groupedData, setGroupedData] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const loadData = () => {
        setLoading(true);
        getSuccessfulPaymentsGrouped().then((res) => {
            if (res.success && res.data) {
                setGroupedData(res.data);
                const keys = Object.keys(res.data);
                if (keys.length > 0 && !keys.includes(activeTab)) setActiveTab(keys[0]);
            }
            setLoading(false);
            setSelectedIds(new Set());
            setCurrentPage(1);
        });
    };

    useEffect(() => {
        loadData();
    }, []);

    // Reset page and selection when tab changes
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [activeTab]);

    const currentTabData = useMemo(() => groupedData[activeTab] || [], [groupedData, activeTab]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return currentTabData.slice(startIndex, startIndex + itemsPerPage);
    }, [currentTabData, currentPage]);

    const totalPages = Math.ceil(currentTabData.length / itemsPerPage);

    const handleDelete = async (id: number, type: string) => {
        if (!confirm("Are you sure you want to delete this test transaction? This cannot be undone.")) return;
        const res = await deleteTransaction(id, type);
        if (res.success) {
            toast.success("Transaction removed");
            loadData();
        } else {
            toast.error("Failed to delete transaction");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} transactions? This cannot be undone.`)) return;
        
        const itemsToDelete = Array.from(selectedIds).map(strId => {
            const [type, id] = strId.split('-');
            return { type, id: parseInt(id) };
        });

        const res = await bulkDeleteTransactions(itemsToDelete);
        if (res.success) {
            toast.success(`${selectedIds.size} transactions removed`);
            loadData();
        } else {
            toast.error("Failed to delete transactions");
        }
    };

    const toggleSelection = (txId: number, txType: string) => {
        const key = `${txType}-${txId}`;
        const newSelected = new Set(selectedIds);
        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.add(key);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedData.length && paginatedData.length > 0) {
            setSelectedIds(new Set());
        } else {
            const newSelected = new Set<string>();
            paginatedData.forEach(tx => {
                newSelected.add(`${tx.type}-${tx.id}`);
            });
            setSelectedIds(newSelected);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    const tabs = Object.keys(groupedData);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Successful Payments</h1>
                    <p className="text-slate-500 font-medium mt-2">View all successful transactions grouped by payment item across ALATPay and Remita.</p>
                </div>
                {selectedIds.size > 0 && (
                    <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Selected ({selectedIds.size})
                    </button>
                )}
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
                                className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
                            >
                                {tab}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
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
                                        <th className="px-6 py-4 w-10">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Student Name</th>
                                        <th className="px-6 py-4">Item Breakdown</th>
                                        <th className="px-6 py-4">Reference</th>
                                        <th className="px-6 py-4">RRR</th>
                                        <th className="px-6 py-4">Gateway</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedData.map((tx) => (
                                        <tr key={`${tx.type}-${tx.id}`} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={selectedIds.has(`${tx.type}-${tx.id}`)}
                                                    onChange={() => toggleSelection(tx.id, tx.type)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {tx.date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                {tx.studentName}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-xs">
                                                {tx.itemBreakdown}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                                {tx.gatewayReference || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-indigo-600">
                                                {tx.rrr || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    tx.gateway === 'remita' ? 'bg-blue-100 text-blue-700' :
                                                    tx.gateway === 'alatpay' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {tx.gateway}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900">
                                                &#8358;{parseFloat(tx.amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => handleDelete(tx.id, tx.type)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                                <div className="text-xs text-slate-500 font-medium">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, currentTabData.length)} of {currentTabData.length} entries
                                </div>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded border border-slate-300 text-slate-600 text-xs font-medium disabled:opacity-50 hover:bg-slate-100 transition"
                                    >
                                        Prev
                                    </button>
                                    <span className="px-3 py-1 text-xs font-bold text-slate-700">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded border border-slate-300 text-slate-600 text-xs font-medium disabled:opacity-50 hover:bg-slate-100 transition"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
