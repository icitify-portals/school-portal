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

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>;

    if (!eligibility?.isEligible) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase italic">Not Eligible</h2>
                    <p className="text-slate-500 font-medium max-w-md mx-auto">
                        {eligibility?.message || "Your current programme or semester does not qualify for Industrial Training at this time."}
                    </p>
                    <Button variant="outline" className="rounded-2xl border-slate-200 font-black uppercase tracking-widest text-[10px]">Contact SIWES Unit</Button>
                </Card>
            </div>
        );
    }

    const currentPlacement = placements[0];

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
                        <Briefcase className="w-10 h-10 text-indigo-600" />
                        SIWES Portal
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage your Industrial Training and Weekly Logbooks</p>
                </div>
                {currentPlacement && (
                    <Badge className="bg-emerald-50 text-emerald-600 border-none px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] shadow-sm italic">
                        Status: {currentPlacement.status}
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={cn(
                            "w-full p-6 rounded-2xl text-left transition-all flex items-center gap-4 group",
                            activeTab === 'overview' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-white text-slate-400 hover:bg-slate-50"
                        )}
                    >
                        <FileText className={cn("w-6 h-6", activeTab === 'overview' ? "text-white" : "text-slate-300 group-hover:text-indigo-400")} />
                        <span className="font-black uppercase italic tracking-tight text-sm">Overview</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('apply')}
                        className={cn(
                            "w-full p-6 rounded-2xl text-left transition-all flex items-center gap-4 group",
                            activeTab === 'apply' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-white text-slate-400 hover:bg-slate-50"
                        )}
                    >
                        <Building2 className={cn("w-6 h-6", activeTab === 'apply' ? "text-white" : "text-slate-300 group-hover:text-indigo-400")} />
                        <span className="font-black uppercase italic tracking-tight text-sm">Find Placement</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('logbook')}
                        disabled={!currentPlacement || currentPlacement.status === 'applied'}
                        className={cn(
                            "w-full p-6 rounded-2xl text-left transition-all flex items-center gap-4 group",
                            activeTab === 'logbook' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-white text-slate-400 hover:bg-slate-50",
                            (!currentPlacement || currentPlacement.status === 'applied') && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Clock className={cn("w-6 h-6", activeTab === 'logbook' ? "text-white" : "text-slate-300 group-hover:text-indigo-400")} />
                        <span className="font-black uppercase italic tracking-tight text-sm">Weekly Logbook</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {!currentPlacement ? (
                                <Card className="border-none shadow-2xl rounded-[3rem] bg-indigo-600 p-12 text-white relative overflow-hidden group">
                                    <div className="relative z-10 space-y-6">
                                        <h2 className="text-4xl font-black uppercase italic leading-tight">Ready to start your <br />Industrial Training?</h2>
                                        <p className="text-indigo-100 font-medium max-w-md">Find an approved organization, download your application letter, and begin your journey.</p>
                                        <Button
                                            onClick={() => setActiveTab('apply')}
                                            className="bg-white text-indigo-600 hover:bg-black hover:text-white px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3"
                                        >
                                            Get Started <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <Briefcase className="absolute -right-20 -bottom-20 w-80 h-80 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                                </Card>
                            ) : (
                                <div className="space-y-6">
                                    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <Building2 className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-800 uppercase italic">{currentPlacement.company?.name}</h3>
                                                    <p className="text-sm text-slate-400 font-bold uppercase">{currentPlacement.company?.address}</p>
                                                </div>
                                            </div>
                                            <Badge className="rounded-xl px-4 py-2 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest">{currentPlacement.status}</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</p>
                                                <p className="text-sm font-black text-slate-700 uppercase italic">{currentPlacement.startDate ? new Date(currentPlacement.startDate).toLocaleDateString() : 'Pending'}</p>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</p>
                                                <p className="text-sm font-black text-slate-700 uppercase italic">{currentPlacement.endDate ? new Date(currentPlacement.endDate).toLocaleDateString() : 'Pending'}</p>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weeks Covered</p>
                                                <p className="text-sm font-black text-slate-700 uppercase italic">{currentPlacement.logbooks?.length || 0} / {eligibility.config.durationMonths * 4}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-50">
                                            <Button variant="outline" className="rounded-2xl border-slate-200 h-14 px-8 font-black uppercase text-[11px] tracking-widest flex items-center gap-3">
                                                <Download className="w-5 h-5" /> Download Letter
                                            </Button>
                                            {currentPlacement.status === 'applied' && (
                                                <Button
                                                    onClick={() => {
                                                        const url = prompt("Enter Acceptance Letter URL (Simulation):");
                                                        if (url) uploadAcceptanceLetter(currentPlacement.id, url).then(fetchData);
                                                    }}
                                                    className="bg-emerald-600 hover:bg-black text-white h-14 px-8 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3"
                                                >
                                                    <Upload className="w-5 h-5" /> Upload Acceptance
                                                </Button>
                                            )}
                                        </div>
                                    </Card>

                                    <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-900 p-8 text-white relative overflow-hidden">
                                        <div className="relative z-10 flex justify-between items-center">
                                            <div>
                                                <h4 className="text-lg font-black uppercase italic mb-1">Download Resources</h4>
                                                <p className="text-indigo-200 text-xs font-medium">Get your official logbook template and guidelines.</p>
                                            </div>
                                            <Button className="bg-white text-indigo-900 hover:bg-indigo-100 px-6 rounded-xl font-black uppercase text-[10px]">
                                                Official Logbook
                                            </Button>
                                        </div>
                                        <Download className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
                                    </Card>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'apply' && (
                        <div className="space-y-6">
                            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Available Companies</h3>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input className="pl-10 rounded-2xl border-slate-100 bg-slate-50 h-10 text-xs" placeholder="Search organization..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {companies.map((c) => (
                                        <div key={c.id} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all flex flex-col justify-between group">
                                            <div>
                                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-lg font-black text-slate-800 uppercase italic mb-2 tracking-tight">{c.name}</h4>
                                                <p className="text-xs text-slate-400 font-bold uppercase leading-relaxed mb-8">{c.address}</p>
                                            </div>
                                            <Button
                                                onClick={() => applyToCompany(student.id, c.id).then(r => { if (r.success) { fetchData(); setActiveTab('overview'); toast.success("Application sent!"); } else toast.error(r.error); })}
                                                className="w-full bg-white text-slate-900 hover:bg-indigo-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 transition-all border border-slate-200"
                                            >
                                                Apply Here
                                            </Button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const name = prompt("Organization Name:");
                                            const addr = prompt("Address:");
                                            if (name && addr) requestCompany({ name, address: addr, addedById: parseInt(session?.user?.id!) }).then(() => toast.success("Request submitted!"));
                                        }}
                                        className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-100 hover:border-indigo-200 transition-all flex flex-col items-center justify-center gap-4 group"
                                    >
                                        <Plus className="w-12 h-12 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600">Add New Organization</span>
                                    </button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'logbook' && currentPlacement && (
                        <div className="space-y-6">
                            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Weekly Activities</h3>
                                    <Button
                                        onClick={() => {
                                            const activities = prompt("Describe your activities for this week:");
                                            if (activities) submitLogbook({ placementId: currentPlacement.id, weekNumber: (currentPlacement.logbooks?.length || 0) + 1, activities }).then(fetchData);
                                        }}
                                        className="bg-indigo-600 hover:bg-black text-white px-8 h-12 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> New Entry
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {currentPlacement.logbooks?.map((l: any) => (
                                        <div key={l.id} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-black italic">W{l.weekNumber}</div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted Date</p>
                                                        <p className="text-xs font-black text-slate-700 uppercase italic">{new Date(l.submittedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <Badge className={cn(
                                                    "rounded-xl px-4 py-2 font-black uppercase text-[9px] tracking-widest italic",
                                                    l.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                                                        l.status === 'flagged' ? "bg-rose-50 text-rose-600" :
                                                            "bg-amber-50 text-amber-600"
                                                )}>
                                                    {l.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed bg-white/50 p-6 rounded-2xl border border-slate-100 italic">
                                                "{l.activities}"
                                            </p>
                                            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" className="rounded-xl text-indigo-600 font-black uppercase text-[9px] hover:bg-indigo-50">View Document</Button>
                                                    <Button variant="ghost" size="sm" className="rounded-xl text-slate-400 font-black uppercase text-[9px]">Edit Entry</Button>
                                                </div>
                                                <CheckCircle2 className={cn("w-6 h-6", l.status === 'approved' ? "text-emerald-500" : "text-slate-100")} />
                                            </div>
                                        </div>
                                    ))}
                                    {(!currentPlacement.logbooks || currentPlacement.logbooks.length === 0) && (
                                        <div className="p-20 text-center space-y-4">
                                            <Clock className="w-16 h-16 text-slate-100 mx-auto" />
                                            <p className="text-slate-400 font-black uppercase italic text-xs">No logbook entries submitted yet</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
