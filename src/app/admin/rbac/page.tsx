"use client";

import { useState, useEffect, useMemo } from "react";
import { Shield, ShieldAlert, ShieldCheck, Loader2, Plus, Search, Users, Lock, RefreshCw, CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
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

// ---- Toggle Switch Component ----
function ToggleSwitch({
    checked,
    onChange,
    disabled = false,
    size = "md",
}: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    size?: "sm" | "md";
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
                checked
                    ? "bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                    : "bg-slate-200",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block rounded-full bg-white shadow-md ring-0 transition-transform duration-200",
                    size === "sm" ? "h-4 w-4" : "h-5 w-5",
                    checked
                        ? size === "sm" ? "translate-x-4" : "translate-x-5"
                        : "translate-x-0"
                )}
            />
        </button>
    );
}

// ---- Toast Notification ----
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

// ---- Permission Category Badge ----
const categoryColors: Record<string, string> = {
    Academic: "bg-blue-50 text-blue-700 border-blue-100",
    Finance: "bg-emerald-50 text-emerald-700 border-emerald-100",
    System: "bg-purple-50 text-purple-700 border-purple-100",
    Hostel: "bg-amber-50 text-amber-700 border-amber-100",
    HR: "bg-rose-50 text-rose-700 border-rose-100",
    Security: "bg-slate-50 text-slate-700 border-slate-200",
    default: "bg-indigo-50 text-indigo-700 border-indigo-100",
};

