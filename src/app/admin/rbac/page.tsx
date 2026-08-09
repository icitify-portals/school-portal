"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Shield, ShieldAlert, ShieldCheck, Loader2, Plus, Search,
    Users, Lock, RefreshCw, CheckCircle2, XCircle, ChevronDown,
    ChevronRight, ChevronLeft, Filter, X, ToggleLeft
} from "lucide-react";
import {
    getAllRoles,
    getAllPermissions,
    addPermissionToRole,
    removePermissionFromRole,
    getUsersWithRoles,
    assignRoleToUser,
    removeRoleFromUser
} from "@/actions/rbac";
import { cn } from "@/lib/utils";

// ---- Toggle Switch ----
function ToggleSwitch({
    checked, onChange, disabled = false, size = "md",
}: {
    checked: boolean; onChange: () => void; disabled?: boolean; size?: "sm" | "md";
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={onChange}
            className={cn(
                "relative inline-flex shrink-0 rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                size === "sm" ? "h-5 w-9" : "h-6 w-11",
                checked ? "bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.4)]" : "bg-slate-200",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"
            )}
        >
            <span className={cn(
                "pointer-events-none inline-block rounded-full bg-white shadow-md transition-transform duration-200",
                size === "sm" ? "h-4 w-4" : "h-5 w-5",
                checked ? (size === "sm" ? "translate-x-4" : "translate-x-5") : "translate-x-0"
            )} />
        </button>
    );
}

// ---- Toast ----
function Toast({ message, type }: { message: string; type: "success" | "error" }) {
    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-semibold animate-in slide-in-from-bottom-4 duration-300",
            type === "success" ? "bg-emerald-600" : "bg-rose-600"
        )}>
            {type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            {message}
        </div>
    );
}

