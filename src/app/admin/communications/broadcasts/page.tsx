"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
    Send, Megaphone, Users, Mail, Bell, CheckCircle2, AlertCircle, Loader2, 
    Trash2, RefreshCw, Layers, Shield, Calendar, Filter, Sparkles, Building, GraduationCap
} from "lucide-react";
import { dispatchCentralBroadcast, getCentralBroadcastHistory, getAudienceCountPreview, deleteCentralBroadcastRecord, clearCentralBroadcastHistory } from "@/actions/broadcasts";
import { getDepartments } from "@/actions/departments";
import { getProgrammes } from "@/actions/programmes";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

export default function CentralBroadcastCommunicationsPage() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || "admin";
    const userName = session?.user?.name || "Administrative Officer";

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [channel, setChannel] = useState<"toast" | "email" | "both">("both");
    const [targetType, setTargetType] = useState<"all" | "levels" | "departments" | "programmes" | "users" | "applicants" | "staff">("all");
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedDepts, setSelectedDepts] = useState<number[]>([]);
    const [selectedProgs, setSelectedProgs] = useState<number[]>([]);
    const [admissionStatus, setAdmissionStatus] = useState<string[]>(["all"]);
    const [customEmails, setCustomEmails] = useState("");
    const [scheduledFor, setScheduledFor] = useState("");

    const [departments, setDepartments] = useState<any[]>([]);
    const [programmes, setProgrammes] = useState<any[]>([]);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [isDispatching, setIsDispatching] = useState(false);
    const [audiencePreview, setAudiencePreview] = useState<number | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Initial load
    useEffect(() => {
        // Set default target type based on role
        if (userRole === "admission_officer") {
            setTargetType("applicants");
        } else if (userRole === "bursar") {
            setTargetType("levels");
        } else if (userRole === "hod" || userRole === "dean") {
            setTargetType("departments");
        }

        getDepartments().then(res => setDepartments(res || []));
        getProgrammes().then(res => setProgrammes(res || []));
        fetchHistory();
    }, [userRole]);

    // Calculate audience preview
    useEffect(() => {
        setPreviewLoading(true);
        getAudienceCountPreview({
            targetType,
            levels: selectedLevels,
            departments: selectedDepts,
            programmes: selectedProgs,
            admissionStatus
        }).then(res => {
            setAudiencePreview(res.count);
            setPreviewLoading(false);
        });
    }, [targetType, selectedLevels, selectedDepts, selectedProgs, admissionStatus]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        const res = await getCentralBroadcastHistory();
        if (res.success) {
            setBroadcasts(res.data || []);
        }
        setLoadingHistory(false);
    };

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error("Please enter both subject title and message content.");
            return;
        }

        setIsDispatching(true);
        const emailsArray = customEmails ? customEmails.split(",").map(e => e.trim()).filter(Boolean) : [];

        const res = await dispatchCentralBroadcast({
            title,
            message,
            channel,
            targetType,
            levels: selectedLevels,
            departments: selectedDepts,
            programmes: selectedProgs,
            admissionStatus,
            emails: emailsArray,
            scheduledFor: scheduledFor || null
        });

        setIsDispatching(false);

        if (res.success) {
            toast.success("Broadcast message queued & dispatched successfully!");
            setTitle("");
            setMessage("");
            setCustomEmails("");
            setScheduledFor("");
            fetchHistory();
        } else {
            toast.error(res.error || "Failed to dispatch broadcast");
        }
    };

    const handleDeleteSingle = async (id: number) => {
        if (!confirm("Are you sure you want to delete this broadcast log?")) return;
        const res = await deleteCentralBroadcastRecord(id);
        if (res.success) {
            toast.success("Broadcast log deleted");
            fetchHistory();
        } else {
            toast.error("Failed to delete log");
        }
    };

    const handleClearAll = async () => {
        if (!confirm("Are you sure you want to clear all broadcast message history?")) return;
        const res = await clearCentralBroadcastHistory();
        if (res.success) {
            toast.success("Broadcast history cleared");
            fetchHistory();
        } else {
            toast.error("Failed to clear history");
        }
    };

    const levelOptions = [
        { label: "ND 1", value: "ND 1" },
        { label: "ND 2", value: "ND 2" },
        { label: "HND 1", value: "HND 1" },
        { label: "HND 2", value: "HND 2" },
        { label: "ND Graduated", value: "ND_graduated" },
        { label: "HND Graduated", value: "HND_graduated" },
    ];

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admission_officer": return { title: "Admission Officer Scope", desc: "Target Applicants & Freshers", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
            case "bursar": return { title: "Bursary Scope", desc: "Target Students & Debtors", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
            case "hod": return { title: "HOD Departmental Scope", desc: "Target Departmental Students & Staff", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" };
            case "dean": return { title: "Faculty Scope", desc: "Target Faculty Students & Staff", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
            case "rector": case "dvc": return { title: "Executive Leadership Scope", desc: "Campus-Wide Global Target Access", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" };
            default: return { title: "Central Communication Scope", desc: "Full Administrative Broadcast Control", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" };
        }
    };

    const roleInfo = getRoleBadge(userRole);

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen space-y-8 bg-slate-50/50">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-emerald-600/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center backdrop-blur-xl shadow-inner">
                            <Megaphone className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl lg:text-3xl font-black tracking-tight italic uppercase">Institutional Broadcast Communications</h1>
                            </div>
                            <p className="text-slate-400 text-sm mt-1">Multi-channel messaging hub with role-based audience scoping and background queue dispatch.</p>
                        </div>
                    </div>

                    <div className={`px-4 py-2 rounded-2xl border ${roleInfo.color} backdrop-blur-md flex items-center gap-3`}>
                        <Shield className="w-5 h-5" />
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider">{roleInfo.title}</p>
                            <p className="text-[11px] font-medium opacity-80">{roleInfo.desc}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Composer Form Card */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border border-white/60 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Send className="w-5 h-5 text-indigo-600" /> Compose Broadcast Announcement
                            </CardTitle>
                            
                            {/* Live Audience Counter Badge */}
                            <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Estimated Audience:</span>
                                {previewLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                ) : (
                                    <span className="text-sm font-black text-indigo-600">{audiencePreview !== null ? audiencePreview.toLocaleString() : 0} Recipient(s)</span>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            {/* Message Subject Title */}
                            <div>
                                <Label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">Subject / Announcement Title</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Important Notice Regarding Academic Session Registration"
                                    className="p-4 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Delivery Channel Selector */}
                            <div>
                                <Label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">Delivery Channel</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setChannel("both")}
                                        className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${channel === "both" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                                    >
                                        <Sparkles className="w-4 h-4" /> Both Email & Toast
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChannel("email")}
                                        className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${channel === "email" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                                    >
                                        <Mail className="w-4 h-4" /> Email Only
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChannel("toast")}
                                        className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${channel === "toast" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                                    >
                                        <Bell className="w-4 h-4" /> In-App Toast Only
                                    </button>
                                </div>
                            </div>

                            {/* Audience Target Type */}
                            <div>
                                <Label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">Target Audience Group</Label>
                                <select
                                    value={targetType}
                                    onChange={(e: any) => setTargetType(e.target.value)}
                                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                >
                                    {(userRole === "admin" || userRole === "superadmin" || userRole === "rector" || userRole === "dvc" || userRole === "registrar") && (
                                        <>
                                            <option value="all">All Active Students (Campus-Wide)</option>
                                            <option value="staff">All Staff & Administrative Personnel</option>
                                        </>
                                    )}
                                    {userRole === "admission_officer" && (
                                        <option value="applicants">Admission Applicants & Freshers</option>
                                    )}
                                    <option value="levels">Filter by Academic Level (ND1, HND1, etc.)</option>
                                    <option value="departments">Filter by Department</option>
                                    <option value="programmes">Filter by Programme / Course</option>
                                    <option value="users">Specific User IDs or External Emails</option>
                                </select>
                            </div>

                            {/* Target Sub-Filters */}
                            {targetType === "applicants" && (
                                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                                    <Label className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Filter Applicants by Admission Status</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {["all", "applied", "screened", "admitted", "rejected"].map(status => (
                                            <button
                                                type="button"
                                                key={status}
                                                onClick={() => {
                                                    if (status === "all") setAdmissionStatus(["all"]);
                                                    else {
                                                        const clean = admissionStatus.filter(s => s !== "all");
                                                        if (clean.includes(status)) setAdmissionStatus(clean.filter(s => s !== status));
                                                        else setAdmissionStatus([...clean, status]);
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${admissionStatus.includes(status) ? "bg-amber-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {targetType === "levels" && (
                                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Select Levels</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {levelOptions.map(lvl => (
                                            <label key={lvl.value} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLevels.includes(lvl.value)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedLevels([...selectedLevels, lvl.value]);
                                                        else setSelectedLevels(selectedLevels.filter(l => l !== lvl.value));
                                                    }}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                {lvl.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {targetType === "departments" && (
                                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                                    <Label className="text-xs font-bold text-purple-800 uppercase tracking-wider block">Select Departments</Label>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                        {departments.map(d => (
                                            <label key={d.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDepts.includes(d.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedDepts([...selectedDepts, d.id]);
                                                        else setSelectedDepts(selectedDepts.filter(id => id !== d.id));
                                                    }}
                                                    className="rounded text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="truncate">{d.name} ({d.code})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {targetType === "programmes" && (
                                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                                    <Label className="text-xs font-bold text-blue-800 uppercase tracking-wider block">Select Programmes / Courses</Label>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                        {programmes.map(p => (
                                            <label key={p.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProgs.includes(p.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedProgs([...selectedProgs, p.id]);
                                                        else setSelectedProgs(selectedProgs.filter(id => id !== p.id));
                                                    }}
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="truncate">{p.name} ({p.code})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {targetType === "users" && (
                                <div>
                                    <Label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">Comma-Separated Emails</Label>
                                    <Input
                                        value={customEmails}
                                        onChange={(e) => setCustomEmails(e.target.value)}
                                        placeholder="e.g. student1@gmail.com, applicant2@yahoo.com"
                                        className="p-3 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            )}

                            {/* Schedule Optional Date */}
                            <div>
                                <Label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Schedule Delivery Date (Optional)
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={scheduledFor}
                                    onChange={(e) => setScheduledFor(e.target.value)}
                                    className="p-3 border border-slate-200 rounded-xl text-sm font-medium w-full sm:w-72"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Leave empty to dispatch broadcast immediately.</p>
                            </div>

                            {/* Message Body Input */}
                            <div>
                                <Label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">Message Content</Label>
                                <Textarea
                                    rows={5}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your official announcement content here..."
                                    className="p-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 custom-scrollbar"
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                onClick={handleSend}
                                disabled={isDispatching}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-500/20 text-xs transition-all active:scale-[0.98] gap-2 h-12"
                            >
                                {isDispatching ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Dispatch Broadcast Announcement</>}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Info & Guidelines Sidebar */}
                <div className="space-y-6">
                    <Card className="border border-white/60 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[2.5rem] p-6 space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" /> Communication Guidelines
                        </h3>
                        <div className="space-y-3 text-xs text-slate-600 font-medium leading-relaxed">
                            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                <p>Queue handles batch delivery in the background without freezing your screen.</p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <p>Email notifications automatically format in branded portal templates.</p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p>Target filters are dynamically restricted based on your role privileges.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Broadcast History & Audit Log Card */}
            <Card className="border border-white/60 shadow-xl bg-white/80 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-600" /> Institutional Broadcast History & Audit Log
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={fetchHistory}
                            variant="outline"
                            className="rounded-xl border-slate-200 text-xs font-bold gap-1.5 h-9"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </Button>
                        <Button
                            onClick={handleClearAll}
                            variant="destructive"
                            className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-rose-600 hover:bg-rose-700"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Clear History
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {loadingHistory ? (
                        <div className="py-12 text-center text-slate-400 space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                            <p className="text-xs font-bold uppercase tracking-wider">Loading broadcast records...</p>
                        </div>
                    ) : broadcasts.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                            <Megaphone className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-sm font-bold text-slate-600">No broadcast announcements recorded yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                                        <th className="pb-3 px-2">Sender</th>
                                        <th className="pb-3 px-2">Title / Subject</th>
                                        <th className="pb-3 px-2">Target Audience</th>
                                        <th className="pb-3 px-2">Channel</th>
                                        <th className="pb-3 px-2">Recipients</th>
                                        <th className="pb-3 px-2">Status</th>
                                        <th className="pb-3 px-2">Date</th>
                                        <th className="pb-3 px-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {broadcasts.map(b => (
                                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-2 font-bold text-slate-800">
                                                <div>{b.senderName || "System Admin"}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{b.senderRole || b.criteria?.senderRole || "admin"}</div>
                                            </td>
                                            <td className="py-4 px-2 font-bold text-slate-800 max-w-xs truncate">
                                                {b.title}
                                            </td>
                                            <td className="py-4 px-2 font-semibold text-slate-600 capitalize">
                                                {b.criteria?.type || "All"}
                                            </td>
                                            <td className="py-4 px-2 font-bold text-slate-700 uppercase">
                                                {b.channel}
                                            </td>
                                            <td className="py-4 px-2 font-black text-indigo-600">
                                                {b.totalRecipients || 0}
                                            </td>
                                            <td className="py-4 px-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    b.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                                    b.status === "processing" ? "bg-blue-100 text-blue-700" :
                                                    b.status === "failed" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                                                }`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-2 font-medium text-slate-500">
                                                {b.createdAt ? format(new Date(b.createdAt), "MMM d, yyyy HH:mm") : "—"}
                                            </td>
                                            <td className="py-4 px-2 text-right">
                                                <Button
                                                    onClick={() => handleDeleteSingle(b.id)}
                                                    variant="ghost"
                                                    className="w-8 h-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
