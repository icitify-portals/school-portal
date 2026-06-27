"use client";

import { useState, useEffect } from "react";
import { 
    Plus, 
    Trash2, 
    Save, 
    Settings, 
    Link as LinkIcon, 
    Layout, 
    Globe,
    Zap,
    RefreshCw,
    ChevronDown,
    List,
    AlignLeft,
    Rows3,
    LayoutGrid,
    Layers,
    Footprints,
    Navigation,
    Navigation2,
    Grip,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getMenusBySlot, upsertMenu, deleteMenu, updateMenuOrder } from "@/actions/cms";
import { translateAllMenus } from "@/actions/cms-menu-translation";
import { cn } from "@/lib/utils";

// ───────────────────────────────────────────────
// Config
// ───────────────────────────────────────────────

const LOCALES = [
    { code: 'en', name: 'English' },
    { code: 'ha', name: 'Hausa' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'ig', name: 'Igbo' },
];

const SLOTS = [
    { id: 'primary',   label: 'Primary Menu',   icon: Navigation,   desc: 'Main navigation shown in the top navbar' },
    { id: 'secondary', label: 'Secondary Menu',  icon: Navigation2,  desc: 'Supplementary nav — e.g. utility links, quick access' },
    { id: 'footer',    label: 'Footer Menu',     icon: Footprints,   desc: 'Links rendered inside the site footer' },
];

const MENU_STYLES = [
    {
        id: 'mega',
        label: 'Mega Menu',
        icon: LayoutGrid,
        desc: 'Full-width panel with icons, descriptions and a featured card',
        badge: 'Premium',
        badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
        id: 'dropdown',
        label: 'Dropdown',
        icon: ChevronDown,
        desc: 'Classic hover dropdown with nested items',
        badge: 'Default',
        badgeColor: 'bg-slate-100 text-slate-600',
    },
    {
        id: 'accordion',
        label: 'Accordion',
        icon: Rows3,
        desc: 'Click-to-expand accordion for compact vertical layouts',
        badge: null,
        badgeColor: '',
    },
    {
        id: 'simple',
        label: 'Simple Links',
        icon: List,
        desc: 'Flat list of links with no hover panels — minimal and fast',
        badge: null,
        badgeColor: '',
    },
];

// ───────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────

