"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Loader2, Mail, User } from "lucide-react";
import { createSingleUser } from "@/actions/user-actions";
import { cn } from "@/lib/utils";

export function AddUserModal({ onClose, onUpdate }: { onClose: () => void, onUpdate?: () => void }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<'applicant' | 'student' | 'staff' | 'admin'>("applicant");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        try {
            const res = await createSingleUser({ name, email, role });
            if (res.success) {
                alert(res.message);
                onUpdate?.();
                onClose();
            } else {
                setError(res.error || "Failed to create user.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] border-none shadow-2xl p-0 overflow-hidden bg-white rounded-2xl">
                <div className="bg-slate-900 p-6 text-white relative">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                            <UserPlus className="w-6 h-6 text-indigo-400" /> New Account
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Create a single new user account instantly.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    required 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    placeholder="e.g. John Doe"
                                    className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    required 
                                    type="email"
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    placeholder="e.g. john@example.com"
                                    className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">Primary Role</label>
                            <select 
                                required
                                value={role}
                                onChange={e => setRole(e.target.value as any)}
                                className="w-full h-12 px-4 bg-slate-50 border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="applicant">Applicant</option>
                                <option value="student">Student</option>
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onClose}
                            className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-11 px-6 border-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="rounded-xl font-black text-[10px] uppercase tracking-widest h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Create User
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
