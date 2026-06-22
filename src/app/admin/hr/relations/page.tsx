"use client";

import { useState, useEffect } from "react";
import {
    ShieldAlert,
    GraduationCap,
    LogOut,
    Plus,
    Search,
    Filter,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Calendar,
    User,
    ChevronDown,
    MoreHorizontal,
    FileText,
    History,
    Check
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getDisciplinaryRecords,
    logDisciplinaryAction,
    getStaffTraining,
    registerTraining,
    getExitRecords,
    initiateExitWorkflow,
    updateExitStatus,
    verifyStaffTraining
} from "@/actions/hr_relations";
import { getStudentCertifications, verifyStudentCertification } from "@/actions/student_growth";
import { getStaffProfiles } from "@/actions/hr";
import { cn } from "@/lib/utils";

export default function RelationsDashboard() {
    const [activeTab, setActiveTab] = useState("disciplinary");
    const [staff, setStaff] = useState<any[]>([]);
    const [disciplinaryRecords, setDisciplinaryRecords] = useState<any[]>([]);
    const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
    const [studentCerts, setStudentCerts] = useState<any[]>([]);
    const [exitRecords, setExitRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form states
    const [selectedStaffId, setSelectedStaffId] = useState("");
    const [incidentDate, setIncidentDate] = useState("");
    const [incidentType, setIncidentType] = useState("incident");
    const [description, setDescription] = useState("");
    const [actionTaken, setActionTaken] = useState("");

    const [trainingTitle, setTrainingTitle] = useState("");
    const [provider, setProvider] = useState("");
    const [completionDate, setCompletionDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");

    const [exitType, setExitType] = useState("resignation");
    const [lastWorkingDay, setLastWorkingDay] = useState("");
    const [exitReason, setExitReason] = useState("");

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        const staffData = await getStaffProfiles();
        setStaff(staffData);

        if (activeTab === "disciplinary") {
            const data = await getDisciplinaryRecords();
            setDisciplinaryRecords(data);
        } else if (activeTab === "training") {
            const data = await getStaffTraining();
            setTrainingRecords(data);
        } else if (activeTab === "student_growth") {
            const data = await getStudentCertifications();
            setStudentCerts(data);
        } else if (activeTab === "exit") {
            const data = await getExitRecords();
            setExitRecords(data);
        }
        setLoading(false);
    };

    const handleLogDisciplinary = async () => {
        const res = await logDisciplinaryAction({
            staffId: parseInt(selectedStaffId),
            incidentDate,
            type: incidentType,
            description,
            actionTaken,
        });
        if (res.success) {
            setIsAdding(false);
            fetchData();
            resetForm();
        }
    };

    const handleRegisterTraining = async () => {
        const res = await registerTraining({
            staffId: parseInt(selectedStaffId),
            title: trainingTitle,
            provider,
            completionDate,
            expiryDate,
            status: 'completed'
        });
        if (res.success) {
            setIsAdding(false);
            fetchData();
            resetForm();
        }
    };

    const handleVerifyStaffTraining = async (id: number, status: 'verified' | 'rejected') => {
        const res = await verifyStaffTraining(id, status);
        if (res.success) fetchData();
    };

    const handleVerifyStudentCert = async (id: number, status: 'verified' | 'rejected') => {
        const res = await verifyStudentCertification(id, status);
        if (res.success) fetchData();
    };

    const handleInitiateExit = async () => {
        const res = await initiateExitWorkflow({
            staffId: parseInt(selectedStaffId),
            exitType,
            lastWorkingDay,
            reason: exitReason,
        });
        if (res.success) {
            setIsAdding(false);
            fetchData();
            resetForm();
        }
    };

    const resetForm = () => {
        setSelectedStaffId("");
        setIncidentDate("");
        setIncidentType("incident");
        setDescription("");
        setActionTaken("");
        setTrainingTitle("");
        setProvider("");
        setCompletionDate("");
        setExpiryDate("");
        setExitType("resignation");
        setLastWorkingDay("");
        setExitReason("");
    };

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                        <ShieldAlert className="w-10 h-10 text-rose-600" />
                        Relations & Learning
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-1">Manage institutional discipline, faculty growth, and exit workflows</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={() => setIsAdding(true)}
                        className="bg-slate-900 hover:bg-black rounded-2xl py-6 px-8 font-black uppercase text-[10px] tracking-widest gap-2 shadow-2xl shadow-slate-200 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Log New Entry
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="disciplinary" className="space-y-8" onValueChange={setActiveTab}>
                <TabsList className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit">
                    <TabsTrigger value="disciplinary" className="rounded-xl px-6 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Disciplinary
                    </TabsTrigger>
                    <TabsTrigger value="training" className="rounded-xl px-6 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Staff Training
                    </TabsTrigger>
                    <TabsTrigger value="student_growth" className="rounded-xl px-6 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Student Growth
                    </TabsTrigger>
                    <TabsTrigger value="exit" className="rounded-xl px-6 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Exit Management
                    </TabsTrigger>
                </TabsList>

                {isAdding && (
                    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-xl font-black italic tracking-wider uppercase">New {activeTab} Entry</CardTitle>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em] mt-1">Institutional Compliance Record</p>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Staff Member</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all appearance-none"
                                        value={selectedStaffId}
                                        onChange={(e) => setSelectedStaffId(e.target.value)}
                                    >
                                        <option value="">-- Choose Staff --</option>
                                        {staff.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.staffId})</option>
                                        ))}
                                    </select>
                                </div>

                                {activeTab === "disciplinary" && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Incident Date</label>
                                            <input type="date" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Action Type</label>
                                            <select value={incidentType} onChange={e => setIncidentType(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none">
                                                <option value="incident">Incident Report</option>
                                                <option value="verbal_warning">Verbal Warning</option>
                                                <option value="written_warning">Written Warning</option>
                                                <option value="query">Institutional Query</option>
                                                <option value="suspension">Suspension</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description of Incident</label>
                                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" placeholder="Provide factual details..." />
                                        </div>
                                        <div className="md:col-span-1 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Action Taken</label>
                                            <textarea value={actionTaken} onChange={e => setActionTaken(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. Mandatory hearing scheduled..." />
                                        </div>
                                    </>
                                )}

                                {activeTab === "training" && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Training Title</label>
                                            <input type="text" value={trainingTitle} onChange={e => setTrainingTitle(e.target.value)} placeholder="e.g. Advanced Academic Writing" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Provider / Body</label>
                                            <input type="text" value={provider} onChange={e => setProvider(e.target.value)} placeholder="e.g. NUC or Professional Body" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Completion Date</label>
                                            <input type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Expiry / Renewal Date</label>
                                            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                                        </div>
                                    </>
                                )}

                                {activeTab === "exit" && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Exit Type</label>
                                            <select value={exitType} onChange={e => setExitType(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none">
                                                <option value="resignation">Resignation</option>
                                                <option value="retirement">Retirement</option>
                                                <option value="termination">Termination</option>
                                                <option value="contract_ended">Contract Ended</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Working Day</label>
                                            <input type="date" value={lastWorkingDay} onChange={e => setLastWorkingDay(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                                        </div>
                                        <div className="md:col-span-1 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Reason for Departure</label>
                                            <textarea value={exitReason} onChange={e => setExitReason(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" placeholder="Provide context..." />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => { setIsAdding(false); resetForm(); }}
                                    className="flex-1 rounded-2xl py-6 font-black uppercase text-[10px] tracking-[0.2em] border-slate-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={activeTab === "disciplinary" ? handleLogDisciplinary : activeTab === "training" ? handleRegisterTraining : handleInitiateExit}
                                    className="flex-1 bg-slate-900 hover:bg-black rounded-2xl py-6 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-slate-200"
                                >
                                    Commit Record to Ledger
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <TabsContent value="disciplinary" className="space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden rounded-2xl italic">
                        <CardHeader className="bg-white border-b border-slate-50 p-6 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-rose-500" />
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Incidents & Warnings Registry</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Staff Identity</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Incident</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Type / Status</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50/50">
                                        {loading ? (
                                            <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-200" /></td></tr>
                                        ) : disciplinaryRecords.map((r) => (
                                            <tr key={r.record.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black italic shadow-inner">{r.user.name?.[0]}</div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-sm">{r.user.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{r.staff.staffId} • {r.staff.jobTitle}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(r.record.incidentDate).toLocaleDateString()}</p>
                                                        <p className="text-xs font-bold text-slate-700 leading-relaxed max-w-md">{r.record.description}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-2">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border",
                                                            r.record.type === 'verbal_warning' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                                r.record.type === 'written_warning' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                                                    r.record.type === 'suspension' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-50 text-slate-600 border-slate-100"
                                                        )}>
                                                            {r.record.type.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 italic">Status: {r.record.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-slate-900"><MoreHorizontal className="w-5 h-5" /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="training" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-none shadow-sm overflow-hidden rounded-2xl italic">
                                <CardHeader className="bg-white border-b border-slate-50 p-6 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <GraduationCap className="w-5 h-5 text-indigo-500" />
                                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Faculty Growth Log</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-50">
                                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Faculty Member</th>
                                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Training / Certification</th>
                                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Verification</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50/50">
                                                {trainingRecords.map(t => (
                                                    <tr key={t.training.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-8 py-6 text-sm font-black text-slate-900">{t.user.name}</td>
                                                        <td className="px-8 py-6">
                                                            <div>
                                                                <p className="text-xs font-black text-slate-700">{t.training.title}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{t.training.provider}</p>
                                                                {t.training.certificateUrl && <a href={t.training.certificateUrl} target="_blank" className="text-[9px] text-indigo-600 hover:underline font-black uppercase">View Credential</a>}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                                    t.training.status === 'verified' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                                        t.training.status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                                            "bg-amber-50 text-amber-600 border-amber-100"
                                                                )}>
                                                                    {t.training.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            {t.training.status !== 'verified' && t.training.status !== 'rejected' && (
                                                                <div className="flex gap-2 justify-end">
                                                                    <Button size="icon" className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600" onClick={() => handleVerifyStaffTraining(t.training.id, 'verified')}><Check className="w-4 h-4" /></Button>
                                                                    <Button size="icon" className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600" onClick={() => handleVerifyStaffTraining(t.training.id, 'rejected')}><AlertCircle className="w-4 h-4" /></Button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1">
                            <Card className="border-none shadow-sm rounded-2xl bg-indigo-600 text-white p-8">
                                <GraduationCap className="w-10 h-10 mb-6 opacity-40 capitalize" />
                                <h3 className="text-2xl font-black italic tracking-tight">Staff Learning</h3>
                                <p className="text-sm font-medium opacity-80 mt-2 mb-8">HR verification ensures all faculty credentials meet institutional standards.</p>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/10 rounded-2xl flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-widest">Logged Records</p>
                                        <span className="text-lg font-black">{trainingRecords.length}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="student_growth" className="space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden rounded-2xl italic">
                        <CardHeader className="bg-white border-b border-slate-50 p-6 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="w-5 h-5 text-amber-500" />
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Student Achievement Ledger</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Student</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Certification</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status / Verification</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50/50">
                                        {studentCerts.map(c => (
                                            <tr key={c.certification.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6 text-sm font-black text-slate-900">{c.user.name}</td>
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-700">{c.certification.title}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{c.certification.provider}</p>
                                                        {c.certification.certificateUrl && <a href={c.certification.certificateUrl} target="_blank" className="text-[9px] text-indigo-600 hover:underline font-black uppercase">View Linked Credential</a>}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                        c.certification.status === 'verified' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                            c.certification.status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                                "bg-amber-50 text-amber-600 border-amber-100"
                                                    )}>
                                                        {c.certification.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {c.certification.status === 'pending' && (
                                                        <div className="flex gap-2 justify-end">
                                                            <Button size="icon" className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600" onClick={() => handleVerifyStudentCert(c.certification.id, 'verified')}><Check className="w-4 h-4" /></Button>
                                                            <Button size="icon" className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600" onClick={() => handleVerifyStudentCert(c.certification.id, 'rejected')}><AlertCircle className="w-4 h-4" /></Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="exit" className="space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden rounded-2xl italic">
                        <CardHeader className="bg-white border-b border-slate-50 p-6">
                            <div className="flex items-center gap-3">
                                <LogOut className="w-5 h-5 text-slate-900" />
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Institutional Separation Ledger</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Departure Details</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status / Clearance</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Process</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50/50">
                                        {exitRecords.map(e => (
                                            <tr key={e.record.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6 text-sm font-black text-slate-900">{e.user.name}</td>
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-700 uppercase tracking-tighter">{e.record.exitType}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold italic">Effective: {new Date(e.record.lastWorkingDay).toLocaleDateString()}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-2">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border",
                                                            e.record.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-600 border-slate-200"
                                                        )}>
                                                            {e.record.status}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                                                            <CheckCircle2 className={cn("w-3 h-3", e.record.clearanceStatus === 'cleared' ? "text-emerald-500" : "text-slate-300")} />
                                                            Clearance: {e.record.clearanceStatus}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Button variant="outline" className="rounded-2xl text-[9px] font-black uppercase tracking-widest h-8 px-4 border-slate-200">Manage Workflow</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
