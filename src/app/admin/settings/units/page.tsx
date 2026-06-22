"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
    Building2, 
    Plus, 
    User, 
    Settings, 
    Loader2, 
    CheckCircle2, 
    XCircle, 
    MapPin, 
    School, 
    GraduationCap, 
    Activity,
    Trash2
} from "lucide-react";
import {
    getInstitutionalUnits,
    createInstitutionalUnit,
    updateInstitutionalUnit,
    deleteInstitutionalUnit
} from "@/actions/institutional_units";
import { getUsers } from "@/actions/rbac";
import { getSettingByKey, updateSystemSetting } from "@/actions/settings";
import { cn } from "@/lib/utils";

export default function UnitsPage() {
    const [units, setUnits] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [categories, setCategories] = useState<string[]>(["Campus", "School", "College", "Administrative Unit"]);
    const [newCategory, setNewCategory] = useState("");
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        type: "Campus",
        academicTier: "tertiary" as 'k12' | 'tertiary',
        headTitle: "",
        headUserId: undefined as number | undefined
    });

    useEffect(() => {
        fetchData();
        loadCategories();
    }, []);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (showAddModal || showCategoryModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showAddModal, showCategoryModal]);

    const loadCategories = async () => {
        const saved = await getSettingByKey("system.branch_categories");
        if (saved) {
            setCategories(JSON.parse(saved));
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory) return;
        const updated = [...categories, newCategory];
        const res = await updateSystemSetting("system.branch_categories", JSON.stringify(updated), "system");
        if (res.success) {
            setCategories(updated);
            setNewCategory("");
            setShowCategoryModal(false);
        }
    };

    const handleDeleteCategory = async (cat: string) => {
        const updated = categories.filter(c => c !== cat);
        const res = await updateSystemSetting("system.branch_categories", JSON.stringify(updated), "system");
        if (res.success) {
            setCategories(updated);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        const [unitData, userData] = await Promise.all([
            getInstitutionalUnits(),
            getUsers()
        ]);
        setUnits(unitData);
        setUsers(userData);
        setLoading(false);
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({ name: "", code: "", type: categories[0] || "Branch", academicTier: "tertiary", headTitle: "", headUserId: undefined });
        setShowAddModal(true);
    };

    const handleOpenEdit = (u: any) => {
        setEditingId(u.unit.id);
        setFormData({
            name: u.unit.name,
            code: u.unit.code,
            type: u.unit.type,
            academicTier: u.unit.academicTier || "tertiary",
            headTitle: u.unit.headTitle || "",
            headUserId: u.unit.headUserId || undefined
        });
        setShowAddModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let res;
        if (editingId) {
            res = await updateInstitutionalUnit(editingId, formData);
        } else {
            res = await createInstitutionalUnit(formData);
        }
        
        if (res.success) {
            setShowAddModal(false);
            setFormData({ name: "", code: "", type: categories[0] || "Branch", academicTier: "tertiary", headTitle: "", headUserId: undefined });
            setEditingId(null);
            fetchData();
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            const res = await deleteInstitutionalUnit(id);
            if (res.success) {
                toast.success("Branch deleted successfully");
                fetchData();
            } else {
                toast.error(res.error || "Failed to delete branch");
            }
        }
    };

    const toggleUnitStatus = async (id: number, currentStatus: boolean) => {
        const res = await updateInstitutionalUnit(id, { isActive: !currentStatus });
        if (res.success) {
            toast.success(`Branch ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchData();
        } else {
            toast.error("Failed to update status");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                    <Building2 className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Architecting System...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-12 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 flex items-center gap-6 italic tracking-tighter">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-200">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                        INSTITUTIONAL ARCHITECTURE
                    </h1>
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 ml-24">Global governance of academic and administrative branches</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={() => setShowCategoryModal(true)}
                        variant="outline"
                        className="border-slate-200 hover:bg-slate-50 text-slate-900 font-black px-8 py-8 rounded-2xl flex gap-3 uppercase text-[10px] tracking-widest"
                    >
                        <Settings className="w-5 h-5" /> Categories
                    </Button>
                    <Button
                        onClick={handleOpenAdd}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black px-10 py-8 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex gap-4 uppercase text-[10px] tracking-widest group"
                    >
                        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" /> Register Branch
                    </Button>
                </div>
            </div>

            {/* Categories Quick Bar */}
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {categories.map(cat => (
                    <div key={cat} className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3 whitespace-nowrap">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{cat}</span>
                        <span className="ml-2 px-2 py-0.5 bg-slate-50 rounded-md text-[9px] text-slate-400 font-bold">
                            {units.filter(u => u.unit.type === cat).length}
                        </span>
                    </div>
                ))}
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {units.map((u) => {
                    const Icon = u.unit.academicTier === 'k12' ? School : GraduationCap;
                    return (
                        <Card key={u.unit.id} className={cn(
                            "group border-none shadow-[0_32px_64px_-15px_rgba(0,0,0,0.08)] overflow-hidden rounded-[3rem] transition-all hover:shadow-[0_48px_96px_-15px_rgba(0,0,0,0.12)] hover:-translate-y-2",
                            !u.unit.isActive && "opacity-60 grayscale"
                        )}>
                            <CardHeader className="p-10 bg-slate-900 text-white flex flex-row justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl">
                                        <Icon className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-black italic uppercase tracking-tight leading-none mb-2">{u.unit.name}</CardTitle>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-300 border border-white/10">
                                                {u.unit.type}
                                            </span>
                                            <span className="px-3 py-1 bg-indigo-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-100 border border-indigo-500/20">
                                                {u.unit.academicTier === 'k12' ? 'K-12 System' : 'Tertiary/Higher Ed'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 relative z-10">
                                    <button
                                        onClick={() => toggleUnitStatus(u.unit.id, u.unit.isActive)}
                                        className={cn(
                                            "w-12 h-12 rounded-2xl transition-all flex items-center justify-center",
                                            u.unit.isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                        )}
                                    >
                                        <Activity className={cn("w-6 h-6", u.unit.isActive && "animate-pulse")} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(u.unit.id, u.unit.name)}
                                        className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                                    >
                                        <Trash2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 space-y-8 bg-white">
                                {/* Head of Unit Section */}
                                <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group/head">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">
                                            {u.head?.name?.[0] || <User className="w-8 h-8" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{u.unit.headTitle || "Head of Unit"}</p>
                                            <p className="text-lg font-black text-slate-900 italic tracking-tight">{u.head?.name || "Pending Assignment"}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleOpenEdit(u)}
                                        className="w-12 h-12 rounded-2xl hover:bg-slate-200 hover:rotate-90 transition-all duration-500"
                                    >
                                        <Settings className="w-6 h-6 text-slate-400" />
                                    </Button>
                                </div>

                                {/* Status Badges */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Operational Status</p>
                                        <span className={cn(
                                            "flex items-center gap-2 text-[11px] font-black uppercase tracking-widest",
                                            u.unit.isActive ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            <div className={cn("w-2 h-2 rounded-full", u.unit.isActive ? "bg-emerald-500 animate-ping" : "bg-rose-500")} />
                                            {u.unit.isActive ? "Live" : "Deactivated"}
                                        </span>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Registry Reference</p>
                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                            {u.unit.code}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Category Management Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl z-50 flex items-center justify-center p-6 transition-all duration-500">
                    <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden animate-in fade-in slide-in-from-bottom-8">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-xl font-black italic uppercase tracking-widest">Branch Classifications</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {categories.map(cat => (
                                    <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{cat}</span>
                                        <button onClick={() => handleDeleteCategory(cat)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="e.g. Study Center" 
                                    className="rounded-2xl border-slate-200 font-bold"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                />
                                <Button onClick={handleAddCategory} className="bg-indigo-600 text-white rounded-2xl px-6">
                                    Add
                                </Button>
                            </div>
                            <Button onClick={() => setShowCategoryModal(false)} variant="ghost" className="w-full font-black uppercase text-[10px] tracking-widest">
                                Done
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Premium Modal Section */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl z-50 flex items-center justify-center p-6 overflow-y-auto transition-all duration-500">
                    <Card className="w-full max-w-xl border-none shadow-[0_64px_128px_-15px_rgba(0,0,0,0.5)] rounded-[4rem] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 my-auto">
                        <CardHeader className="bg-slate-900 text-white p-12 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-slate-900 z-0" />
                            <div className="relative z-10">
                                <p className="text-indigo-400 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Architecture Manager</p>
                                <CardTitle className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                                    {editingId ? "Modify Configuration" : "Register Architecture"}
                                </CardTitle>
                            </div>
                            <button 
                                onClick={() => setShowAddModal(false)}
                                className="absolute top-10 right-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all z-20"
                            >
                                <XCircle className="w-6 h-6 text-white" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-12 space-y-8 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Institutional Designation</label>
                                    <Input
                                        placeholder="e.g. Faculty of Applied Sciences"
                                        className="rounded-2xl border-slate-200 px-8 py-8 font-black italic text-lg shadow-inner focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Registry Code</label>
                                        <Input
                                            placeholder="FAS"
                                            className="rounded-2xl border-slate-200 px-8 py-8 font-black uppercase text-center text-lg shadow-inner focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Branch Category</label>
                                        <select
                                            className="w-full h-[68px] rounded-2xl border border-slate-200 px-8 font-black uppercase text-[10px] tracking-widest bg-slate-50 shadow-inner appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Academic System (Critical)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, academicTier: 'tertiary' })}
                                            className={cn(
                                                "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                                formData.academicTier === 'tertiary' ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <GraduationCap className="w-8 h-8" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Tertiary / Uni</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, academicTier: 'k12' })}
                                            className={cn(
                                                "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                                formData.academicTier === 'k12' ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <School className="w-8 h-8" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">K-12 / Basic</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Executive Designation (Head Title)</label>
                                    <Input
                                        placeholder="Provost / Director / Dean"
                                        className="rounded-2xl border-slate-200 px-8 py-8 font-black italic shadow-inner focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={formData.headTitle}
                                        onChange={(e) => setFormData({ ...formData, headTitle: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Assign Controller (User)</label>
                                    <select
                                        className="w-full h-[68px] rounded-2xl border border-slate-200 px-8 font-black uppercase text-[10px] tracking-widest bg-slate-50 shadow-inner appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={formData.headUserId}
                                        onChange={(e) => setFormData({ ...formData, headUserId: e.target.value ? parseInt(e.target.value) : undefined })}
                                    >
                                        <option value="">Vacant / Not Assigned</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-6 pt-6">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 font-black py-8 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
                                    >
                                        Discard
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-slate-900 hover:bg-indigo-600 text-white font-black py-8 rounded-2xl uppercase text-[10px] tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {editingId ? "Commit Changes" : "Deploy Unit"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
