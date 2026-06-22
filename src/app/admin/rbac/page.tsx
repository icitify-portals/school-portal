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
        <div className="p-8 max-w-[1600px] w-full mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Shield className="w-8 h-8 text-indigo-600" />
                    Roles & Permissions
                </h2>
                <div className="flex items-center gap-4 mt-1">
                    <p className="text-slate-500">Granular access control management</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-lg border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                        onClick={async () => {
                            const res = await import("@/actions/rbac").then(m => m.initializeDefaultRoles());
                            if (res.success) window.location.reload();
                        }}
                    >
                        Initialize Default Roles
                    </Button>
                </div>
            </div>

            <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("roles")}
                    className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "roles" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                    Roles & Permissions
                </button>
                <button
                    onClick={() => setActiveTab("users")}
                    className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "users" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                    User Role Assignment
                </button>
            </div>

            {activeTab === "roles" ? (
                <div className="grid grid-cols-1 gap-6">
                    {roles.map((role) => (
                        <Card key={role.id} className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row justify-between items-center">
                                <div>
                                    <CardTitle className="text-lg text-slate-800 uppercase tracking-wide">{role.name}</CardTitle>
                                    <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                                </div>
                                <ShieldAlert className="w-5 h-5 text-slate-300" />
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {permissions.map((perm) => {
                                        const isAssigned = role.permissions.some((rp: any) => rp.permissionId === perm.id);
                                        return (
                                            <button
                                                key={perm.id}
                                                onClick={() => handleTogglePermission(role.id, perm.id, isAssigned)}
                                                className={cn(
                                                    "px-3 py-2 rounded-lg text-[10px] font-bold text-center border transition-all truncate",
                                                    isAssigned
                                                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                                                )}
                                                title={perm.description}
                                            >
                                                {perm.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-none shadow-sm overflow-hidden text-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Current Roles</th>
                                <th className="px-6 py-4 text-right">Assign New Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">{u.name}</span>
                                            <span className="text-xs text-slate-400">{u.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {u.roles.map((ur: any) => (
                                                <span key={ur.roleId} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">
                                                    {ur.role.name}
                                                    <button onClick={() => handleUserRoleAction(u.id, ur.roleId, true)} className="hover:text-red-500">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                            {u.roles.length === 0 && <span className="text-slate-300 italic text-[10px]">No roles assigned</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <select
                                            className="bg-slate-100 border-none rounded-lg px-2 py-1 text-[10px] font-bold focus:ring-2 focus:ring-indigo-500"
                                            onChange={(e) => {
                                                if (e.target.value) handleUserRoleAction(u.id, parseInt(e.target.value), false);
                                            }}
                                            value=""
                                        >
                                            <option value="">+ Add Role</option>
                                            {roles.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}
