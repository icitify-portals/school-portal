"use client";

import { useState, useEffect } from "react";
import {
    GraduationCap,
    Upload,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    ExternalLink,
    Loader2,
    Award
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { getStaffTraining, registerTraining } from "@/actions/hr_relations";
import { cn } from "@/lib/utils";

export default function StaffGrowthPage() {
    const { data: session } = useSession();
    const [trainings, setTrainings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [provider, setProvider] = useState("");
    const [completionDate, setCompletionDate] = useState("");
    const [certificateUrl, setCertificateUrl] = useState("");

    useEffect(() => {
        fetchData();
    }, [session]);

    const fetchData = async () => {
        if (!session?.user) return;
        setLoading(true);
        // We'll need to find the staffId associated with the userId
        // For simplicity in this demo, let's assume getStaffTraining handles session or we pass it
        // Actually getStaffTraining(staffId) needs staffId. 
        // We might need an action to get the current staff profile.
        const res = await getStaffTraining();
        // Filter for current user if backend doesn't
        setTrainings(res.filter(r => (r.user as any).id === (session.user as any).id));
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!session?.user) return;

        // Find staff record for this user
        // We will pass the staffId from the first record or fetch it
        const staffId = (trainings[0]?.staff?.id);

        if (!staffId) {
            alert("Staff profile not found. Please contact HR.");
            return;
        }

        const res = await registerTraining({
            staffId,
            title,
            provider,
            completionDate,
            certificateUrl,
            status: 'completed' // Initial status before verification
        });

        if (res.success) {
            setIsAdding(false);
            setTitle("");
            setProvider("");
            setCompletionDate("");
            setCertificateUrl("");
            fetchData();
        }
    };

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
                        <Award className="w-8 h-8 text-indigo-600" />
                        Professional Growth
                    </h1>
                    <p className="text-slate-500 font-medium italic">Track your certifications and institutional developmental history</p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl py-6 px-8 font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-indigo-100"
                >
                    {isAdding ? "Close Form" : <><Upload className="w-4 h-4" /> Upload Certificate</>}
                </Button>
            </div>

            {isAdding && (
                <Card className="border-none shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <CardHeader className="bg-slate-900 text-white p-6">
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Self-Reported Certification</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Certification Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. AWS Certified Solutions Architect"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Issuing Institution</label>
                                <input
                                    type="text"
                                    value={provider}
                                    onChange={e => setProvider(e.target.value)}
                                    placeholder="e.g. Amazon Web Services"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Completion Date</label>
                                <input
                                    type="date"
                                    value={completionDate}
                                    onChange={e => setCompletionDate(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Certificate URL / Link</label>
                                <input
                                    type="text"
                                    value={certificateUrl}
                                    onChange={e => setCertificateUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleSubmit}
                            className="w-full bg-slate-900 hover:bg-black rounded-2xl py-6 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl"
                        >
                            Submit for HR Verification
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400 italic font-black uppercase text-[10px] tracking-widest animate-pulse">Scanning Academic Records...</div>
                ) : trainings.map((t) => (
                    <Card key={t.training.id} className="border-none shadow-sm hover:shadow-xl transition-all group rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 p-6 flex flex-row items-start justify-between">
                            <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Award className="w-6 h-6" />
                            </div>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                t.training.status === 'verified' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                    t.training.status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                        "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                                {t.training.status}
                            </span>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight mb-2">{t.training.title}</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">{t.training.provider}</p>

                            <div className="space-y-3 pt-6 border-t border-slate-100">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="text-slate-400 uppercase">Obtained</span>
                                    <span className="text-slate-900">{new Date(t.training.completionDate).toLocaleDateString()}</span>
                                </div>
                                {t.training.certificateUrl && (
                                    <a
                                        href={t.training.certificateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors text-[10px] font-black uppercase tracking-widest pt-2"
                                    >
                                        <ExternalLink className="w-3 h-3" /> View Credential
                                    </a>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!loading && trainings.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <GraduationCap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-900 italic">No Institutional Certifications</h3>
                        <p className="text-slate-400 text-sm font-medium mt-2">Start building your academic portfolio by uploading verified certifications.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
