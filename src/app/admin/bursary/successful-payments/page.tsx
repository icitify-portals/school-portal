"use client";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { getSuccessfulPaymentsGrouped, deleteTransaction, bulkDeleteTransactions, updateSuccessfulPayment } from "@/actions/successful-payments";
import { Loader2, Calendar, Trash2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const TAB_ORDER = [
    'School Fees',
    'Processing Fee',
    'ICT Fee',
    'Incidental Fee',
    'Acceptance Fee',
    'Application Form Fee',
    'Transcript Fee',
    'Certificate Fee',
    'ID Card Fee',
    'Wallet Topup',
    'Others'
];

export default function SuccessfulPaymentsPage() {
    const [groupedData, setGroupedData] = useState<Record<string, any[]>>({});
    const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
    const [tabTotals, setTabTotals] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const sortTabKeys = (keys: string[]) => {
        return keys.sort((a, b) => {
            let idxA = TAB_ORDER.indexOf(a);
            let idxB = TAB_ORDER.indexOf(b);
            if (idxA === -1) idxA = a.toLowerCase().includes('other') ? 999 : 50;
            if (idxB === -1) idxB = b.toLowerCase().includes('other') ? 999 : 50;
            return idxA - idxB;
        });
    };

    const loadData = () => {
        setLoading(true);
        getSuccessfulPaymentsGrouped()
            .then((res: any) => {
                if (res.success && res.data) {
                    setGroupedData(res.data);
                    if (res.counts) setTabCounts(res.counts);
                    if (res.totals) setTabTotals(res.totals);
                    const sortedKeys = sortTabKeys(Object.keys(res.data));
                    if (sortedKeys.length > 0 && !sortedKeys.includes(activeTab)) {
                        setActiveTab(sortedKeys[0]);
                    }
                } else {
                    toast.error(res.error || "Failed to load successful payments");
                }
                setLoading(false);
                setSelectedIds(new Set());
                setCurrentPage(1);
            })
            .catch((err) => {
                console.error("Load payments failed:", err);
                toast.error("Failed to load payments data. Please refresh.");
                setLoading(false);
            });
    };

    useEffect(() => {
        loadData();
    }, []);

    // Reset page and selection when tab changes
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds(new Set());
        setSearchQuery("");
    }, [activeTab]);

    const rawTabData = useMemo(() => groupedData[activeTab] || [], [groupedData, activeTab]);

    const filteredTabData = useMemo(() => {
        if (!searchQuery.trim()) return rawTabData;
        const q = searchQuery.toLowerCase().trim();
        return rawTabData.filter((tx) => {
            const student = (tx.studentName || '').toLowerCase();
            const rrr = (tx.rrr || '').toLowerCase();
            const ref = (tx.gatewayReference || '').toLowerCase();
            const purpose = (tx.purpose || '').toLowerCase();
            const breakdown = (tx.itemBreakdown || '').toLowerCase();
            return student.includes(q) || rrr.includes(q) || ref.includes(q) || purpose.includes(q) || breakdown.includes(q);
        });
    }, [rawTabData, searchQuery]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTabData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTabData, currentPage]);

    const totalPages = Math.ceil(filteredTabData.length / itemsPerPage);

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

    // Edit state
    const [editTx, setEditTx] = useState<any>(null);
    const [editData, setEditData] = useState({
        rrr: '',
        gatewayReference: '',
        gateway: '',
        amount: '',
        purpose: '',
        createdAt: '',
        studentId: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const openEditModal = (tx: any) => {
        setEditTx(tx);
        setEditData({
            rrr: tx.rrr || '',
            gatewayReference: tx.gatewayReference || '',
            gateway: tx.gateway || '',
            amount: tx.amount?.toString() || '',
            purpose: tx.purpose || '',
            createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString().slice(0, 10) : '',
            studentId: tx.studentId ? String(tx.studentId) : (tx.userId ? String(tx.userId) : ''),
        });
    };

    const handleSaveEdit = async () => {
        if (!editTx) return;
        setIsSaving(true);
        const res = await updateSuccessfulPayment(editTx.id, editTx.type, editData);
        setIsSaving(false);
        if (res.success) {
            toast.success("Transaction updated");
            setEditTx(null);
            loadData();
        } else {
            toast.error(res.error || "Failed to update");
        }
    };

    const tabs = useMemo(() => sortTabKeys(Object.keys(groupedData)), [groupedData]);

    const activeTabTotalAmount = useMemo(() => {
        if (tabTotals[activeTab] !== undefined) return tabTotals[activeTab];
        return rawTabData.reduce((sum, tx) => sum + (parseFloat(tx.amount || '0') || 0), 0);
    }, [tabTotals, activeTab, rawTabData]);

    const totalRecordedCount = tabCounts[activeTab] !== undefined ? tabCounts[activeTab] : rawTabData.length;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Successful Payments</h1>
                    <p className="text-slate-500 font-medium mt-2">View all successful transactions grouped by payment item across ALATPay, Paystack and Remita.</p>
                </div>
                {selectedIds.size > 0 && (
                    <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Selected ({selectedIds.size})
                    </button>
                )}
            </div>

            {loading ? (
                <Card className="p-20 flex flex-col items-center justify-center gap-4 text-center border-slate-200 shadow-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <div>
                        <h3 className="text-base font-bold text-slate-700">Loading Successful Payments</h3>
                        <p className="text-xs text-slate-400 mt-1">Retrieving verified transactions across Remita, ALATPay and Paystack...</p>
                    </div>
                </Card>
            ) : tabs.length === 0 ? (
                <Card className="p-10 text-center text-slate-500 font-bold">No successful payments found.</Card>
            ) : (
                <div className="space-y-6">
                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {tabs.map((tab) => {
                            const count = tabCounts[tab] !== undefined ? tabCounts[tab] : (groupedData[tab]?.length || 0);
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
                                >
                                    {tab}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        {count.toLocaleString()}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Tab Summary Banner */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 px-6 rounded-xl border border-slate-200 shadow-sm gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg">
                                ₦
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-800">{activeTab} Collections</h2>
                                <p className="text-xs text-slate-500 font-medium">
                                    {totalRecordedCount.toLocaleString()} total verified payment{totalRecordedCount === 1 ? '' : 's'} recorded
                                    {rawTabData.length < totalRecordedCount && ` (displaying latest ${rawTabData.length})`}
                                </p>
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Collected</span>
                            <span className="text-xl font-black text-emerald-600">
                                ₦{activeTabTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Search and Table */}
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <Input
                                placeholder={`Search in ${activeTab} by payer, matric, RRR, or reference...`}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="max-w-md bg-white rounded-xl text-sm"
                            />
                            <div className="text-xs font-semibold text-slate-500">
                                Showing {filteredTabData.length} {searchQuery ? 'matching' : 'recent'} transactions
                            </div>
                        </div>
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
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-medium">
                                                No settled {activeTab} transactions found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((tx) => (
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
                                                {tx.studentName && tx.studentName !== 'N/A' ? (
                                                    <span>{tx.studentName}</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                        Unassigned (N/A)
                                                    </span>
                                                )}
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
                                                    tx.gateway === 'paystack' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {tx.gateway || 'portal'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900">
                                                &#8358;{(parseFloat(tx.amount || '0') || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => openEditModal(tx)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="Edit transaction">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(tx.id, tx.type)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                                <div className="text-xs text-slate-500 font-medium">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTabData.length)} of {filteredTabData.length} entries
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

            {/* Edit Transaction Modal */}
            <Dialog open={!!editTx} onOpenChange={(open) => { if (!open) setEditTx(null); }}>
                <DialogContent className="max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <Pencil className="w-5 h-5 text-indigo-600" /> Edit Transaction
                            <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest">{editTx?.type} #{editTx?.id}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 my-2 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</p>
                            <p className="text-sm font-bold text-slate-700">{editTx?.studentName || 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Student ID / User ID</Label>
                            <Input
                                value={editData.studentId}
                                onChange={(e) => setEditData({ ...editData, studentId: e.target.value })}
                                placeholder="e.g. 7360 or 12589"
                                className="mt-1 p-3 rounded-xl border border-slate-200 text-sm font-mono"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                Enter Student ID or User ID to manually link this payment to a student.
                            </p>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">RRR</Label>
                            <Input
                                value={editData.rrr}
                                onChange={(e) => setEditData({ ...editData, rrr: e.target.value })}
                                placeholder="e.g. 125007894321"
                                className="mt-1 p-3 rounded-xl border border-slate-200 text-sm font-mono"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Gateway Reference</Label>
                            <Input
                                value={editData.gatewayReference}
                                onChange={(e) => setEditData({ ...editData, gatewayReference: e.target.value })}
                                placeholder="e.g. SCH-153-123456"
                                className="mt-1 p-3 rounded-xl border border-slate-200 text-sm font-mono"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Gateway</Label>
                            <select
                                value={editData.gateway}
                                onChange={(e) => setEditData({ ...editData, gateway: e.target.value })}
                                className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="">-- Select Gateway --</option>
                                {['remita', 'alatpay', 'paystack', 'flutterwave', 'opay', 'manual'].map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Amount (₦)</Label>
                            <Input
                                value={editData.amount}
                                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                                placeholder="e.g. 5000"
                                className="mt-1 p-3 rounded-xl border border-slate-200 text-sm font-mono"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Purpose / Item</Label>
                            <Input
                                value={editData.purpose}
                                onChange={(e) => setEditData({ ...editData, purpose: e.target.value })}
                                placeholder="e.g. Acceptance Fee / School Fees"
                                className="mt-1 p-3 rounded-xl border border-slate-200 text-sm"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Payment Date</Label>
                            <Input
                                type="date"
                                value={editData.createdAt}
                                onChange={(e) => setEditData({ ...editData, createdAt: e.target.value })}
                                className="mt-1 p-3 rounded-xl border border-slate-200 text-sm"
                            />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Editable fields apply to the selected gateway transaction record.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setEditTx(null)} className="rounded-xl font-bold">
                            <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                        <Button
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
