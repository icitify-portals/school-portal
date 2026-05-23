"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Package, Plus, Trash2,
    Save, X, Loader2, Info,
    CheckCircle2, AlertTriangle,
    History
} from "lucide-react";
import {
    getRoomInventory,
    getHostelInventory,
    assignInventoryToRoom,
    deleteRoomInventory
} from "@/actions/hostels";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function RoomInventoryDetails({
    roomId,
    hostelId
}: {
    roomId: number,
    hostelId: number
}) {
    const [roomItems, setRoomItems] = useState<any[]>([]);
    const [hostelItems, setHostelItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        inventoryItemId: "",
        quantity: 1,
        condition: "good" as const,
        notes: ""
    });

    useEffect(() => {
        loadData();
    }, [roomId, hostelId]);

    const loadData = async () => {
        setLoading(true);
        const [rItems, hItems] = await Promise.all([
            getRoomInventory(roomId),
            getHostelInventory(hostelId)
        ]);
        setRoomItems(rItems);
        setHostelItems(hItems);
        setLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.inventoryItemId) return toast.error("Please select an item");

        setSubmitting(true);
        const res = await assignInventoryToRoom({
            roomId,
            inventoryItemId: parseInt(formData.inventoryItemId),
            quantity: formData.quantity,
            condition: formData.condition,
            notes: formData.notes
        });

        if (res.success) {
            toast.success(res.message);
            setShowAddForm(false);
            setFormData({ inventoryItemId: "", quantity: 1, condition: "good", notes: "" });
            loadData();
        } else {
            toast.error(res.error || "Failed to assign item");
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Remove this item from room inventory?")) return;
        const res = await deleteRoomInventory(id);
        if (res.success) {
            toast.success(res.message);
            loadData();
        } else {
            toast.error(res.error);
        }
    };

    if (loading) {
        return (
            <div className="py-10 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500 opacity-20" />
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-500" />
                    Room Assets
                </h4>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="rounded-xl h-8 text-[9px] font-black uppercase tracking-widest gap-2 bg-white"
                >
                    {showAddForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {showAddForm ? "Cancel" : "Assign Item"}
                </Button>
            </div>

            {showAddForm && (
                <Card className="p-5 border-none shadow-lg bg-indigo-50/50 rounded-2xl border border-indigo-100/20">
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Select Asset Type</label>
                                <select
                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-indigo-500 focus:outline-none"
                                    value={formData.inventoryItemId}
                                    onChange={(e) => setFormData({ ...formData, inventoryItemId: e.target.value })}
                                    required
                                >
                                    <option value="">Choose item...</option>
                                    {hostelItems.map(item => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Quantity</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                    className="h-10 rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Initial Condition</label>
                                <div className="flex gap-1">
                                    {['excellent', 'good', 'fair', 'poor', 'broken'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, condition: c as any })}
                                            className={cn(
                                                "flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all",
                                                formData.condition === c
                                                    ? "bg-slate-900 text-white"
                                                    : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
                                            )}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Assignment Notes</label>
                                <Input
                                    placeholder="Serial number, position etc."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="h-10 rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[9px] gap-2 shadow-md"
                        >
                            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Confirm Allocation
                        </Button>
                    </form>
                </Card>
            )}

            <div className="space-y-2">
                {roomItems.map((ri) => (
                    <Card key={ri.id} className="p-4 border-none shadow-sm bg-white rounded-2xl border border-slate-100 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                                <Package className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
                                    {ri.item.name} <span className="text-indigo-500 ml-1">x{ri.quantity}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <Badge className={cn(
                                        "rounded-md text-[7px] font-black uppercase px-1.5 py-0",
                                        ri.condition === 'excellent' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            ri.condition === 'broken' ? "bg-red-50 text-red-600 border-red-100" :
                                                "bg-slate-50 text-slate-400 border-slate-100"
                                    )}>
                                        {ri.condition}
                                    </Badge>
                                    {ri.notes && (
                                        <p className="text-[8px] text-slate-400 font-medium truncate max-w-[150px]">
                                            {ri.notes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-bold text-slate-300 uppercase">
                                {ri.lastInspectedAt ? format(new Date(ri.lastInspectedAt), 'MMM dd') : 'Uninspected'}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(ri.id)}
                                className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </Card>
                ))}

                {roomItems.length === 0 && !showAddForm && (
                    <div className="py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-2">
                        <AlertTriangle className="w-6 h-6 text-slate-200" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">No assets allocated to this room</p>
                    </div>
                )}
            </div>
        </div>
    );
}
