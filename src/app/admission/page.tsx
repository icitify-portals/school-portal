"use client";

import { useState, useEffect } from "react";
import { getAdmissionTemplates } from "@/actions/admission_v2";
import { 
    GraduationCap,
    ArrowRight, 
    Search,
    Loader2,
    Sparkles,
    ShieldCheck,
    Fingerprint,
    HelpCircle,
    Clock,
    FileText,
    CreditCard,
    UserCheck,
    Mail,
    Info,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


export default function AdmissionLandingPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        const tplList = await getAdmissionTemplates();
        setTemplates(tplList || []);
        setLoading(false);
    };

    const startApplication = () => {
        if (templates.length > 0) {
            router.push(`/admission/${templates[0].slug}`);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex justify-center items-center">
            <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Loading Intake Channels...</p>
            </div>
        </div>
    );

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden font-sans">
            {/* Hero */}
            <div className="relative pt-32 pb-56 px-8 border-b border-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -translate-y-1/2" />
                    <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/2" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[200px]" />
                </div>

                <div className="max-w-6xl mx-auto relative z-10 text-center space-y-12">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-full backdrop-blur-md shadow-xl">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">FSS Ibadan — 2026/2027 Intake Portal</span>
                    </div>
                    
                    <div className="space-y-6">
                        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                            ADMISSION <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-indigo-400">EXERCISE</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs max-w-2xl mx-auto leading-relaxed">
                            Federal School of Statistics, Ibadan — Admission for the 2026/2027 Academic Session
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <button onClick={startApplication}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 px-10 rounded-2xl uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 flex items-center gap-3 group">
                            Start Application <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                        <Link href="/admission/status">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors cursor-pointer border border-slate-800 py-4 px-8 rounded-2xl hover:border-slate-700">
                                Track Existing Application →
                            </span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 -mt-32 pb-32">
                <div className="space-y-16">
                    {/* How to Apply — Instruction Card */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-[3rem] p-10 md:p-14 border border-slate-800/80 shadow-2xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-[100px]" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[80px]" />
                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-600/20 to-indigo-600/20 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg">
                                    <Info className="w-7 h-7 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">How to Apply</h2>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Tertiary Admission Guide 2026/2027</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StepItem 
                                    number="01"
                                    title="Create Profile"
                                    desc="Register with your surname, first name, email, and phone. Set a strong password to secure your account."
                                    icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
                                    gradient="from-emerald-600/20 to-emerald-900/20"
                                />
                                <StepItem 
                                    number="02"
                                    title="Verify Email"
                                    desc="Check your inbox and click the verification link to activate your account before proceeding."
                                    icon={<Mail className="w-5 h-5 text-indigo-400" />}
                                    gradient="from-indigo-600/20 to-indigo-900/20"
                                />
                                <StepItem 
                                    number="03"
                                    title="Pay Application Fee"
                                    desc="Select Full-Time or Part-Time mode. Pay the application fee securely via Remita to proceed."
                                    icon={<CreditCard className="w-5 h-5 text-emerald-400" />}
                                    gradient="from-emerald-600/20 to-emerald-900/20"
                                />
                                <StepItem 
                                    number="04"
                                    title="Complete & Submit"
                                    desc="Fill in your bio-data, O-Level results, and upload required documents. Review and submit for screening."
                                    icon={<FileText className="w-5 h-5 text-indigo-400" />}
                                    gradient="from-indigo-600/20 to-indigo-900/20"
                                />
                            </div>

                            <div className="bg-slate-950/80 border border-slate-800/60 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-inner">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                                    <span className="text-sm font-bold text-slate-300">Deadline: <span className="text-amber-400">Varies by programme</span></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Fingerprint className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span className="text-sm font-bold text-slate-300">NIN verification required</span>
                                </div>
                                <div className="md:ml-auto">
                                    <button onClick={startApplication}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-8 rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/30 flex items-center gap-2">
                                        Start Application <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Programmes Section */}
                    <div className="space-y-8 scroll-mt-20">
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-900/60 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-md">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-800 outline-none bg-slate-950 font-bold text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 transition-colors"
                                    placeholder="Search programmes..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{filteredTemplates.length} Programme{filteredTemplates.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredTemplates.length > 0 ? (
                                filteredTemplates.map((template) => (
                                    <AdmissionCard key={template.id} template={template} />
                                ))
                            ) : (
                                <div className="col-span-3 py-20 text-center bg-slate-900/40 rounded-[3rem] border border-slate-800/60">
                                    <HelpCircle className="w-12 h-12 text-slate-700 mx-auto" />
                                    <h3 className="text-xl font-black text-slate-500 italic uppercase mt-4">No Active Programmes</h3>
                                    <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px] mt-2">Check back later or contact the admissions office.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 border-t border-slate-800/60 py-12 text-center text-slate-600">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" /> Secure Multi-Tier Intake Gateway
                </p>
                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mt-2">© 2026 FSS Portal Group. All Rights Reserved.</p>
            </div>
        </div>
    );
}

function StepItem({ number, title, desc, icon, gradient }: { number: string; title: string; desc: string; icon: any; gradient: string }) {
    return (
        <div className={cn("bg-slate-950/60 border border-slate-800/50 rounded-2xl p-6 space-y-4 group hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1")}>
            <div className="flex items-center justify-between">
                <div className={cn("w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300", gradient)}>
                    {icon}
                </div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Step {number}</span>
            </div>
            <div>
                <h4 className="text-lg font-black text-white italic uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{title}</h4>
                <p className="text-sm font-bold text-slate-400 italic leading-relaxed mt-1">{desc}</p>
            </div>
        </div>
    );
}

function AdmissionCard({ template }: { template: any }) {
    const levelColor = template.level === 'tertiary' ? 'from-emerald-600 to-emerald-700' : template.level === 'secondary' ? 'from-indigo-600 to-indigo-700' : 'from-amber-600 to-amber-700';
    return (
        <Card className="group relative bg-slate-900/60 rounded-[3rem] shadow-xl hover:shadow-2xl border border-slate-800/60 transition-all duration-500 hover:-translate-y-4 overflow-hidden hover:border-emerald-500/20">
            <div className={`h-40 relative flex items-center justify-center bg-gradient-to-br ${levelColor} overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)]" />
                <div className="relative z-10 text-white transform group-hover:scale-110 transition-transform duration-700">
                    <GraduationCap className="w-8 h-8" />
                </div>
                <div className={`absolute bottom-6 left-8 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg`}>
                    {template.level}
                </div>
            </div>
            
            <CardContent className="p-8 space-y-8 bg-slate-950">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white italic uppercase leading-tight group-hover:text-emerald-400 transition-colors">
                        {template.name}
                    </h3>
                    <p className="text-slate-400 font-bold text-xs italic line-clamp-2">
                        {template.description || "Start your enrollment for the upcoming session."}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/40">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fee</p>
                        <p className="text-sm font-black text-white">₦{parseFloat(template.applicationFee).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Deadline</p>
                        <p className="text-sm font-black text-white">{format(new Date(template.endDate), 'MMM dd, yyyy')}</p>
                    </div>
                </div>

                <Link href={`/admission/${template.slug}`}>
                    <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-0 font-black py-7 rounded-2xl flex justify-between items-center px-8 hover:from-emerald-500 hover:to-emerald-400 transition-all uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/30 group/btn">
                        Apply Now
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={cn(className)}>{children}</div>;
}

function CardContent({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={cn(className)}>{children}</div>;
}
