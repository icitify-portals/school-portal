"use client";

import { useState, useEffect } from "react";
import { getAdmissionTemplates } from "@/actions/admission_v2";
import { 
    School, 
    BookOpen, 
    GraduationCap, 
    ArrowRight, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    ChevronRight,
    Search,
    Loader2,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AdmissionLandingPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        const res = await getAdmissionTemplates();
        setTemplates(res);
        setLoading(false);
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden">
            {/* Hero Section */}
            <div className="relative bg-slate-900 pt-32 pb-48 px-8">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2" />
                    <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] translate-y-1/2" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10 text-center space-y-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">2024/2025 Admissions are Open</span>
                    </div>
                    
                    <div className="space-y-4">
                        <h1 className="text-7xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Begin Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Excellence</span> Journey
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm max-w-2xl mx-auto leading-relaxed">
                            Join our community of innovators and leaders. Choose your level and start your application today.
                        </p>
                    </div>

                    <div className="flex justify-center gap-6">
                        <Button className="bg-white text-slate-900 font-black px-10 py-8 rounded-[2rem] shadow-2xl hover:bg-indigo-50 transition-all flex gap-3 uppercase text-xs tracking-widest">
                            How to Apply <ArrowRight className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" className="text-white font-black px-10 py-8 rounded-[2rem] border border-white/10 hover:bg-white/5 uppercase text-xs tracking-widest">
                            Check Status
                        </Button>
                    </div>
                </div>
            </div>

            {/* Template Selection */}
            <div className="max-w-7xl mx-auto px-8 -mt-24 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {templates.length > 0 ? (
                        templates.map((template) => (
                            <AdmissionCard key={template.id} template={template} />
                        ))
                    ) : (
                        <div className="col-span-3 py-32 text-center bg-white rounded-[4rem] shadow-xl border border-slate-100">
                            <h3 className="text-2xl font-black text-slate-300 italic uppercase">No Active Admissions</h3>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Check back soon for new intake cycles.</p>
                        </div>
                    )}
                </div>

                {/* FAQ / Info Section */}
                <div className="mt-40 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-5xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Smart Admission <br /> Technology</h2>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Efficiency at every step of your intake.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <FeatureItem 
                                title="Dynamic Age Verification" 
                                desc="Automated eligibility checks based on your level and date of birth." 
                                icon={<Clock className="w-5 h-5" />}
                            />
                            <FeatureItem 
                                title="Real-time CBT Assessment" 
                                desc="Take your entrance exams securely on our integrated testing platform." 
                                icon={<Sparkles className="w-5 h-5" />}
                            />
                            <FeatureItem 
                                title="Instant Decisioning" 
                                desc="Receive status updates and download admission letters immediately." 
                                icon={<CheckCircle2 className="w-5 h-5" />}
                            />
                        </div>
                    </div>
                    <div className="bg-slate-900 rounded-[4rem] p-12 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <School className="w-64 h-64 text-white" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="w-16 h-16 bg-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Existing Applicants</h3>
                            <p className="text-slate-400 font-bold italic leading-relaxed">Already started? Tracking your application is easy. Use your Application ID to check your status, pay fees, or edit your details.</p>
                            <Link href="/admission/find">
                                <Button className="w-full bg-white text-slate-900 font-black py-8 rounded-[2rem] uppercase text-xs tracking-widest hover:bg-indigo-50 transition-all mt-4">
                                    Track My Application
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-100 py-12 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Universal Admission Portal &copy; 2024</p>
            </div>
        </div>
    );
}

function AdmissionCard({ template }: { template: any }) {
    const icons: any = {
        primary: <School className="w-8 h-8" />,
        secondary: <BookOpen className="w-8 h-8" />,
        tertiary: <GraduationCap className="w-8 h-8" />
    };

    const colors: any = {
        primary: "bg-amber-500",
        secondary: "bg-indigo-600",
        tertiary: "bg-emerald-600"
    };

    return (
        <Card className="group relative bg-white rounded-[3.5rem] shadow-xl hover:shadow-2xl border-none transition-all duration-500 hover:-translate-y-4 overflow-hidden">
            <div className={cn("h-40 relative flex items-center justify-center", colors[template.level])}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <div className="relative z-10 text-white transform group-hover:scale-110 transition-transform duration-700">
                    {icons[template.level]}
                </div>
                <div className="absolute bottom-6 left-8 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                    {template.level} Level
                </div>
            </div>
            
            <CardContent className="p-10 space-y-8">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 italic uppercase leading-tight group-hover:text-indigo-600 transition-colors">
                        {template.name}
                    </h3>
                    <p className="text-slate-400 font-bold text-xs italic line-clamp-2">
                        {template.description || "Start your enrollment process for the upcoming session."}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Application Fee</p>
                        <p className="text-sm font-black text-slate-900 italic">₦{parseFloat(template.applicationFee).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Deadline</p>
                        <p className="text-sm font-black text-slate-900 italic">{format(new Date(template.endDate), 'MMM dd')}</p>
                    </div>
                </div>

                <Link href={`/admission/${template.slug}`}>
                    <Button className="w-full bg-slate-900 text-white font-black py-8 rounded-2xl flex justify-between items-center px-8 group-hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 uppercase text-xs tracking-widest">
                        Apply Now
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

function FeatureItem({ title, desc, icon }: { title: string, desc: string, icon: any }) {
    return (
        <div className="flex gap-6 group">
            <div className="w-14 h-14 bg-white shadow-lg rounded-[1.5rem] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                {icon}
            </div>
            <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900 italic uppercase tracking-tight">{title}</h4>
                <p className="text-sm font-bold text-slate-400 italic leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={cn(className)}>{children}</div>;
}

function CardContent({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={cn(className)}>{children}</div>;
}
