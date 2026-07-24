"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Trash2,
    Loader2,
    Layers,
    ListChecks,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Search
} from "lucide-react";
import {
    getFeeItems,
    createFeeItem,
    updateFeeItem,
    deleteFeeItem,
    bulkDeleteFeeItems,
    bulkDeleteFeeStructures,
    getFeeStructures,
    createFeeStructure,
    updateFeeStructure,
    deleteFeeStructure,
    approveFeeStructureWithAuth as approveFeeStructure,
    bulkApproveFeeStructuresWithAuth as bulkApproveFeeStructures,
    allocateFeeStructure,
    generateBatchBills
} from "@/actions/bursary";
import { getAcademicSessions } from "@/actions/portal";
import { getProgrammes } from "@/actions/programmes";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function FeesPage() {
    const { data: session } = useSession();
    const userRoles = (session?.user as any)?.roles || [];
    const userRole = (session?.user as any)?.role;
    const isBursar = userRoles.includes("bursar") || ["admin", "superadmin", "icitify_dev", "bursar"].includes(userRole);

    const [activeTab, setActiveTab] = useState<'items' | 'structures'>('items');
    const [feeItemsList, setFeeItemsList] = useState<any[]>([]);
    const [feeStructuresList, setFeeStructuresList] = useState<any[]>([]);
    const [sessionsList, setSessionsList] = useState<any[]>([]);
    const [programmesList, setProgrammesList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Multi-select State
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // View Details State
    const [expandedStructureId, setExpandedStructureId] = useState<number | null>(null);

    // Edit Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [editingStructureId, setEditingStructureId] = useState<number | null>(null);

    // Apply & Generate Bills Modal State
    const [isApplying, setIsApplying] = useState(false);
    const [applyingStructureId, setApplyingStructureId] = useState<number | null>(null);
    const [applySessionId, setApplySessionId] = useState("");
    const [applyScope, setApplyScope] = useState<'all' | 'level' | 'programme' | 'department'>('level');
    const [applyFilterId, setApplyFilterId] = useState("");


    // Fee Item Form State
    const [itemName, setItemName] = useState("");
    const [itemDesc, setItemDesc] = useState("");
    const [itemRequired, setItemRequired] = useState(true);
    const [itemCurrency, setItemCurrency] = useState("NGN");

    // Fee Item Edit State
    const [editingFeeItemId, setEditingFeeItemId] = useState<number | null>(null);
    const [editItemName, setEditItemName] = useState("");
    const [editItemDesc, setEditItemDesc] = useState("");
    const [editItemRequired, setEditItemRequired] = useState(true);
    const [editItemCurrency, setEditItemCurrency] = useState("NGN");

    // Fee Structure Form State
    const [structName, setStructName] = useState("");
    const [structYear, setStructYear] = useState("2024/2025");
    const [structLevel, setStructLevel] = useState("100");
    const [selectedItems, setSelectedItems] = useState<{ feeItemId: number, amount: string, semester: '1' | '2' | 'both' }[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [items, structures, sessions, programmes] = await Promise.all([
            getFeeItems(),
            getFeeStructures(),
            getAcademicSessions(),
            getProgrammes()
        ]);
        setFeeItemsList(items);
        setFeeStructuresList(structures);
        setSessionsList(sessions);
        setProgrammesList(programmes);
        if (sessions.length > 0 && !applySessionId) {
            setApplySessionId(sessions.find((s:any) => s.isCurrent)?.id.toString() || sessions[0].id.toString());
        }
        setLoading(false);
    };

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createFeeItem({ name: itemName, description: itemDesc, isRequired: itemRequired, currency: itemCurrency });
        if (res.success) {
            setItemName("");
            setItemDesc("");
            setIsAdding(false);
            fetchData();
        }
    };

    const handleEditItemClick = (item: any) => {
        setEditingFeeItemId(item.id);
        setEditItemName(item.name);
        setEditItemDesc(item.description || "");
        setEditItemRequired(item.isRequired);
        setEditItemCurrency(item.currency || "NGN");
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFeeItemId) return;
        const res = await updateFeeItem(editingFeeItemId, {
            name: editItemName,
            description: editItemDesc,
            isRequired: editItemRequired,
            currency: editItemCurrency
        });
        if (res.success) {
            setEditingFeeItemId(null);
            fetchData();
        } else {
            alert(res.error || "Failed to update item");
        }
    };

    const handleCreateStructure = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) return alert("Add at least one fee item to the structure");
        const res = await createFeeStructure({
            name: structName,
            academicYear: structYear,
            level: parseInt(structLevel),
            items: selectedItems
        });
        if (res.success) {
            setStructName("");
            setSelectedItems([]);
            setIsAdding(false);
            fetchData();
        }
    };

    const toggleItemSelection = (itemId: number) => {
        const exists = selectedItems.find(i => i.feeItemId === itemId);
        if (exists) {
            setSelectedItems(selectedItems.filter(i => i.feeItemId !== itemId));
        } else {
            setSelectedItems([...selectedItems, { feeItemId: itemId, amount: "0", semester: 'both' }]);
        }
    };

    const updateSelectedItem = (itemId: number, field: string, value: any) => {
        setSelectedItems(selectedItems.map(item =>
            item.feeItemId === itemId ? { ...item, [field]: value } : item
        ));
    };

    const handleApprove = async (id: number) => {
        const userId = (session?.user as any)?.id;
        if (!userId) return alert("User session not found");
        const res = await approveFeeStructure(id, parseInt(userId));
        if (res.success) fetchData();
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const list = activeTab === 'items' ? feeItemsList : feeStructuresList;
        if (selectedIds.size === list.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(list.map((i: any) => i.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        const label = activeTab === 'items' ? 'fee items' : 'fee structures';
        if (!confirm(`Delete ${selectedIds.size} selected ${label}?`)) return;
        const ids = Array.from(selectedIds);
        const res = activeTab === 'items'
            ? await bulkDeleteFeeItems(ids)
            : await bulkDeleteFeeStructures(ids);
        if (res.success) {
            setSelectedIds(new Set());
            fetchData();
        } else {
            alert(res.error);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Approve ${selectedIds.size} selected fee structures?`)) return;
        const userId = (session?.user as any)?.id;
        if (!userId) return alert("User session not found");
        
        const ids = Array.from(selectedIds);
        const res = await bulkApproveFeeStructures(ids, parseInt(userId));
        
        if (res.success) {
            setSelectedIds(new Set());
            fetchData();
        } else {
            alert(res.error);
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm("Delete this fee item? It will be removed from all structures.")) return;
        const res = await deleteFeeItem(id);
        if (res.success) {
            setSelectedIds(new Set());
            fetchData();
        } else {
            alert(res.error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this fee structure?")) return;
        const res = await deleteFeeStructure(id);
        if (res.success) {
            setSelectedIds(new Set());
            fetchData();
        } else {
            alert(res.error);
        }
    };

    const handleEditClick = (s: any) => {
        setEditingStructureId(s.id);
        setStructName(s.name);
        setStructYear(s.academicYear);
        setStructLevel(s.level.toString());
        setSelectedItems(s.items.map((i: any) => ({
            feeItemId: i.feeItemId,
            amount: i.amount,
            semester: i.semester
        })));
        setIsEditing(true);
        setIsAdding(false);
    };

    const handleUpdateStructure = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) return alert("Add at least one fee item to the structure");
        if (!editingStructureId) return;
        const res = await updateFeeStructure(editingStructureId, {
            name: structName,
            academicYear: structYear,
            level: parseInt(structLevel),
            items: selectedItems
        });
        if (res.success) {
            if (res.newVersion) {
                alert(res.message);
            }
            setStructName("");
            setSelectedItems([]);
            setIsEditing(false);
            setEditingStructureId(null);
            fetchData();
        } else {
            alert(res.error);
        }
    };

    const handleApplyClick = (id: number) => {
        setApplyingStructureId(id);
        setIsApplying(true);
    };

    const handleApplyAndBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!applyingStructureId || !applySessionId) return;

        // 1. Allocate
        await allocateFeeStructure({
            feeStructureId: applyingStructureId,
            level: applyScope === 'level' ? parseInt(applyFilterId) : undefined,
            programmeId: applyScope === 'programme' ? parseInt(applyFilterId) : undefined,
            academicYear: sessionsList.find(s => s.id.toString() === applySessionId)?.name
        });

        // 2. Generate Bills
        const res = await generateBatchBills({
            sessionId: parseInt(applySessionId),
            scope: applyScope,
            filters: {
                level: applyScope === 'level' ? parseInt(applyFilterId) : undefined,
                programmeId: applyScope === 'programme' ? parseInt(applyFilterId) : undefined
            },
            note: "Batch Fee Generation"
        });

        if (res.success) {
            alert(`Successfully generated bills for ${res.successCount} students.`);
            setIsApplying(false);
        } else {
            alert(res.error);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Fee Management</h2>
                    <p className="text-slate-500 mt-1">Define fee items and build hierarchical structures</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => { setActiveTab('items'); setIsAdding(false); }}
                        className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'items' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
                    >
                        Fee Items
                    </button>
                    <button
                        onClick={() => { setActiveTab('structures'); setIsAdding(false); }}
                        className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'structures' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
                    >
                        Fee Structures
                    </button>
                </div>
            </div>

            <div className="flex justify-end mb-6">
                {!isEditing && !isApplying && (
                    <Button
                        onClick={() => { setIsAdding(!isAdding); setStructName(""); setSelectedItems([]); }}
                        className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/20 gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {activeTab === 'items' ? "New Fee Item" : "Create Structure"}
                    </Button>
                )}
            </div>

            {isAdding && activeTab === 'items' && (
                <Card className="mb-8 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6 p-6">
                        <form onSubmit={handleCreateItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                    placeholder="e.g. Tuition Fee"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                                <input
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                    placeholder="Optional description"
                                    value={itemDesc}
                                    onChange={(e) => setItemDesc(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Currency</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white"
                                    value={itemCurrency}
                                    onChange={(e) => setItemCurrency(e.target.value)}
                                >
                                    <option value="NGN">NGN</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                            <div className="flex items-end mb-1">
                                <Button type="submit" className="w-full bg-slate-900 h-10">Save Item</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {isAdding && activeTab === 'structures' && (
                <Card className="mb-8 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6 p-6">
                        <form onSubmit={handleCreateStructure} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Structure Name</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                        placeholder="e.g. Freshmen 2024/2025"
                                        value={structName}
                                        onChange={(e) => setStructName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Academic Year</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                        value={structYear}
                                        onChange={(e) => setStructYear(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Level</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10"
                                        value={structLevel}
                                        onChange={(e) => setStructLevel(e.target.value)}
                                    >
                                        <option value="0">Applicant</option>
                                        <option value="100">ND 1</option>
                                        <option value="200">ND 2</option>
                                        <option value="300">HND 1</option>
                                        <option value="400">HND 2</option>
                                        <option value="500">Graduated</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-800 border-b pb-2">Select Fee Items & Set Amounts</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {feeItemsList.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={!!selectedItems.find(i => i.feeItemId === item.id)}
                                                onChange={() => toggleItemSelection(item.id)}
                                            />
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-700 leading-tight">{item.name}</p>
                                                <p className="text-xs text-slate-400">{item.description}</p>
                                            </div>
                                            {selectedItems.find(i => i.feeItemId === item.id) && (
                                                <div className="flex gap-3">
                                                    <input
                                                        type="number"
                                                        className="w-24 px-3 py-1 rounded-md border border-slate-200 text-sm"
                                                        placeholder="Amount"
                                                        value={selectedItems.find(i => i.feeItemId === item.id)?.amount}
                                                        onChange={(e) => updateSelectedItem(item.id, 'amount', e.target.value)}
                                                    />
                                                    <select
                                                        className="px-3 py-1 rounded-md border border-slate-200 text-sm h-8"
                                                        value={selectedItems.find(i => i.feeItemId === item.id)?.semester}
                                                        onChange={(e) => updateSelectedItem(item.id, 'semester', e.target.value)}
                                                    >
                                                        <option value="both">Annual</option>
                                                        <option value="1">1st Semester</option>
                                                        <option value="2">2nd Semester</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="submit" className="bg-indigo-600 px-8">Save Fee Structure</Button>
                                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {isEditing && activeTab === 'structures' && (
                <Card className="mb-8 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden transition-all duration-300 ring-2 ring-indigo-500">
                    <CardHeader className="bg-slate-50 border-b px-6 py-4">
                        <CardTitle className="text-lg text-indigo-700 font-bold">Edit Fee Structure</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 p-6">
                        <form onSubmit={handleUpdateStructure} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Structure Name</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                        placeholder="e.g. Freshmen 2024/2025"
                                        value={structName}
                                        onChange={(e) => setStructName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Academic Year</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                        value={structYear}
                                        onChange={(e) => setStructYear(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Level</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10"
                                        value={structLevel}
                                        onChange={(e) => setStructLevel(e.target.value)}
                                    >
                                        <option value="0">Applicant</option>
                                        <option value="100">ND 1</option>
                                        <option value="200">ND 2</option>
                                        <option value="300">HND 1</option>
                                        <option value="400">HND 2</option>
                                        <option value="500">Graduated</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-800 border-b pb-2">Select Fee Items & Set Amounts</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {feeItemsList.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={!!selectedItems.find(i => i.feeItemId === item.id)}
                                                onChange={() => toggleItemSelection(item.id)}
                                            />
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-700 leading-tight">{item.name}</p>
                                                <p className="text-xs text-slate-400">{item.description}</p>
                                            </div>
                                            {selectedItems.find(i => i.feeItemId === item.id) && (
                                                <div className="flex gap-3">
                                                    <input
                                                        type="number"
                                                        className="w-24 px-3 py-1 rounded-md border border-slate-200 text-sm"
                                                        placeholder="Amount"
                                                        value={selectedItems.find(i => i.feeItemId === item.id)?.amount}
                                                        onChange={(e) => updateSelectedItem(item.id, 'amount', e.target.value)}
                                                    />
                                                    <select
                                                        className="px-3 py-1 rounded-md border border-slate-200 text-sm h-8"
                                                        value={selectedItems.find(i => i.feeItemId === item.id)?.semester}
                                                        onChange={(e) => updateSelectedItem(item.id, 'semester', e.target.value)}
                                                    >
                                                        <option value="both">Annual</option>
                                                        <option value="1">1st Semester</option>
                                                        <option value="2">2nd Semester</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="submit" className="bg-indigo-600 px-8">Update Structure</Button>
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {isApplying && activeTab === 'structures' && (
                <Card className="mb-8 border-none shadow-xl rounded-[2rem] bg-emerald-50 group overflow-hidden transition-all duration-300 ring-2 ring-emerald-500">
                    <CardHeader className="bg-emerald-100 border-b border-emerald-200 px-6 py-4">
                        <CardTitle className="text-lg text-emerald-800 font-bold">Apply Structure & Generate Bills</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 p-6">
                        <form onSubmit={handleApplyAndBill} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Academic Session</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10"
                                        value={applySessionId}
                                        onChange={(e) => setApplySessionId(e.target.value)}
                                    >
                                        {sessionsList.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Apply To (Scope)</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10"
                                        value={applyScope}
                                        onChange={(e) => { setApplyScope(e.target.value as any); setApplyFilterId(""); }}
                                    >
                                        <option value="all">All Students in Session</option>
                                        <option value="level">Specific Level</option>
                                        <option value="programme">Specific Programme</option>
                                    </select>
                                </div>
                                {applyScope === 'level' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Target Level</label>
                                        <select
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10"
                                            value={applyFilterId}
                                            onChange={(e) => setApplyFilterId(e.target.value)}
                                        >
                                            <option value="">Select Level...</option>
                                            <option value="100">ND 1 (100)</option>
                                            <option value="200">ND 2 (200)</option>
                                            <option value="300">HND 1 (300)</option>
                                            <option value="400">HND 2 (400)</option>
                                            <option value="500">500 Level</option>
                                        </select>
                                    </div>
                                )}
                                {applyScope === 'programme' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Target Programme</label>
                                        <select
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10"
                                            value={applyFilterId}
                                            onChange={(e) => setApplyFilterId(e.target.value)}
                                        >
                                            <option value="">Select Programme...</option>
                                            {programmesList.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 px-8 text-white">Generate Bills</Button>
                                <Button type="button" variant="outline" onClick={() => setIsApplying(false)}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                {(selectedIds.size > 0) && (
                    <div className="mb-3 flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <span className="text-sm font-bold text-indigo-700">{selectedIds.size} selected</span>
                        <button onClick={handleBulkDelete}
                            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors">
                            Delete Selected
                        </button>
                        {activeTab === 'structures' && isBursar && (
                            <button onClick={handleBulkApprove}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors">
                                Approve Selected
                            </button>
                        )}
                        <button onClick={() => setSelectedIds(new Set())}
                            className="px-5 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold transition-colors">
                            Clear Selection
                        </button>
                    </div>
                )}
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4 w-10">
                                <input type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    checked={selectedIds.size > 0 && selectedIds.size === (activeTab === 'items' ? feeItemsList.length : feeStructuresList.length)}
                                    onChange={toggleSelectAll} />
                            </th>
                            <th className="px-6 py-4">{activeTab === 'items' ? "ID" : "Name"}</th>
                            <th className="px-6 py-4">{activeTab === 'items' ? "Fee Name" : "Academic Year"}</th>
                            <th className="px-6 py-4">{activeTab === 'items' ? "Currency" : "Level"}</th>
                            <th className="px-6 py-4">{activeTab === 'items' ? "Required" : "Items"}</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                                <tr>
                                <td colSpan={6} className="px-6 py-10 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                </td>
                            </tr>
                        ) : activeTab === 'items' ? (
                            feeItemsList.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">No items found.</td></tr>
                            ) : feeItemsList.map(item => (
                                <React.Fragment key={item.id}>
                                    {editingFeeItemId === item.id ? (
                                        <tr className="bg-indigo-50/50">
                                            <td colSpan={6} className="px-6 py-4">
                                                <form onSubmit={handleUpdateItem} className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                                                    <div className="space-y-1 col-span-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fee Name</label>
                                                        <input required type="text" className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200" value={editItemName} onChange={(e) => setEditItemName(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-1 col-span-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description (Optional)</label>
                                                        <input type="text" className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200" value={editItemDesc} onChange={(e) => setEditItemDesc(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency</label>
                                                        <select className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200" value={editItemCurrency} onChange={(e) => setEditItemCurrency(e.target.value)}>
                                                            <option value="NGN">NGN (₦)</option>
                                                            <option value="USD">USD ($)</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-2 col-span-5">
                                                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" checked={editItemRequired} onChange={(e) => setEditItemRequired(e.target.checked)} />
                                                        <span className="text-sm font-bold text-slate-700">Mandatory Item (Required for all students)</span>
                                                    </div>
                                                    <div className="col-span-5 flex gap-2 justify-end mt-2">
                                                        <Button type="button" variant="ghost" onClick={() => setEditingFeeItemId(null)}>Cancel</Button>
                                                        <Button type="submit" className="bg-indigo-600">Save Changes</Button>
                                                    </div>
                                                </form>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr className={cn("hover:bg-slate-50/50 transition-colors", selectedIds.has(item.id) && "bg-indigo-50/50")}>
                                            <td className="px-6 py-4">
                                                <input type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    checked={selectedIds.has(item.id)}
                                                    onChange={() => toggleSelect(item.id)} />
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-slate-400">#{item.id}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{item.currency || 'NGN'}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase", item.isRequired ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500")}>
                                                    {item.isRequired ? "Yes" : "No"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" onClick={() => handleEditItemClick(item)} className="p-2 text-slate-400 hover:text-indigo-600 mr-2 h-8">Edit</Button>
                                                <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            feeStructuresList.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">No structures found.</td></tr>
                            ) : feeStructuresList.map(s => (
                                <React.Fragment key={s.id}>
                                <tr className={cn("hover:bg-slate-50/50 transition-colors cursor-pointer", selectedIds.has(s.id) && "bg-indigo-50/50")} onClick={() => setExpandedStructureId(expandedStructureId === s.id ? null : s.id)}>
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            checked={selectedIds.has(s.id)}
                                            onChange={() => toggleSelect(s.id)} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-lg">
                                                <Layers className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{s.academicYear}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {s.level === 0 ? "Applicant" : s.level === 100 ? "ND 1" : s.level === 200 ? "ND 2" : s.level === 300 ? "HND 1" : s.level === 400 ? "HND 2" : s.level === 500 ? "Graduated" : `${s.level} Level`}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                        {s.items?.length || 0} Fees
                                        <br/>
                                        <span className="text-xs text-indigo-500 font-bold">
                                            Total: {s.items ? s.items.reduce((acc:any, i:any) => acc + parseFloat(i.amount || 0), 0).toLocaleString() : 0} NGN
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2 items-center h-full">
                                        {s.status === 'draft' ? (
                                            <>
                                                {isBursar && (
                                                    <Button
                                                        onClick={(e) => { e.stopPropagation(); handleApprove(s.id); }}
                                                        className="bg-amber-500 hover:bg-amber-600 h-8 px-3 rounded-lg text-xs gap-1 text-white"
                                                    >
                                                        Approve
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="outline"
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(s); }}
                                                    className="h-8 px-3 rounded-lg text-xs"
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                                                    className="h-8 px-2 text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-1 text-green-600 font-bold text-xs uppercase px-2">
                                                    <CheckCircle2 className="w-4 h-4" /> Approved
                                                </div>
                                                <Button 
                                                    variant="outline"
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(s); }}
                                                    className="h-8 px-3 rounded-lg text-xs"
                                                    title="Editing an approved structure will create a new Draft version."
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    onClick={(e) => { e.stopPropagation(); handleApplyClick(s.id); }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 rounded-lg text-xs gap-1 shadow-md shadow-emerald-500/20"
                                                >
                                                    Apply & Bill
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                                {expandedStructureId === s.id && (
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <td colSpan={5} className="px-14 py-4">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                                                {s.items?.map((i:any) => (
                                                    <div key={i.id} className="flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50">
                                                        <span className="text-xs font-bold text-slate-500 uppercase">{i.item?.name || 'Unknown'}</span>
                                                        <span className="text-sm font-black text-slate-800">{parseFloat(i.amount).toLocaleString()} {i.item?.currency || 'NGN'}</span>
                                                        <span className="text-[10px] text-slate-400 mt-1 capitalize">{i.semester === 'both' ? 'Annual' : `Semester ${i.semester}`}</span>
                                                    </div>
                                                ))}
                                                {(!s.items || s.items.length === 0) && (
                                                    <div className="col-span-full text-center text-sm text-slate-400 py-4">No fee items assigned.</div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
