"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Key, KeySquare, ScanLine, ListTodo, Plus, CheckCircle2 } from "lucide-react";
import { addKeyAction, checkoutKeyAction, returnKeyAction } from "@/actions/security-keys";
import { format } from "date-fns";

export default function KeyManagementClient({ initialKeys }: { initialKeys: any[] }) {
    const [activeTab, setActiveTab] = useState<"issue" | "registry" | "add">("issue");
    const [submitting, setSubmitting] = useState(false);
    const [keys, setKeys] = useState(initialKeys);

    async function handleAddKeySubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            officeName: formData.get("officeName") as string,
            keyIdentifier: formData.get("keyIdentifier") as string,
        };

        const res = await addKeyAction(data);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Key registered successfully!");
            (e.target as HTMLFormElement).reset();
            setActiveTab("registry");
            setTimeout(() => window.location.reload(), 1000);
        }
        setSubmitting(false);
    }

    async function handleScanSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const keyId = parseInt(formData.get("keyId") as string);
        const staffBarcode = formData.get("staffBarcode") as string;

        const key = keys.find(k => k.id === keyId);
        if (!key) {
            toast.error("Invalid key selected.");
            setSubmitting(false);
            return;
        }

        if (key.status === 'available') {
            const res = await checkoutKeyAction(keyId, staffBarcode);
            if (res.error) toast.error(res.error);
            else {
                toast.success(res.message);
                (e.target as HTMLFormElement).reset();
                setTimeout(() => window.location.reload(), 1000);
            }
        } else if (key.status === 'checked_out') {
            const res = await returnKeyAction(keyId, staffBarcode);
            if (res.error) toast.error(res.error);
            else {
                toast.success(res.message);
                (e.target as HTMLFormElement).reset();
                setTimeout(() => window.location.reload(), 1000);
            }
        }

        setSubmitting(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab("issue")}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "issue" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                    <span className="flex items-center gap-2"><ScanLine className="w-4 h-4" /> Issue / Return</span>
                </button>
                <button
                    onClick={() => setActiveTab("registry")}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "registry" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                    <span className="flex items-center gap-2"><KeySquare className="w-4 h-4" /> Key Registry</span>
                </button>
                <button
                    onClick={() => setActiveTab("add")}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "add" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                    <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Key</span>
                </button>
                <div className="flex-1" />
                <a
                    href="/admin/security-director/key-management/analytics"
                    className="pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all text-purple-600 hover:text-purple-800 flex items-center gap-2"
                >
                    <ListTodo className="w-4 h-4" /> View Analytics
                </a>
            </div>

            {activeTab === "issue" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-sm bg-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <ScanLine className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-slate-800">Scan & Handover</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Process Checkout or Return automatically</p>
                            </div>
                        </div>

                        <form onSubmit={handleScanSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Select Target Key</Label>
                                <select name="keyId" required className="flex h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2">
                                    <option value="">-- Choose Key --</option>
                                    {keys.map(k => (
                                        <option key={k.id} value={k.id}>
                                            {k.keyIdentifier} ({k.officeName}) - {k.status.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Staff ID Barcode</Label>
                                <Input name="staffBarcode" autoFocus required placeholder="Scan Staff ID or type User ID" className="h-14 rounded-2xl border-slate-200" />
                            </div>

                            <Button disabled={submitting} type="submit" className="w-full h-14 rounded-2xl bg-emerald-800 hover:bg-emerald-950 text-white font-black uppercase tracking-widest text-[10px] transition-all">
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Process"}
                            </Button>
                        </form>
                    </Card>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Currently Checked Out</h4>
                        {keys.filter(k => k.status === 'checked_out').length === 0 ? (
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">All keys are secure.</p>
                            </div>
                        ) : (
                            keys.filter(k => k.status === 'checked_out').map(k => (
                                <div key={k.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-rose-100 shadow-sm">
                                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-slate-800 text-sm">{k.keyIdentifier}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{k.officeName}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-slate-700">{k.currentHolder?.firstName}</div>
                                        <div className="text-[9px] text-slate-400 uppercase tracking-widest">Holder</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === "registry" && (
                <div className="overflow-x-auto rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="p-6">Key ID & Office</th>
                                <th className="p-6">Status</th>
                                <th className="p-6">Current Holder</th>
                                <th className="p-6 text-right">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {keys.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <div className="font-black text-slate-800">{item.keyIdentifier}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">{item.officeName}</div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {item.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        {item.currentHolder ? (
                                            <div>
                                                <div className="text-xs font-bold text-slate-700">{item.currentHolder.firstName} {item.currentHolder.lastName}</div>
                                                <div className="text-[9px] uppercase tracking-widest text-slate-400 mt-1">{item.currentHolder.email}</div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">-</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right text-xs text-slate-500">
                                        {format(new Date(item.updatedAt), 'PPp')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "add" && (
                <Card className="max-w-2xl p-8 rounded-[2.5rem] border-slate-100 shadow-sm bg-white">
                    <form onSubmit={handleAddKeySubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Office Name</Label>
                            <Input name="officeName" required placeholder="e.g., Dean's Office, Faculty of Law" className="h-14 rounded-2xl border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Key Identifier / Number</Label>
                            <Input name="keyIdentifier" required placeholder="e.g., LAW-101-MASTER" className="h-14 rounded-2xl border-slate-200" />
                        </div>

                        <Button disabled={submitting} type="submit" className="w-full h-14 rounded-2xl bg-emerald-800 hover:bg-emerald-950 text-white font-black uppercase tracking-widest text-[10px] transition-all">
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Register Key to Database"}
                        </Button>
                    </form>
                </Card>
            )}
        </div>
    );
}
