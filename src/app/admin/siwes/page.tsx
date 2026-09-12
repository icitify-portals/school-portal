"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Briefcase,
    Building2,
    Plus,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    ShieldCheck,
    ShieldAlert,
    FileText
} from "lucide-react";
import {
    getSiwesConfigs,
    getAdminCompanies,
    getPlacementsForAdmin,
    addSiwesConfig,
    toggleSiwesConfig,
    setCompanyApproval,
    reviewLogbook
} from "@/actions/siwes";
import { getFaculties } from "@/actions/faculties";
import { getDepartments } from "@/actions/departments";
import { getProgrammes } from "@/actions/programmes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Company {
    id: number;
    name: string;
    address: string;
    email?: string | null;
    phone?: string | null;
    isApproved: boolean | null;
    addedById?: number | null;
    addedBy?: { id: number; name: string } | null;
}

export default function AdminSiwesDashboard() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [placements, setPlacements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Config modal state
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [faculties, setFaculties] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [programmes, setProgrammes] = useState<any[]>([]);
    const [configForm, setConfigForm] = useState({ facultyId: "", deptId: "", programmeId: "", semester: "1", durationMonths: "3" });

    // Review modal state
    const [reviewTarget, setReviewTarget] = useState<any>(null);
    const [reviewComment, setReviewComment] = useState("");

    const fetchData = async () => {
        setLoading(true);
        const [confRes, compRes, placRes, facRes, deptRes, progRes] = await Promise.all([
            getSiwesConfigs(),
            getAdminCompanies(),
            getPlacementsForAdmin(),
            getFaculties() as any,
            getDepartments() as any,
            getProgrammes() as any
        ]);

        if (confRes.success && confRes.data) setConfigs(confRes.data);
        if (compRes.success && compRes.data) setCompanies(compRes.data);
        if (placRes.success && placRes.data) setPlacements(placRes.data);
        setFaculties(Array.isArray(facRes) ? facRes : []);
        setDepartments(Array.isArray(deptRes) ? deptRes : []);
        setProgrammes(Array.isArray(progRes) ? progRes : []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const approvedCompanies = companies.filter(c => c.isApproved);
    const pendingCompanies = companies.filter(c => !c.isApproved);
    const pendingLogbookCount = placements.reduce((acc, p) => acc + (p.logbooks?.filter((l: any) => l.status === 'submitted').length || 0), 0);

    const saveConfig = async () => {
        const payload: any = { semester: configForm.semester, durationMonths: parseInt(configForm.durationMonths) || 3, isActive: true };
        if (configForm.facultyId) payload.facultyId = parseInt(configForm.facultyId);
        if (configForm.deptId) payload.deptId = parseInt(configForm.deptId);
        if (configForm.programmeId) payload.programmeId = parseInt(configForm.programmeId);
        setSavingConfig(true);
        const res = await addSiwesConfig(payload);
        setSavingConfig(false);
        if (res.success) {
            toast.success("SIWES configuration created!");
            setShowConfigModal(false);
            setConfigForm({ facultyId: "", deptId: "", programmeId: "", semester: "1", durationMonths: "3" });
            fetchData();
        } else {
            toast.error(res.error || "Failed to create configuration");
        }
    };

    const handleToggleConfig = async (conf: any) => {
        const res = await toggleSiwesConfig(conf.id);
        if (res.success) {
            toast.success(conf.isActive ? "Configuration deactivated" : "Configuration activated");
            fetchData();
        } else {
            toast.error(res.error || "Failed to update configuration");
        }
    };

    const handleSetApproval = async (companyId: number, approved: boolean) => {
        const res = await setCompanyApproval(companyId, approved);
        if (res.success) {
            toast.success(approved ? "Company approved" : "Company approval removed");
            fetchData();
        } else {
            toast.error(res.error || "Failed to update company");
        }
    };

    const handleReviewLogbook = async (logbook: any, status: 'approved' | 'flagged') => {
        const res = await reviewLogbook(logbook.id, status, reviewComment.trim() || undefined);
        if (res.success) {
            toast.success(status === 'approved' ? "Logbook entry approved!" : "Logbook entry flagged");
            setReviewComment("");
            fetchData();
        } else {
            toast.error(res.error || "Failed to review entry");
        }
    };

    const filteredDepartments = departments.filter(d => !configForm.facultyId || d.facultyId === parseInt(configForm.facultyId));
    const filteredProgrammes = programmes.filter(p => !configForm.deptId || p.deptId === parseInt(configForm.deptId));

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
            <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-650/30 to-purple-650/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <Briefcase className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                                SIWES Management
                            </h2>
                        </div>
                        <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                            Industrial Work Experience Scheme Administration
                        </p>
                    </div>
                    <div className="relative z-10 flex gap-3 shrink-0">
                        <Button onClick={() => setShowConfigModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md border border-white/10 active:scale-95 transition-all">
                            <Plus className="w-4 h-4 mr-2" />
                            New Configuration
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8 hover:-translate-y-1 transition-all duration-300">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Placements</p>
                        <h3 className="text-4xl font-black italic text-slate-900 tracking-tighter">{placements.length}</h3>
                        <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mt-2">Across all programmes</p>
                    </Card>
                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8 hover:-translate-y-1 transition-all duration-300">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pending Logbooks</p>
                        <h3 className="text-4xl font-black italic text-indigo-650 tracking-tighter">{pendingLogbookCount}</h3>
                        <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mt-2">Awaiting Officer Review</p>
                    </Card>
                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8 hover:-translate-y-1 transition-all duration-300">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Company Partners</p>
                        <h3 className="text-4xl font-black italic text-emerald-600 tracking-tighter">{approvedCompanies.length}</h3>
                        <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mt-2">Approved Organizations</p>
                    </Card>
                </div>

                <Tabs defaultValue="placements" className="space-y-6">
                    <TabsList className="bg-slate-200/50 backdrop-blur-xl rounded-2xl p-1 w-full md:w-auto h-14 border border-slate-200 shadow-inner">
                        <TabsTrigger value="placements" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md">Active Placements</TabsTrigger>
                        <TabsTrigger value="companies" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md">Partner Companies</TabsTrigger>
                        <TabsTrigger value="configs" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md">Eligibility Config</TabsTrigger>
                    </TabsList>

                    {/* PlACEMENTS */}
                    <TabsContent value="placements">
                        <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem]">
                            {loading ? (
                                <div className="py-20 text-center">
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                                </div>
                            ) : placements.length === 0 ? (
                                <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                    No active placements found
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-900 text-white">
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Student</th>
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Company</th>
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Duration</th>
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/40 bg-white/20">
                                            {placements.map((p) => (
                                                <tr key={p.id} className="group hover:bg-white/40 transition-colors">
                                                    <td className="px-10 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-black text-slate-800 uppercase">{p.student?.user?.name}</span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase mt-0.5">{p.student?.matricNumber}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">{p.company?.name}</span>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-2 text-slate-600 font-bold font-mono">
                                                            <Clock className="w-4 h-4 text-slate-400" />
                                                            <span className="text-xs uppercase">{p.startDate ? new Date(p.startDate).toLocaleDateString() : 'NOT SET'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <Badge className={cn(
                                                            "rounded-full text-[9px] font-black uppercase tracking-widest px-4 py-1.5 border",
                                                            p.status === 'accepted' ? "bg-emerald-50 border-emerald-250 text-emerald-600 shadow-sm" :
                                                                p.status === 'applied' ? "bg-amber-50 border-amber-250 text-amber-600 shadow-sm" :
                                                                    p.status === 'completed' ? "bg-indigo-50 border-indigo-250 text-indigo-600 shadow-sm" :
                                                                        "bg-slate-100 border-slate-200 text-slate-400"
                                                        )}>
                                                            {p.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        <Button size="sm" onClick={() => { setReviewTarget(p); setReviewComment(""); }} className="bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 rounded-xl font-black uppercase tracking-widest text-[9px] px-4 py-4 shadow-sm transition-all">
                                                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                                                            Review Logbook ({p.logbooks?.length || 0})
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </TabsContent>

                    {/* COMPANIES */}
                    <TabsContent value="companies">
                        {loading ? (
                            <div className="py-20 text-center">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {pendingCompanies.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <ShieldAlert className="w-5 h-5 text-amber-500" />
                                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Pending Approval ({pendingCompanies.length})</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {pendingCompanies.map((c) => (
                                                <Card key={c.id} className="border border-amber-200 shadow-xl shadow-amber-100/50 bg-amber-50/40 backdrop-blur-3xl rounded-[2.5rem] p-6 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-inner">
                                                                <Building2 className="w-8 h-8" />
                                                            </div>
                                                            <Badge className="bg-amber-100 border border-amber-200 text-amber-600 rounded-full font-black uppercase text-[8px] tracking-widest">
                                                                Pending
                                                            </Badge>
                                                        </div>
                                                        <h4 className="text-lg font-black text-slate-800 uppercase italic mb-2 tracking-tight">{c.name}</h4>
                                                        <p className="text-xs text-slate-500 font-bold leading-relaxed mb-3">{c.address}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                                            Requested by: {c.addedBy?.name || 'Student'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2 pt-5 border-t border-amber-200/60">
                                                        <Button onClick={() => handleSetApproval(c.id, true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest h-11 active:scale-95">
                                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                                                        </Button>
                                                        <Button variant="outline" onClick={() => handleSetApproval(c.id, false)} className="w-full rounded-2xl font-black uppercase text-[10px] tracking-widest h-11 text-slate-500">
                                                            <XCircle className="w-4 h-4 mr-2" /> Reject
                                                        </Button>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Approved Partners ({approvedCompanies.length})</h3>
                                    </div>
                                    {approvedCompanies.length === 0 ? (
                                        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                            No approved partner companies yet
                                        </Card>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {approvedCompanies.map((c) => (
                                                <Card key={c.id} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-6 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                                                                <Building2 className="w-8 h-8" />
                                                            </div>
                                                            <Badge className="bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-full font-black uppercase text-[8px] tracking-widest">
                                                                Verified
                                                            </Badge>
                                                        </div>
                                                        <h4 className="text-lg font-black text-slate-800 uppercase italic mb-2 tracking-tight">{c.name}</h4>
                                                        <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6 line-clamp-2">{c.address}</p>
                                                    </div>
                                                    <div className="pt-5 border-t border-white/40">
                                                        <Button variant="outline" onClick={() => handleSetApproval(c.id, false)} className="w-full rounded-2xl font-black uppercase text-[10px] tracking-widest h-10 text-slate-500">
                                                            Remove Approval
                                                        </Button>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* CONFIGS */}
                    <TabsContent value="configs">
                        <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Active Configurations</h3>
                                <Button onClick={() => setShowConfigModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest px-5 h-11 active:scale-95">
                                    <Plus className="w-4 h-4 mr-2" /> Add Configuration
                                </Button>
                            </div>
                            {loading ? (
                                <div className="py-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                                </div>
                            ) : configs.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                    No SIWES configurations active
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {configs.map((conf) => (
                                        <div key={conf.id} className={cn("flex items-center justify-between p-6 rounded-2xl bg-white border border-slate-200/70 group hover:border-indigo-300 transition-all shadow-sm", !conf.isActive && "opacity-55")}>
                                            <div className="flex items-center gap-6">
                                                <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center font-black italic uppercase text-xs shadow-inner", conf.isActive ? "bg-slate-50 border-slate-200 text-indigo-600" : "bg-slate-100 border-slate-200 text-slate-400")}>
                                                    {conf.programme?.code || 'GEN'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                                                        {conf.programme?.name || (conf.department?.name || 'All Programmes')}
                                                        <Badge className={cn("rounded-full font-black uppercase text-[8px] tracking-widest", conf.isActive ? "bg-emerald-50 border-emerald-250 text-emerald-600" : "bg-slate-100 border-slate-200 text-slate-400")}>
                                                            {conf.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </p>
                                                    <div className="flex gap-4 mt-1 font-mono">
                                                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Semester {conf.semester}</span>
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{conf.durationMonths} Months</span>
                                                        {conf.faculty?.name && <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">{conf.faculty.name}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost"
                                                onClick={() => handleToggleConfig(conf)}
                                                className={cn("rounded-xl font-black uppercase text-[10px] tracking-wider", conf.isActive ? "text-rose-500 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50")}>
                                                {conf.isActive ? "Deactivate" : "Activate"}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* NEW CONFIG MODAL */}
            {showConfigModal && (
                <Modal isOpen onClose={() => !savingConfig && setShowConfigModal(false)} title="New SIWES Eligibility Configuration">
                    <div className="space-y-5">
                        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">How eligibility works</p>
                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                                Leave a field as &quot;All&quot; to make this rule apply to every faculty, department, or programme globally. More specific rules override general ones.
                            </p>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Faculty</Label>
                            <Select value={configForm.facultyId || "all"} onValueChange={(v) => setConfigForm({ ...configForm, facultyId: v === "all" ? "" : v, deptId: "", programmeId: "" })}>
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="All Faculties" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Faculties</SelectItem>
                                    {faculties.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Department</Label>
                            <Select value={configForm.deptId || "all"} onValueChange={(v) => setConfigForm({ ...configForm, deptId: v === "all" ? "" : v, programmeId: "" })}>
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {filteredDepartments.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Programme</Label>
                            <Select value={configForm.programmeId || "all"} onValueChange={(v) => setConfigForm({ ...configForm, programmeId: v === "all" ? "" : v })}>
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="All Programmes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Programmes</SelectItem>
                                    {filteredProgrammes.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Semester</Label>
                                <Select value={configForm.semester} onValueChange={(v) => setConfigForm({ ...configForm, semester: v })}>
                                    <SelectTrigger className="rounded-2xl">
                                        <SelectValue placeholder="Semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Semester 1</SelectItem>
                                        <SelectItem value="2">Semester 2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Duration (months)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={configForm.durationMonths}
                                    onChange={(e) => setConfigForm({ ...configForm, durationMonths: e.target.value })}
                                    className="rounded-2xl"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button onClick={saveConfig} disabled={savingConfig} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 active:scale-95 shadow-md">
                                {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Create Configuration
                            </Button>
                            <Button variant="outline" onClick={() => setShowConfigModal(false)} disabled={savingConfig} className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-12">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* REVIEW LOGBOOK MODAL */}
            {reviewTarget && (
                <Modal isOpen onClose={() => setReviewTarget(null)} title={`Review Logbook — ${reviewTarget.student?.user?.name || 'Student'}`}>
                    <div className="space-y-5">
                        <p className="text-[11px] font-bold text-slate-500">
                            Company: <span className="text-slate-800 uppercase">{reviewTarget.company?.name}</span>
                        </p>
                        {(!reviewTarget.logbooks || reviewTarget.logbooks.length === 0) ? (
                            <div className="py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                No logbook entries submitted for this placement
                            </div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                                {reviewTarget.logbooks.map((l: any) => (
                                    <div key={l.id} className={cn("p-4 rounded-2xl border", l.status === 'approved' ? "bg-emerald-50/60 border-emerald-200" : l.status === 'flagged' ? "bg-rose-50/60 border-rose-200" : "bg-white border-slate-200")}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-slate-700 uppercase italic">Week {l.weekNumber}</span>
                                            <Badge className={cn(
                                                "rounded-full font-black uppercase text-[8px] tracking-widest",
                                                l.status === 'approved' ? "bg-emerald-50 border-emerald-250 text-emerald-600" :
                                                    l.status === 'flagged' ? "bg-rose-50 border-rose-250 text-rose-600" :
                                                        "bg-amber-50 border-amber-250 text-amber-600"
                                            )}>{l.status}</Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">"{l.activities}"</p>
                                        {l.coordinatorComment && (
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Comment: {l.coordinatorComment}</p>
                                        )}
                                        <div className="flex gap-2 mt-3">
                                            {l.status !== 'approved' && (
                                                <Button size="sm" variant="success" onClick={() => handleReviewLogbook(l, 'approved')} className="rounded-lg font-black uppercase text-[9px] tracking-widest">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                                                </Button>
                                            )}
                                            {l.status !== 'flagged' && (
                                                <Button size="sm" variant="outline" onClick={() => handleReviewLogbook(l, 'flagged')} className="rounded-lg font-black uppercase text-[9px] tracking-widest text-amber-600">
                                                    <ShieldAlert className="w-3 h-3 mr-1" /> Flag
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div>
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Coordinator comment (applied to next action)</Label>
                            <Textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                rows={2}
                                placeholder="e.g. Good work, keep it up. / Please provide more detail on Week 4."
                                className="rounded-2xl resize-none"
                            />
                        </div>
                        <Button variant="outline" onClick={() => setReviewTarget(null)} className="w-full rounded-2xl font-black uppercase text-[10px] tracking-widest h-11">
                            Close
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}