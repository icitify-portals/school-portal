import { auth } from "@/auth";
import { getSettingByKey } from "@/actions/settings";
import Link from "next/link";
import { ArrowRight, BookOpen, UserPlus, Users, GraduationCap, ShieldCheck, CreditCard, ChevronRight, HelpCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
    const session = await auth();
    const rawLogo = await getSettingByKey('portal_logo');
    const rawName = await getSettingByKey('portal_name');
    
    const logoUrl = rawLogo?.trim() && rawLogo !== 'null' ? rawLogo : "/logo.png";
    const instName = rawName || "Smart Portal";

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-indigo-500/30">

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 overflow-hidden bg-slate-950 flex items-center min-h-[70vh]">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" />
                </div>
                
                <div className="max-w-7xl mx-auto px-4 relative z-10 w-full">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium text-sm mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Portal Usage Guide
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.9] mb-6">
                            Welcome to the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Smart Portal</span>
                        </h1>
                        <p className="text-xl text-slate-400 font-medium leading-relaxed mb-10 max-w-2xl">
                            A completely streamlined digital experience for admissions, registration, payments, and academic management. Follow our comprehensive guides below to navigate your journey.
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                            <a href="https://fssibadan.edu.ng" target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 px-8 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-colors">
                                Main Website <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                            <Link href="/register" className="inline-flex h-14 items-center justify-center rounded-2xl bg-emerald-600 px-8 text-sm font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition-colors shadow-xl shadow-emerald-500/25">
                                2026/2027 Application Form <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                            {session ? (
                                <Link href="/dashboard" className="inline-flex h-14 items-center justify-center rounded-2xl bg-indigo-600 px-8 text-sm font-bold uppercase tracking-wider text-white hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-500/25">
                                    Enter Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                                </Link>
                            ) : (
                                <Link href="/login" className="inline-flex h-14 items-center justify-center rounded-2xl bg-indigo-600 px-8 text-sm font-bold uppercase tracking-wider text-white hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-500/25">
                                    Login to Portal <ArrowRight className="ml-2 w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Guides Section */}
            <section id="guides" className="py-24 relative z-20 -mt-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Applicants Card */}
                        <div className="group relative bg-white rounded-[2rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-all duration-500">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <UserPlus className="w-32 h-32" />
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <UserPlus className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">Prospective Applicants</h2>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                Starting a new journey? Learn exactly how to purchase your application form, fill out your details, upload documents, and track your admission status in real-time.
                            </p>
                            
                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-3 text-slate-700 font-medium">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">1</div>
                                    Create a portal account safely
                                </li>
                                <li className="flex items-center gap-3 text-slate-700 font-medium">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">2</div>
                                    Pay application and processing fees
                                </li>
                                <li className="flex items-center gap-3 text-slate-700 font-medium">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">3</div>
                                    Submit and print application slip
                                </li>
                            </ul>

                            <Link href="/guide/applicants" className="inline-flex w-full h-14 items-center justify-between rounded-xl bg-slate-900 px-6 text-sm font-bold uppercase tracking-wider text-white hover:bg-indigo-600 transition-colors">
                                Read Applicant Guide <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>

                        {/* Returning Students Card */}
                        <div className="group relative bg-white rounded-[2rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-all duration-500">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Users className="w-32 h-32" />
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <Users className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">Returning Students</h2>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                Welcome back to a new session! Discover how the new portal handles your tuition payments, course registrations, result checking, and accommodation.
                            </p>
                            
                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-3 text-slate-700 font-medium">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">1</div>
                                    Secure login using Matric Number
                                </li>
                                <li className="flex items-center gap-3 text-slate-700 font-medium">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">2</div>
                                    Clear structured session invoices
                                </li>
                                <li className="flex items-center gap-3 text-slate-700 font-medium">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">3</div>
                                    Register semester courses online
                                </li>
                            </ul>

                            <Link href="/guide/returning-students" className="inline-flex w-full h-14 items-center justify-between rounded-xl bg-slate-900 px-6 text-sm font-bold uppercase tracking-wider text-white hover:bg-emerald-600 transition-colors">
                                Read Student Guide <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* General Info / Features */}
            <section className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter mb-16">Core Portal Systems</h2>
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="p-8 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <ShieldCheck className="w-12 h-12 text-indigo-600 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Secure Identity</h3>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">Centralized authentication ensuring that your academic records, payments, and personal information are strictly protected.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <CreditCard className="w-12 h-12 text-emerald-600 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Wallet & Payments</h3>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">Top up your portal wallet using modern payment gateways to instantly clear fee invoices and print official receipts.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <GraduationCap className="w-12 h-12 text-amber-500 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Academic Registry</h3>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">Real-time access to your course history, CGPA calculation, and transcript request processing without leaving the portal.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <HelpCircle className="w-12 h-12 text-rose-500 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Help & Support</h3>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">Open support tickets seamlessly from your dashboard to resolve issues with IT or Bursary in record time. Never get stuck!</p>
                        </div>
                    </div>
                </div>
            </section>


        </div>
    );
}
