"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Hammer,
    Plus,
    Calendar,
    History,
    Play,
    Building2,
    Truck,
    Monitor,
    Loader2,
    CalendarDays,
    ArrowUpRight,
    Search,
    Wrench,
    TrendingUp,
    Trash2,
    CheckCircle2
} from "lucide-react";
import { getFixedAssets, runDepreciationForMonth, createFixedAsset, disposeAsset, revalueAsset, addAssetMaintenance } from "@/actions/assets";
import { getCOA } from "@/actions/accounting";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function FixedAssetsPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [coa, setCoa] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [runningDep, setRunningDep] = useState(false);

    // Action State
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [actionType, setActionType] = useState<'dispose' | 'revalue' | 'maintenance' | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form State (New Asset)
    const [name, setName] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");
    const [purchasePrice, setPurchasePrice] = useState("");
    const [salvageValue, setSalvageValue] = useState("0");
    const [usefulLife, setUsefulLife] = useState("5");
    const [glAccountId, setGlAccountId] = useState("");
    const [depAccountId, setDepAccountId] = useState("");
    const [accumDepAccountId, setAccumDepAccountId] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [assetData, coaData] = await Promise.all([
            getFixedAssets(),
            getCOA()
        ]);
        setAssets(assetData);
        setCoa(coaData);
        setLoading(false);
    };

    const handleCreate = async () => {
        const res = await createFixedAsset({
            name,
            purchaseDate: new Date(purchaseDate),
            purchasePrice: purchasePrice.toString(),
            salvageValue: salvageValue.toString(),
            usefulLifeYears: parseInt(usefulLife),
            glAccountId: parseInt(glAccountId),
            depAccountId: parseInt(depAccountId),
            accumDepAccountId: parseInt(accumDepAccountId),
            depreciationMethod: 'straight_line'
        });
        if (res.success) {
            setIsAdding(false);
            fetchData();
        } else alert(res.error);
    };

    const handleRunDepreciation = async () => {
        const period = new Date().toISOString().slice(0, 7); // YYYY-MM
        if (!confirm(`Run depreciation for ${period}?`)) return;

        setRunningDep(true);
        const res = await runDepreciationForMonth(period);
        setRunningDep(false);

        if (res.success) {
            alert(`Depreciation processed for ${res.processedCount || 0} assets.`);
            fetchData();
        } else alert(res.error);
    };

    const handleActionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedAsset || !actionType) return;
        setActionLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            if (actionType === 'dispose') {
                const res = await disposeAsset(
                    selectedAsset.id,
                    parseFloat(formData.get("disposalAmount") as string),
                    formData.get("reason") as string,
                    parseInt(formData.get("bankAccountId") as string)
                );
                if (res.success) {
                    alert("Asset disposed successfully");
                    setActionType(null);
                    fetchData();
                } else alert(res.error);
            } else if (actionType === 'revalue') {
                const res = await revalueAsset(
                    selectedAsset.id,
                    parseFloat(formData.get("newValuation") as string),
                    formData.get("reason") as string
                );
                if (res.success) {
                    alert("Asset revalued successfully");
                    setActionType(null);
                    fetchData();
                } else alert(res.error);
            } else if (actionType === 'maintenance') {
                const res = await addAssetMaintenance(
                    selectedAsset.id,
                    formData.get("title") as string,
                    formData.get("description") as string,
                    parseFloat(formData.get("cost") as string),
                    formData.get("performedBy") as string,
                    parseInt(formData.get("creditAccountId") as string) || undefined,
                    formData.get("nextServiceDate") ? new Date(formData.get("nextServiceDate") as string) : undefined
                );
                if (res.success) {
                    alert("Maintenance logged successfully");
                    setActionType(null);
                    fetchData();
                } else alert(res.error);
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const getAssetIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('vehicle') || n.includes('bus') || n.includes('car')) return Truck;
        if (n.includes('computer') || n.includes('server') || n.includes('it')) return Monitor;
        return Building2;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
                <p className="text-slate-500 font-medium">Loading Institutional Assets...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-start mb-10 text-center lg:text-left">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Hammer className="w-8 h-8 text-amber-600" />
                        Fixed Asset Registry
                    </h2>
                    <p className="text-slate-500 mt-1">Institutional property tracking and automated depreciation manager</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="gap-2 rounded-xl border-slate-200"
                        onClick={handleRunDepreciation}
                        disabled={runningDep}
                    >
                        {runningDep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Run Monthly Depreciation
                    </Button>
                    <Button
                        className="bg-amber-600 hover:bg-amber-700 rounded-xl gap-2 shadow-lg shadow-amber-500/20"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus className="w-4 h-4" /> Register New Asset
                    </Button>
                </div>
            </div>

            {isAdding && (
                <Card className="mb-10 border-none shadow-xl bg-white ring-1 ring-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Register Institutional Property</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Asset Name</Label>
                            <Input placeholder="e.g. Toyota Coaster Bus (2024)" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Purchase Date</Label>
                            <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Purchase Price (₦)</Label>
                            <Input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Salvage Value (₦)</Label>
                            <Input type="number" value={salvageValue} onChange={e => setSalvageValue(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Useful Life (Years)</Label>
                            <Input type="number" value={usefulLife} onChange={e => setUsefulLife(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Asset GL Account</Label>
                            <select className="w-full p-2 rounded-lg border border-slate-200 text-sm" value={glAccountId} onChange={e => setGlAccountId(e.target.value)}>
                                <option value="">Select Account...</option>
                                {coa.filter(a => a.category === 'asset').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Depreciation Expense Account</Label>
                            <select className="w-full p-2 rounded-lg border border-slate-200 text-sm" value={depAccountId} onChange={e => setDepAccountId(e.target.value)}>
                                <option value="">Select Account...</option>
                                {coa.filter(a => a.category === 'expense').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Accum. Dep. (Contra-Asset)</Label>
                            <select className="w-full p-2 rounded-lg border border-slate-200 text-sm" value={accumDepAccountId} onChange={e => setAccumDepAccountId(e.target.value)}>
                                <option value="">Select Account...</option>
                                {coa.filter(a => a.category === 'asset').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-3 mt-4">
                            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={handleCreate}>Save Asset & Generate Schedule</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {actionType && selectedAsset && (
                <Card className="mb-10 border-none shadow-xl bg-white ring-1 ring-amber-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader className={`border-b border-slate-100 py-4 ${actionType === 'dispose' ? 'bg-rose-50' :
                        actionType === 'revalue' ? 'bg-emerald-50' :
                            'bg-blue-50'
                        }`}>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex flex-col">
                            <span>{actionType === 'dispose' ? 'Dispose Asset' : actionType === 'revalue' ? 'Revalue Asset' : 'Log Maintenance'}</span>
                            <span className="text-slate-500 font-medium normal-case mt-1">{selectedAsset.name}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleActionSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {actionType === 'dispose' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Disposal Amount (₦)</Label>
                                        <Input type="number" name="disposalAmount" required placeholder="Amount received" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Receiving Bank Account</Label>
                                        <select name="bankAccountId" required className="w-full p-2 rounded-lg border border-slate-200 text-sm">
                                            <option value="">Select Account...</option>
                                            {coa.filter(a => a.category === 'asset').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Reason for Disposal</Label>
                                        <Input name="reason" required placeholder="e.g Sold to third party, Scrapped" />
                                    </div>
                                </>
                            )}

                            {actionType === 'revalue' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>New Valuation (₦)</Label>
                                        <Input type="number" name="newValuation" required placeholder="Updated market value" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reason for Revaluation</Label>
                                        <Input name="reason" required placeholder="e.g Inflation Adjustment, Damage Impairment" />
                                    </div>
                                </>
                            )}

                            {actionType === 'maintenance' && (
                                <>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Maintenance Title</Label>
                                        <Input name="title" required placeholder="e.g Routine Servicing" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Description</Label>
                                        <Input name="description" placeholder="Details of work done" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cost (₦)</Label>
                                        <Input type="number" name="cost" required defaultValue={0} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Paying Bank Account (Optional)</Label>
                                        <select name="creditAccountId" className="w-full p-2 rounded-lg border border-slate-200 text-sm">
                                            <option value="">Select Account (leaves unposted if empty)</option>
                                            {coa.filter(a => a.category === 'asset').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Performed By</Label>
                                        <Input name="performedBy" placeholder="Vendor / Technician Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Next Service Date</Label>
                                        <Input type="date" name="nextServiceDate" />
                                    </div>
                                </>
                            )}

                            <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                                <Button type="button" variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
                                <Button type="submit" disabled={actionLoading} className="bg-slate-900 hover:bg-slate-800 text-white min-w-[120px]">
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Action'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )
            }

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map((asset) => {
                    const Icon = getAssetIcon(asset.name);
                    const totalDep = asset.depreciationLogs.reduce((sum: number, log: any) => sum + parseFloat(log.amount), 0);
                    const bookValue = parseFloat(asset.purchasePrice) - totalDep;

                    return (
                        <Card key={asset.id} className="border-none shadow-sm hover:shadow-md transition-all border border-slate-50 overflow-hidden group">
                            <CardHeader className="bg-slate-50/50 p-6 flex flex-row items-start justify-between">
                                <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-amber-50 transition-colors">
                                    <Icon className="w-6 h-6 text-amber-600" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Book Value</p>
                                    <p className="text-lg font-bold text-slate-900">{settings?.base_currency || '₦'}{bookValue.toLocaleString()}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <h4 className="font-extrabold text-slate-900 uppercase tracking-tight mb-1">{asset.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-4" suppressHydrationWarning>
                                    <CalendarDays className="w-3 h-3" />
                                    Purchased {new Date(asset.purchaseDate).toLocaleDateString()}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-400">Original Cost</span>
                                        <span className="text-slate-700 font-bold">{settings?.base_currency || '₦'}{parseFloat(asset.purchasePrice).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-400">Accum. Depreciation</span>
                                        <span className="text-rose-600 font-bold">- {settings?.base_currency || '₦'}{totalDep.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-4">
                                        <div
                                            className="bg-amber-500 h-full transition-all duration-1000"
                                            style={{ width: `${(totalDep / parseFloat(asset.purchasePrice)) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-center font-bold uppercase text-slate-400 pt-1">
                                        {(totalDep / parseFloat(asset.purchasePrice) * 100).toFixed(1)}% Depreciated
                                    </p>
                                </div>
                            </CardContent>
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <History className="w-3 h-3" />
                                        {asset.depreciationLogs.length} Periods
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowUpRight className="w-3 h-3" />
                                        Life: {asset.usefulLifeYears}Y
                                    </div>
                                </div>

                                {asset.status !== 'disposed' && (
                                    <div className="flex gap-2 pt-2 border-t border-slate-200 w-full">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-8 text-[10px] border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100"
                                            onClick={() => { setSelectedAsset(asset); setActionType('maintenance'); }}
                                        >
                                            <Wrench className="w-3 h-3 mr-1" /> Maint
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-8 text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100"
                                            onClick={() => { setSelectedAsset(asset); setActionType('revalue'); }}
                                        >
                                            <TrendingUp className="w-3 h-3 mr-1" /> Revalue
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-8 text-[10px] border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100"
                                            onClick={() => { setSelectedAsset(asset); setActionType('dispose'); }}
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" /> Dispose
                                        </Button>
                                    </div>
                                )}
                                {asset.status === 'disposed' && (
                                    <div className="text-center py-1 bg-red-50 text-red-600 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Disposed
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {
                assets.length === 0 && (
                    <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 mt-10">
                        <Hammer className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">No Institutional Assets</h3>
                        <p className="text-slate-500 max-w-[300px] mx-auto mt-2">Start registering buildings, vehicles, and equipment to track their institutional value.</p>
                    </div>
                )
            }
        </div >
    );
}
