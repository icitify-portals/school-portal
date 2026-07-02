"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Briefcase,
    Building2,
    FileText,
    CheckCircle2,
    Clock,
    Upload,
    Download,
    Plus,
    Loader2,
    AlertCircle,
    ArrowRight,
    Search
} from "lucide-react";
import {
    getSiwesEligibility,
    getSiwesCompanies,
    getStudentPlacements,
    applyToCompany,
    uploadAcceptanceLetter,
    submitLogbook,
    requestCompany
} from "@/actions/siwes";
import { getStudentByUserId } from "@/actions/students";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StudentSiwesPortal() {
    const { data: session } = useSession();
    const [student, setStudent] = useState<any>(null);
    const [eligibility, setEligibility] = useState<any>(null);
    const [companies, setCompanies] = useState<any[]>([]);
    const [placements, setPlacements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'apply' | 'logbook'>('overview');

    const fetchData = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        const studentData = await getStudentByUserId(parseInt(session.user.id));
        if (studentData) {
            setStudent(studentData);
            const [eligRes, compRes, placRes] = await Promise.all([
                getSiwesEligibility(studentData.id),
                getSiwesCompanies(),
                getStudentPlacements(studentData.id)
            ]);

            if (eligRes.success && eligRes.isEligible !== undefined) setEligibility(eligRes);
            if (compRes.success && compRes.data) setCompanies(compRes.data);
            if (placRes.success && placRes.data) setPlacements(placRes.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [session?.user?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)]" />
                <div className="relative z-10 w-full max-w-md p-8 border border-white/10 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center space-y-6">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                    <p className="text-sm text-slate-400 font-medium animate-pulse">Loading SIWES portal datasets...</p>
                </div>
            </div>
        );
    }

    if (!eligibility?.isEligible) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.15),transparent_70%)]" />
                <div className="relative z-10 w-full max-w-lg p-8 border border-white/10 bg-white/5 backdrop-blur-2xl rounded-[3rem] shadow-2xl flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-450 border border-rose-500/20">
                        <AlertCircle className="w-10 h-10 animate-bounce" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-100 uppercase italic tracking-wide">Not Eligible</h2>
                        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                            {eligibility?.message || "Your current programme or semester does not qualify for Industrial Training at this time."}
                        </p>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] py-6 px-8 active:scale-95 transition-all">
                        Contact SIWES Unit
                    </Button>
                </div>
            </div>
        );
    }

    const currentPlacement = placements[0];

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
            <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-indigo-650/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <Briefcase className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                                SIWES Portal
                            </h2>
                        </div>
                        <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                            Manage your Industrial Training and Weekly Logbooks
                        </p>
                    </div>
                    {currentPlacement && (
                        <div className="relative z-10 flex gap-3 shrink-0">
                            <Badge className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-sm italic">
                                Status: {currentPlacement.status}
                            </Badge>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={cn(
                                "w-full p-6 rounded-2xl text-left transition-all flex items-center gap-4 group active:scale-[0.98]",
                                activeTab === 'overview'
                                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200/50"
                                    : "bg-white/60 backdrop-blur-3xl border border-white/40 shadow-md text-slate-400 hover:bg-slate-50"
                            )}
                        >
                            <FileText className={cn("w-6 h-6", activeTab === 'overview' ? "text-white" : "text-slate-400 group-hover:text-indigo-600")} />
                            <span className="font-black uppercase italic tracking-tight text-sm">Overview</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('apply')}
                            className={cn(
                                "w-full p-6 rounded-2xl text-left transition-all flex items-center gap-4 group active:scale-[0.98]",
                                activeTab === 'apply'
                                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200/50"
                                    : "bg-white/60 backdrop-blur-3xl border border-white/40 shadow-md text-slate-400 hover:bg-slate-50"
                            )}
                        >
                            <Building2 className={cn("w-6 h-6", activeTab === 'apply' ? "text-white" : "text-slate-400 group-hover:text-indigo-600")} />
                            <span className="font-black uppercase italic tracking-tight text-sm">Find Placement</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('logbook')}
                            disabled={!currentPlacement || currentPlacement.status === 'applied'}
                            className={cn(
                                "w-full p-6 rounded-2xl text-left transition-all flex items-center gap-4 group active:scale-[0.98]",
                                activeTab === 'logbook'
                                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200/50"
                                    : "bg-white/60 backdrop-blur-3xl border border-white/40 shadow-md text-slate-400 hover:bg-slate-50",
                                (!currentPlacement || currentPlacement.status === 'applied') && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Clock className={cn("w-6 h-6", activeTab === 'logbook' ? "text-white" : "text-slate-400 group-hover:text-indigo-600")} />
                            <span className="font-black uppercase italic tracking-tight text-sm">Weekly Logbook</span>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {!currentPlacement ? (
                                    <Card className="border border-indigo-500/20 shadow-2xl rounded-[3rem] bg-indigo-600 p-12 text-white relative overflow-hidden group">
                                        <div className="relative z-10 space-y-6">
                                            <h2 className="text-4xl font-black uppercase italic leading-tight">Ready to start your <br />Industrial Training?</h2>
                                            <p className="text-indigo-150 font-medium max-w-md">Find an approved organization, download your application letter, and begin your journey.</p>
                                            <Button
                                                onClick={() => setActiveTab('apply')}
                                                className="bg-white text-indigo-600 hover:bg-black hover:text-white px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 active:scale-95 shadow-md"
                                            >
                                                Get Started <ArrowRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                        <Briefcase className="absolute -right-20 -bottom-20 w-80 h-80 text-white/10 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                                    </Card>
                                ) : (
                                    <div className="space-y-6">
                                        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-8">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                                                        <Building2 className="w-10 h-10" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black text-slate-800 uppercase italic leading-none mb-1.5">{currentPlacement.company?.name}</h3>
                                                        <p className="text-xs text-slate-400 font-black uppercase tracking-wider">{currentPlacement.company?.address}</p>
                                                    </div>
                                                </div>
                                                <Badge className="rounded-xl px-4 py-2 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest">{currentPlacement.status}</Badge>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</p>
                                                    <p className="text-sm font-black text-slate-700 uppercase italic font-mono">{currentPlacement.startDate ? new Date(currentPlacement.startDate).toLocaleDateString() : 'Pending'}</p>
                                                </div>
                                                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</p>
                                                    <p className="text-sm font-black text-slate-700 uppercase italic font-mono">{currentPlacement.endDate ? new Date(currentPlacement.endDate).toLocaleDateString() : 'Pending'}</p>
                                                </div>
                                                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weeks Covered</p>
                                                    <p className="text-sm font-black text-slate-700 uppercase italic font-mono">{currentPlacement.logbooks?.length || 0} / {eligibility.config.durationMonths * 4}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-4 pt-8 border-t border-white/40">
                                                <Button variant="outline" className="rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border-slate-200 h-14 px-8 font-black uppercase text-[11px] tracking-widest flex items-center gap-3 active:scale-95 shadow-sm" asChild>
                                                    <a href={currentPlacement.acceptanceLetterUrl || "#"} target="_blank" rel="noreferrer">
                                                        <Download className="w-5 h-5 text-slate-450" /> Download Letter
                                                    </a>
                                                </Button>
                                                {currentPlacement.status === 'applied' && (
                                                    <Button
                                                        onClick={() => {
                                                            const url = prompt("Enter Acceptance Letter URL (Simulation):");
                                                            if (url) uploadAcceptanceLetter(currentPlacement.id, url).then(fetchData);
                                                        }}
                                                        className="bg-emerald-650 hover:bg-emerald-700 text-white h-14 px-8 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 active:scale-95 shadow-md"
                                                    >
                                                        <Upload className="w-5 h-5" /> Upload Acceptance
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>

                                        <Card className="border border-white/10 shadow-xl bg-indigo-900 p-8 text-white relative overflow-hidden rounded-[2.5rem]">
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-800/50 to-purple-800/50 opacity-40" />
                                            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div>
                                                    <h4 className="text-lg font-black uppercase italic mb-1">Download Resources</h4>
                                                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Get your official logbook template and guidelines.</p>
                                                </div>
                                                <Button className="bg-white text-indigo-900 hover:bg-indigo-100 px-6 py-6 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-md">
                                                    Official Logbook
                                                </Button>
                                            </div>
                                            <Download className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 pointer-events-none" />
                                        </Card>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'apply' && (
                            <div className="space-y-6">
                                <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-10">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight leading-none">Available Companies</h3>
                                        <div className="relative w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input className="pl-10 rounded-2xl border-slate-200 bg-white h-10 text-xs font-bold" placeholder="Search organization..." />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {companies.map((c) => (
                                            <Card key={c.id} className="p-8 rounded-[2.5rem] bg-white border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between group shadow-sm">
                                                <div>
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/50 shadow-inner flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                                                        <Building2 className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="text-lg font-black text-slate-800 uppercase italic mb-2 tracking-tight">{c.name}</h4>
                                                    <p className="text-xs text-slate-455 font-bold uppercase leading-relaxed mb-8">{c.address}</p>
                                                </div>
                                                <Button
                                                    onClick={() => applyToCompany(student.id, c.id).then(r => { if (r.success) { fetchData(); setActiveTab('overview'); toast.success("Application sent!"); } else toast.error(r.error); })}
                                                    className="w-full bg-white text-slate-900 hover:bg-indigo-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 transition-all border border-slate-200 shadow-sm active:scale-95"
                                                >
                                                    Apply Here
                                                </Button>
                                            </Card>
                                        ))}
                                        <button
                                            onClick={() => {
                                                const name = prompt("Organization Name:");
                                                const addr = prompt("Address:");
                                                if (name && addr) requestCompany({ name, address: addr, addedById: parseInt(session?.user?.id!) }).then(() => toast.success("Request submitted!"));
                                            }}
                                            className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/40 hover:border-indigo-300 transition-all flex flex-col items-center justify-center gap-4 group active:scale-[0.98] min-h-[220px]"
                                        >
                                            <Plus className="w-12 h-12 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                            <span className="text-xs font-black text-slate-450 uppercase tracking-widest group-hover:text-slate-650">Add New Organization</span>
                                        </button>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'logbook' && currentPlacement && (
                            <div className="space-y-6">
                                <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-10">
                                    <div className="flex justify-between items-center mb-10">
                                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight leading-none">Weekly Activities</h3>
                                        <Button
                                            onClick={() => {
                                                const activities = prompt("Describe your activities for this week:");
                                                if (activities) submitLogbook({ placementId: currentPlacement.id, weekNumber: (currentPlacement.logbooks?.length || 0) + 1, activities }).then(fetchData);
                                            }}
                                            className="bg-indigo-650 hover:bg-indigo-700 text-white px-6 py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 active:scale-95 shadow-md"
                                        >
                                            <Plus className="w-4 h-4" /> New Entry
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {currentPlacement.logbooks?.map((l: any) => (
                                            <Card key={l.id} className="p-8 rounded-[2.5rem] bg-white border border-slate-200 group hover:border-indigo-300 transition-all shadow-sm">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center text-indigo-600 font-black italic">W{l.weekNumber}</div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted Date</p>
                                                            <p className="text-xs font-black text-slate-700 uppercase italic font-mono">{new Date(l.submittedAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn(
                                                        "rounded-xl px-4 py-2 font-black uppercase text-[9px] tracking-widest italic border",
                                                        l.status === 'approved' ? "bg-emerald-50 border-emerald-250 text-emerald-600 shadow-sm" :
                                                            l.status === 'flagged' ? "bg-rose-50 border-rose-250 text-rose-600 shadow-sm" :
                                                                "bg-amber-50 border-amber-250 text-amber-600 shadow-sm"
                                                    )}>
                                                        {l.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-650 font-medium leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100 italic">
                                                    "{l.activities}"
                                                </p>
                                                <div className="mt-6 pt-6 border-t border-slate-200/60 flex justify-between items-center">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" className="rounded-xl text-indigo-650 font-black uppercase text-[9px] hover:bg-indigo-50">View Document</Button>
                                                        <Button variant="ghost" size="sm" className="rounded-xl text-slate-400 font-black uppercase text-[9px]">Edit Entry</Button>
                                                    </div>
                                                    <CheckCircle2 className={cn("w-6 h-6", l.status === 'approved' ? "text-emerald-500 animate-pulse" : "text-slate-100")} />
                                                </div>
                                            </Card>
                                        ))}
                                        {(!currentPlacement.logbooks || currentPlacement.logbooks.length === 0) && (
                                            <div className="p-20 text-center space-y-4">
                                                <Clock className="w-16 h-16 text-slate-200 mx-auto" />
                                                <p className="text-slate-400 font-black uppercase italic text-xs tracking-wider">No logbook entries submitted yet</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
