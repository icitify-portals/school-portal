import { db } from "@/db/db";
import { cmsHomePageSections, cmsSectionMedia } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getHomePageSections } from "@/actions/cms";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
    ArrowRight,
    Plus,
    CheckCircle2,
    BookOpen,
    Users,
    Globe,
    Zap,
    Shield,
    MessageCircle,
    Play,
    BarChart4,
    Code2,
    Coins,
    Briefcase,
    Network
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MediaSlider } from "@/components/cms/MediaSlider";
import { MediaGallery } from "@/components/cms/MediaGallery";
import NewsFeedBlock from "@/components/cms/NewsFeedBlock";
import SeedDemoButton from "@/components/seeding/SeedDemoButton";
import SeedResultsDemoButton from "@/components/seeding/SeedResultsDemoButton";
import SeedFssDemoButton from "@/components/seeding/SeedFssDemoButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
    const session = await auth();

    let sections: any[] = [];
    try {
        const res = await getHomePageSections();
        if (res.success) {
            sections = res.data || [];
        } else {
            throw new Error(res.error);
        }
    } catch (error) {
        console.error("Failed to fetch CMS sections:", error);
        return <DefaultLandingPage session={session} />;
    }

    if (sections.length === 0) {
        return <DefaultLandingPage session={session} />;
    }

    return (
        <div className="flex flex-col">
            {sections.map((section: any) => (
                <SectionRenderer key={section.id} section={section} session={session} />
            ))}
        </div>
    );
}

function getDashboardUrl(role: string) {
    switch (role) {
        case 'superadmin':
        case 'icitify_dev':
            return "/super-admin/dashboard";
        case 'admin':
            return "/admin/dashboard";
        case 'staff':
            return "/staff/dashboard";
        case 'student':
            return "/student/dashboard";
        case 'parent':
            return "/parent/dashboard";
        case 'dvc':
            return "/admin/dashboard";
        case 'bursar':
            return "/admin/bursary";
        case 'registrar':
            return "/admin/admission";
        case 'librarian':
            return "/admin/library";
        case 'healthadmin':
            return "/healthadmin/dashboard";
        case 'fresher':
            return "/fresher";
        case 'applicant':
            return "/admission";
        case 'hod':
            return "/admin/hod";
        case 'dean':
            return "/admin/dean";
        default:
            return "/dashboard";
    }
}

