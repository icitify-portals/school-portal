"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users,
    Plus,
    Trash2,
    Shield,
    Building,
    PenTool,
    Upload,
    CheckCircle2,
    Search,
    UserPlus,
    X
} from "lucide-react";
import {
    getPrincipalOfficers,
    assignOfficerRole,
    removeOfficerRole,
    getStaffUsers,
    getAvailableRoles,
    getInstitutionalUnits
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
import SignatureCapture from "@/components/lms/SignatureCapture";
import { Badge } from "@/components/ui/badge";

export default function PrincipalOfficersPage() {
    const [officers, setOfficers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);

    // New assignment state
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");
    const [selectedUnitId, setSelectedUnitId] = useState<string>("global");
    const [isAssigning, setIsAssigning] = useState(false);
    
    // Search/Filter
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [offRes, staffData, rolesData, unitsData] = await Promise.all([
            getPrincipalOfficers(),
            getStaffUsers(),
            getAvailableRoles(),
            getInstitutionalUnits()
        ]);
        
        if (offRes.success) {
            setOfficers(offRes.officers || []);
        }
        setStaff(staffData);
        setRoles(rolesData.filter((r: any) => ['Bursar', 'Principal', 'Headteacher', 'Registrar', 'VP Academics', 'Stakeholder'].includes(r.name)));
        setUnits(unitsData);
        setLoading(false);
    };

    const handleAssign = async () => {
        if (!selectedUserId || !selectedRoleId) return toast.error("User and Role are required");
        
        setIsAssigning(true);
        const res = await assignOfficerRole(
            parseInt(selectedUserId), 
            parseInt(selectedRoleId), 
            selectedUnitId === "global" ? undefined : parseInt(selectedUnitId)
        );
        
        if (res.success) {
            toast.success("Officer assigned successfully");
            loadData();
        } else {
            toast.error(res.error || "Failed to assign");
        }
        setIsAssigning(false);
    };

    const handleRemove = async (id: number) => {
        if (!confirm("Are you sure you want to remove this officer assignment?")) return;
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

    const filteredOfficers = officers.filter(o => 
        o.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.unit?.name || "Global").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase tracking-widest flex items-center gap-3">
                            <Shield className="w-8 h-8 text-indigo-600" />
                            Principal Officers
                        </h1>
                        <p className="text-slate-500 font-medium">Manage school officials, institutional roles, and digital signatures.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={handleSeed} variant="outline" className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-2">
                             Repair Roles/Permissions
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] h-11 px-6 shadow-lg shadow-indigo-100">
                                    <UserPlus className="w-4 h-4 mr-2" /> Assign New Officer
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] border-none rounded-[2rem] p-8">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Assign Officer</DialogTitle>
                                    <DialogDescription className="font-medium text-slate-500">Assign a staff member to an institutional role.</DialogDescription>
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

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Official Role</label>
                                        <Select onValueChange={setSelectedRoleId}>
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-medium">
                                                <SelectValue placeholder="Select Role" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100">
                                                {roles.map(r => (
                                                    <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Institution Branch (Unit)</label>
                                        <Select onValueChange={setSelectedUnitId} defaultValue="global">
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-medium">
                                                <SelectValue placeholder="Select Unit" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100">
                                                <SelectItem value="global">Global (All Units)</SelectItem>
                                                {units.map(u => (
                                                    <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.code})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button 
                                        className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs mt-4 shadow-xl shadow-indigo-100"
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
                        placeholder="Search officers, roles or branches..." 
                        className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Officers Table */}
                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Officer Info</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Role & Scope</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Digital Signature</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredOfficers.map((officer) => (
                                    <tr key={officer.assignmentId} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xl border-2 border-white shadow-sm">
                                                    {officer.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-tight">{officer.user.name}</p>
                                                    <p className="text-[11px] text-slate-400 font-medium">{officer.user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <Badge className="w-fit bg-indigo-50 text-indigo-600 border-none px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                    {officer.role.name}
                                                </Badge>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Building className="w-3 h-3" />
                                                    <span className="text-[11px] font-bold uppercase tracking-tight">{officer.unit?.name || "Institution Global"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <button className="flex items-center gap-3 group/sig">
                                                        {officer.profile?.signatureUrl ? (
                                                            <div className="relative">
                                                                <img 
                                                                    src={officer.profile.signatureUrl} 
                                                                    className={cn(
                                                                        "h-12 w-32 object-contain bg-slate-50 rounded-xl border border-slate-100 p-1 group-hover/sig:border-indigo-300 transition-all",
                                                                        officer.profile.isSignatureDigital ? "invert brightness-0" : ""
                                                                    )} 
                                                                />
                                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/sig:opacity-100 flex items-center justify-center rounded-xl transition-all">
                                                                    <PenTool className="w-4 h-4 text-white" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="h-12 w-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all text-[9px] font-black uppercase tracking-widest">
                                                                <Upload className="w-4 h-4 mr-2" /> Add Signature
                                                            </div>
                                                        )}
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[600px] border-none rounded-[3rem] p-10">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Official Signature</DialogTitle>
                                                        <DialogDescription className="font-medium text-slate-500">
                                                            Manage institutional signature for {officer.user.name}.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="mt-8">
                                                        <SignatureCapture 
                                                            userId={officer.user.id} 
                                                            currentSignature={officer.profile?.signatureUrl}
                                                            isCurrentDigital={officer.profile?.isSignatureDigital}
                                                            onComplete={loadData}
                                                        />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleRemove(officer.assignmentId)}
                                                className="h-10 w-10 p-0 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                            >
                                                <X className="w-5 h-5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredOfficers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="max-w-xs mx-auto space-y-3">
                                                <div className="p-4 bg-slate-50 rounded-3xl inline-block">
                                                    <Users className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <p className="font-bold text-slate-400">No principal officers found matches your criteria.</p>
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
