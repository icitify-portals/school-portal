"use client";

import { useState, useEffect } from "react";
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
    getFeeStructures,
    createFeeStructure,
    approveFeeStructureWithAuth as approveFeeStructure
} from "@/actions/bursary";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function FeesPage() {
    const { data: session } = useSession();
    const userRoles = (session?.user as any)?.roles || [];
    const isBursar = userRoles.includes("bursar") || (session?.user as any)?.role === "admin";

    const [activeTab, setActiveTab] = useState<'items' | 'structures'>('items');
    const [feeItemsList, setFeeItemsList] = useState<any[]>([]);
    const [feeStructuresList, setFeeStructuresList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Fee Item Form State
    const [itemName, setItemName] = useState("");
    const [itemDesc, setItemDesc] = useState("");
    const [itemRequired, setItemRequired] = useState(true);

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
        const [items, structures] = await Promise.all([
            getFeeItems(),
            getFeeStructures()
        ]);
        setFeeItemsList(items);
        setFeeStructuresList(structures);
        setLoading(false);
    };

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createFeeItem({ name: itemName, description: itemDesc, isRequired: itemRequired });
        if (res.success) {
            setItemName("");
            setItemDesc("");
            setIsAdding(false);
            fetchData();
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
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/20 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    {activeTab === 'items' ? "New Fee Item" : "Create Structure"}
                </Button>
            </div>

            {isAdding && activeTab === 'items' && (
                <Card className="mb-8 border-none shadow-md bg-slate-50">
                    <CardContent className="pt-6">
                        <form onSubmit={handleCreateItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <div className="flex items-end mb-1">
                                <Button type="submit" className="w-full bg-slate-900 h-10">Save Item</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {isAdding && activeTab === 'structures' && (
                <Card className="mb-8 border-none shadow-md bg-slate-50">
                    <CardContent className="pt-6">
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
                                        <option value="100">100 Level</option>
                                        <option value="200">200 Level</option>
                                        <option value="300">300 Level</option>
                                        <option value="400">400 Level</option>
                                        <option value="500">500 Level</option>
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

                            <div className="pt-4">
                                <Button type="submit" className="bg-indigo-600 px-8">Save Fee Structure</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="border-none shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4">{activeTab === 'items' ? "ID" : "Name"}</th>
                            <th className="px-6 py-4">{activeTab === 'items' ? "Fee Name" : "Academic Year"}</th>
                            <th className="px-6 py-4">{activeTab === 'items' ? "Description" : "Level"}</th>
                            <th className="px-6 py-4">{activeTab === 'items' ? "Required" : "Items"}</th>
                            <th className="px-6 py-4 text-right">Status / Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                </td>
                            </tr>
                        ) : activeTab === 'items' ? (
                            feeItemsList.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">No items found.</td></tr>
                            ) : feeItemsList.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 text-sm font-mono text-slate-400">#{item.id}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{item.description}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase", item.isRequired ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500")}>
                                            {item.isRequired ? "Yes" : "No"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            feeStructuresList.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">No structures found.</td></tr>
                            ) : feeStructuresList.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-lg">
                                                <Layers className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{s.academicYear}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{s.level} Level</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{s.items?.length || 0} Fees</td>
                                    <td className="px-6 py-4 text-right">
                                        {s.status === 'draft' ? (
                                            isBursar ? (
                                                <Button
                                                    onClick={() => handleApprove(s.id)}
                                                    className="bg-amber-500 hover:bg-amber-600 h-8 px-3 rounded-lg text-xs gap-1"
                                                >
                                                    Approve
                                                </Button>
                                            ) : (
                                                <div className="text-amber-500 font-bold text-[10px] uppercase italic">
                                                    Awaiting Approval
                                                </div>
                                            )
                                        ) : (
                                            <div className="flex items-center justify-end gap-1 text-green-600 font-bold text-xs uppercase">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Approved
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
