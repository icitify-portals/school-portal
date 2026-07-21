"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Shield,
    Lock,
    UserX,
    UserCheck,
    Loader2,
    ShieldAlert,
    Trash2,
    History,
    ShieldCheck
} from "lucide-react";
import { resetUserPassword, updateUserStatus, verifyUserEmailManually } from "@/actions/user-actions";
import { getAllRoles, assignRoleToUser, removeRoleFromUser } from "@/actions/rbac";
import { cn } from "@/lib/utils";

interface AccountManagementModalProps {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        status: string;
        roles?: any[];
    } | null;
    onClose: () => void;
    onUpdate?: () => void;
}

export function AccountManagementModal({ user, onClose, onUpdate }: AccountManagementModalProps) {
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [allRoles, setAllRoles] = useState<any[]>([]);
    const [userRoles, setUserRoles] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchRoles();
        }
    }, [user]);

    const fetchRoles = async () => {
        setLoading(true);
        const roles = await getAllRoles();
        setAllRoles(roles);
        // If the user object doesn't have roles, we might need a separate fetch, 
        // but for now we assume it's passed or handled via rbac actions directly.
        setLoading(false);
    };

    if (!user) return null;

    const handleResetPassword = async () => {
        setActionLoading("password");
        const res = await resetUserPassword(user.id, newPassword);
        if (res.success) {
            alert(res.message);
            setNewPassword("");
        } else {
            alert(res.error);
        }
        setActionLoading(null);
    };

    const handleStatusToggle = async (checked: boolean) => {
        setActionLoading("status");
        const newStatus = checked ? 'active' : 'suspended';
        const res = await updateUserStatus(user.id, newStatus);
        if (res.success) {
            onUpdate?.();
        } else {
            alert(res.error);
        }
        setActionLoading(null);
    };

    const handleVerifyEmail = async () => {
        setActionLoading("verifyEmail");
        const res = await verifyUserEmailManually(user.id);
        if (res.success) {
            alert(res.message);
            onUpdate?.();
        } else {
            alert(res.error);
        }
        setActionLoading(null);
    };

    const handleToggleRole = async (roleId: number, isAssigned: boolean) => {
        setActionLoading(`role-${roleId}`);
        if (isAssigned) {
            await removeRoleFromUser(user.id, roleId);
        } else {
            await assignRoleToUser(user.id, roleId);
        }
        onUpdate?.();
        setActionLoading(null);
    };

    return (
        <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl p-0 overflow-hidden bg-white rounded-2xl">
                <div className="bg-slate-900 p-6 text-white relative">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                            <Shield className="w-6 h-6 text-indigo-400" /> Account Security
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Managing access and credentials for <span className="text-white underline decoration-indigo-500">{user.name}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 select-none pointer-events-none">
                        <ShieldAlert className="w-32 h-32" />
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", 
                                user.status === 'active' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                            )}>
                                {user.status === 'active' ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 leading-none mb-1 uppercase tracking-tighter">Account Status</p>
                                <p className={cn("text-[10px] font-bold uppercase", 
                                    user.status === 'active' ? "text-emerald-600" : "text-rose-600"
                                )}>
                                    Currently {user.status}
                                </p>
                            </div>
                        </div>
                        <Switch 
                            checked={user.status === 'active'}
                            onCheckedChange={handleStatusToggle}
                            disabled={actionLoading === "status"}
                        />
                    </div>

                    {/* Manual Email Verification */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 leading-none mb-1 uppercase tracking-tighter">Email Verification</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">
                                    Manually verify email
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === "verifyEmail"}
                            onClick={handleVerifyEmail}
                            className="text-[10px] font-black uppercase text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                            {actionLoading === "verifyEmail" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Now"}
                        </Button>
                    </div>

                    {/* Password Reset Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900">
                            <Lock className="w-4 h-4 text-indigo-600" />
                            <h3 className="font-black uppercase text-[10px] tracking-[0.2em]">Reset Password</h3>
                        </div>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Enter specific password (optional)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-11 rounded-xl bg-slate-50 border-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                            <Button 
                                onClick={handleResetPassword}
                                disabled={actionLoading === "password"}
                                className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-black font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shrink-0"
                            >
                                {actionLoading === "password" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset"}
                            </Button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic">If blank, password defaults to <span className="font-bold text-indigo-600 underline">welcome123</span></p>
                    </div>

                    {/* Role Management */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2">
                            <Shield className="w-4 h-4 text-indigo-600" />
                            <h3 className="font-black uppercase text-[10px] tracking-[0.2em]">Assign Granular Roles</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="w-full py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                            ) : allRoles.map((role) => {
                                // This is tricky because the user object passed might not have granular roles list
                                // For now, we'll check user.role (top level) or wait for a better user object
                                const isAssigned = user.role === role.name.toLowerCase() || (user as any).userRoles?.some((ur: any) => ur.roleId === role.id);
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => handleToggleRole(role.id, isAssigned)}
                                        disabled={actionLoading?.startsWith('role-')}
                                        className={cn(
                                            "px-3 py-2 rounded-xl text-[10px] font-bold text-center border transition-all flex items-center gap-2",
                                            isAssigned
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                                                : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                                        )}
                                    >
                                        {actionLoading === `role-${role.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                                        {role.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Meta Info / Footer Action */}
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-400">
                             <History className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-medium uppercase">Role Context: {user.role}</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
