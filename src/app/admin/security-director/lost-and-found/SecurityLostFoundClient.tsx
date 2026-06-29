"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Database, CheckCircle2, UserCheck, ShieldAlert, Trash2, ListTodo } from "lucide-react";
import { reportFoundItemAction, updateItemStatusAction, claimItemAction } from "@/actions/security-lost-found";
import { format } from "date-fns";

export default function SecurityLostFoundClient({ initialItems }: { initialItems: any[] }) {
    const [activeTab, setActiveTab] = useState<"database" | "log">("database");
    const [submitting, setSubmitting] = useState(false);
    const [items, setItems] = useState(initialItems);

    const [claimModalOpen, setClaimModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    async function handleLogFoundSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            itemName: formData.get("itemName") as string,
            category: formData.get("category") as any,
            description: formData.get("description") as string,
            location: formData.get("location") as string,
            dateReported: new Date(formData.get("dateReported") as string),
            storageLocation: formData.get("storageLocation") as string,
            imageUrl: formData.get("imageUrl") as string || undefined,
        };

        const res = await reportFoundItemAction(data);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Found item logged successfully!");
            (e.target as HTMLFormElement).reset();
            setActiveTab("database");
            setTimeout(() => window.location.reload(), 1000);
        }
        setSubmitting(false);
    }

    async function handleStatusChange(id: number, status: any) {
        const res = await updateItemStatusAction(id, status);
        if (res.error) toast.error(res.error);
        else {
            toast.success("Status updated!");
            setItems(items.map(i => i.id === id ? { ...i, status } : i));
        }
    }

    async function handleProcessClaim(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const proofUrl = formData.get("claimProofImageUrl") as string;
        const claimerIdStr = formData.get("claimerId") as string;
        
        // In a real app, this might be a dropdown of users or just searching by matric number.
        // For simplicity, we assume they provide the User ID
        const claimerId = parseInt(claimerIdStr);

        const res = await claimItemAction(selectedItem.id, claimerId, proofUrl);
        if (res.error) toast.error(res.error);
        else {
            toast.success("Item claimed successfully!");
            setItems(items.map(i => i.id === selectedItem.id ? { ...i, status: 'claimed', claimedById: claimerId, claimProofImageUrl: proofUrl } : i));
            setClaimModalOpen(false);
        }
        setSubmitting(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab("database")}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "database" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                    <span className="flex items-center gap-2"><Database className="w-4 h-4" /> Item Database</span>
                </button>
                <button
                    onClick={() => setActiveTab("log")}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "log" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                    <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Log Found Item</span>
                </button>
                <div className="flex-1" />
                <a
                    href="/admin/security-director/lost-and-found/analytics"
                    className="pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all text-purple-600 hover:text-purple-800 flex items-center gap-2"
                >
                    <ListTodo className="w-4 h-4" /> View Analytics
                </a>
            </div>

            {activeTab === "database" && (
                <div className="space-y-4">
                    <div className="overflow-x-auto rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <tr>
                                    <th className="p-6">Item Details</th>
                                    <th className="p-6">Type & Status</th>
                                    <th className="p-6">Location</th>
                                    <th className="p-6">Reporter</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6">
                                            <div className="font-black text-slate-800">{item.itemName}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">{item.category} • {format(new Date(item.dateReported), 'PP')}</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-2 items-start">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.type === 'found' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {item.type}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'claimed' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-xs font-bold text-slate-700">{item.location}</div>
                                            {item.storageLocation && (
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Storage: {item.storageLocation}</div>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            <div className="text-xs font-bold text-slate-700">{item.reporter?.firstName} {item.reporter?.lastName}</div>
                                            <div className="text-[10px] text-slate-400 mt-1">{item.reporter?.email}</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-end gap-2">
                                                {item.status === 'open' && item.type === 'lost' && (
                                                    <Button onClick={() => handleStatusChange(item.id, 'matched')} size="sm" variant="outline" className="text-[9px] h-8 rounded-lg font-black uppercase tracking-widest text-blue-600 border-blue-200 hover:bg-blue-50">
                                                        Mark Matched
                                                    </Button>
                                                )}
                                                {item.status !== 'claimed' && item.status !== 'disposed' && (
                                                    <Button onClick={() => { setSelectedItem(item); setClaimModalOpen(true); }} size="sm" className="bg-emerald-800 text-white text-[9px] h-8 rounded-lg font-black uppercase tracking-widest hover:bg-emerald-900">
                                                        Process Claim
                                                    </Button>
                                                )}
                                                {item.status !== 'claimed' && item.status !== 'disposed' && (
                                                    <Button onClick={() => handleStatusChange(item.id, 'disposed')} size="sm" variant="ghost" className="text-[9px] h-8 rounded-lg font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                                                        Dispose
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "log" && (
                <Card className="max-w-2xl p-8 rounded-[2.5rem] border-slate-100 shadow-sm bg-white">
                    <form onSubmit={handleLogFoundSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Item Name</Label>
                                <Input name="itemName" required placeholder="e.g., Car Keys" className="h-14 rounded-2xl border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Category</Label>
                                <select name="category" required className="flex h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2">
                                    <option value="electronics">Electronics</option>
                                    <option value="documents">ID / Documents</option>
                                    <option value="clothing">Clothing</option>
                                    <option value="keys">Keys</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</Label>
                            <Textarea name="description" required placeholder="Found near the fountain..." className="rounded-2xl border-slate-200 min-h-[100px]" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Location Found</Label>
                                <Input name="location" required placeholder="e.g., Main Library" className="h-14 rounded-2xl border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date Found</Label>
                                <Input name="dateReported" type="date" required className="h-14 rounded-2xl border-slate-200" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Storage Location</Label>
                                <Input name="storageLocation" required placeholder="e.g., Security Post A Locker 2" className="h-14 rounded-2xl border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Image URL (Optional)</Label>
                                <Input name="imageUrl" type="url" placeholder="Photo of the item" className="h-14 rounded-2xl border-slate-200" />
                            </div>
                        </div>

                        <Button disabled={submitting} type="submit" className="w-full h-14 rounded-2xl bg-emerald-800 hover:bg-emerald-950 text-white font-black uppercase tracking-widest text-[10px] transition-all">
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log Found Item"}
                        </Button>
                    </form>
                </Card>
            )}

            {/* Claim Modal */}
            {claimModalOpen && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <Card className="max-w-lg w-full p-8 rounded-[2.5rem] shadow-2xl bg-white border-none animate-in zoom-in-95">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                            <UserCheck className="w-6 h-6 text-emerald-600" />
                            <div>
                                <h3 className="font-black text-lg text-slate-800">Process Item Claim</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify ownership for: {selectedItem.itemName}</p>
                            </div>
                        </div>
                        <form onSubmit={handleProcessClaim} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Claimant User ID</Label>
                                <Input name="claimerId" type="number" required placeholder="Enter User ID of the owner" className="h-14 rounded-2xl border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Proof of Ownership / ID Image URL</Label>
                                <Input name="claimProofImageUrl" type="url" required placeholder="Link to photo of ID or receipt" className="h-14 rounded-2xl border-slate-200" />
                                <p className="text-[10px] text-slate-400 mt-1">This is required for auditing purposes to prove the item was handed to the rightful owner.</p>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="outline" onClick={() => setClaimModalOpen(false)} className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-600">Cancel</Button>
                                <Button disabled={submitting} type="submit" className="flex-1 h-14 rounded-2xl bg-emerald-800 hover:bg-emerald-950 text-white font-black uppercase tracking-widest text-[10px] transition-all">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Approve & Mark Claimed"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
