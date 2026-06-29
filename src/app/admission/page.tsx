"use client";

import { useState, useEffect } from "react";
import { getAdmissionTemplates, getAdmissionEngineSetting } from "@/actions/admission_v2";
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
    Sparkles,
    ShieldCheck,
    Fingerprint,
    HelpCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AdmissionLandingPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [engineMode, setEngineMode] = useState<string>("multi_level");
    const [loading, setLoading] = useState(true);
    const [activePathway, setActivePathway] = useState<'primary' | 'secondary' | 'tertiary' | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchTemplatesAndSettings();
        
        // Handle URL direct levels routing (e.g. /admission?level=primary)
        const params = new URLSearchParams(window.location.search);
        const lvl = params.get('level');
        if (lvl && ['primary', 'secondary', 'tertiary'].includes(lvl)) {
            setActivePathway(lvl as any);
        }
    }, []);

    const fetchTemplatesAndSettings = async () => {
        setLoading(true);
        const [tplList, mode] = await Promise.all([
            getAdmissionTemplates(),
            getAdmissionEngineSetting()
        ]);
        setTemplates(tplList || []);
        setEngineMode(mode || "multi_level");
        
        // If engine mode is tertiary-only, default to tertiary pathway directly
        if (mode === "jamb_only") {
            setActivePathway("tertiary");
        }
        setLoading(false);
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex justify-center items-center">
            <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Loading Intake Channels...</p>
            </div>
        </div>
    );

    // Apply filters based on search and level pathway selector
    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase());
        
        if (engineMode === "jamb_only") {
            return matchesSearch && t.level === 'tertiary';
        }
        
        if (activePathway) {
            return matchesSearch && t.level === activePathway;
        }
        
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden font-sans">
            {/* Header Stage */}
            <div className="relative pt-32 pb-48 px-8 border-b border-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -translate-y-1/2" />
                    <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/2" />
                </div>

                <div className="max-w-6xl mx-auto relative z-10 text-center space-y-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">2026 Intake Portal Active</span>
                    </div>
                    
                    <div className="space-y-4">
                        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                            ACADEMIC <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">ADMISSIONS</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs max-w-2xl mx-auto leading-relaxed">
                            Begin your pathway to outstanding scholarly growth. Select your level to proceed with your enrollment.
                        </p>
                    </div>

                    {activePathway && engineMode !== "jamb_only" && (
                        <Button 
                            onClick={() => {
                                setActivePathway(null);
                                window.history.pushState({}, "", "/admission");
                            }}
                            variant="ghost" 
                            className="rounded-full border border-slate-800 text-slate-400 font-black px-6 py-4 uppercase text-[9px] tracking-widest hover:bg-slate-900 hover:text-white"
                        >
                            ← Back to Pathways
                        </Button>
                    )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 -mt-24 pb-32">
                {/* 1. Pathways Selection Stage */}
                {engineMode === 'multi_level' && !activePathway ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <PathwayCard 
                            title="Primary School"
                            level="primary"
                            icon={<School className="w-10 h-10" />}
                            desc="Foundation programs, early development, and interactive elementary intake classes."
                            onClick={() => {
                                setActivePathway("primary");
                                window.history.pushState({}, "", "/admission?level=primary");
                            }}
                            color="from-amber-500/20 to-amber-500/5 hover:border-amber-500/40"
                            iconColor="text-amber-500"
                        />
                        <PathwayCard 
                            title="Secondary School"
                            level="secondary"
                            icon={<BookOpen className="w-10 h-10" />}
                            desc="Junior and Senior high schools offering high-fidelity academic preparations."
                            onClick={() => {
                                setActivePathway("secondary");
                                window.history.pushState({}, "", "/admission?level=secondary");
                            }}
                            color="from-indigo-500/20 to-indigo-500/5 hover:border-indigo-500/40"
                            iconColor="text-indigo-400"
                        />
                        <PathwayCard 
                            title="Tertiary Admissions"
                            level="tertiary"
                            icon={<GraduationCap className="w-10 h-10" />}
                            desc="Universities, Polytechnics, Diplomas, and Post-UTME screening applications."
                            onClick={() => {
                                setActivePathway("tertiary");
                                window.history.pushState({}, "", "/admission?level=tertiary");
                            }}
                            color="from-emerald-500/20 to-emerald-500/5 hover:border-emerald-500/40"
                            iconColor="text-emerald-400"
                        />
                    </div>
                ) : (
                    /* 2. Active Channel Showcase */
                    <div className="space-y-12">
                        {/* Search and Filters */}
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-900/60 p-6 rounded-2xl border border-slate-900 backdrop-blur-md">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input 
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-none outline-none bg-slate-950 font-bold text-sm text-white placeholder-slate-500"
                                    placeholder="Search active templates..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intake Pathway:</span>
                                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {activePathway || "tertiary"} Level
                                </span>
                            </div>
                        </div>

                        {/* Tertiary Special: Show JAMB CAPS portal card if Tertiary is active */}
                        {(activePathway === 'tertiary' || engineMode === 'jamb_only') && (
                            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900/80 to-slate-900/80 rounded-[3rem] p-12 border border-emerald-500/10 relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                    <Fingerprint className="w-64 h-64 text-white" />
                                </div>
                                <div className="max-w-2xl relative z-10 space-y-6">
                                    <span className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[9px] font-black tracking-widest text-emerald-400 uppercase">
                                        Degree Verification
                                    </span>
                                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">JAMB CAPS Claim Portal</h3>
                                    <p className="text-slate-400 font-bold italic text-sm leading-relaxed">
                                        For university and polytechnic candidates who sat for the UTME exam. Confirm your screening qualifications, verify subject combinations, and claim your school profile.
                                    </p>
                                    <Link href="/admission/claim">
                                        <Button className="bg-emerald-600 text-white font-black py-6 px-10 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-500/10 transition-all mt-4">
                                            Claim My Admission Profile <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Form Templates Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {filteredTemplates.length > 0 ? (
                                filteredTemplates.map((template) => (
                                    <AdmissionCard key={template.id} template={template} />
                                ))
                            ) : (
                                <div className="col-span-3 py-20 text-center bg-slate-900/40 rounded-[3rem] border border-slate-900">
                                    <HelpCircle className="w-12 h-12 text-slate-700 mx-auto" />
                                    <h3 className="text-xl font-black text-slate-500 italic uppercase mt-4">No Direct Forms Active</h3>
                                    <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px] mt-2">There are no direct applications configured for this pathway.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FAQ / Info Section */}
                <div className="mt-40 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Smart Admission <br /> Technology</h2>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Efficiency at every step of your intake.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <FeatureItem 
                                title="NIN Spell Verification" 
                                desc="JIT spelling and bio checks directly integrated into intake sheets via NIN." 
                                icon={<Fingerprint className="w-5 h-5 text-emerald-400" />}
                            />
                            <FeatureItem 
                                title="Dynamic Age Verification" 
                                desc="Automated age verification based on template constraints." 
                                icon={<Clock className="w-5 h-5 text-indigo-400" />}
                            />
                            <FeatureItem 
                                title="Instant Decisioning" 
                                desc="Receive status updates and download admission letters immediately." 
                                icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                            />
                        </div>
                    </div>
                    <div className="bg-slate-900 rounded-[4rem] p-12 relative overflow-hidden group border border-slate-800 shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <School className="w-64 h-64 text-white" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl border border-slate-800">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Already Applied?</h3>
                            <p className="text-slate-400 font-bold italic leading-relaxed">Checking your status is easy. Use your dynamic Application ID to track payment clearing, exam slips, or edit requests.</p>
                            <Link href="/admission/status">
                                <Button className="w-full bg-white text-slate-950 font-black py-8 rounded-2xl uppercase text-xs tracking-widest hover:bg-slate-100 transition-all mt-4">
                                    Track My Application
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 border-t border-slate-900 py-12 text-center text-slate-600">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" /> Secure Multi-Tier Intake Gateway
                </p>
                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mt-2">© 2026 School Portal Group. All Rights Reserved.</p>
            </div>
        </div>
    );
}

function PathwayCard({ title, level, icon, desc, onClick, color, iconColor }: { 
    title: string, level: string, icon: any, desc: string, onClick: () => void, color: string, iconColor: string 
}) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "group bg-gradient-to-b border border-slate-900 p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 cursor-pointer relative overflow-hidden flex flex-col justify-between h-[360px]",
                color
            )}
        >
            <div className="space-y-6 relative z-10">
                <div className={cn("w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg", iconColor)}>
                    {icon}
                </div>
                <div className="space-y-3">
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tight leading-none">{title}</h3>
                    <p className="text-slate-400 font-bold text-xs leading-relaxed italic">{desc}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300 relative z-10 group-hover:text-white transition-colors">
                Select Pathway <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform" />
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
        <Card className="group relative bg-slate-900/60 rounded-[3rem] shadow-xl hover:shadow-2xl border border-slate-900 transition-all duration-500 hover:-translate-y-4 overflow-hidden">
            <div className={cn("h-40 relative flex items-center justify-center", colors[template.level])}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <div className="relative z-10 text-white transform group-hover:scale-110 transition-transform duration-700">
                    {icons[template.level]}
                </div>
                <div className="absolute bottom-6 left-8 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                    {template.level} Level
                </div>
            </div>
            
            <CardContent className="p-8 space-y-8 bg-slate-950">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white italic uppercase leading-tight group-hover:text-emerald-400 transition-colors">
                        {template.name}
                    </h3>
                    <p className="text-slate-400 font-bold text-xs italic line-clamp-2">
                        {template.description || "Start your enrollment process for the upcoming session."}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Application Fee</p>
                        // @ts-expect-error - TS2304: Auto-suppressed for build
                        <p className="text-sm font-black text-white italic">{settings?.base_currency || '₦'}{parseFloat(template.applicationFee).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Deadline</p>
                        <p className="text-sm font-black text-white italic">{format(new Date(template.endDate), 'MMM dd')}</p>
                    </div>
                </div>

                <Link href={`/admission/${template.slug}`}>
                    <Button className="w-full bg-slate-900 text-white border border-slate-800 font-black py-8 rounded-2xl flex justify-between items-center px-8 hover:bg-emerald-600 transition-all uppercase text-[10px] tracking-widest shadow-xl">
                        Apply Now
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

function FeatureItem({ title, desc, icon }: { title: string, desc: string, icon: any }) {
    return (
        <div className="flex gap-6 group">
            <div className="w-14 h-14 bg-slate-900 border border-slate-800 shadow-lg rounded-[1.5rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                {icon}
            </div>
            <div className="space-y-1">
                <h4 className="text-lg font-black text-white italic uppercase tracking-tight">{title}</h4>
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
