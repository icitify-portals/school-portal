"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp,
    Target,
    Users,
    Star,
    CheckCircle,
    Plus,
    Loader2,
    Search,
    UserPlus,
    Award,
    Layout
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    getKPIs,
    createKPI,
    initiateAppraisal,
    getStaffReviews,
    submitReview
} from "@/actions/hr_performance";
import { getStaffProfiles } from "@/actions/hr";
import { cn } from "@/lib/utils";

export default function AdminPerformancePage() {
    const [kpis, setKpis] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showKPIForm, setShowKPIForm] = useState(false);
    const [showAppraisalModal, setShowAppraisalModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // We need a getStaffProfiles that returns basic info.
        const [kData, rData, sData] = await Promise.all([
            getKPIs(),
            getStaffReviews(),
            getStaffProfiles()
        ]);
        setKpis(kData);
        setReviews(rData);
        setStaff(sData);
        setLoading(false);
    };

    const handleCreateKPI = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const res = await createKPI({
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            weight: parseInt(formData.get("weight") as string) || 1,
            category: formData.get("category") as any,
        });

        if (res.success) {
            setShowKPIForm(false);
            fetchData();
        }
        setIsSubmitting(false);
    };

    const handleInitiate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const res = await initiateAppraisal(
            parseInt(formData.get("staffId") as string),
            new Date().getFullYear(),
            'annual'
        );

        if (res.success) {
            setShowAppraisalModal(false);
            fetchRequests();
        } else {
            alert(res.error);
        }
        setIsSubmitting(false);
    };

    const fetchRequests = async () => {
        const rData = await getStaffReviews();
        setReviews(rData);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-indigo-600" />
                        Institutional Performance
                    </h1>
                    <p className="text-slate-500 font-medium italic">Track educational standards, faculty KPIs, and institutional success</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={() => setShowKPIForm(true)}
                        variant="outline"
                        className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 bg-white border-slate-200"
                    >
                        <Target className="w-4 h-4" />
                        Configure KPIs
                    </Button>
                    <Button
                        onClick={() => setShowAppraisalModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-200 font-black uppercase text-xs tracking-widest gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Start Appraisal
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* KPIs Overview */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden border-t-4 border-indigo-600">
                        <CardHeader className="bg-white">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0">
                            {kpis.map((kpi) => (
                                <div key={kpi.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group">
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{kpi.name}</p>
                                        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter mt-1">{kpi.category}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Award className="w-3 h-3 text-indigo-400" />
                                        <span className="text-xs font-black text-indigo-600">x{kpi.weight}</span>
                                    </div>
                                </div>
                            ))}
                            {kpis.length === 0 && <p className="text-center text-xs text-slate-400 italic py-4">No KPIs configured.</p>}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-slate-900 text-white p-6 relative overflow-hidden">
                        <div className="absolute top-[-20px] right-[-20px] opacity-10">
                            <Star className="w-32 h-32" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Quality Control</h3>
                        <p className="text-sm font-medium leading-relaxed opacity-80 italic">"Institutional excellence begins with precise measurement of teaching and research impact."</p>
                    </Card>
                </div>

                {/* Performance Reviews */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 italic">Active Appraisal Cycles</h3>
                    {loading ? (
                        <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
                    ) : reviews.map((item) => {
                        const { review, staff, staffUser, reviewer } = item;
                        return (
                            <Card key={review.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden border-l-4 border-indigo-500">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black italic">
                                                {staffUser.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 tracking-tight">{staffUser.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{staff.jobTitle}</span>
                                                    <span className="text-[8px] text-slate-300">•</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.year} {review.period}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic",
                                                review.status === 'draft' ? "bg-slate-100 text-slate-500" :
                                                    review.status === 'submitted' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                            )}>
                                                {review.status}
                                            </span>
                                            {review.overallScore && (
                                                <div className="mt-2 flex items-center justify-end gap-1">
                                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                    <span className="text-lg font-black text-slate-900">{review.overallScore}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">/ 5.0</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between text-[10px]">
                                        <div className="flex items-center gap-2">
                                            <Layout className="w-3 h-3 text-slate-400" />
                                            <span className="text-slate-500 font-medium">Reviewer: <span className="font-black text-slate-700 italic">{reviewer.name}</span></span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                                        >
                                            View Report
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {reviews.length === 0 && !loading && (
                        <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Target className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">No active appraisals</p>
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Config Modal */}
            {showKPIForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="bg-emerald-600 text-white rounded-t-2xl">
                            <CardTitle className="text-lg font-black uppercase tracking-[0.1em] italic">KPI Strategic Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <form onSubmit={handleCreateKPI} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Metric Name</label>
                                    <input name="name" required placeholder="e.g. Student Research Engagement" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</label>
                                        <select name="category" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
                                            <option value="teaching">Teaching</option>
                                            <option value="research">Research</option>
                                            <option value="administration">Administration</option>
                                            <option value="general">General</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Relative Weight</label>
                                        <input name="weight" type="number" defaultValue={1} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Definition</label>
                                    <textarea name="description" rows={3} placeholder="How is this measured?" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                                </div>
                                <div className="flex gap-4">
                                    <Button type="button" onClick={() => setShowKPIForm(false)} variant="outline" className="flex-1 py-7 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 py-7 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Metric"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Appraisal Modal */}
            {showAppraisalModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="bg-indigo-900 text-white rounded-t-2xl text-center py-10">
                            <CardTitle className="text-2xl font-black uppercase tracking-widest italic">Initialize Appraisal</CardTitle>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Annual Evaluation Cycle</p>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <form onSubmit={handleInitiate} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Staff Member</label>
                                    <select name="staffId" required className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
                                        {staff.map((s) => (
                                            <option key={s.staff.id} value={s.staff.id}>{s.user.name} ({s.staff.staffId})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-4">
                                    <Button type="button" onClick={() => setShowAppraisalModal(false)} variant="ghost" className="flex-1 py-7 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600">Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 py-7 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 italic">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize Appraisal"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