export default function MenuManagerPage() {
    const [activeLocale, setActiveLocale] = useState('en');
    const [activeSlot, setActiveSlot] = useState('primary');
    const [menus, setMenus] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Style for the whole slot is derived from the first root item (or default)
    const slotStyle = menus[0]?.menu_style ?? 'dropdown';

    const loadMenus = async () => {
        setLoading(true);
        const res = await getMenusBySlot(activeSlot, activeLocale);
        if (res.success) setMenus(res.data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadMenus();
        setEditingItem(null);
    }, [activeLocale, activeSlot]);

    const handleAdd = async (parentId: number | null = null) => {
        const res = await upsertMenu({
            label: "New Item",
            href: "#",
            locale: activeLocale,
            parentId: parentId,
            slot: activeSlot,
            menu_style: slotStyle,
            order: menus.length,
        });
        if (res.success) {
            toast.success("Item added");
            loadMenus();
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this item and its children?")) return;
        const res = await deleteMenu(id);
        if (res.success) {
            toast.success("Deleted");
            loadMenus();
        }
    };

    const handleSync = async () => {
        if (!confirm("Use AI to translate all EN menus to other locales?")) return;
        setSyncing(true);
        const res = await translateAllMenus('en');
        setSyncing(false);
        if (res.success) {
            toast.success(`Propagated ${res.count} items across locales.`);
            loadMenus();
        }
    };

    const handleSave = async () => {
        if (!editingItem) return;
        const res = await upsertMenu(editingItem);
        if (res.success) {
            toast.success("Saved");
            setEditingItem(null);
            loadMenus();
        } else {
            toast.error(res.error || "Failed to save");
        }
    };

    /** Change the menu_style for every root item in the current slot */
    const handleChangeSlotStyle = async (newStyle: string) => {
        if (menus.length === 0) return;
        setSyncing(true);
        for (const m of menus) {
            await upsertMenu({ ...m, menu_style: newStyle, children: undefined });
        }
        setSyncing(false);
        toast.success(`Slot style changed to ${newStyle}`);
        loadMenus();
    };

    const activeSlotInfo = SLOTS.find(s => s.id === activeSlot)!;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Navigation Hub</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Manage multi-slot, multi-style menus for the portal.
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap justify-end">
                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={syncing}
                        className="rounded-xl border-slate-200 font-bold"
                    >
                        {syncing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2 text-indigo-600" />}
                        AI Locale Sync
                    </Button>
                    <Button onClick={() => handleAdd()} className="bg-indigo-600 rounded-xl font-bold px-6 shadow-lg shadow-indigo-600/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </div>
            </header>

            {/* ── Locale Switcher ─────────────────────── */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {LOCALES.map(l => (
                    <button
                        key={l.code}
                        onClick={() => setActiveLocale(l.code)}
                        className={cn(
                            "px-5 py-2 rounded-xl text-sm font-bold transition-all",
                            activeLocale === l.code ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        {l.name}
                    </button>
                ))}
            </div>

            {/* ── Slot Tabs ────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {SLOTS.map(slot => {
                    const Icon = slot.icon;
                    const isActive = activeSlot === slot.id;
                    return (
                        <button
                            key={slot.id}
                            onClick={() => setActiveSlot(slot.id)}
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                                isActive
                                    ? "border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100"
                                    : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl shrink-0",
                                isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className={cn("font-black text-sm uppercase tracking-tight", isActive ? "text-indigo-700" : "text-slate-700")}>{slot.label}</p>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{slot.desc}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Menu Style Picker ────────────────────── */}
            <Card className="p-5 rounded-2xl border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Style for: <span className="text-indigo-600">{activeSlotInfo.label}</span>
                    </span>
                    <div className="ml-2 flex items-center gap-1 text-[10px] text-slate-400">
                        <Info className="w-3 h-3" />
                        Applies to all root items in this slot
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {MENU_STYLES.map(style => {
                        const Icon = style.icon;
                        const isSelected = slotStyle === style.id;
                        return (
                            <button
                                key={style.id}
                                onClick={() => handleChangeSlotStyle(style.id)}
                                disabled={menus.length === 0 && style.id !== 'dropdown'}
                                className={cn(
                                    "relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all group",
                                    isSelected
                                        ? "border-indigo-600 bg-indigo-50 shadow-inner"
                                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                                )}
                            >
                                {style.badge && (
                                    <span className={cn("absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest", style.badgeColor)}>
                                        {style.badge}
                                    </span>
                                )}
                                <div className={cn(
                                    "p-2 rounded-xl",
                                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <p className={cn("font-black text-sm", isSelected ? "text-indigo-700" : "text-slate-800")}>{style.label}</p>
                                <p className="text-[10px] text-slate-400 font-medium leading-tight">{style.desc}</p>
                                {isSelected && (
                                    <span className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-indigo-600 shadow-md shadow-indigo-400" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* ── Items + Editor ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Item list */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : menus.length === 0 ? (
                        <Card className="p-12 text-center border-dashed border-2 border-slate-200 rounded-2xl">
                            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No items in this slot for this locale yet.</p>
                            <Button onClick={() => handleAdd()} className="mt-4 bg-indigo-600 rounded-xl font-bold px-6">
                                <Plus className="w-4 h-4 mr-2" /> Add First Item
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {menus.map((menu) => (
                                <div key={menu.id} className="space-y-2">
                                    <MenuCard
                                        item={menu}
                                        isActive={editingItem?.id === menu.id}
                                        onEdit={() => setEditingItem({ ...menu })}
                                        onDelete={() => handleDelete(menu.id)}
                                        onAddChild={() => handleAdd(menu.id)}
                                    />
                                    {menu.children?.map((child: any) => (
                                        <div key={child.id} className="ml-12">
                                            <MenuCard
                                                item={child}
                                                isChild
                                                isActive={editingItem?.id === child.id}
                                                onEdit={() => setEditingItem({ ...child })}
                                                onDelete={() => handleDelete(child.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Editor Panel */}
                <div className="space-y-6">
                    {editingItem ? (
                        <Card className="p-6 rounded-2xl shadow-xl border-slate-100 sticky top-8">
                            <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
                                <Settings className="w-5 h-5 text-indigo-600" />
                                Item Settings
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Label</label>
                                    <Input
                                        value={editingItem.label}
                                        onChange={e => setEditingItem({ ...editingItem, label: e.target.value })}
                                        className="rounded-xl border-slate-200 font-bold mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">URL / Href</label>
                                    <Input
                                        value={editingItem.href}
                                        onChange={e => setEditingItem({ ...editingItem, href: e.target.value })}
                                        className="rounded-xl border-slate-200 font-mono text-xs mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Description</label>
                                    <Input
                                        value={editingItem.description || ""}
                                        onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                        className="rounded-xl border-slate-200 font-medium text-sm mt-1"
                                        placeholder="Short description shown in mega/dropdown panels"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Icon Name (optional)</label>
                                    <Input
                                        value={editingItem.icon || ""}
                                        onChange={e => setEditingItem({ ...editingItem, icon: e.target.value })}
                                        className="rounded-xl border-slate-200 font-mono text-xs mt-1"
                                        placeholder="e.g. GraduationCap, BookOpen"
                                    />
                                    <p className="text-[9px] text-slate-400 mt-1 ml-1">Must be a Lucide React icon name</p>
                                </div>

                                {/* Slot selector for this item */}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Slot</label>
                                    <select
                                        value={editingItem.slot || 'primary'}
                                        onChange={e => setEditingItem({ ...editingItem, slot: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {SLOTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                </div>

                                {/* Style selector for this item */}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Menu Style</label>
                                    <select
                                        value={editingItem.menu_style || 'dropdown'}
                                        onChange={e => setEditingItem({ ...editingItem, menu_style: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {MENU_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleSave} className="flex-1 bg-indigo-600 rounded-xl font-bold h-12 shadow-lg shadow-indigo-600/20">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Item
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

                    {/* Style legend */}
                    <Card className="p-4 rounded-2xl border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-1">
                            <Info className="w-3 h-3" /> Style Guide
                        </p>
                        <ul className="space-y-2">
                            {MENU_STYLES.map(s => {
                                const Icon = s.icon;
                                return (
                                    <li key={s.id} className="flex items-center gap-2 text-xs text-slate-500">
                                        <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                        <span><strong className="text-slate-700">{s.label}:</strong> {s.desc}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ───────────────────────────────────────────────
// MenuCard component
// ───────────────────────────────────────────────

function MenuCard({ item, isChild, isActive, onEdit, onDelete, onAddChild }: any) {
    const style = item.menu_style || 'dropdown';
    const styleInfo = MENU_STYLES.find(s => s.id === style);
    const StyleIcon = styleInfo?.icon || List;

    return (
        <Card className={cn(
            "p-4 rounded-2xl flex items-center justify-between group transition-all",
            isActive ? "ring-2 ring-indigo-600 shadow-lg shadow-indigo-100" : "",
            isChild ? "bg-white border-slate-100 hover:shadow-md" : "bg-white border-slate-200 shadow-sm hover:shadow-lg"
        )}>
            <div className="flex items-center gap-4">
                <div className={cn(
                    "p-2 rounded-xl",
                    isChild ? "bg-slate-50 text-slate-400" : "bg-indigo-50 text-indigo-600"
                )}>
                    <StyleIcon className="w-5 h-5" />
                </div>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{item.label}</span>
                        {styleInfo && (
                            <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 text-[9px] uppercase font-black tracking-widest rounded-full">
                                {styleInfo.label}
                            </Badge>
                        )}
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
