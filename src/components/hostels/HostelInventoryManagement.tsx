"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Package, Plus, Pencil, Trash2,
    Save, X, Loader2, Info,
    Tag, Hash
} from "lucide-react";
import {
    getHostelInventory,
    upsertHostelInventoryItem
} from "@/actions/hostels";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function HostelInventoryManagement({ hostelId }: { hostelId: number }) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        totalQuantity: 0
    });

    useEffect(() => {
        loadInventory();
    }, [hostelId]);

    const loadInventory = async () => {
        setLoading(true);
        const data = await getHostelInventory(hostelId);
        setItems(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await upsertHostelInventoryItem({
            ...formData,
            id: editingItem?.id,
            hostelId
        });
        if (res.success) {
            toast.success(res.message);
            setEditingItem(null);
            setShowForm(false);
            setFormData({ name: "", description: "", totalQuantity: 0 });
            loadInventory();
        } else {
            toast.error(res.error || "Failed to save item");
        }
        setSubmitting(false);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || "",
            totalQuantity: item.totalQuantity
        });
        setShowForm(true);
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Inventory Initializing...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-600" />
                    Asset Registry
                </h3>
                {!showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 gap-2 shadow-lg"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add New Asset type
                    </Button>
                )}
            </div>

            {showForm && (
                <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-2xl border border-slate-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-black text-slate-800">{editingItem ? "Update Asset" : "Define New Asset"}</h4>
                            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingItem(null); }} className="rounded-full">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Name</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input
                                        placeholder="e.g. Double Bunk Bed"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="h-12 pl-12 rounded-xl border-slate-200 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Stock</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input
                                        type="number"
                                        placeholder="Available units"
                                        required
                                        value={formData.totalQuantity}
                                        onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) })}
                                        className="h-12 pl-12 rounded-xl border-slate-200 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Specifications (Optional)</label>
                            <Textarea
                                placeholder="Dimensions, material, or color details..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="rounded-xl border-slate-200 focus:ring-indigo-500 min-h-[100px]"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-indigo-100"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {editingItem ? "Update Registry" : "Register Asset"}
                        </Button>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-all bg-white rounded-2xl p-6 border border-slate-50 relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                                <Package className="w-5 h-5" />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 rounded-lg">
                                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h4 className="font-black text-slate-900 tracking-tight leading-none mb-1">{item.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Hall Inventory</p>
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
                                {item.description || "No specifications provided."}
                            </p>

                            <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Stock Capacity</p>
                                    <p className="text-sm font-black text-slate-900">{item.totalQuantity} units</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Asset ID</p>
                                    <p className="text-[10px] font-mono font-bold text-indigo-500">#{item.id.toString().padStart(4, '0')}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                {items.length === 0 && !showForm && (
                    <div className="md:col-span-3 py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                        <Info className="w-10 h-10 text-slate-200" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empty Registry</p>
                            <p className="text-[10px] text-slate-300 uppercase">Start by defining assets available in this hostel.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
