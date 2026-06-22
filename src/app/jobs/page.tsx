"use client";

import { useState, useEffect } from "react";
import {
    Briefcase,
    GraduationCap,
    MapPin,
    Clock,
    ChevronRight,
    Search,
    Loader2,
    Send,
    CheckCircle,
    Building2,
    X,
    FileUp
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getJobVacancies, submitApplication } from "@/actions/hr_recruitment";
import { cn } from "@/lib/utils";

export default function PublicJobBoardPage() {
    const [vacancies, setVacancies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getJobVacancies();
        setVacancies(data.filter(v => v.vacancy.status === 'open'));
        setLoading(false);
    };

    const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsApplying(true);
        const formData = new FormData(e.currentTarget);

        const res = await submitApplication({
            vacancyId: selectedJob.vacancy.id,
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            resumeUrl: "https://demo-resume-path.pdf" // In real world, we'd upload file first
        });

        if (res.success) {
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setSelectedJob(null);
            }, 3000);
        } else {
            alert(res.error);
        }
        setIsApplying(false);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-20 px-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <Building2 className="w-96 h-96 absolute -bottom-10 -right-10" />
                    <GraduationCap className="w-64 h-64 absolute -top-10 -left-10" />
                </div>
                <div className="max-w-[1600px] w-full mx-auto text-center relative z-10">
                    <h1 className="text-5xl font-black tracking-tight mb-6 italic">Join Our Institutional Legacy</h1>
                    <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">Explore vacancies across faculties and administrative departments. Help us shape the future of education.</p>
                </div>
            </div>

            {/* List Section */}
            <div className="max-w-[1600px] w-full mx-auto py-16 px-4">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic border-l-4 border-indigo-600 pl-4">Open Positions</h2>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input placeholder="Search careers..." className="bg-transparent outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {vacancies.map((item) => (
                            <Card key={item.vacancy.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row items-center">
                                        <div className="p-8 flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest">{item.department?.name || 'Institutional'}</span>
                                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                    <Clock className="w-3 h-3" />
                                                    Full Time
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 mb-2 leading-none group-hover:text-indigo-600 transition-colors">{item.vacancy.title}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 italic">"{item.vacancy.description}"</p>
                                        </div>
                                        <div className="p-8 bg-slate-50/50 md:w-48 flex flex-col justify-center border-l border-slate-100 group-hover:bg-slate-900 transition-all">
                                            <Button
                                                onClick={() => setSelectedJob(item)}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-lg font-black uppercase text-[10px] tracking-widest h-10 group-hover:bg-white group-hover:text-slate-900"
                                            >
                                                Apply Now
                                                <ChevronRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {vacancies.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active vacancies at this time.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Application Modal */}
            {selectedJob && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl border-none shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {submitted ? (
                            <div className="p-20 text-center animate-in fade-in duration-500">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 mb-2">Application Received!</h2>
                                <p className="text-slate-500 font-medium">Our recruitment team will review your profile for the <span className="text-indigo-600 font-bold">{selectedJob.vacancy.title}</span> position.</p>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => setSelectedJob(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-20">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                                    {/* Left: Info */}
                                    <div className="md:col-span-2 bg-slate-900 text-white p-8 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-4 block">Vacancy Details</span>
                                            <h3 className="text-2xl font-black tracking-tight mb-4 leading-tight italic">{selectedJob.vacancy.title}</h3>
                                            <div className="space-y-4 text-xs font-medium text-slate-400 italic">
                                                <p>"{selectedJob.vacancy.description}"</p>
                                                <div className="pt-4 border-t border-slate-800">
                                                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Requirements</p>
                                                    <p className="text-slate-300">{selectedJob.vacancy.requirements || 'Standard institutional qualifications apply.'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-8">
                                            <Building2 className="w-10 h-10 text-indigo-500 opacity-30" />
                                        </div>
                                    </div>
                                    {/* Right: Form */}
                                    <div className="md:col-span-3 p-8 bg-white">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Submit Application</h4>
                                        <form onSubmit={handleApply} className="space-y-6">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                                                <input name="name" required className="w-full p-3 border-b-2 border-slate-100 outline-none focus:border-indigo-600 text-sm font-bold bg-transparent" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                                                <input name="email" type="email" required className="w-full p-3 border-b-2 border-slate-100 outline-none focus:border-indigo-600 text-sm font-bold bg-transparent" />
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                                <FileUp className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attach Resume / CV</p>
                                                <span className="text-[8px] text-slate-300 italic">PDF or DOCX max 5MB (Simulated)</span>
                                            </div>
                                            <Button
                                                disabled={isApplying}
                                                className="w-full bg-slate-900 hover:bg-black py-7 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-slate-200"
                                            >
                                                {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initiate Application"}
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
