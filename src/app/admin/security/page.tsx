"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
    Shield, Activity, Lock, FileText, Users, Eye,
    ShieldCheck, AlertTriangle, ArrowRight, Monitor, Database
} from "lucide-react";
import { getGdprSummary } from "@/actions/gdpr";

export default function SecurityDashboard() {
    const [summary, setSummary] = useState<any>(null);

    useEffect(() => {
        getGdprSummary().then(result => {
            if (result && !result.error) setSummary(result.summary);
        });
    }, []);

    const securityModules = [
        {
            title: "Audit Logs",
            description: "Track all system activities, user actions, and data changes",
            icon: Activity,
            href: "/admin/security/audit",
            color: "bg-blue-500",
            bgColor: "bg-blue-50 border-blue-100",
        },
        {
            title: "Exam Security",
            description: "Configure browser lockdown, proctoring, and exam integrity controls",
            icon: Monitor,
            href: "/admin/security/exams",
            color: "bg-amber-500",
            bgColor: "bg-amber-50 border-amber-100",
        },
        {
            title: "GDPR Compliance",
            description: "Data export, anonymization, and retention policy management",
            icon: Shield,
            href: "/admin/security/gdpr",
            color: "bg-green-500",
            bgColor: "bg-green-50 border-green-100",
        },
        {
            title: "Role & Permissions",
            description: "Manage user roles and granular permission assignments",
            icon: Users,
            href: "/admin/rbac",
            color: "bg-purple-500",
            bgColor: "bg-purple-50 border-purple-100",
        },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck className="w-12 h-12 text-red-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic">
                                    Campus Security
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                System security overview and administration tools
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth Methods</p>
                                <h3 className="text-3xl font-black text-slate-900 mt-2 italic tracking-tighter">3</h3>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Users</p>
                                <h3 className="text-3xl font-black text-blue-600 mt-2 italic tracking-tighter">{summary?.totalUsers || '—'}</h3>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Activity Logs</p>
                                <h3 className="text-3xl font-black text-amber-600 mt-2 italic tracking-tighter">{summary?.totalActivityLogs || '—'}</h3>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
                                <Activity className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-red-600 text-white backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-red-200 uppercase tracking-widest">Anonymized</p>
                                <h3 className="text-3xl font-black text-white mt-2 italic tracking-tighter">{summary?.anonymizedUsers || '—'}</h3>
                            </div>
                            <div className="p-4 bg-white/20 rounded-2xl text-white shadow-inner group-hover:scale-110 transition-transform">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Module Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {securityModules.map((module, i) => (
                        <Link key={module.title} href={module.href} className="block group">
                            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] hover:-translate-y-2 hover:shadow-2xl hover:border-slate-300 transition-all duration-300 h-full p-4 relative overflow-hidden">
                                <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-150 transition-transform duration-700 pointer-events-none">
                                    <module.icon className="w-48 h-48" />
                                </div>
                                <CardContent className="p-6 flex items-start gap-6 relative z-10">
                                    <div className={`p-5 rounded-[1.5rem] text-white shrink-0 shadow-lg ${module.color}`}>
                                        <module.icon className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight italic">
                                            {module.title}
                                            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-2 group-hover:text-indigo-600 transition-all" />
                                        </h3>
                                        <p className="text-sm font-bold text-slate-500 mt-2 leading-relaxed">{module.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Auth Configuration Info */}
                <Card className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="border-b border-white/40 bg-white/40 pb-6 px-10 pt-10">
                        <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight italic">
                            <Lock className="w-6 h-6 text-slate-500" /> Authentication Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 uppercase">Email/Password</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active — bcrypt hashing</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 uppercase">Google OAuth</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ready — set GOOGLE_CLIENT_ID</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 uppercase">Microsoft Entra</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ready — set MS_CLIENT_ID</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 p-5 bg-slate-900 rounded-3xl text-white shadow-xl flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <Database className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm font-black tracking-widest uppercase text-indigo-300">LDAP Infrastructure Ready</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">Set LDAP_URL in .env to activate directory authentication.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