// ---- Category color map ----
const catColors: Record<string, string> = {
    Academic: "bg-blue-50 text-blue-700 border-blue-200",
    Finance:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    System:   "bg-purple-50 text-purple-700 border-purple-200",
    Hostel:   "bg-amber-50 text-amber-700 border-amber-200",
    HR:       "bg-rose-50 text-rose-700 border-rose-200",
    Security: "bg-slate-50 text-slate-600 border-slate-200",
    default:  "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const USERS_PER_PAGE = 15;

// ============================================================
// MAIN PAGE
// ============================================================
export default function RBACPage() {
    const [roles, setRoles]           = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [users, setUsers]           = useState<any[]>([]);
    const [loading, setLoading]       = useState(true);
    const [activeTab, setActiveTab]   = useState("users");
    const [toast, setToast]           = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // ---- Users tab state ----
    const [userSearch, setUserSearch]           = useState("");
    const [roleFilter, setRoleFilter]           = useState("all");   // "all" | "assigned" | roleId
    const [currentPage, setCurrentPage]         = useState(1);
    const [expandedUserIds, setExpandedUserIds] = useState<number[]>([]);

    // ---- Roles tab state ----
    const [expandedRoleId, setExpandedRoleId]   = useState<number | null>(null);
    const [permSearch, setPermSearch]           = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3200);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const showToast = (msg: string, type: "success" | "error") => setToast({ message: msg, type });

    async function fetchData() {
        setLoading(true);
        const [rData, pData, uData] = await Promise.all([
            getAllRoles(), getAllPermissions(), getUsersWithRoles()
        ]);
        setRoles(rData);
        setPermissions(pData);
        setUsers(uData);
        setLoading(false);
    }

    // ---- Handlers ----
    async function handleTogglePermission(roleId: number, permId: number, isAssigned: boolean) {
        const key = `perm-${roleId}-${permId}`;
        setTogglingId(key);
        const res = isAssigned
            ? await removePermissionFromRole(roleId, permId)
            : await addPermissionToRole(roleId, permId);
        showToast(
            res.success
                ? (isAssigned ? "Permission removed" : "Permission granted")
                : (res.error || "Failed to update permission"),
            res.success ? "success" : "error"
        );
        if (res.success) await fetchData();
        setTogglingId(null);
    }

    async function handleUserRoleToggle(userId: number, roleId: number, isAssigned: boolean) {
        const key = `role-${userId}-${roleId}`;
        setTogglingId(key);
        const res = isAssigned
            ? await removeRoleFromUser(userId, roleId)
            : await assignRoleToUser(userId, roleId);
        showToast(
            res.success
                ? (isAssigned ? "Role removed" : "Role assigned")
                : (res.error || "Failed to update role"),
            res.success ? "success" : "error"
        );
        if (res.success) await fetchData();
        setTogglingId(null);
    }

    // ---- Computed: users ----
    const filteredUsers = useMemo(() => {
        let list = users;
        const q = userSearch.trim().toLowerCase();
        if (q) list = list.filter(u =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.role?.toLowerCase().includes(q)
        );
        if (roleFilter === "assigned") {
            list = list.filter(u => u.roles?.length > 0);
        } else if (roleFilter === "unassigned") {
            list = list.filter(u => !u.roles?.length);
        } else if (roleFilter !== "all") {
            list = list.filter(u => u.roles?.some((ur: any) => ur.roleId.toString() === roleFilter));
        }
        return list;
    }, [users, userSearch, roleFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pagedUsers = filteredUsers.slice((safeCurrentPage - 1) * USERS_PER_PAGE, safeCurrentPage * USERS_PER_PAGE);

    // Reset to page 1 when filters change
    const handleSearchChange = (v: string) => { setUserSearch(v); setCurrentPage(1); };
    const handleRoleFilterChange = (v: string) => { setRoleFilter(v); setCurrentPage(1); };

    // ---- Computed: permissions ----
    const permCategories = useMemo(() => {
        const cats = new Set(permissions.map((p: any) => p.category || "System"));
        return ["All", ...Array.from(cats)] as string[];
    }, [permissions]);

    const filteredPerms = useMemo(() => {
        let list = permissions;
        if (selectedCategory !== "All") list = list.filter((p: any) => (p.category || "System") === selectedCategory);
        const q = permSearch.trim().toLowerCase();
        if (q) list = list.filter((p: any) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
        return list;
    }, [permissions, selectedCategory, permSearch]);

    // Summary stats
    const assignedCount = users.filter(u => u.roles?.length > 0).length;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <p className="text-slate-500 font-semibold">Loading access control…</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/10 p-6 lg:p-8">
            <div className="max-w-[1500px] mx-auto space-y-6">

                {/* ---- HEADER ---- */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-10 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-600/40 via-purple-600/20 to-transparent" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Roles & Permissions</h1>
                            </div>
                            <p className="text-slate-400 text-sm max-w-xl">
                                Manage user access control. Use toggles to quickly grant or revoke permissions from roles and assign roles to specific staff.
                            </p>
                            <div className="flex flex-wrap gap-3 mt-4">
                                {[
                                    { icon: ShieldCheck, color: "text-indigo-400", label: `${roles.length} Roles` },
                                    { icon: Lock, color: "text-purple-400", label: `${permissions.length} Permissions` },
                                    { icon: Users, color: "text-emerald-400", label: `${users.length} Users` },
                                    { icon: ShieldAlert, color: "text-amber-400", label: `${assignedCount} With Roles` },
                                ].map(({ icon: Icon, color, label }) => (
                                    <div key={label} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-300">
                                        <Icon className={cn("w-3.5 h-3.5", color)} />
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchData}
                                className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-sm font-semibold transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                            <button
                                onClick={async () => {
                                    const res = await import("@/actions/rbac").then(m => m.initializeDefaultRoles());
                                    if (res.success) { showToast("Default roles initialized!", "success"); fetchData(); }
                                }}
                                className="flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30"
                            >
                                <Plus className="w-4 h-4" />
                                Init Defaults
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---- TABS ---- */}
                <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm w-fit">
                    {[
                        { id: "users",  label: "User Role Assignment", icon: Users },
                        { id: "roles",  label: "Roles & Permissions",  icon: ShieldAlert },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                activeTab === tab.id
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ======================================================
                    USER ROLE ASSIGNMENT TAB
                ====================================================== */}
                {activeTab === "users" && (
                    <div className="space-y-4">

                        {/* Search + Filters bar */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Search */}
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email or base role…"
                                        value={userSearch}
                                        onChange={e => handleSearchChange(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                    />
                                    {userSearch && (
                                        <button onClick={() => handleSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Role filter */}
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <select
                                        value={roleFilter}
                                        onChange={e => handleRoleFilterChange(e.target.value)}
                                        className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none min-w-[180px]"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="assigned">Has Any Role</option>
                                        <option value="unassigned">No Roles</option>
                                        {roles.map((r: any) => (
                                            <option key={r.id} value={r.id.toString()}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Active filter chips */}
                            {(userSearch || roleFilter !== "all") && (
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <span className="text-xs text-slate-400 font-medium">Active filters:</span>
                                    {userSearch && (
                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold">
                                            "{userSearch}"
                                            <button onClick={() => handleSearchChange("")} className="ml-1 text-indigo-400 hover:text-indigo-700"><X className="w-3 h-3" /></button>
                                        </span>
                                    )}
                                    {roleFilter !== "all" && (
                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold">
                                            {roleFilter === "assigned" ? "Has roles"
                                                : roleFilter === "unassigned" ? "No roles"
                                                : roles.find((r: any) => r.id.toString() === roleFilter)?.name || roleFilter}
                                            <button onClick={() => handleRoleFilterChange("all")} className="ml-1 text-purple-400 hover:text-purple-700"><X className="w-3 h-3" /></button>
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400 ml-auto">{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found</span>
                                </div>
                            )}
                        </div>

                        {/* User list */}
                        <div className="space-y-3">
                            {pagedUsers.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                    <p className="font-semibold text-slate-500">No users found</p>
                                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filter</p>
                                </div>
                            ) : (
                                pagedUsers.map((user: any) => {
                                    const isExpanded = expandedUserIds.includes(user.id);
                                    return (
                                        <div key={user.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                            {/* User row */}
                                            <div
                                                className="flex items-center justify-between p-5 cursor-pointer select-none"
                                                onClick={() => setExpandedUserIds(prev =>
                                                    prev.includes(user.id)
                                                        ? prev.filter(id => id !== user.id)
                                                        : [...prev, user.id]
                                                )}
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md shadow-indigo-500/20">
                                                        {user.name?.charAt(0)?.toUpperCase() || "?"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-900 truncate">{user.name}</div>
                                                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                                                    </div>
                                                    <span className="hidden sm:inline-flex px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest shrink-0">
                                                        {user.role}
                                                    </span>
                                                    {user.roles?.length > 0 && (
                                                        <span className="hidden md:inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold shrink-0">
                                                            {user.roles.length} role{user.roles.length > 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    {/* Role chips preview */}
                                                    {!isExpanded && user.roles?.slice(0, 2).map((ur: any) => (
                                                        <span key={ur.roleId} className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold">
                                                            <ShieldCheck className="w-3 h-3" />
                                                            {ur.role?.name}
                                                        </span>
                                                    ))}
                                                    {isExpanded
                                                        ? <ChevronDown className="w-5 h-5 text-slate-400" />
                                                        : <ChevronRight className="w-5 h-5 text-slate-400" />
                                                    }
                                                </div>
                                            </div>

                                            {/* Expanded: role toggles */}
                                            {isExpanded && (
                                                <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Assign / Remove Roles</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                        {roles.map((role: any) => {
                                                            const isAssigned = user.roles?.some((ur: any) => ur.roleId === role.id);
                                                            const key = `role-${user.id}-${role.id}`;
                                                            const isToggling = togglingId === key;
                                                            return (
                                                                <div key={role.id} className={cn(
                                                                    "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                                                                    isAssigned
                                                                        ? "bg-indigo-50 border-indigo-200"
                                                                        : "bg-slate-50 border-slate-100 hover:border-slate-200"
                                                                )}>
                                                                    <div className="min-w-0 mr-3">
                                                                        <div className={cn("text-sm font-bold truncate", isAssigned ? "text-indigo-700" : "text-slate-600")}>
                                                                            {role.name}
                                                                        </div>
                                                                        {role.description && (
                                                                            <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]">
                                                                                {role.description}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {isToggling
                                                                        ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                                                                        : <ToggleSwitch checked={isAssigned} onChange={() => handleUserRoleToggle(user.id, role.id, isAssigned)} />
                                                                    }
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
                                <p className="text-sm text-slate-500">
                                    Showing <span className="font-bold text-slate-800">{(safeCurrentPage - 1) * USERS_PER_PAGE + 1}–{Math.min(safeCurrentPage * USERS_PER_PAGE, filteredUsers.length)}</span> of <span className="font-bold text-slate-800">{filteredUsers.length}</span> users
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={safeCurrentPage === 1}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Prev
                                    </button>

                                    {/* Page number buttons */}
                                    <div className="flex gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                                            .reduce<(number | "...")[]>((acc, p, i, arr) => {
                                                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                                                acc.push(p);
                                                return acc;
                                            }, [])
                                            .map((p, i) =>
                                                p === "..." ? (
                                                    <span key={`ellipsis-${i}`} className="px-2 py-2 text-slate-400 text-sm">…</span>
                                                ) : (
                                                    <button
                                                        key={p}
                                                        onClick={() => setCurrentPage(p as number)}
                                                        className={cn(
                                                            "w-9 h-9 rounded-xl text-sm font-bold transition-all",
                                                            safeCurrentPage === p
                                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                                                                : "text-slate-600 hover:bg-slate-100"
                                                        )}
                                                    >
                                                        {p}
                                                    </button>
                                                )
                                            )
                                        }
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={safeCurrentPage === totalPages}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ======================================================
                    ROLES & PERMISSIONS TAB
                ====================================================== */}
                {activeTab === "roles" && (
                    <div className="space-y-4">

                        {/* Global permission filter bar */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search permissions…"
                                        value={permSearch}
                                        onChange={e => setPermSearch(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                    />
                                    {permSearch && (
                                        <button onClick={() => setPermSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Category pills */}
                            <div className="flex flex-wrap gap-2">
                                {permCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-xl text-xs font-bold border transition-all",
                                            selectedCategory === cat
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                        )}
                                    >
                                        {cat}
                                        {cat !== "All" && (
                                            <span className="ml-1.5 opacity-60">
                                                ({permissions.filter((p: any) => (p.category || "System") === cat).length})
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400">
                                Showing <span className="font-bold text-slate-600">{filteredPerms.length}</span> permissions · Click a role below to expand and manage its permissions
                            </p>
                        </div>

                        {/* Role accordion list — one open at a time */}
                        {roles.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                                <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                <p className="font-semibold text-slate-500">No roles found.</p>
                                <p className="text-sm text-slate-400 mt-1">Click "Init Defaults" to create the default roles.</p>
                            </div>
                        ) : (
                            roles.map((role: any) => {
                                const isOpen = expandedRoleId === role.id;
                                const assignedCount = role.permissions?.length || 0;
                                const pct = permissions.length > 0 ? Math.round((assignedCount / permissions.length) * 100) : 0;

                                return (
                                    <div key={role.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                        {/* Role header */}
                                        <div
                                            className="flex items-center justify-between p-6 cursor-pointer select-none"
                                            onClick={() => setExpandedRoleId(isOpen ? null : role.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                                                    <ShieldAlert className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h2 className="text-base font-black text-slate-900 uppercase tracking-widest">{role.name}</h2>
                                                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{role.description || "No description"}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 shrink-0 ml-4">
                                                {/* Progress bar */}
                                                <div className="hidden md:flex flex-col items-end gap-1">
                                                    <span className="text-xs font-bold text-slate-500">{assignedCount}/{permissions.length} permissions</span>
                                                    <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Mobile count */}
                                                <span className="md:hidden px-3 py-1 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700">
                                                    {assignedCount}/{permissions.length}
                                                </span>
                                                {isOpen
                                                    ? <ChevronDown className="w-5 h-5 text-slate-400" />
                                                    : <ChevronRight className="w-5 h-5 text-slate-400" />
                                                }
                                            </div>
                                        </div>

                                        {/* Permissions grid (only for open role) */}
                                        {isOpen && (
                                            <div className="border-t border-slate-100">
                                                {filteredPerms.length === 0 ? (
                                                    <div className="py-10 text-center text-slate-400 text-sm">
                                                        No permissions match your search / filter
                                                    </div>
                                                ) : (
                                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                        {filteredPerms.map((perm: any) => {
                                                            const isAssigned = role.permissions?.some((rp: any) => rp.permissionId === perm.id);
                                                            const key = `perm-${role.id}-${perm.id}`;
                                                            const isToggling = togglingId === key;
                                                            const catColor = catColors[perm.category] || catColors.default;
                                                            return (
                                                                <div
                                                                    key={perm.id}
                                                                    className={cn(
                                                                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                                                                        isAssigned
                                                                            ? "bg-indigo-50 border-indigo-200"
                                                                            : "bg-slate-50 border-slate-100 hover:border-slate-200"
                                                                    )}
                                                                >
                                                                    <div className="min-w-0 flex-1 mr-3">
                                                                        <div className={cn(
                                                                            "text-[11px] font-black uppercase tracking-wide mb-1 leading-tight",
                                                                            isAssigned ? "text-indigo-700" : "text-slate-600"
                                                                        )}>
                                                                            {perm.name.replace(/_/g, " ")}
                                                                        </div>
                                                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg border", catColor)}>
                                                                            {perm.category || "System"}
                                                                        </span>
                                                                    </div>
                                                                    {isToggling
                                                                        ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                                                                        : <ToggleSwitch
                                                                            checked={isAssigned}
                                                                            onChange={() => handleTogglePermission(role.id, perm.id, isAssigned)}
                                                                            size="sm"
                                                                        />
                                                                    }
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
}