export default function RBACPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("users"); // users, roles
    const [searchQuery, setSearchQuery] = useState("");
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [expandedRoles, setExpandedRoles] = useState<Record<number, boolean>>({});
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [expandedUserIds, setExpandedUserIds] = useState<number[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const fetchData = async () => {
        setLoading(true);
        const [roleData, permData, userData] = await Promise.all([
            getAllRoles(),
            getAllPermissions(),
            getUsersWithRoles()
        ]);
        setRoles(roleData);
        setPermissions(permData);
        setUsers(userData);
        setLoading(false);
    };

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
    };

    const handleTogglePermission = async (roleId: number, permissionId: number, isAssigned: boolean) => {
        const key = `perm-${roleId}-${permissionId}`;
        setTogglingId(key);
        try {
            if (isAssigned) {
                await removePermissionFromRole(roleId, permissionId);
                showToast("Permission removed successfully", "success");
            } else {
                await addPermissionToRole(roleId, permissionId);
                showToast("Permission granted successfully", "success");
            }
            await fetchData();
        } catch {
            showToast("Failed to update permission", "error");
        }
        setTogglingId(null);
    };

    const handleUserRoleToggle = async (userId: number, roleId: number, isAssigned: boolean) => {
        const key = `role-${userId}-${roleId}`;
        setTogglingId(key);
        try {
            if (isAssigned) {
                const res = await removeRoleFromUser(userId, roleId);
                if (!res.success) { showToast(res.error || "Failed to remove role", "error"); }
                else showToast("Role removed successfully", "success");
            } else {
                const res = await assignRoleToUser(userId, roleId);
                if (!res.success) { showToast(res.error || "Failed to assign role", "error"); }
                else showToast("Role assigned successfully", "success");
            }
            await fetchData();
        } catch {
            showToast("Failed to update role", "error");
        }
        setTogglingId(null);
    };

    const permissionCategories = useMemo(() => {
        const cats = new Set(permissions.map((p: any) => p.category || "System"));
        return ["All", ...Array.from(cats)] as string[];
    }, [permissions]);

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const q = searchQuery.toLowerCase();
        return users.filter((u: any) =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.role?.toLowerCase().includes(q)
        );
    }, [users, searchQuery]);

    const filteredPermissions = useMemo(() => {
        if (selectedCategory === "All") return permissions;
        return permissions.filter((p: any) => (p.category || "System") === selectedCategory);
    }, [permissions, selectedCategory]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-500" />
                <p className="text-slate-500 font-medium">Loading access control data...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* ---- Header ---- */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-10 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-600/40 via-purple-600/20 to-transparent" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                                    Roles & Permissions
                                </h1>
                            </div>
                            <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
                                Manage user access control. Use toggles to quickly grant or revoke permissions from roles and assign roles to specific staff members.
                            </p>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-300">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                    {roles.length} Roles
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-300">
                                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                                    {permissions.length} Permissions
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-300">
                                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                                    {users.length} Users
                                </div>
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
                                Initialize Defaults
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---- Tabs ---- */}
                <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm w-fit">
                    {[
                        { id: "users", label: "User Role Assignment", icon: Users },
                        { id: "roles", label: "Roles & Permissions", icon: ShieldAlert },
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

                {/* ======== USER ROLE ASSIGNMENT TAB ======== */}
                {activeTab === "users" && (
                    <div className="space-y-4">
                        {/* Search bar */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users by name, email or base role..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 shadow-sm"
                            />
                        </div>

                        {/* Users List */}
                        <div className="space-y-3">
                            {filteredUsers.map((user: any) => {
                                const isExpanded = expandedUserIds.includes(user.id);
                                return (
                                    <div key={user.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                        {/* User row header */}
                                        <div
                                            className="flex items-center justify-between p-5 cursor-pointer select-none"
                                            onClick={() =>
                                                setExpandedUserIds(prev =>
                                                    prev.includes(user.id)
                                                        ? prev.filter(id => id !== user.id)
                                                        : [...prev, user.id]
                                                )
                                            }
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Avatar */}
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md">
                                                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{user.name}</div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                </div>
                                                {/* Base role badge */}
                                                <span className="hidden sm:inline-flex px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest">
                                                    {user.role}
                                                </span>
                                                {/* Assigned roles count */}
                                                {user.roles.length > 0 && (
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold">
                                                        {user.roles.length} role{user.roles.length > 1 ? "s" : ""} assigned
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {/* Currently active role chips (collapsed preview) */}
                                                {!isExpanded && user.roles.slice(0, 2).map((ur: any) => (
                                                    <span key={ur.roleId} className="hidden md:inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        {ur.role.name}
                                                    </span>
                                                ))}
                                                {isExpanded ? (
                                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded: role toggles */}
                                        {isExpanded && (
                                            <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Toggle Roles</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {roles.map((role: any) => {
                                                        const isAssigned = user.roles.some((ur: any) => ur.roleId === role.id);
                                                        const key = `role-${user.id}-${role.id}`;
                                                        const isToggling = togglingId === key;
                                                        return (
                                                            <div
                                                                key={role.id}
                                                                className={cn(
                                                                    "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                                                                    isAssigned
                                                                        ? "bg-indigo-50 border-indigo-200"
                                                                        : "bg-slate-50 border-slate-100 hover:border-slate-200"
                                                                )}
                                                            >
                                                                <div>
                                                                    <div className={cn(
                                                                        "text-sm font-bold",
                                                                        isAssigned ? "text-indigo-700" : "text-slate-600"
                                                                    )}>
                                                                        {role.name}
                                                                    </div>
                                                                    {role.description && (
                                                                        <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]">
                                                                            {role.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {isToggling ? (
                                                                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                                                                ) : (
                                                                    <ToggleSwitch
                                                                        checked={isAssigned}
                                                                        onChange={() => handleUserRoleToggle(user.id, role.id, isAssigned)}
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <div className="text-center py-20 text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No users found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ======== ROLES & PERMISSIONS TAB ======== */}
                {activeTab === "roles" && (
                    <div className="space-y-4">
                        {/* Category filter */}
                        <div className="flex flex-wrap gap-2">
                            {permissionCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                        selectedCategory === cat
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Role cards */}
                        {roles.map((role: any) => {
                            const isExpanded = expandedRoles[role.id] !== false; // expanded by default
                            const assignedCount = role.permissions?.length || 0;
                            return (
                                <div key={role.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                    {/* Role header */}
                                    <div
                                        className="flex items-center justify-between p-6 cursor-pointer select-none"
                                        onClick={() =>
                                            setExpandedRoles(prev => ({
                                                ...prev,
                                                [role.id]: !isExpanded
                                            }))
                                        }
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                                                <ShieldAlert className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">
                                                    {role.name}
                                                </h2>
                                                <p className="text-sm text-slate-500 mt-0.5">
                                                    {role.description || "No description"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "px-3 py-1.5 rounded-xl text-xs font-bold",
                                                assignedCount > 0
                                                    ? "bg-indigo-50 text-indigo-700"
                                                    : "bg-slate-50 text-slate-500"
                                            )}>
                                                {assignedCount}/{permissions.length} permissions
                                            </div>
                                            {isExpanded ? (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Permissions grid */}
                                    {isExpanded && (
                                        <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {filteredPermissions.map((perm: any) => {
                                                    const isAssigned = role.permissions?.some((rp: any) => rp.permissionId === perm.id);
                                                    const key = `perm-${role.id}-${perm.id}`;
                                                    const isToggling = togglingId === key;
                                                    const catColor = categoryColors[perm.category] || categoryColors.default;
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
                                                                    "text-[11px] font-black uppercase tracking-wide mb-1 truncate",
                                                                    isAssigned ? "text-indigo-700" : "text-slate-600"
                                                                )}>
                                                                    {perm.name.replace(/_/g, " ")}
                                                                </div>
                                                                <span className={cn(
                                                                    "text-[10px] font-bold px-2 py-0.5 rounded-lg border",
                                                                    catColor
                                                                )}>
                                                                    {perm.category || "System"}
                                                                </span>
                                                            </div>
                                                            {isToggling ? (
                                                                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                                                            ) : (
                                                                <ToggleSwitch
                                                                    checked={isAssigned}
                                                                    onChange={() => handleTogglePermission(role.id, perm.id, isAssigned)}
                                                                    size="sm"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {filteredPermissions.length === 0 && (
                                                    <div className="col-span-full text-center py-8 text-slate-400 text-sm">
                                                        No permissions in this category
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {roles.length === 0 && (
                            <div className="text-center py-20 text-slate-400">
                                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No roles found. Click "Initialize Defaults" to create them.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
}
