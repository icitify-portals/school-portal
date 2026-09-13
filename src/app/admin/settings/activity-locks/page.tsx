"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Lock,
    Unlock,
    Plus,
    Trash2,
    Search,
    Shield,
    Loader2,
    Pencil,
    X,
    Clock,
    AlertTriangle,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getActivityLocksAction,
    createActivityLockAction,
    updateActivityLockAction,
    toggleActivityLockAction,
    deleteActivityLockAction,
    getLockDepartmentsAction,
} from "@/actions/activity-locks";
import { toast } from "sonner";

type LockRow = {
    id: number;
    activity: string;
    scope: "global" | "programme_level" | "department" | "applicant";
    programmeType: "ND" | "HND" | null;
    level: number | null;
    departmentId: number | null;
    isLocked: boolean;
    opensAt: string | null;
    closesAt: string | null;
    message: string | null;
    createdBy: number | null;
    createdAt: string | null;
    updatedAt: string | null;
};

const SCOPE_LABELS: Record<string, string> = {
    global: "Global",
    programme_level: "Programme + Level",
    department: "Department",
    applicant: "Applicant Only",
};

export default function ActivityLocksPage() {
    const [locks, setLocks] = useState<LockRow[]>([]);
    const [activities, setActivities] = useState<Record<string, string>>({});
    const [activityLabels, setActivityLabels] = useState<Record<string, string>>({});
    const [scopes, setScopes] = useState<string[]>([]);
    const [departments, setDepartments] = useState<{ id: number; name: string; code: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [creating, setCreating] = useState(false);
    const [editLock, setEditLock] = useState<LockRow | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    // Form state
    const [formActivity, setFormActivity] = useState("");
    const [formScope, setFormScope] = useState("global");
    const [formProgrammeType, setFormProgrammeType] = useState<string>("");
    const [formLevel, setFormLevel] = useState<string>("");
    const [formDepartmentId, setFormDepartmentId] = useState<string>("");
    const [formOpensAt, setFormOpensAt] = useState("");
    const [formClosesAt, setFormClosesAt] = useState("");
    const [formMessage, setFormMessage] = useState("");
    const [formIsLocked, setFormIsLocked] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [res, deptRes] = await Promise.all([
            getActivityLocksAction(),
            getLockDepartmentsAction(),
        ]);
        if (res.success) {
            setLocks((res.locks || []) as LockRow[]);
            setActivities(res.activities || {});
            setActivityLabels(res.activityLabels || {});
            setScopes(res.scopes as unknown as string[] || []);
        }
        if (deptRes.success) {
            setDepartments(deptRes.departments || []);
        }
        setLoading(false);
    };

    const filtered = locks.filter((l) => {
        if (!search) return true;
        const s = search.toLowerCase();
        const label = activityLabels[l.activity] || l.activity;
        return (
            label.toLowerCase().includes(s) ||
            l.activity.toLowerCase().includes(s) ||
            l.scope.toLowerCase().includes(s) ||
            (l.message || "").toLowerCase().includes(s)
        );
    });

    const resetForm = () => {
        setFormActivity("");
        setFormScope("global");
        setFormProgrammeType("");
        setFormLevel("");
        setFormDepartmentId("");
        setFormOpensAt("");
        setFormClosesAt("");
        setFormMessage("");
        setFormIsLocked(true);
    };

    const handleCreate = async () => {
        if (!formActivity) {
            toast.error("Select an activity");
            return;
        }
        setCreating(true);
        const res = await createActivityLockAction({
            activity: formActivity,
            scope: formScope as any,
            programmeType: formScope === "programme_level" ? (formProgrammeType as "ND" | "HND") : null,
            level: formScope === "programme_level" && formLevel ? parseInt(formLevel) : null,
            departmentId: formScope === "department" && formDepartmentId ? parseInt(formDepartmentId) : null,
            isLocked: formIsLocked,
            opensAt: formOpensAt || null,
            closesAt: formClosesAt || null,
            message: formMessage || null,
        });
        setCreating(false);
        if (res.success) {
            toast.success("Activity lock created");
            resetForm();
            loadData();
        } else {
            toast.error(res.error || "Failed to create");
        }
    };

    const handleToggle = async (lock: LockRow) => {
        const res = await toggleActivityLockAction(lock.id, !lock.isLocked);
        if (res.success) {
            toast.success(lock.isLocked ? "Unlocked" : "Locked");
            loadData();
        } else {
            toast.error(res.error || "Failed to toggle");
        }
    };

    const handleEdit = async () => {
        if (!editLock) return;
        const res = await updateActivityLockAction(editLock.id, {
            scope: formScope as any,
            programmeType: formScope === "programme_level" ? (formProgrammeType as "ND" | "HND") : null,
            level: formScope === "programme_level" && formLevel ? parseInt(formLevel) : null,
            departmentId: formScope === "department" && formDepartmentId ? parseInt(formDepartmentId) : null,
            isLocked: formIsLocked,
            opensAt: formOpensAt || null,
            closesAt: formClosesAt || null,
            message: formMessage || null,
        });
        if (res.success) {
            toast.success("Lock updated");
            setEditOpen(false);
            setEditLock(null);
            resetForm();
            loadData();
        } else {
            toast.error(res.error || "Failed to update");
        }
    };

    const handleDelete = async (lock: LockRow) => {
        if (!confirm(`Delete ${activityLabels[lock.activity] || lock.activity} (${SCOPE_LABELS[lock.scope] || lock.scope})?`)) return;
        const res = await deleteActivityLockAction(lock.id);
        if (res.success) {
            toast.success("Lock deleted");
            loadData();
        } else {
            toast.error(res.error || "Failed to delete");
        }
    };

    const openEditDialog = (lock: LockRow) => {
        setEditLock(lock);
        setFormScope(lock.scope);
        setFormProgrammeType(lock.programmeType || "");
        setFormLevel(lock.level?.toString() || "");
        setFormDepartmentId(lock.departmentId?.toString() || "");
        setFormOpensAt(lock.opensAt ? new Date(lock.opensAt).toISOString().slice(0, 16) : "");
        setFormClosesAt(lock.closesAt ? new Date(lock.closesAt).toISOString().slice(0, 16) : "");
        setFormMessage(lock.message || "");
        setFormIsLocked(lock.isLocked);
        setEditOpen(true);
    };

    const formatDate = (d: string | null) => {
        if (!d) return "—";
        return new Date(d).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
    };

    return (
        <div className="p-5 md:p-8 max-w-[1600px] w-full mx-auto space-y-8 pb-20">
            {/* Header */}
            <Card className="border-none shadow-xl rounded-[2rem] bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900">Activity Locks</CardTitle>
                            <p className="text-sm text-slate-500 mt-0.5">Freeze specific portal activities (payments, registration, etc.)</p>
                        </div>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl">
                                <Plus className="w-4 h-4 mr-1.5" />
                                New Lock
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px] border-none rounded-2xl p-8">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black">Create Activity Lock</DialogTitle>
                                <DialogDescription>Freeze a portal activity for specific students or globally.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Activity</Label>
                                    <Select value={formActivity} onValueChange={setFormActivity}>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5">
                                            <SelectValue placeholder="Select activity" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100">
                                            {Object.entries(activityLabels).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Scope</Label>
                                    <Select value={formScope} onValueChange={setFormScope}>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100">
                                            {scopes.map((s) => (
                                                <SelectItem key={s} value={s}>{SCOPE_LABELS[s] || s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formScope === "programme_level" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Programme Type</Label>
                                            <Select value={formProgrammeType} onValueChange={setFormProgrammeType}>
                                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5">
                                                    <SelectValue placeholder="All" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-100">
                                                    <SelectItem value="ND">ND</SelectItem>
                                                    <SelectItem value="HND">HND</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Level</Label>
                                            <Select value={formLevel} onValueChange={setFormLevel}>
                                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5">
                                                    <SelectValue placeholder="All levels" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-100">
                                                    <SelectItem value="1">Level 1 (ND1/HND1)</SelectItem>
                                                    <SelectItem value="2">Level 2 (ND2/HND2)</SelectItem>
                                                    <SelectItem value="3">Level 3 (HND3)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                                {formScope === "department" && (
                                    <div>
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Department</Label>
                                        <Select value={formDepartmentId} onValueChange={setFormDepartmentId}>
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5">
                                                <SelectValue placeholder="Select department" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 max-h-60">
                                                {departments.map((d) => (
                                                    <SelectItem key={d.id} value={d.id.toString()}>{d.name} ({d.code})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Locked Until (opens at)</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formOpensAt}
                                            onChange={(e) => setFormOpensAt(e.target.value)}
                                            className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Lock Expires (closes at)</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formClosesAt}
                                            onChange={(e) => setFormClosesAt(e.target.value)}
                                            className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Message (shown to blocked users)</Label>
                                    <Textarea
                                        value={formMessage}
                                        onChange={(e) => setFormMessage(e.target.value)}
                                        placeholder="e.g. School fee payments are closed for the holiday."
                                        className="rounded-xl bg-slate-50 border-slate-100 mt-1.5 min-h-[80px]"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="formIsLocked"
                                        checked={formIsLocked}
                                        onChange={(e) => setFormIsLocked(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <Label htmlFor="formIsLocked" className="text-sm font-medium">Active (lock is enforced)</Label>
                                </div>
                            </div>
                            <DialogFooter className="mt-6">
                                <Button onClick={handleCreate} disabled={creating} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                                    Create Lock
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
            </Card>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Search locks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-white border-slate-200"
                />
            </div>

            {/* Table */}
            <Card className="border-none shadow-xl rounded-[2rem] bg-white">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No activity locks found</p>
                            <p className="text-sm mt-1">Create a lock to freeze a portal activity.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Activity</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Scope</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Target</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Window</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Message</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.map((lock) => {
                                        const target = lock.scope === "programme_level"
                                            ? `${lock.programmeType || "Any"} Level ${lock.level || "?"}`
                                            : lock.scope === "department"
                                            ? departments.find((d) => d.id === lock.departmentId)?.name || `Dept #${lock.departmentId}`
                                            : lock.scope === "applicant"
                                            ? "Applicants"
                                            : "All";
                                        return (
                                            <tr key={lock.id} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-slate-900 text-sm">
                                                        {activityLabels[lock.activity] || lock.activity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                        {SCOPE_LABELS[lock.scope] || lock.scope}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{target}</td>
                                                <td className="px-6 py-4">
                                                    {lock.isLocked ? (
                                                        <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                            <Lock className="w-3 h-3 mr-1" />
                                                            Locked
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                            <Unlock className="w-3 h-3 mr-1" />
                                                            Open
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    {lock.opensAt && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Until {formatDate(lock.opensAt)}
                                                        </div>
                                                    )}
                                                    {lock.closesAt && (
                                                        <div className="flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Expires {formatDate(lock.closesAt)}
                                                        </div>
                                                    )}
                                                    {!lock.opensAt && !lock.closesAt && <span>—</span>}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                                                    {lock.message || "—"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggle(lock)}
                                                            className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                                                lock.isLocked
                                                                    ? "text-emerald-600 hover:bg-emerald-50"
                                                                    : "text-red-600 hover:bg-red-50"
                                                            }`}
                                                        >
                                                            {lock.isLocked ? <Unlock className="w-3.5 h-3.5 mr-1" /> : <Lock className="w-3.5 h-3.5 mr-1" />}
                                                            {lock.isLocked ? "Unlock" : "Lock"}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(lock)}
                                                            className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(lock)}
                                                            className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[550px] border-none rounded-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Edit Activity Lock</DialogTitle>
                        <DialogDescription>
                            {editLock && `${activityLabels[editLock.activity] || editLock.activity}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Scope</Label>
                            <Select value={formScope} onValueChange={setFormScope}>
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100">
                                    {scopes.map((s) => (
                                        <SelectItem key={s} value={s}>{SCOPE_LABELS[s] || s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {formScope === "programme_level" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Programme Type</Label>
                                    <Select value={formProgrammeType} onValueChange={setFormProgrammeType}>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5">
                                            <SelectValue placeholder="All" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100">
                                            <SelectItem value="ND">ND</SelectItem>
                                            <SelectItem value="HND">HND</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Level</Label>
                                    <Select value={formLevel} onValueChange={setFormLevel}>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5">
                                            <SelectValue placeholder="All levels" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100">
                                            <SelectItem value="1">Level 1 (ND1/HND1)</SelectItem>
                                            <SelectItem value="2">Level 2 (ND2/HND2)</SelectItem>
                                            <SelectItem value="3">Level 3 (HND3)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        {formScope === "department" && (
                            <div>
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Department</Label>
                                <Select value={formDepartmentId} onValueChange={setFormDepartmentId}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 max-h-60">
                                        {departments.map((d) => (
                                            <SelectItem key={d.id} value={d.id.toString()}>{d.name} ({d.code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Locked Until</Label>
                                <Input
                                    type="datetime-local"
                                    value={formOpensAt}
                                    onChange={(e) => setFormOpensAt(e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Expires At</Label>
                                <Input
                                    type="datetime-local"
                                    value={formClosesAt}
                                    onChange={(e) => setFormClosesAt(e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 border-slate-100 mt-1.5"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Message</Label>
                            <Textarea
                                value={formMessage}
                                onChange={(e) => setFormMessage(e.target.value)}
                                className="rounded-xl bg-slate-50 border-slate-100 mt-1.5 min-h-[80px]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="editIsLocked"
                                checked={formIsLocked}
                                onChange={(e) => setFormIsLocked(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300"
                            />
                            <Label htmlFor="editIsLocked" className="text-sm font-medium">Active (lock is enforced)</Label>
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button onClick={handleEdit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
