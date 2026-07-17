"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    MessageSquare,
    ChevronRight,
    Search,
    Plus,
    GraduationCap,
    Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Mock data as we don't have a getForums action yet, or we'll assume standard fetch
const forumCategories = [
    { id: 1, title: "General Discussion", description: "Campus-wide talk and social interaction.", type: "general", icon: Globe, count: 124 },
    { id: 2, title: "CSC 301: Algorithms", description: "Course-specific discussion for CSC 301.", type: "course", icon: GraduationCap, count: 45 },
    { id: 3, title: "LAW 401: Jurisprudence", description: "Deep dives into legal theory and cases.", type: "course", icon: GraduationCap, count: 32 },
];

export default function ForumsPage() {
    const [search, setSearch] = useState("");

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Discussion Forums
                    </h1>
                    <p className="text-slate-500 font-medium">Connect, debate, and collaborate with your peers and lecturers</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6">
                        My Participations
                    </Button>
                    <Button className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 bg-slate-900 shadow-lg">
                        <Plus className="w-4 h-4 mr-2" /> Create Forum
                    </Button>
                </div>
            </div>

            <div className="relative max-w-xl">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <Input
                    placeholder="Search for a topic or course forum..."
                    className="pl-12 h-12 bg-white rounded-2xl border-slate-100 shadow-sm font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forumCategories.map((forum) => (
                    <Link key={forum.id} href={`/forums/${forum.id}`}>
                        <Card className="hover: transition-all cursor-pointer group h-full border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-100/20",
                                        forum.type === 'general' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                                    )}>
                                        <forum.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" /> {forum.count} Topics
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{forum.title}</h3>
                                <p className="text-sm text-slate-500 font-medium mt-2 flex-1">{forum.description}</p>
                                <div className="mt-6 flex items-center justify-between pt-6 border-t border-slate-50">
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded capitalize",
                                        forum.type === 'general' ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                                    )}>
                                        {forum.type} Forum
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
