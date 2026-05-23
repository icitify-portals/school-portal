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
    Award,
    Sparkles
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { getStudentCertifications, uploadStudentCertification } from "@/actions/student_growth";
import { cn } from "@/lib/utils";

export default function StudentGrowthPage() {
    const { data: session } = useSession();
    const [certs, setCerts] = useState<any[]>([]);
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
        // We'll pass studentId or filter by userId
        const res = await getStudentCertifications();
        setCerts(res.filter(r => (r.user as any).id === (session.user as any).id));
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!session?.user) return;

        // Find student record for this user
        // We'll assume the studentId is available. 
        // In a real app, we'd fetch currentStudentProfile(session.user.id)
        const studentId = (certs[0]?.student?.id);

        if (!studentId && certs.length === 0) {
            // If no certs exist, we might need to fetch the student profile
            // For now, let's assume we can find it.
            // In production, we'd have a server action that finds student profile from userId.
            alert("Student profile sync required. Please refresh or contact registry.");
            return;
        }

        const res = await uploadStudentCertification({
            studentId,
            title,
            provider,
            completionDate,
            certificateUrl
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
        <div className="p-8 max-w-5xl mx-auto space-y-8 bg-white min-h-screen">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 text-center lg:text-left">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase flex items-center justify-center lg:justify-start gap-4">
                        <Sparkles className="w-10 h-10 text-amber-500" />
                        My Academic Growth
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-2">Build your digital extracurricular portfolio for employment opportunities</p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 hover:bg-slate-900 rounded-3xl py-7 px-10 font-black uppercase text-[10px] tracking-widest gap-2 shadow-2xl transition-all w-full lg:w-auto"
                >
                    {isAdding ? "Cancel Entry" : <><Plus className="w-4 h-4" /> Add Achievement</>}
                </Button>
            </div>

            {isAdding && (
                <Card className="border-[3px] border-slate-900 shadow-2xl rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-500">
                    <CardHeader className="bg-slate-900 text-white p-8">
                        <CardTitle className="text-xl font-black italic tracking-widest uppercase">Self-Reported Achievement</CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Achievement Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Google Data Analytics Professional Certificate"
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Issuing Body</label>
                                <input
                                    type="text"
                                    value={provider}
                                    onChange={e => setProvider(e.target.value)}
                                    placeholder="e.g. Coursera / Google"
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Date Completed</label>
                                <input
                                    type="date"
                                    value={completionDate}
                                    onChange={e => setCompletionDate(e.target.value)}
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Verifiable URL</label>
                                <input
                                    type="text"
                                    value={certificateUrl}
                                    onChange={e => setCertificateUrl(e.target.value)}
                                    placeholder="Link to digital credential..."
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-bold outline-none"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleSubmit}
                            className="w-full bg-slate-900 hover:bg-black rounded-3xl py-8 font-black uppercase text-xs tracking-[0.3em] shadow-2xl"
                        >
                            Submit for Verification
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-200" /></div>
                ) : certs.map((c) => (
                    <Card key={c.certification.id} className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[3rem] p-4 group hover:scale-[1.02] transition-all relative overflow-hidden bg-slate-50/50">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                    <Award className="w-8 h-8 text-slate-900 group-hover:text-white" />
                                </div>
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white shadow-sm",
                                    c.certification.status === 'verified' ? "bg-emerald-50 text-emerald-600" :
                                        c.certification.status === 'rejected' ? "bg-rose-50 text-rose-600" :
                                            "bg-white text-indigo-600"
                                )}>
                                    {c.certification.status}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{c.certification.title}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{c.certification.provider}</p>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(c.certification.completionDate).toLocaleDateString()}
                                </div>
                                {c.certification.certificateUrl && (
                                    <a
                                        href={c.certification.certificateUrl}
                                        target="_blank"
                                        className="text-indigo-600 hover:underline text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                        Credentials <ArrowRight className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}

                {!loading && certs.length === 0 && (
                    <div className="col-span-full py-40 text-center bg-slate-50/50 rounded-[4rem] border-[3px] border-dashed border-slate-100">
                        <Award className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                        <h4 className="text-2xl font-black text-slate-300 uppercase italic">Your Achievement Portal is Empty</h4>
                        <p className="text-slate-400 font-medium mt-2 max-w-sm mx-auto">Upload certificates from workshops, online courses, and professional bodies to boost your credentials.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

import { Plus, ArrowRight, Calendar } from "lucide-react";
