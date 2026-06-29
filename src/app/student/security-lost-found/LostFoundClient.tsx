"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, PackageSearch, ListTodo, Search, Image as ImageIcon, CheckCircle2, Clock } from "lucide-react";
import { reportLostItemAction } from "@/actions/security-lost-found";
import { format } from "date-fns";

export default function LostFoundClient({ initialFoundItems, initialMyItems }: { initialFoundItems: any[], initialMyItems: any[] }) {
    const [activeTab, setActiveTab] = useState<"board" | "my_reports" | "report">("board");
    const [submitting, setSubmitting] = useState(false);

    async function handleReportSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            itemName: formData.get("itemName") as string,
            category: formData.get("category") as any,
            description: formData.get("description") as string,
            location: formData.get("location") as string,
            dateReported: new Date(formData.get("dateReported") as string),
            imageUrl: formData.get("imageUrl") as string || undefined,
        };

        const res = await reportLostItemAction(data);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Lost item reported successfully!");
            (e.target as HTMLFormElement).reset();
            setActiveTab("my_reports");
            setTimeout(() => window.location.reload(), 1000); // Quick refresh to grab new items
        }
        setSubmitting(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab("board")}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "board" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                    <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Found Items</span>
                </button>
                <button
                    onClick={() => setActiveTab("my_reports")}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "my_reports" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                    <span className="flex items-center gap-2"><ListTodo className="w-4 h-4" /> My Reports</span>
                </button>
                <button
                    onClick={() => setActiveTab("report")}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "report" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                    <span className="flex items-center gap-2"><PackageSearch className="w-4 h-4" /> Report Lost Item</span>
                </button>
            </div>

            {activeTab === "board" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {initialFoundItems.length === 0 ? (
                        <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-100 text-center">
                            <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No newly found items to display.</p>
                        </div>
                    ) : (
                        initialFoundItems.map(item => (
                            <Card key={item.id} className="p-6 rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                        <PackageSearch className="w-6 h-6" />
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full">
                                        {item.category}
                                    </span>
                                </div>
                                <h3 className="font-black text-lg text-slate-800 mb-2">{item.itemName}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.description}</p>
                                
                                <div className="space-y-2 pt-4 border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase flex justify-between">
                                        <span>Found On:</span>
                                        <span className="text-slate-700">{format(new Date(item.dateReported), 'PP')}</span>
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase flex justify-between">
                                        <span>Location:</span>
                                        <span className="text-slate-700 text-right max-w-[150px] truncate" title={item.location}>{item.location}</span>
                                    </p>
                                </div>

                                <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[9px] rounded-xl h-12">
                                    Claim at Security Desk
                                </Button>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {activeTab === "my_reports" && (
                <div className="space-y-4">
                    {initialMyItems.length === 0 ? (
                        <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center">
                            <ListTodo className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">You haven't reported any lost items.</p>
                        </div>
                    ) : (
                        initialMyItems.map(item => (
                            <div key={item.id} className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                <div className={`p-4 rounded-2xl ${item.status === 'claimed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {item.status === 'claimed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="font-black text-slate-800">{item.itemName}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lost on {format(new Date(item.dateReported), 'PP')} • {item.location}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                        item.status === 'open' ? 'bg-amber-100 text-amber-700' :
                                        item.status === 'matched' ? 'bg-blue-100 text-blue-700' :
                                        'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {item.status === 'matched' ? 'Found - Visit Security' : item.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === "report" && (
                <Card className="max-w-2xl p-8 rounded-[2.5rem] border-slate-100 shadow-sm bg-white">
                    <form onSubmit={handleReportSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Item Name</Label>
                                <Input name="itemName" required placeholder="e.g., Mac Wallet" className="h-14 rounded-2xl border-slate-200" />
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
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description (Color, Brands, Distinct Marks)</Label>
                            <Textarea name="description" required placeholder="Black leather wallet with my driver's license inside..." className="rounded-2xl border-slate-200 min-h-[100px]" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Where did you last see it?</Label>
                                <Input name="location" required placeholder="e.g., Faculty of Law, Hall 2" className="h-14 rounded-2xl border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">When did you lose it?</Label>
                                <Input name="dateReported" type="date" required className="h-14 rounded-2xl border-slate-200" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Image URL (Optional)</Label>
                            <Input name="imageUrl" type="url" placeholder="Link to a photo of the item if you have one" className="h-14 rounded-2xl border-slate-200" />
                        </div>

                        <Button disabled={submitting} type="submit" className="w-full h-14 rounded-2xl bg-emerald-800 hover:bg-emerald-950 text-white font-black uppercase tracking-widest text-[10px] transition-all">
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Lost Report"}
                        </Button>
                    </form>
                </Card>
            )}
        </div>
    );
}
