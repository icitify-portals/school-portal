"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Brain,
    Plus,
    Database,
    Clock,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Settings2,
    FileEdit
} from "lucide-react";
import Link from "next/link";
import { getCourses } from "@/actions/courses";
import { cn } from "@/lib/utils";

export default function CBTDashboard() {
    const [stats, setStats] = useState({ totalQuizzes: 0, pendingGrading: 0, banks: 0 });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Brain className="w-8 h-8 text-indigo-600" />
                        CBT Assessment Center
                    </h1>
                    <p className="text-slate-500 font-medium">Create, manage and grade advanced examinations</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/cbt/banks">
                        <Button variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 border-slate-200">
                            <Database className="w-4 h-4 mr-2" /> Question Banks
                        </Button>
                    </Link>
                    <Link href="/admin/cbt/editor">
                        <Button className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 bg-slate-900 hover:bg-black shadow-lg">
                            <Plus className="w-4 h-4 mr-2" /> New Assessment
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-indigo-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">Active Exams</p>
                                <h3 className="text-3xl font-black mt-1">24</h3>
                            </div>
                            <Clock className="w-10 h-10 text-indigo-400 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-amber-500 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-100">Manual Grading</p>
                                <h3 className="text-3xl font-black mt-1">12</h3>
                            </div>
                            <FileEdit className="w-10 h-10 text-amber-300 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Avg. Pass Rate</p>
                                <h3 className="text-3xl font-black mt-1">78%</h3>
                            </div>
                            <BarChart3 className="w-10 h-10 text-emerald-400 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Recent Assessments</CardTitle>
                        <Settings2 className="w-4 h-4 text-slate-300" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                            QUIZ
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Introduction to Computer Science {i}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-black">20 Questions • 60 Minutes</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase text-indigo-600">Edit</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b border-slate-50">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Question Types Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { name: "Multiple Choice", type: "Objective", color: "bg-blue-100 text-blue-700" },
                                { name: "Essay", type: "Subjective", color: "bg-rose-100 text-rose-700" },
                                { name: "Short Answer", type: "Mixed", color: "bg-amber-100 text-amber-700" },
                                { name: "Matching", type: "Objective", color: "bg-emerald-100 text-emerald-700" },
                            ].map(t => (
                                <div key={t.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-800">{t.name}</p>
                                    <span className={cn("mt-2 inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase", t.color)}>
                                        {t.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
