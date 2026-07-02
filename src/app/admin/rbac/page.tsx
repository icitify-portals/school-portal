"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ShieldAlert, UserPlus, Trash2, Loader2, Plus } from "lucide-react";
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

export default function RBACPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("roles"); // roles, users

    useEffect(() => {
        fetchData();
    }, []);

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

    const handleTogglePermission = async (roleId: number, permissionId: number, isAssigned: boolean) => {
        if (isAssigned) {
            await removePermissionFromRole(roleId, permissionId);
        } else {
            await addPermissionToRole(roleId, permissionId);
        }
        fetchData();
    };

    const handleUserRoleAction = async (userId: number, roleId: number, isAssigned: boolean) => {
        if (isAssigned) {
            await removeRoleFromUser(userId, roleId);
        } else {
            await assignRoleToUser(userId, roleId);
        }
        fetchData();
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-400" /></div>;

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-12 h-12 text-indigo-400" />
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md">
                                Roles & Permissions
                            </h1>
                        </div>
                        <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                            Granular access control management. Configure roles, define global system permissions, and enforce secure identities.
                        </p>
                    </div>
                    <Button
                        onClick={async () => {
                            const res = await import("@/actions/rbac").then(m => m.initializeDefaultRoles());
                            if (res.success) window.location.reload();
                        }}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 py-6 rounded-2xl shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] transition-all uppercase tracking-widest text-xs"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Initialize Defaults
                    </Button>
                </div>
            </div>

            {/* Glassmorphic Tabs */}
            <div className="flex gap-2 p-1.5 bg-slate-200/50 backdrop-blur-xl rounded-2xl w-fit border border-slate-200 shadow-inner">
                <button
                    onClick={() => setActiveTab("roles")}
                    className={cn(
                        "px-8 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-wider",
                        activeTab === "roles" 
                        ? "bg-white text-indigo-700 shadow-md scale-105" 
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    )}
                >
                    Roles & Permissions
                </button>
                <button
                    onClick={() => setActiveTab("users")}
                    className={cn(
                        "px-8 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-wider",
                        activeTab === "users" 
                        ? "bg-white text-indigo-700 shadow-md scale-105" 
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    )}
                >
                    User Role Assignment
                </button>
            </div>

            {activeTab === "roles" ? (
                <div className="grid grid-cols-1 gap-4">
                    {roles.map((role) => (
                        <Card key={role.id} className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                            <CardHeader className="bg-gradient-to-r from-white to-slate-50/80 border-b border-slate-100/50 flex flex-row justify-between items-center p-8">
                                <div>
                                    <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-3 h-8 bg-indigo-500 rounded-full" />
                                        {role.name}
                                    </CardTitle>
                                    <p className="text-sm font-medium text-slate-500 mt-2 ml-6">{role.description}</p>
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                                    <ShieldAlert className="w-8 h-8 text-indigo-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {permissions.map((perm) => {
                                        const isAssigned = role.permissions.some((rp: any) => rp.permissionId === perm.id);
                                        return (
                                            <button
                                                key={perm.id}
                                                onClick={() => handleTogglePermission(role.id, perm.id, isAssigned)}
                                                className={cn(
                                                    "px-4 py-4 rounded-2xl text-[11px] font-black text-center border-2 transition-all truncate hover:-translate-y-1 hover:shadow-lg uppercase tracking-wider",
                                                    isAssigned
                                                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-indigo-100/50"
                                                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                                                )}
                                                title={perm.description}
                                            >
                                                {perm.name.replace(/_/g, " ")}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="/80 backdrop-blur-2xl /50 -200/50 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="px-8 py-6 font-black uppercase tracking-widest text-xs rounded-tl-3xl">User Profile</th>
                                    <th className="px-8 py-6 font-black uppercase tracking-widest text-xs">Current Roles</th>
                                    <th className="px-8 py-6 font-black uppercase tracking-widest text-xs text-right rounded-tr-3xl">Assign New Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 text-lg group-hover:text-indigo-700 transition-colors">{u.name}</span>
                                                <span className="text-sm font-medium text-slate-500">{u.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-wrap gap-2">
                                                {u.roles.map((ur: any) => (
                                                    <span key={ur.roleId} className="flex items-center gap-2 px-4 py-2 bg-indigo-100/80 text-indigo-800 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">
                                                        {ur.role.name}
                                                        <button onClick={() => handleUserRoleAction(u.id, ur.roleId, true)} className="hover:text-rose-500 transition-colors p-1 bg-white rounded-lg">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                {u.roles.length === 0 && <span className="text-slate-300 italic font-medium text-xs uppercase tracking-widest">No roles assigned</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <select
                                                className="bg-slate-100/50 border-2 border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:bg-slate-100 cursor-pointer"
                                                onChange={(e) => {
                                                    if (e.target.value) handleUserRoleAction(u.id, parseInt(e.target.value), false);
                                                }}
                                                value=""
                                            >
                                                <option value="">+ Assign Role</option>
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
