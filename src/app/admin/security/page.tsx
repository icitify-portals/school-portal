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
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-7 h-7 text-indigo-600" />
                    Security & Administration
                </h1>
                <p className="text-sm text-slate-500 mt-1">System security overview and administration tools</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0">
                    <CardContent className="p-5">
                        <ShieldCheck className="w-8 h-8 text-indigo-200 mb-2" />
                        <p className="text-xs font-bold text-indigo-200 uppercase">Auth Methods</p>
                        <p className="text-2xl font-black mt-1">3</p>
                        <p className="text-xs text-indigo-300 mt-1">Email, Google, Microsoft</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
                    <CardContent className="p-5">
                        <Users className="w-8 h-8 text-blue-200 mb-2" />
                        <p className="text-xs font-bold text-blue-200 uppercase">Total Users</p>
                        <p className="text-2xl font-black mt-1">{summary?.totalUsers || '—'}</p>
                        <p className="text-xs text-blue-300 mt-1">Registered accounts</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-600 to-amber-800 text-white border-0">
                    <CardContent className="p-5">
                        <Activity className="w-8 h-8 text-amber-200 mb-2" />
                        <p className="text-xs font-bold text-amber-200 uppercase">Activity Logs</p>
                        <p className="text-2xl font-black mt-1">{summary?.totalActivityLogs || '—'}</p>
                        <p className="text-xs text-amber-300 mt-1">Recorded events</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-600 to-red-800 text-white border-0">
                    <CardContent className="p-5">
                        <AlertTriangle className="w-8 h-8 text-red-200 mb-2" />
                        <p className="text-xs font-bold text-red-200 uppercase">Anonymized</p>
                        <p className="text-2xl font-black mt-1">{summary?.anonymizedUsers || '—'}</p>
                        <p className="text-xs text-red-300 mt-1">GDPR processed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {securityModules.map(module => (
                    <Link key={module.title} href={module.href}>
                        <Card className={`${module.bgColor} hover:shadow-lg transition-all cursor-pointer group`}>
                            <CardContent className="p-5 flex items-start gap-4">
                                <div className={`p-3 ${module.color} rounded-xl text-white shrink-0`}>
                                    <module.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-slate-900 flex items-center gap-2">
                                        {module.title}
                                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">{module.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Auth Configuration Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Authentication Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <div>
                                <p className="text-sm font-bold text-slate-700">Email/Password</p>
                                <p className="text-xs text-slate-400">Active — bcrypt hashing</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <div>
                                <p className="text-sm font-bold text-slate-700">Google OAuth</p>
                                <p className="text-xs text-slate-400">Ready — set GOOGLE_CLIENT_ID</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <div>
                                <p className="text-sm font-bold text-slate-700">Microsoft Entra</p>
                                <p className="text-xs text-slate-400">Ready — set MS_CLIENT_ID</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                            <Database className="w-3 h-3" />
                            <strong>LDAP:</strong> Infrastructure ready. Set LDAP_URL in .env to activate directory authentication.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
