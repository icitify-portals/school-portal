"use client";

import { useState, useEffect } from "react";
import { 
    Plus, 
    Trash2, 
    MoveUp, 
    MoveDown, 
    Save, 
    Settings, 
    Link as LinkIcon, 
    Layout, 
    ChevronRight, 
    Globe,
    Zap,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getMenus, upsertMenu, deleteMenu, updateMenuOrder } from "@/actions/cms";
import { translateAllMenus } from "@/actions/cms-menu-translation";
import { cn } from "@/lib/utils";

const LOCALES = [
    { code: 'en', name: 'English' },
    { code: 'ha', name: 'Hausa' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'ig', name: 'Igbo' },
];

export default function MenuManagerPage() {
    const [activeLocale, setActiveLocale] = useState('en');
    const [menus, setMenus] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const loadMenus = async () => {
        setLoading(true);
        const res = await getMenus(activeLocale);
        if (res.success) setMenus(res.data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadMenus();
    }, [activeLocale]);

    const handleAdd = async (parentId: number | null = null) => {
        const res = await upsertMenu({
            label: "New Menu Item",
            href: "#",
            locale: activeLocale,
            parentId: parentId,
            order: menus.length
        });
        if (res.success) {
            toast.success("Item added");
            loadMenus();
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This will delete the item and its children.")) return;
        const res = await deleteMenu(id);
        if (res.success) {
            toast.success("Item deleted");
            loadMenus();
        }
    };

    const handleSync = async () => {
        if (!confirm("This will use AI to translate all EN menus to other locales. Proceed?")) return;
        setSyncing(true);
        const res = await translateAllMenus('en');
        setSyncing(false);
        if (res.success) {
            toast.success(`Success! Propagated ${res.count} items across Pan-African locales.`);
            loadMenus();
        }
    };

    const handleUpdate = async () => {
        if (!editingItem) return;
        const res = await upsertMenu(editingItem);
        if (res.success) {
            toast.success("Settings saved");
            setEditingItem(null);
            loadMenus();
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Navigation Hub</h1>
                    <p className="text-slate-500 font-medium">Manage localized Mega Menus for the Pan-African portal.</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={handleSync}
                        disabled={syncing}
                        className="rounded-xl border-slate-200 font-bold"
                    >
                        {syncing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2 text-indigo-600" />}
                        Pan-African AI Sync
                    </Button>
                    <Button onClick={() => handleAdd()} className="bg-indigo-600 rounded-xl font-bold px-6 shadow-lg shadow-indigo-600/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Main Menu
                    </Button>
                </div>
            </header>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {LOCALES.map(l => (
                    <button
                        key={l.code}
                        onClick={() => setActiveLocale(l.code)}
                        className={cn(
                            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                            activeLocale === l.code ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        {l.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : menus.length === 0 ? (
                        <Card className="p-12 text-center border-dashed border-2 border-slate-200 rounded-2xl">
                            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No menu items for this locale yet.</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {menus.map((menu, idx) => (
                                <div key={menu.id} className="space-y-3">
                                    <MenuCard 
                                        item={menu} 
                                        onEdit={() => setEditingItem(menu)}
                                        onDelete={() => handleDelete(menu.id)}
                                        onAddChild={() => handleAdd(menu.id)}
                                    />
                                    {menu.children && menu.children.map((child: any) => (
                                        <div key={child.id} className="ml-12">
                                            <MenuCard 
                                                item={child} 
                                                isChild
                                                onEdit={() => setEditingItem(child)}
                                                onDelete={() => handleDelete(child.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {editingItem ? (
                        <Card className="p-6 rounded-2xl shadow-xl border-slate-100 sticky top-8">
                            <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
                                <Settings className="w-5 h-5 text-indigo-600" />
                                Menu Settings
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Label</label>
                                    <Input 
                                        value={editingItem.label} 
                                        onChange={e => setEditingItem({...editingItem, label: e.target.value})}
                                        className="rounded-xl border-slate-200 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">URL / Href</label>
                                    <Input 
                                        value={editingItem.href} 
                                        onChange={e => setEditingItem({...editingItem, href: e.target.value})}
                                        className="rounded-xl border-slate-200 font-mono text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Description</label>
                                    <Input 
                                        value={editingItem.description || ""} 
                                        onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                                        className="rounded-xl border-slate-200 font-medium text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <input 
                                        type="checkbox" 
                                        checked={editingItem.isMega}
                                        onChange={e => setEditingItem({...editingItem, isMega: e.target.checked})}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                    <span className="text-sm font-bold text-slate-700">Display as Mega Menu</span>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleUpdate} className="flex-1 bg-indigo-600 rounded-xl font-bold h-12 shadow-lg shadow-indigo-600/20">
                                        <Save className="w-4 h-4 mr-2" />
                                        Update Item
                                    </Button>
                                    <Button variant="outline" onClick={() => setEditingItem(null)} className="rounded-xl px-4 border-slate-200">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                            <Settings className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Select an item to edit</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MenuCard({ item, isChild, onEdit, onDelete, onAddChild }: any) {
    return (
        <Card className={cn(
            "p-4 rounded-2xl flex items-center justify-between group transition-all",
            isChild ? "bg-white border-slate-100 hover:shadow-md" : "bg-white border-slate-200 shadow-sm hover:shadow-lg"
        )}>
            <div className="flex items-center gap-4">
                <div className={cn(
                    "p-2 rounded-xl",
                    isChild ? "bg-slate-50 text-slate-400" : "bg-indigo-50 text-indigo-600"
                )}>
                    {item.isMega ? <Layout className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.label}</span>
                        {item.isMega && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[9px] uppercase font-black tracking-widest rounded-full">Mega</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{item.href}</p>
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isChild && onAddChild && (
                    <Button variant="ghost" size="icon" onClick={onAddChild} className="text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg">
                        <Plus className="w-4 h-4" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onEdit} className="text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg">
                    <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
}
