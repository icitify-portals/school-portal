"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Save,
    Trash2,
    GripVertical,
    ChevronDown,
    ChevronRight,
    Link as LinkIcon,
    Loader2,
    Check,
    Edit,
    Globe,
    ExternalLink,
    Library,
    Book,
    GraduationCap,
    School,
    FileText,
    LayoutDashboard,
    User,
    Users,
    Settings,
    HelpCircle,
    Info,
    Phone,
    Mail,
    Calendar,
    Award,
    Search,
    Image,
    Video,
    Layers,
    Eye,
    EyeOff,
    Zap,
    Layout
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { getMenus, upsertMenu, deleteMenu, updateMenuOrder } from "@/actions/cms";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ICON_OPTIONS = [
    { name: 'Globe', icon: Globe },
    { name: 'Library', icon: Library },
    { name: 'Book', icon: Book },
    { name: 'GraduationCap', icon: GraduationCap },
    { name: 'School', icon: School },
    { name: 'FileText', icon: FileText },
    { name: 'LayoutDashboard', icon: LayoutDashboard },
    { name: 'User', icon: User },
    { name: 'Users', icon: Users },
    { name: 'Settings', icon: Settings },
    { name: 'HelpCircle', icon: HelpCircle },
    { name: 'Info', icon: Info },
    { name: 'Phone', icon: Phone },
    { name: 'Mail', icon: Mail },
    { name: 'Calendar', icon: Calendar },
    { name: 'Award', icon: Award },
    { name: 'Search', icon: Search },
    { name: 'Image', icon: Image },
    { name: 'Video', icon: Video },
    { name: 'Layers', icon: Layers }
];

const SYSTEM_SHORTCUTS = [
    { label: 'Admission Form', href: '/admissions/apply', icon: 'FileText' },
    { label: 'Student Portal', href: '/login', icon: 'User' },
    { label: 'School Fees', href: '/payments/fees', icon: 'Zap' },
    { label: 'Academic Calendar', href: '/calendar', icon: 'Calendar' },
    { label: 'Contact Us', href: '/contact', icon: 'Phone' }
];