function SectionRenderer({ section, session }: { section: any; session: any }) {
    const content = JSON.parse(section.content || '{}');

    switch (section.type) {
        case 'hero':
            return (
                <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-slate-950">
                    <div 
                        className="absolute inset-0 z-0" 
                        style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(var(--brand-primary-rgb, 16, 185, 129), 0.15), transparent)' }}
                    />
                    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            {content.badge && (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-1.5 px-4 rounded-full font-black uppercase tracking-widest text-[10px]">
                                    {content.badge}
                                </Badge>
                            )}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[0.85] uppercase italic">
                                {section.title || content.title || "Shape Your Future With Us"}
                            </h1>
                            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
                                {section.subtitle || content.subtitle || "A world-class management system designed for the modern educational landscape."}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                {session?.user ? (
                                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-600/40">
                                        <Link href={getDashboardUrl((session.user as any).role)}>Go to Dashboard</Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-600/40">
                                            <Link href={content.ctaLink || "/register"}>{content.ctaText || "Apply Online Now"}</Link>
                                        </Button>
                                        <Button asChild variant="outline" className="border-white/10 hover:bg-white/5 rounded-2xl px-8 h-14 font-black uppercase text-xs tracking-widest text-white">
                                            <Link href="/login">Login Portal</Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-600/30 blur-[120px] rounded-full group-hover:bg-emerald-600/40 transition-colors" />
                            <img
                                src={content.imageUrl || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200"}
                                alt="Hero"
                                className="relative z-10 rounded-[3rem] shadow-2xl border border-white/10 hover:scale-[1.02] transition-transform duration-700"
                            />
                        </div>
                    </div>
                </section>
            );
        case 'slider':
            return (
                <section className="py-20 px-4 bg-slate-50">
                    <div className="max-w-[1600px] w-full mx-auto">
                        <MediaSlider items={section.media || []} className="h-[700px]" />
                    </div>
                </section>
            );
        case 'gallery':
            return (
                <section className="py-32 bg-slate-50 relative overflow-hidden">
                    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="mb-16 text-center space-y-4">
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter">{section.title || "Our Campus Life"}</h2>
                            <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">{section.subtitle}</p>
                        </div>
                        <MediaGallery items={section.media || []} />
                    </div>
                </section>
            );
        case 'content':
            return (
                <section className="py-32 bg-white relative">
                    <div className="max-w-4xl mx-auto px-4 text-center space-y-10">
                        {section.title && <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase italic">{section.title}</h2>}
                        {section.subtitle && <p className="text-xl text-slate-500 font-medium leading-relaxed">{section.subtitle}</p>}
                        {content.body && (
                            <div
                                className="prose prose-slate prose-lg lg:prose-xl mx-auto text-left prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-a:text-emerald-600 font-medium text-slate-600"
                                dangerouslySetInnerHTML={{ __html: content.body }}
                            />
                        )}
                    </div>
                </section>
            );
        case 'cta':
            return (
                <section className="py-20 px-4">
                    <div className="max-w-[1600px] w-full mx-auto bg-emerald-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-[0_40px_80px_-20px_rgba(16,185,129,0.4)]">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10 space-y-8">
                            <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">{section.title || "Ready to join us?"}</h2>
                            <p className="text-emerald-100 text-lg md:text-xl font-medium max-w-2xl mx-auto">{section.subtitle}</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Button asChild className="bg-white text-emerald-700 hover:bg-slate-50 h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                                    <Link href={content.ctaLink || "/register"}>{content.ctaText || "Get Started Now"}</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            )
        case 'news':
            return <NewsFeedBlock title={section.title} subtitle={section.subtitle} />;
        case 'features':
            const items = content.items || [];
            return (
                <section className="py-32 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.05),transparent)] z-0" />
                    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="mb-20 text-center space-y-4 max-w-3xl mx-auto">
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-1.5 px-4 rounded-full font-black uppercase tracking-widest text-[10px]">
                                Academics & Innovation
                            </Badge>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {section.title || "Key Features"}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
                                {section.subtitle}
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {items.map((item: any, idx: number) => {
                                const getIcon = (iconName: string) => {
                                    switch (iconName) {
                                        case 'BarChart4':
                                            return <BarChart4 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />;
                                        case 'Code2':
                                            return <Code2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />;
                                        case 'Coins':
                                            return <Coins className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />;
                                        case 'Briefcase':
                                            return <Briefcase className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />;
                                        case 'Zap':
                                            return <Zap className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />;
                                        case 'Network':
                                            return <Network className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />;
                                        default:
                                            return <BookOpen className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />;
                                    }
                                };

                                return (
                                    <div 
                                        key={idx} 
                                        className="glass-card hover-lift p-8 rounded-2xl flex flex-col justify-between h-full space-y-6 relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-[4rem] group-hover:scale-110 transition-transform duration-500" />
                                        <div className="space-y-4 relative z-10">
                                            <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl w-fit">
                                                {getIcon(item.icon)}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {item.title}
                                                </h3>
                                                {item.badge && (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[9px] uppercase tracking-wider">
                                                        {item.badge}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            );
        default:
            return <div className="py-20 text-center text-slate-400">Section type {section.type} coming soon</div>;
    }
}

import { getTenantStoragePath } from "@/db/db";
import { headers } from "next/headers";

async function DefaultLandingPage({ session }: { session: any }) {
    const headersList = await headers();
    const hostname = headersList.get("host") || "";
    
    const activeNode = hostname.includes("ajatschools.local") ? "AJAT-ACADEMY" : hostname.includes("citadeluniversity.local") ? "CITADEL-UNI" : "DEFAULT";
    const activeDb = hostname.includes("ajatschools.local") ? "portal_AJAT_ACADEMY" : hostname.includes("citadeluniversity.local") ? "portal_CITADEL_UNI" : "school_portal";
    const activePath = getTenantStoragePath(hostname);

    return (
        <div className="pt-20">
            <section className="bg-slate-900 py-32 text-center text-white px-4 relative overflow-hidden">
                <div 
                    className="absolute inset-0" 
                    style={{ backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(var(--brand-primary-rgb, 16, 185, 129), 0.3), transparent)' }}
                />
                <div className="relative z-10 max-w-4xl mx-auto space-y-12">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-1.5 px-4 rounded-full font-black uppercase tracking-widest text-[10px]">
                        Project Initialization
                    </Badge>
                    <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter mb-6 leading-none">
                        Ready to <span className="text-emerald-400 text-outline">Launch</span>?
                    </h1>
                    
                    {/* Prestigious Tenant Routing Badge */}
                    <div 
                        className="max-w-xl mx-auto p-6 border rounded-2xl flex flex-col gap-3 text-left text-xs font-mono text-slate-300 shadow-2xl backdrop-blur-md"
                        style={{ 
                            backgroundColor: 'rgba(var(--brand-secondary-rgb, 15, 23, 42), 0.8)', 
                            borderColor: 'rgba(var(--brand-primary-rgb, 16, 185, 129), 0.2)' 
                        }}
                    >
                        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Active Domain ID</span>
                            <span className="font-black text-emerald-400 tracking-tight">{activeNode}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Partitioned Database</span>
                            <span className="font-black text-emerald-400 tracking-tight">{activeDb}</span>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0 mt-0.5">Isolated Storage</span>
                            <span className="font-bold text-amber-400 break-all text-right">{activePath}</span>
                        </div>
                    </div>

                    <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
                        Your portal is live, but your homepage is waiting for its first spark. Click below to automatically seed high-quality content and test accounts.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <SeedFssDemoButton />
                        <SeedDemoButton />
                        <SeedResultsDemoButton />
                        <Button asChild variant="outline" className="border-white/10 hover:bg-white/5 rounded-2xl px-10 h-14 font-black uppercase text-xs tracking-widest text-white">
                            <Link href="/admin/cms">Go to CMS Admin</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
