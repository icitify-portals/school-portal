"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users,
    Shield,
    Globe,
    Search,
    UserPlus,
    X
} from "lucide-react";
import {
    getCmsManagers,
    assignOfficerRole,
    removeOfficerRole,
    getStaffUsers,
    getAvailableRoles
} from "@/actions/officers";
import { seedPrincipalRoles } from "@/actions/rbac-seed";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function CmsManagersPage() {
    const [managers, setManagers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<any[]>([]);
    const [cmsRoleId, setCmsRoleId] = useState<number | null>(null);

    // New assignment state
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [isAssigning, setIsAssigning] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Search/Filter
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [mgrRes, staffData, rolesData] = await Promise.all([
            getCmsManagers(),
            getStaffUsers(),
            getAvailableRoles()
        ]);
        
        if (mgrRes.success) {
            setManagers(mgrRes.managers || []);
        }
        setStaff(staffData);
        
        const cmsRole = rolesData.find((r: any) => r.name === 'CMS Manager');
        if (cmsRole) {
            setCmsRoleId(cmsRole.id);
        }
        setLoading(false);
    };

    const handleAssign = async () => {
        if (!selectedUserId) return toast.error("Staff member is required");
        if (!cmsRoleId) return toast.error("CMS Manager role not found. Please click 'Repair Roles/Permissions' first.");
        
        setIsAssigning(true);
        const res = await assignOfficerRole(
            parseInt(selectedUserId), 
            cmsRoleId
        );
        
        if (res.success) {
            toast.success("CMS Manager assigned successfully");
            setDialogOpen(false);
            loadData();
        } else {
            toast.error(res.error || "Failed to assign");
        }
        setIsAssigning(false);
    };

    const handleRemove = async (id: number) => {
        if (!confirm("Are you sure you want to remove this CMS Manager assignment?")) return;
        const res = await removeOfficerRole(id);
        if (res.success) {
            toast.success("Assignment removed");
            loadData();
        }
    };

    const handleSeed = async () => {
        const res = await seedPrincipalRoles();
        if (res.success) {
            toast.success(res.message);
            loadData();
        } else {
            toast.error(res.error);
        }
    };

    const filteredManagers = managers.filter(m => 
        m.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase tracking-widest flex items-center gap-3">
                            <Globe className="w-8 h-8 text-teal-600" />
                            CMS Content Managers
                        </h1>
                        <p className="text-slate-500 font-medium">Assign staff members to manage public pages, menus, homepage sections, and media catalog.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={handleSeed} variant="outline" className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-2">
                             Repair Roles/Permissions
                        </Button>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-widest text-[10px] h-11 px-6 shadow-lg shadow-teal-100">
                                    <UserPlus className="w-4 h-4 mr-2" /> Assign New Manager
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] border-none rounded-2xl p-8">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Assign CMS Manager</DialogTitle>
                                    <DialogDescription className="font-medium text-slate-500">Assign a staff member the role of CMS Manager with full permissions.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 mt-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Staff Member</label>
                                        <Select onValueChange={setSelectedUserId}>
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-medium">
                                                <SelectValue placeholder="Select Staff" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100">
                                                {staff.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.email})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl space-y-2">
                                        <p className="text-[11px] font-black text-teal-800 uppercase tracking-wider">Assigned Role Capabilities</p>
                                        <p className="text-xs text-teal-600 font-medium leading-relaxed">
                                            The CMS Manager role has granular permissions to create and edit custom pages, design menu navigation, upload files to the media library, and configure the school website's homepage sliders.
                                        </p>
                                    </div>

                                    <Button 
                                        className="w-full h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-widest text-xs mt-4 shadow-xl shadow-teal-100"
                                        onClick={handleAssign}
                                        disabled={isAssigning}
                                    >
                                        {isAssigning ? "Processing..." : "Confirm Assignment"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Filter and Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                        placeholder="Search managers..." 
                        className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Managers Table */}
                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Manager Info</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Role</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredManagers.map((manager) => (
                                    <tr key={manager.assignmentId} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xl border-2 border-white shadow-sm">
                                                    {manager.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-tight">{manager.user.name}</p>
                                                    <p className="text-[11px] text-slate-400 font-medium">{manager.user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge className="w-fit bg-teal-50 text-teal-600 border-none px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                {manager.role.name}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleRemove(manager.assignmentId)}
                                                className="h-10 w-10 p-0 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                            >
                                                <X className="w-5 h-5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredManagers.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center">
                                            <div className="max-w-xs mx-auto space-y-3">
                                                <div className="p-4 bg-slate-50 rounded-2xl inline-block">
                                                    <Users className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <p className="font-bold text-slate-400">No CMS Managers found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