export default function MenuBuilder() {
    const [menus, setMenus] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [newItem, setNewItem] = useState({ label: "", href: "", parentId: null as number | null, order: 0, icon: 'Globe', isMega: false, target: '_self' });

    const fetchData = async () => {
        setLoading(true);
        const res = await getMenus();
        if (res.success && res.data) {
            setMenus(res.data);
        } else {
            toast.error(res.error || "Failed to fetch menus");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;

        const { source, destination, draggableId, type } = result;

        if (type === "DEFAULT") {
            const newMenus = Array.from(menus);
            const [reorderedItem] = newMenus.splice(source.index, 1);
            newMenus.splice(destination.index, 0, reorderedItem);

            setMenus(newMenus);

            const updates = newMenus.map((m, index) => ({
                id: m.id,
                order: index,
                parentId: null
            }));

            await updateMenuOrder(updates);
            toast.success("Main menu order updated");
        } else if (type.startsWith("SUB-")) {
            const parentId = parseInt(type.split("-")[1]);
            const parent = menus.find(m => m.id === parentId);
            if (!parent) return;

            const newChildren = Array.from(parent.children || []);
            const [reorderedItem] = newChildren.splice(source.index, 1);
            newChildren.splice(destination.index, 0, reorderedItem);

            const newMenus = menus.map(m => m.id === parentId ? { ...m, children: newChildren } : m);
            setMenus(newMenus);

            const updates = newChildren.map((c: any, index: number) => ({
                id: c.id,
                order: index,
                parentId
            }));

            await updateMenuOrder(updates);
            toast.success("Sub-menu order updated");
        }
    };

    const handleSave = async (data: any) => {
        const res = await upsertMenu(data);
        if (res.success) {
            toast.success("Menu item saved");
            setIsAdding(false);
            setEditingItem(null);
            fetchData();
        } else {
            toast.error(res.error || "Failed to save menu item");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This will delete all sub-menus too.")) return;
        const res = await deleteMenu(id);
        if (res.success) {
            toast.success("Menu item deleted");
            fetchData();
        } else {
            toast.error(res.error || "Failed to delete");
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Menu Builder</h1>
                        <p className="text-slate-500 mt-1">Manage your website's navigation structure and dropdowns.</p>
                    </div>
                    <Button onClick={() => { setNewItem({ label: "", href: "", parentId: null, order: menus.length, icon: 'Globe', isMega: false, target: '_self' }); setIsAdding(true); }} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 rounded-xl transition-all h-11 px-6 font-bold">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Main Menu
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Builder Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden min-h-[500px]">
                            <CardHeader className="border-b border-slate-50 p-6">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Website Navigation Structure</CardTitle>
                                <CardDescription>Rearrange items using drag and drop</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center p-20">
                                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                    </div>
                                ) : menus.length === 0 ? (
                                    <div className="text-center p-20 flex flex-col items-center gap-4">
                                        <div className="p-4 bg-slate-50 rounded-full">
                                            <Layout className="w-12 h-12 text-slate-200" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Your Menu is Empty</p>
                                            <p className="text-sm text-slate-400">Start by adding a main menu item or using shortcuts.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <DragDropContext onDragEnd={onDragEnd}>
                                        <Droppable droppableId="main-menu" type="DEFAULT">
                                            {(provided) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                                    {menus.map((menu, index) => (
                                                        <Draggable key={menu.id} draggableId={menu.id.toString()} index={index}>
                                                            {(provided) => (
                                                                <div 
                                                                    ref={provided.innerRef} 
                                                                    {...provided.draggableProps}
                                                                >
                                                                    <MenuItemRow
                                                                        item={menu}
                                                                        onEdit={(item: any) => setEditingItem(item)}
                                                                        onDelete={handleDelete}
                                                                        onAddSub={(id: number) => { setNewItem({ label: "", href: "", parentId: id, order: menu.children?.length || 0, icon: 'Globe', isMega: false, target: '_self' } as any); setIsAdding(true); }}
                                                                        dragHandleProps={provided.dragHandleProps}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar: Shortcuts & Tips */}
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-none shadow-sm bg-indigo-600 text-white overflow-hidden p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                <h3 className="font-black uppercase tracking-widest text-xs">Institutional Shortcuts</h3>
                            </div>
                            <p className="text-indigo-100 text-xs leading-relaxed">Quickly add standard pages to your navigation menu with one click.</p>
                            <div className="space-y-2 pt-2">
                                {SYSTEM_SHORTCUTS.map((sc, i) => (
                                    <Button 
                                        key={i}
                                        onClick={() => handleSave({ ...sc, order: menus.length })}
                                        className="w-full justify-start bg-white/10 hover:bg-white/20 border-none text-white text-xs font-bold rounded-xl h-10 px-4"
                                    >
                                        {sc.label}
                                    </Button>
                                ))}
                            </div>
                        </Card>

                        <Card className="rounded-2xl border-none shadow-sm bg-white p-6 space-y-4">
                            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Builder Guidelines</h3>
                            <ul className="space-y-3">
                                <li className="flex gap-3 items-start">
                                    <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-bold">1</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-normal">Use short labels (1-2 words) for the main navigation to avoid wrapping.</p>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-bold">2</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-normal">Enable <strong>Mega Menu</strong> for items with more than 5 sub-links for better layout.</p>
                                </li>
                            </ul>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Upsert Dialog */}
            <Dialog open={isAdding || !!editingItem} onOpenChange={(open) => { if (!open) { setIsAdding(false); setEditingItem(null); } }}>
                <DialogContent className="rounded-2xl max-w-2xl overflow-hidden p-0 gap-0 border-none">
                    <DialogHeader className="p-6 bg-slate-900 text-white">
                        <DialogTitle className="text-xl font-bold italic uppercase tracking-tighter">
                            {editingItem ? "Refine Navigation Item" : "New Navigation Item"}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Link Information</Label>
                                    <Input
                                        placeholder="e.g. Student Services"
                                        className="h-11 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                                        value={editingItem ? editingItem.label : newItem.label}
                                        onChange={(e) => editingItem ? setEditingItem({ ...editingItem, label: e.target.value }) : setNewItem({ ...newItem, label: e.target.value })}
                                    />
                                    <Input
                                        placeholder="e.g. /students or https://..."
                                        className="h-11 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-xs"
                                        value={editingItem ? editingItem.href : newItem.href}
                                        onChange={(e) => editingItem ? setEditingItem({ ...editingItem, href: e.target.value }) : setNewItem({ ...newItem, href: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Behavior & Layout</Label>
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-slate-900">Mega Menu</div>
                                            <div className="text-[10px] text-slate-500">Enable wide dropdown layout</div>
                                        </div>
                                        <Switch 
                                            checked={editingItem ? !!editingItem.isMega : !!newItem.isMega}
                                            onCheckedChange={(v) => editingItem ? setEditingItem({ ...editingItem, isMega: v }) : setNewItem({ ...newItem, isMega: v } as any)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-slate-900">Open in New Tab</div>
                                            <div className="text-[10px] text-slate-500">For external resources</div>
                                        </div>
                                        <Switch 
                                            checked={(editingItem ? editingItem.target : (newItem as any).target) === '_blank'}
                                            onCheckedChange={(v) => {
                                                const target = v ? '_blank' : '_self';
                                                editingItem ? setEditingItem({ ...editingItem, target }) : setNewItem({ ...newItem, target } as any);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-l border-slate-100 flex flex-col gap-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Associate Icon</Label>
                            <div className="grid grid-cols-5 gap-2 h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {ICON_OPTIONS.map((opt) => {
                                    const Icon = opt.icon;
                                    const isSelected = (editingItem ? editingItem.icon : (newItem as any).icon) === opt.name;
                                    return (
                                        <button
                                            key={opt.name}
                                            onClick={() => editingItem ? setEditingItem({ ...editingItem, icon: opt.name }) : setNewItem({ ...newItem, icon: opt.name } as any)}
                                            className={cn(
                                                "aspect-square rounded-xl flex items-center justify-center transition-all border-2",
                                                isSelected 
                                                    ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20 text-white" 
                                                    : "bg-white border-transparent text-slate-400 hover:text-indigo-600 hover:border-indigo-100"
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-auto pt-6 flex flex-col gap-3">
                                <Button onClick={() => handleSave(editingItem || newItem)} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl font-bold shadow-lg shadow-indigo-600/20">
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingItem ? "Update Navigation" : "Include in Menu"}
                                </Button>
                                <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingItem(null); }} className="w-full rounded-2xl font-bold text-slate-400">
                                    Discard Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function MenuItemRow({ item, onEdit, onDelete, onAddSub, dragHandleProps }: any) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    const Icon = ICON_OPTIONS.find(o => o.name === item.icon)?.icon || Globe;

    return (
        <div className="space-y-2">
            <div className={cn(
                "flex items-center justify-between p-4 bg-white rounded-2xl border transition-all shadow-sm",
                item.isActive === false ? "opacity-50 grayscale bg-slate-50 border-slate-100" : "border-slate-100 hover:border-indigo-200"
            )}>
                <div className="flex items-center gap-4">
                    <div {...dragHandleProps} className="p-1 hover:bg-slate-100 rounded-lg cursor-grab active:cursor-grabbing text-slate-300">
                        <GripVertical className="w-5 h-5" />
                    </div>
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        item.isActive === false ? "bg-slate-200 text-slate-400" : "bg-indigo-50 text-indigo-600"
                    )}>
                        <Icon className="w-5 h-5" />
                    </div>
                    {hasChildren && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{item.label}</span>
                            {item.isMega && <Badge className="bg-amber-100 text-amber-600 border-none text-[8px] uppercase tracking-widest px-1.5 h-4">Mega</Badge>}
                            {item.target === '_blank' && <ExternalLink className="w-3 h-3 text-slate-300" />}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">{item.href}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onAddSub(item.id)} className="h-9 w-9 text-indigo-500 hover:bg-indigo-50 rounded-xl">
                        <Plus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl">
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="h-9 w-9 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="ml-10 space-y-3 pt-1 border-l-2 border-slate-100/50 pl-6">
                    <Droppable droppableId={`sub-${item.id}`} type={`SUB-${item.id}`}>
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                {item.children.map((child: any, index: number) => (
                                    <Draggable key={child.id} draggableId={child.id.toString()} index={index}>
                                        {(provided) => (
                                            <div 
                                                ref={provided.innerRef} 
                                                {...provided.draggableProps}
                                                className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group/sub hover:bg-white hover:border-indigo-100 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div {...provided.dragHandleProps} className="text-slate-200">
                                                        <GripVertical className="w-3 h-3" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{child.label}</span>
                                                    <span className="text-[9px] text-slate-400 font-mono opacity-50 group-hover/sub:opacity-100">{child.href}</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => onEdit(child)} className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                                        <Edit className="w-3 h-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => onDelete(child.id)} className="h-7 w-7 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            )}
        </div>
    );
}
