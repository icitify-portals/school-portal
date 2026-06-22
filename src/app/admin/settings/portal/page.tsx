"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Calendar,
    Plus,
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Loader2,
    Settings,
    Lock,
    Unlock,
    Archive,
    Trash2,
    CalendarDays,
    Upload,
    Link as LinkIcon,
    Image as ImageIcon
} from "lucide-react";
import {
    getAcademicSessions,
    createAcademicSession,
    setCurrentSession,
    toggleRegistration,
    toggleAddDrop,
    deleteAcademicSession,
    setCurrentSemester,
    updateAcademicSession
} from "@/actions/portal";
import { getBrandingSettings, updateBrandingSettings } from "@/actions/settings";
import { uploadFile } from "@/actions/upload";
import FileUploadZone from "@/components/lms/FileUploadZone";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as Tabs from "@radix-ui/react-tabs";

export default function PortalSettingsPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [branding, setBranding] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingBranding, setIsSavingBranding] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [logoMode, setLogoMode] = useState<'url' | 'upload'>('url');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSession, setEditingSession] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        currentSemester: '1' as '1' | '2',
        status: 'planned' as 'planned' | 'active' | 'archived'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [sessionData, brandingData] = await Promise.all([
            getAcademicSessions(),
            getBrandingSettings()
        ]);
        setSessions(sessionData);
        setBranding(brandingData);
        setLoading(false);
    };

    const handleLogoUpload = async (file: File) => {
        setIsUploadingLogo(true);
        const tid = toast.loading("Uploading logo...");
        const formData = new FormData();
        formData.append("file", file);

        const res = await uploadFile(formData, "branding");
        if (res.success) {
            setBranding(prev => ({ ...prev, INST_LOGO: (res as any).url! }));
            toast.success("Logo uploaded successfully", { id: tid });
        } else {
            toast.error(res.error || "Failed to upload logo", { id: tid });
        }
        setIsUploadingLogo(false);
    };

    const handleSaveBranding = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingBranding(true);
        const tid = toast.loading("Saving branding settings...");
        const res = await updateBrandingSettings(branding);
        if (res.success) {
            toast.success("Branding updated successfully", { id: tid });
            // Logic to refresh styles would go here if not using revalidatePath
        } else {
            toast.error(res.error || "Failed to update branding", { id: tid });
        }
        setIsSavingBranding(false);
    };

    const handleResetBranding = () => {
        if (confirm("Are you sure you want to reset branding to defaults?")) {
            setBranding({
                INST_NAME: "SchoolPortal",
                INST_MOTTO: "",
                INST_LOGO: "",
                COLOR_PRIMARY: "#4f46e5",
                COLOR_SECONDARY: "#0f172a"
            });
            toast.info("Branding reset to defaults (click save to apply)");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await createAcademicSession(formData);
        if (res.success) {
            toast.success("Academic Session created");
            setShowAddModal(false);
            setFormData({ name: "", startDate: "", endDate: "", isCurrent: false, currentSemester: '1', status: 'planned' });
            loadData();
        } else {
            toast.error(res.error || "Failed to create session");
        }
        setIsSubmitting(false);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await updateAcademicSession(editingSession.id, formData);
        if (res.success) {
            toast.success("Academic Session updated");
            setShowEditModal(false);
            setEditingSession(null);
            setFormData({ name: "", startDate: "", endDate: "", isCurrent: false, currentSemester: '1', status: 'planned' });
            loadData();
        } else {
            toast.error(res.error || "Failed to update session");
        }
        setIsSubmitting(false);
    };

    const handleSetCurrent = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to set ${name} as the current academic session? This will affect all student records.`)) return;

        const tid = toast.loading(`Setting ${name} as current...`);
        const res = await setCurrentSession(id);
        if (res.success) {
            toast.success(`${name} is now the active session`, { id: tid });
            loadData();
        }
    };

    const handleSemesterToggle = async (id: number, current: string, name: string) => {
        const next = current === "1" ? "2" : "1";
        const tid = toast.loading(`Switching ${name} to ${next === "1" ? "First" : "Second"} Semester...`);
        const res = await setCurrentSemester(id, next as '1' | '2');
        if (res.success) {
            toast.success(`Active semester updated to ${next === "1" ? "First" : "Second"} Semester`, { id: tid });
            loadData();
        } else {
            toast.error("Failed to update semester", { id: tid });
        }
    };

    const handleToggleLock = async (id: number, current: boolean, name: string) => {
        const action = current ? "lock" : "unlock";
        if (!confirm(`Are you sure you want to ${action} registration for the ${name} session?`)) return;

        const res = await toggleRegistration(id, !current);
        if (res.success) {
            toast.success(`Registration ${current ? 'locked' : 'unlocked'} for ${name}`);
            loadData();
        }
    };

    const handleToggleAddDrop = async (id: number, current: boolean, name: string) => {
        const action = current ? "close" : "open";
        if (!confirm(`Are you sure you want to ${action} the Add/Drop window for the ${name} session?`)) return;

        const res = await toggleAddDrop(id, !current);
        if (res.success) {
            toast.success(`Add/Drop window ${current ? 'closed' : 'opened'} for ${name}`);
            loadData();
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`DANGER: Are you sure you want to delete the ${name} session? This should only be done if no records are linked to it.`)) return;

        const res = await deleteAcademicSession(id);
        if (res.success) {
            toast.success("Session deleted");
            loadData();
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>;

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic uppercase">
                        <Settings className="w-10 h-10 text-indigo-600" />
                        System Settings
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Manage institutional branding and academic cycles</p>
                </div>
            </header>

            <Tabs.Root defaultValue="sessions" className="space-y-8">
                <Tabs.List className="flex bg-slate-100/50 p-1.5 rounded-2xl w-fit">
                    <Tabs.Trigger
                        value="sessions"
                        className="px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 text-slate-400 flex items-center gap-2"
                    >
                        <CalendarDays className="w-4 h-4" /> Academic Cycles
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        value="branding"
                        className="px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 text-slate-400 flex items-center gap-2"
                    >
                        <ShieldCheck className="w-4 h-4" /> Branding & Theme
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="sessions" className="space-y-8 focus:outline-none animate-in fade-in duration-500">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-900 italic uppercase">Academic Sessions</h2>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-6 rounded-2xl shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex gap-3 uppercase text-xs tracking-widest"
                        >
                            <Plus className="w-5 h-5" /> New Session
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {sessions.map((s) => (
                            <Card key={s.id} className={cn(
                                "group border-none shadow-xl overflow-hidden rounded-[2.5rem] transition-all",
                                s.isCurrent ? "ring-4 ring-indigo-500/20" : "opacity-90"
                            )}>
                                <CardHeader className={cn(
                                    "p-8 text-white flex flex-row justify-between items-center",
                                    s.isCurrent ? "bg-indigo-600" : "bg-slate-900"
                                )}>
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                                            <Calendar className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <CardTitle className="text-2xl font-black italic uppercase tracking-tight">{s.name} Session</CardTitle>
                                                {s.isCurrent && (
                                                    <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md">
                                                        Active Now
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                                                {s.status} • {s.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A'} - {s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {!s.isCurrent && (
                                            <Button
                                                onClick={() => handleSetCurrent(s.id, s.name)}
                                                variant="ghost"
                                                className="text-white hover:bg-white/10 font-black rounded-xl"
                                            >
                                                Set Current
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => {
                                                setEditingSession(s);
                                                setFormData({
                                                    name: s.name,
                                                    startDate: s.startDate ? new Date(s.startDate).toISOString().split('T')[0] : "",
                                                    endDate: s.endDate ? new Date(s.endDate).toISOString().split('T')[0] : "",
                                                    isCurrent: s.isCurrent,
                                                    currentSemester: s.currentSemester,
                                                    status: s.status
                                                });
                                                setShowEditModal(true);
                                            }}
                                            variant="ghost"
                                            className="text-white hover:bg-white/10 font-black rounded-xl"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() => handleSemesterToggle(s.id, s.currentSemester, s.name)}
                                            className={cn(
                                                "rounded-xl font-black border-none",
                                                s.currentSemester === "1" ? "bg-amber-500 hover:bg-amber-600" : "bg-purple-500 hover:bg-purple-600"
                                            )}
                                        >
                                            <CalendarDays className="w-4 h-4 mr-2" />
                                            {s.currentSemester === "1" ? "First Semester" : "Second Semester"}
                                        </Button>
                                        <Button
                                            onClick={() => handleToggleLock(s.id, s.isRegistrationOpen, s.name)}
                                            className={cn(
                                                "rounded-xl font-black border-none",
                                                s.isRegistrationOpen ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"
                                            )}
                                        >
                                            {s.isRegistrationOpen ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                                            {s.isRegistrationOpen ? "Reg Open" : "Reg Locked"}
                                        </Button>
                                        <Button
                                            onClick={() => handleToggleAddDrop(s.id, s.isAddDropOpen, s.name)}
                                            className={cn(
                                                "rounded-xl font-black border-none",
                                                s.isAddDropOpen ? "bg-indigo-500 hover:bg-indigo-600" : "bg-slate-500 hover:bg-slate-600"
                                            )}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {s.isAddDropOpen ? "Add/Drop Open" : "Add/Drop Closed"}
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(s.id, s.name)}
                                            variant="ghost"
                                            size="icon"
                                            className="text-white/40 hover:text-white hover:bg-rose-500/20 rounded-xl"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center space-y-2">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center",
                                                s.isCurrent ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500"
                                            )}>
                                                <ShieldCheck className="w-6 h-6" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Priority</p>
                                            <p className="font-black text-slate-900 italic">{s.isCurrent ? "Primary Session" : "Standby"}</p>
                                        </div>

                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center space-y-2">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center",
                                                s.isRegistrationOpen ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                            )}>
                                                {s.isRegistrationOpen ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registration Access</p>
                                            <p className="font-black text-slate-900 italic">{s.isRegistrationOpen ? "Authorized" : "Revoked"}</p>
                                        </div>

                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center space-y-2">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                                <Archive className="w-6 h-6" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lifecycle State</p>
                                            <p className="font-black text-slate-900 italic capitalize">{s.status}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {sessions.length === 0 && (
                        <div className="p-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-black text-slate-400 italic uppercase">No Academic Sessions Found</h3>
                            <p className="text-slate-400 text-sm font-bold mt-2">Initialize your first academic cycle to begin</p>
                        </div>
                    )}
                </Tabs.Content>

                <Tabs.Content value="branding" className="focus:outline-none animate-in slide-in-from-right-4 duration-500">
                    <form onSubmit={handleSaveBranding} className="space-y-8">
                        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-10 bg-slate-900 text-white">
                                <CardTitle className="text-3xl font-black italic uppercase tracking-tight">Institutional Branding</CardTitle>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Customize your portal identity and colors</p>
                            </CardHeader>
                            <CardContent className="p-10 bg-white grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Institution Name</label>
                                        <Input
                                            value={branding.INST_NAME || ""}
                                            onChange={(e) => setBranding({ ...branding, INST_NAME: e.target.value })}
                                            placeholder="e.g., Alpha University"
                                            className="rounded-2xl border-slate-200 py-6 font-bold shadow-sm focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Motto / Tagline</label>
                                        <Input
                                            value={branding.INST_MOTTO || ""}
                                            onChange={(e) => setBranding({ ...branding, INST_MOTTO: e.target.value })}
                                            placeholder="e.g., Excellence in Research"
                                            className="rounded-2xl border-slate-200 py-6 font-bold shadow-sm focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Institutional Logo</label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setLogoMode('url')}
                                                    className={cn(
                                                        "text-[9px] font-black uppercase tracking-tighter px-3 py-1 rounded-full transition-all",
                                                        logoMode === 'url' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                    )}
                                                >
                                                    URL Link
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLogoMode('upload')}
                                                    className={cn(
                                                        "text-[9px] font-black uppercase tracking-tighter px-3 py-1 rounded-full transition-all",
                                                        logoMode === 'upload' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                    )}
                                                >
                                                    File Upload
                                                </button>
                                            </div>
                                        </div>

                                        {logoMode === 'url' ? (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        value={branding.INST_LOGO || ""}
                                                        onChange={(e) => setBranding({ ...branding, INST_LOGO: e.target.value })}
                                                        placeholder="https://example.com/logo.png"
                                                        className="rounded-2xl border-slate-200 py-6 pl-12 font-bold shadow-sm focus:ring-indigo-500"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium px-2 italic">Provide a direct link to an image hosted online.</p>
                                            </div>
                                        ) : (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                <FileUploadZone
                                                    onUpload={handleLogoUpload}
                                                    uploading={isUploadingLogo}
                                                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp'] }}
                                                    maxSize={2 * 1024 * 1024}
                                                    label="Drop your logo here (PNG, JPG, SVG)"
                                                    currentUrl={branding.INST_LOGO}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Primary Color</label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="color"
                                                    value={branding.COLOR_PRIMARY || "#4f46e5"}
                                                    onChange={(e) => setBranding({ ...branding, COLOR_PRIMARY: e.target.value })}
                                                    className="w-12 h-12 rounded-xl border-none cursor-pointer"
                                                />
                                                <Input
                                                    value={branding.COLOR_PRIMARY || ""}
                                                    onChange={(e) => setBranding({ ...branding, COLOR_PRIMARY: e.target.value })}
                                                    className="rounded-2xl border-slate-200 py-6 font-mono font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Secondary Color</label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="color"
                                                    value={branding.COLOR_SECONDARY || "#0f172a"}
                                                    onChange={(e) => setBranding({ ...branding, COLOR_SECONDARY: e.target.value })}
                                                    className="w-12 h-12 rounded-xl border-none cursor-pointer"
                                                />
                                                <Input
                                                    value={branding.COLOR_SECONDARY || ""}
                                                    onChange={(e) => setBranding({ ...branding, COLOR_SECONDARY: e.target.value })}
                                                    className="rounded-2xl border-slate-200 py-6 font-mono font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center gap-4">
                                        <div
                                            className="w-20 h-20 rounded-[1.5rem] shadow-xl flex items-center justify-center text-white"
                                            style={{ backgroundColor: branding.COLOR_PRIMARY }}
                                        >
                                            <ShieldCheck className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Preview</p>
                                            <p className="font-bold text-slate-900 mt-1">{branding.INST_NAME || "Your Portal"}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="p-10 bg-slate-50 flex justify-end gap-4">
                                <Button
                                    type="button"
                                    onClick={handleResetBranding}
                                    variant="ghost"
                                    className="text-slate-400 hover:text-slate-600 font-black px-8 py-8 rounded-[1.5rem] uppercase text-[10px] tracking-widest transition-all"
                                >
                                    Reset to Default
                                </Button>
                                <Button
                                    disabled={isSavingBranding}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-8 rounded-[1.5rem] shadow-2xl shadow-indigo-100 uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95"
                                >
                                    {isSavingBranding ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : "Save Branding Changes"}
                                </Button>
                            </div>
                        </Card>
                    </form>
                </Tabs.Content>
            </Tabs.Root>

            {/* Add Session Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-300">
                            <CardHeader className="bg-slate-900 text-white p-8">
                                <CardTitle className="text-2xl font-black italic uppercase">Initialize Session</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Session Name</label>
                                        <Input
                                            placeholder="2024/2025"
                                            className="rounded-2xl border-slate-200 py-6 font-bold"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Start Date</label>
                                            <Input
                                                type="date"
                                                className="rounded-2xl border-slate-200 py-6 font-bold"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">End Date</label>
                                            <Input
                                                type="date"
                                                className="rounded-2xl border-slate-200 py-6 font-bold"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Startup Semester</label>
                                            <select
                                                className="w-full p-4 rounded-2xl border border-slate-200 font-bold text-sm bg-white"
                                                value={formData.currentSemester}
                                                onChange={(e) => setFormData({ ...formData, currentSemester: e.target.value as '1' | '2' })}
                                            >
                                                <option value="1">First Semester</option>
                                                <option value="2">Second Semester</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-4 py-4 p-4 bg-slate-50 rounded-2xl">
                                            <input
                                                type="checkbox"
                                                id="isCurrent"
                                                className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={formData.isCurrent}
                                                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                                            />
                                            <label htmlFor="isCurrent" className="text-sm font-bold text-slate-700">Set Primary</label>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setShowAddModal(false)}
                                            className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Session"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Edit Session Modal */}
            {
                showEditModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-300">
                            <CardHeader className="bg-slate-900 text-white p-8">
                                <CardTitle className="text-2xl font-black italic uppercase">Edit Session</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <form onSubmit={handleEdit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Session Name</label>
                                        <Input
                                            placeholder="2024/2025"
                                            className="rounded-2xl border-slate-200 py-6 font-bold"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Start Date</label>
                                            <Input
                                                type="date"
                                                className="rounded-2xl border-slate-200 py-6 font-bold"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">End Date</label>
                                            <Input
                                                type="date"
                                                className="rounded-2xl border-slate-200 py-6 font-bold"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Status</label>
                                        <select
                                            className="w-full p-4 rounded-2xl border border-slate-200 font-bold text-sm bg-white"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'planned' | 'active' | 'archived' })}
                                        >
                                            <option value="planned">Planned</option>
                                            <option value="active">Active</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setShowEditModal(false);
                                                setEditingSession(null);
                                            }}
                                            className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div >
    );
}
