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
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/30 to-slate-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Hammer className="w-12 h-12 text-amber-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Fixed Asset Registry
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Institutional property tracking and automated depreciation manager
                </p>
            </div>
            
            <div className="relative z-10 flex gap-4 w-full md:w-auto shrink-0 flex-wrap">
                <Button
                    variant="outline"
                    className="h-12 px-6 rounded-[1.5rem] font-black uppercase text-xs tracking-wider border-white/20 text-white bg-white/10 hover:bg-white hover:text-slate-900 transition-all gap-2"
                    onClick={handleRunDepreciation}
                    disabled={runningDep}
                >
                    {runningDep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Run Depreciation
                </Button>
                <Button
                    onClick={() => setIsAdding(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-8 py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Register Asset
                </Button>
            </div>
        </div>

        {isAdding && (
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden animate-in slide-in-from-top-8 duration-500">
                <CardHeader className="p-8 lg:p-10 border-b border-white/40 bg-white/40">
                    <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Register Institutional Property</CardTitle>
                </CardHeader>
                <CardContent className="p-8 lg:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Asset Name</Label>
                            <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" placeholder="e.g. Toyota Coaster Bus (2024)" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Purchase Date</Label>
                            <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Purchase Price (₦)</Label>
                            <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Salvage Value (₦)</Label>
                            <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" type="number" value={salvageValue} onChange={e => setSalvageValue(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Useful Life (Years)</Label>
                            <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" type="number" value={usefulLife} onChange={e => setUsefulLife(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Asset GL Account</Label>
                            <select className="w-full px-5 rounded-[1rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800 h-11" value={glAccountId} onChange={e => setGlAccountId(e.target.value)}>
                                <option value="">Select Account...</option>
                                {coa.filter(a => a.category === 'asset').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Depreciation Expense Account</Label>
                            <select className="w-full px-5 rounded-[1rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800 h-11" value={depAccountId} onChange={e => setDepAccountId(e.target.value)}>
                                <option value="">Select Account...</option>
                                {coa.filter(a => a.category === 'expense').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Accum. Dep. (Contra-Asset)</Label>
                            <select className="w-full px-5 rounded-[1rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800 h-11" value={accumDepAccountId} onChange={e => setAccumDepAccountId(e.target.value)}>
                                <option value="">Select Account...</option>
                                {coa.filter(a => a.category === 'asset').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-3 mt-4">
                            <Button variant="outline" className="rounded-xl font-bold uppercase text-xs tracking-wider" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase text-xs tracking-wider" onClick={handleCreate}>Save Asset & Generate Schedule</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        {actionType && selectedAsset && (
            <Card className="border border-white/40 shadow-xl bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden animate-in slide-in-from-top-8 duration-500">
                <CardHeader className={`p-8 lg:p-10 border-b border-white/40 ${actionType === 'dispose' ? 'bg-rose-500/10 text-rose-900' :
                    actionType === 'revalue' ? 'bg-emerald-500/10 text-emerald-900' :
                        'bg-blue-500/10 text-blue-900'
                    }`}>
                    <CardTitle className="text-2xl font-black italic tracking-tight uppercase flex flex-col gap-1">
                        <span>{actionType === 'dispose' ? 'Dispose Asset' : actionType === 'revalue' ? 'Revalue Asset' : 'Log Maintenance'}</span>
                        <span className="text-slate-500 font-bold normal-case text-sm tracking-wide mt-1">{selectedAsset.name}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 lg:p-10">
                    <form onSubmit={handleActionSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {actionType === 'dispose' && (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Disposal Amount (₦)</Label>
                                    <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" type="number" name="disposalAmount" required placeholder="Amount received" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Receiving Bank Account</Label>
                                    <select name="bankAccountId" required className="w-full px-5 rounded-[1rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800 h-11">
                                        <option value="">Select Account...</option>
                                        {coa.filter(a => a.category === 'asset').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Reason for Disposal</Label>
                                    <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" name="reason" required placeholder="e.g Sold to third party, Scrapped" />
                                </div>
                            </>
                        )}

                        {actionType === 'revalue' && (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">New Valuation (₦)</Label>
                                    <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" type="number" name="newValuation" required placeholder="Updated market value" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Reason for Revaluation</Label>
                                    <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" name="reason" required placeholder="e.g Inflation Adjustment, Damage Impairment" />
                                </div>
                            </>
                        )}

                        {actionType === 'maintenance' && (
                            <>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Maintenance Title</Label>
                                    <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" name="title" required placeholder="e.g Routine Servicing" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Description</Label>
                                    <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" name="description" placeholder="Details of work done" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Cost (₦)</Label>
                                    <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" type="number" name="cost" required defaultValue={0} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Paying Bank Account (Optional)</Label>
                                    <select name="creditAccountId" className="w-full px-5 rounded-[1rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800 h-11">
                                        <option value="">Select Account (leaves unposted if empty)</option>
                                        {coa.filter(a => a.category === 'asset').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Performed By</Label>
                                    <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" name="performedBy" placeholder="Vendor / Technician Name" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Next Service Date</Label>
                                    <Input className="rounded-[1rem] border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" type="date" name="nextServiceDate" />
                                </div>
                            </>
                        )}

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                            <Button type="button" variant="outline" className="rounded-xl font-bold uppercase text-xs tracking-wider" onClick={() => setActionType(null)}>Cancel</Button>
                            <Button type="submit" disabled={actionLoading} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase text-xs tracking-wider min-w-[120px]">
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Action'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {assets.map((asset) => {
                const Icon = getAssetIcon(asset.name);
                const totalDep = asset.depreciationLogs.reduce((sum: number, log: any) => sum + parseFloat(log.amount), 0);
                const bookValue = parseFloat(asset.purchasePrice) - totalDep;

                return (
                    <Card key={asset.id} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden group hover:shadow-2xl transition-all h-full flex flex-col justify-between">
                        <CardHeader className="bg-white/40 p-8 flex flex-row items-center justify-between border-b border-white/40">
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl shadow-sm group-hover:bg-amber-500/20 transition-colors">
                                <Icon className="w-8 h-8 text-amber-700" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Book Value</p>
                                <p className="text-xl font-black text-slate-800">₦{bookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1 group-hover:text-amber-700 transition-colors">{asset.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-4" suppressHydrationWarning>
                                    <CalendarDays className="w-4 h-4 text-slate-400" />
                                    <span>Purchased {new Date(asset.purchaseDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/60">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                    <span className="text-slate-400">Original Cost</span>
                                    <span className="text-slate-700">₦{parseFloat(asset.purchasePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                    <span className="text-slate-400">Accum. Depreciation</span>
                                    <span className="text-rose-600">- ₦{totalDep.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden mt-4 shadow-inner border border-white/40">
                                    <div
                                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-1000 shadow-md"
                                        style={{ width: `${(totalDep / parseFloat(asset.purchasePrice)) * 100}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-center font-black uppercase text-slate-400 pt-1 tracking-wider">
                                    {(totalDep / parseFloat(asset.purchasePrice) * 100).toFixed(1)}% Depreciated
                                </p>
                            </div>
                        </CardContent>

                        <div className="px-8 py-6 bg-white/40 border-t border-white/40 flex flex-col gap-4">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-slate-450" />
                                    <span>{asset.depreciationLogs.length} Periods</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ArrowUpRight className="w-4 h-4 text-slate-450" />
                                    <span>Life: {asset.usefulLifeYears}Y</span>
                                </div>
                            </div>

                            {asset.status !== 'disposed' && (
                                <div className="flex gap-2 pt-2 border-t border-white/40 w-full">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-9 text-[10px] font-black uppercase tracking-wider border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/80 rounded-xl active:scale-95 transition-all shadow-sm"
                                        onClick={() => { setSelectedAsset(asset); setActionType('maintenance'); }}
                                    >
                                        <Wrench className="w-3.5 h-3.5 mr-1" /> Maint
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-9 text-[10px] font-black uppercase tracking-wider border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/80 rounded-xl active:scale-95 transition-all shadow-sm"
                                        onClick={() => { setSelectedAsset(asset); setActionType('revalue'); }}
                                    >
                                        <TrendingUp className="w-3.5 h-3.5 mr-1" /> Revalue
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-9 text-[10px] font-black uppercase tracking-wider border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/80 rounded-xl active:scale-95 transition-all shadow-sm"
                                        onClick={() => { setSelectedAsset(asset); setActionType('dispose'); }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Dispose
                                    </Button>
                                </div>
                            )}
                            {asset.status === 'disposed' && (
                                <div className="text-center py-2 bg-red-100 text-red-700 border border-red-200 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm">
                                    <CheckCircle2 className="w-4 h-4" /> Disposed
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>

        {assets.length === 0 && (
            <div className="text-center py-24 bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50 mt-10">
                <Hammer className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-slate-800 italic uppercase">No Institutional Assets</h3>
                <p className="text-slate-500 max-w-[300px] mx-auto mt-2 font-bold text-xs uppercase tracking-widest">Start registering buildings, vehicles, and equipment to track their institutional value.</p>
            </div>
        )}
      </div>
    </div>
  );
}
