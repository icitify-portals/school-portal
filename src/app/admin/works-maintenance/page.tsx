"use client";

import { useState, useEffect } from "react";
import { 
    getAllGeneralRequestsAction, 
    getTechniciansAction, 
    assignRequestAction,
    resolveRequestAction,
    updateTechnicianProfileAction
} from "@/actions/works-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Wrench,
    Users,
    ClipboardList,
    Clock,
    CheckCircle2,
    Building,
    MapPin,
    AlertTriangle,
    CheckCircle,
    UserCheck,
    Briefcase,
    ShieldAlert,
    AlertCircle,
    ArrowUpRight
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

export default function WorksDirectorDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"requests" | "technicians">("requests");
    
    // Assign dialog state
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
    const [selectedTechId, setSelectedTechId] = useState<number | null>(null);
    const [assigning, setAssigning] = useState(false);

    // Tech profile dialog state
    const [techProfileOpen, setTechProfileOpen] = useState(false);
    const [selectedTechUser, setSelectedTechUser] = useState<any | null>(null);
    const [techSpecialty, setTechSpecialty] = useState("general");
    const [techStatus, setTechStatus] = useState("active");
    const [updatingTech, setUpdatingTech] = useState(false);

    // Resolve dialog state
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [resolveNotes, setResolveNotes] = useState("");
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const reqRes = await getAllGeneralRequestsAction();
        const techRes = await getTechniciansAction();

        if (reqRes.success && reqRes.requests) {
            setRequests(reqRes.requests);
        } else {
            toast.error("Failed to load maintenance requests");
        }

        if (techRes.success && techRes.technicians) {
            setTechnicians(techRes.technicians);
        } else {
            toast.error("Failed to load technicians");
        }
        setLoading(false);
    }

    async function handleAssign() {
        if (!selectedReqId || !selectedTechId) {
            toast.error("Please select a technician");
            return;
        }

        setAssigning(true);
        const res = await assignRequestAction(selectedReqId, selectedTechId);
        if (res.success) {
            toast.success(res.message);
            setAssignDialogOpen(false);
            loadData();
        } else {
            toast.error(res.error || "Failed to assign technician");
        }
        setAssigning(false);
    }

    async function handleResolveOverride() {
        if (!selectedReqId) return;
        if (!resolveNotes.trim()) {
            toast.error("Resolution notes are required");
            return;
        }

        setResolving(true);
        const res = await resolveRequestAction(selectedReqId, resolveNotes);
        if (res.success) {
            toast.success(res.message);
            setResolveDialogOpen(false);
            setResolveNotes("");
            loadData();
        } else {
            toast.error(res.error || "Failed to resolve ticket");
        }
        setResolving(false);
    }

    async function handleUpdateTechProfile() {
        if (!selectedTechUser) return;
        setUpdatingTech(true);
        const res = await updateTechnicianProfileAction(selectedTechUser.id, techSpecialty, techStatus);
        if (res.success) {
            toast.success(res.message);
            setTechProfileOpen(false);
            loadData();
        } else {
            toast.error(res.error || "Failed to update profile");
        }
        setUpdatingTech(false);
    }

    // Stats calculations
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        inProgress: requests.filter(r => r.status === 'in-progress').length,
        resolved: requests.filter(r => r.status === 'resolved').length,
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header section with rich gradient badge */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-white/10 text-amber-300 mb-4 uppercase tracking-widest border border-white/10 backdrop-blur-md">
                                <Wrench className="w-3.5 h-3.5" />
                                Works Control Center
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic text-white">Works & Maintenance</h1>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90 mt-2">Manage school facility maintenance requests, assign technicians, and configure specialties.</p>
                        </div>

                        <div className="flex bg-white/10 p-1 rounded-2xl self-start md:self-center backdrop-blur-md border border-white/10">
                            <button
                                onClick={() => setActiveTab("requests")}
                                className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                                    activeTab === "requests" 
                                    ? "bg-white text-indigo-600 shadow-lg" 
                                    : "text-slate-300 hover:text-white hover:bg-white/10"
                                }`}
                            >
                                <ClipboardList className="w-4 h-4" />
                                Requests ({stats.total})
                            </button>
                            <button
                                onClick={() => setActiveTab("technicians")}
                                className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                                    activeTab === "technicians" 
                                    ? "bg-white text-indigo-600 shadow-lg" 
                                    : "text-slate-300 hover:text-white hover:bg-white/10"
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                Works Crew ({technicians.length})
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Reports</p>
                                <h3 className="text-3xl font-black text-slate-900 mt-2 italic tracking-tighter">{stats.total}</h3>
                            </div>
                            <div className="p-4 bg-slate-100/50 rounded-2xl text-slate-500 shadow-inner group-hover:scale-110 transition-transform">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pending Dispatch</p>
                                <h3 className="text-3xl font-black text-amber-600 mt-2 italic tracking-tighter">{stats.pending}</h3>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
                                <Clock className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">In Progress</p>
                                <h3 className="text-3xl font-black text-indigo-600 mt-2 italic tracking-tighter">{stats.inProgress}</h3>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-500 shadow-inner group-hover:scale-110 transition-transform">
                                <Wrench className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Jobs Completed</p>
                                <h3 className="text-3xl font-black text-emerald-600 mt-2 italic tracking-tighter">{stats.resolved}</h3>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

            {loading ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                    Loading dashboard data...
                </div>
            ) : activeTab === "requests" ? (
                /* Requests Management Tab */
                /* Requests Management Tab */
                <Card className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-[3rem] overflow-hidden">
                    <CardHeader className="border-b border-white/40 bg-white/40 pb-6 px-10 pt-10">
                        <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tighter">Facility Maintenance Requests</CardTitle>
                        <CardDescription className="font-bold text-slate-500">Dispatch, reassign, and track campus repair issues.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-100/30 border-b border-white/40 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-10 py-6">Request Details</th>
                                    <th className="px-10 py-6">Category</th>
                                    <th className="px-10 py-6">Reporter</th>
                                    <th className="px-10 py-6">Priority</th>
                                    <th className="px-10 py-6">Status</th>
                                    <th className="px-10 py-6">Assigned Tech</th>
                                    <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No maintenance requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-slate-900 uppercase">{req.title}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                                                            <Building className="w-3 h-3" /> {req.buildingName}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                                                            <MapPin className="w-3 h-3" /> {req.roomOrAreaDescription}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0.5 px-2 bg-slate-100 text-slate-600 border-none">
                                                    {req.category}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                                {req.reporter.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`text-[10px] font-bold uppercase py-0.5 px-2 border-none ${
                                                    req.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                                                    req.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                                                    'bg-slate-50 text-slate-400'
                                                }`}>
                                                    {req.priority}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={`text-[10px] font-bold uppercase py-0.5 px-2 gap-1 ${
                                                    req.status === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                                    req.status === 'in-progress' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' :
                                                    req.status === 'resolved' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                                    'text-slate-400 bg-slate-50 border-slate-100'
                                                }`}>
                                                    {req.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                                {req.assignedStaff ? (
                                                    <span className="text-indigo-600 font-bold uppercase">{req.assignedStaff.name}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {req.status === 'pending' && (
                                                        <Dialog open={assignDialogOpen && selectedReqId === req.id} onOpenChange={(open) => {
                                                            setAssignDialogOpen(open);
                                                            if (open) setSelectedReqId(req.id);
                                                        }}>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                                                    Dispatch Tech
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[425px]">
                                                                <DialogHeader>
                                                                    <DialogTitle>Dispatch Technician</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="tech">Select Crew Member</Label>
                                                                        <select
                                                                            id="tech"
                                                                            onChange={(e) => setSelectedTechId(parseInt(e.target.value))}
                                                                            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                        >
                                                                            <option value="">-- Choose Specialist --</option>
                                                                            {technicians
                                                                                .filter(t => t.profileStatus === 'active')
                                                                                .map(t => (
                                                                                    <option key={t.id} value={t.id}>
                                                                                        {t.name} ({t.specialty.toUpperCase()})
                                                                                    </option>
                                                                                ))}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button
                                                                        className="bg-indigo-600 w-full hover:bg-indigo-700 text-white font-bold h-10 text-xs uppercase tracking-wider"
                                                                        disabled={assigning}
                                                                        onClick={handleAssign}
                                                                    >
                                                                        {assigning ? "Assigning..." : "Confirm Dispatch"}
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}

                                                    {req.status === 'in-progress' && (
                                                        <Dialog open={resolveDialogOpen && selectedReqId === req.id} onOpenChange={(open) => {
                                                            setResolveDialogOpen(open);
                                                            if (open) setSelectedReqId(req.id);
                                                        }}>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                                                    Resolve Job
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[425px]">
                                                                <DialogHeader>
                                                                    <DialogTitle>Resolve Maintenance Job</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="resolveNotes">Resolution Log</Label>
                                                                        <Textarea
                                                                            id="resolveNotes"
                                                                            placeholder="Explain the resolution for reference..."
                                                                            rows={4}
                                                                            value={resolveNotes}
                                                                            onChange={(e) => setResolveNotes(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button
                                                                        className="bg-emerald-600 w-full hover:bg-emerald-700 text-white font-bold h-10 text-xs uppercase tracking-wider"
                                                                        disabled={resolving}
                                                                        onClick={handleResolveOverride}
                                                                    >
                                                                        {resolving ? "Resolving..." : "Complete & Close"}
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            ) : (
                /* Technicians Registry Tab */
                /* Technicians Registry Tab */
                <Card className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-[3rem] overflow-hidden">
                    <CardHeader className="border-b border-white/40 bg-white/40 pb-6 px-10 pt-10">
                        <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tighter">Works & Maintenance Crew</CardTitle>
                        <CardDescription className="font-bold text-slate-500">Assign technical specialties (Electrician, Plumber, Mechanic) and manage duty status.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-100/30 border-b border-white/40 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-10 py-6">Technician Name</th>
                                    <th className="px-10 py-6">Primary Trade / Specialty</th>
                                    <th className="px-10 py-6">Contact Email</th>
                                    <th className="px-10 py-6">Contact Phone</th>
                                    <th className="px-10 py-6">Duty Status</th>
                                    <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {technicians.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No maintenance staff found. Assign user accounts to 'maintenance' office description to list them here.
                                        </td>
                                    </tr>
                                ) : (
                                    technicians.map((tech) => (
                                        <tr key={tech.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-sm text-slate-900 uppercase">
                                                {tech.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className="text-[10px] font-extrabold uppercase py-0.5 px-2 bg-indigo-50 text-indigo-600 border-none">
                                                    {tech.specialty}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                {tech.email}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                {tech.phone || "No phone"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={`text-[10px] font-bold uppercase py-0.5 px-2 ${
                                                    tech.profileStatus === 'active' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                                    tech.profileStatus === 'on_leave' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                                    'text-red-600 bg-red-50 border-red-100'
                                                }`}>
                                                    {tech.profileStatus.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Dialog open={techProfileOpen && selectedTechUser?.id === tech.id} onOpenChange={(open) => {
                                                    setTechProfileOpen(open);
                                                    if (open) {
                                                        setSelectedTechUser(tech);
                                                        setTechSpecialty(tech.specialty);
                                                        setTechStatus(tech.profileStatus);
                                                    }
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-slate-600 border-slate-200 hover:bg-slate-50">
                                                            Edit Profile
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Configure Technician Profile</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="specialty">Trade / Specialty</Label>
                                                                <select
                                                                    id="specialty"
                                                                    value={techSpecialty}
                                                                    onChange={(e) => setTechSpecialty(e.target.value)}
                                                                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                >
                                                                    <option value="general">General Maintenance</option>
                                                                    <option value="electrical">Electrician</option>
                                                                    <option value="plumbing">Plumber</option>
                                                                    <option value="hvac">HVAC Specialist</option>
                                                                    <option value="carpentry">Carpenter</option>
                                                                    <option value="auto_mechanic">Auto Mechanic</option>
                                                                    <option value="masonry">Mason</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="status">Duty Status</Label>
                                                                <select
                                                                    id="status"
                                                                    value={techStatus}
                                                                    onChange={(e) => setTechStatus(e.target.value)}
                                                                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                >
                                                                    <option value="active">Active / On Duty</option>
                                                                    <option value="on_leave">On Leave</option>
                                                                    <option value="suspended">Suspended</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button
                                                                className="bg-indigo-600 w-full hover:bg-indigo-700 text-white font-bold h-10 text-xs uppercase tracking-wider"
                                                                disabled={updatingTech}
                                                                onClick={handleUpdateTechProfile}
                                                            >
                                                                {updatingTech ? "Saving..." : "Save Specialty Profile"}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
        </div>
    );
}
