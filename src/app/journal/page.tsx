"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, ChevronRight, Newspaper, Users, Info, GraduationCap } from "lucide-react";
import { getAllJournals } from "@/actions/journal";

interface Journal {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    issn: string | null;
    logoUrl: string | null;
}

export default function PublicJournalsPage() {
    const [journals, setJournals] = useState<Journal[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const data = await getAllJournals();
            setJournals(data as Journal[]);
            setIsLoading(false);
        };
        fetch();
    }, []);

    const filteredJournals = journals.filter(j => 
        j.name.toLowerCase().includes(search.toLowerCase()) || 
        j.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <Badge variant="outline" className="text-indigo-600 border-indigo-200 dark:text-indigo-400 px-3 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">University Press</Badge>
                <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">Academic Journals</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">Discover peer-reviewed research and scholarly publications from across our diverse faculties and departments.</p>
                <div className="pt-6">
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                            className="pl-10 h-12 rounded-2xl border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all text-lg" 
                            placeholder="Search journals by name or field..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <Card key={i} className="animate-pulse h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl border-none shadow-none" />
                    ))
                ) : filteredJournals.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200">
                        <BookOpen className="mx-auto h-16 w-16 opacity-20 mb-4" />
                        <p className="text-xl font-bold italic">No journals found matching your query.</p>
                        <Button variant="link" className="text-indigo-600 font-bold" onClick={() => setSearch("")}>Clear Search</Button>
                    </div>
                ) : (
                    filteredJournals.map((journal) => (
                        <Link key={journal.id} href={`/journal/${journal.slug}`}>
                            <Card className="group h-full relative -200/50 dark: hover: hover:-500/10 transition-all duration-500 overflow-hidden dark: border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                                <div className="h-2 bg-indigo-600 w-0 group-hover:w-full transition-all duration-500 absolute top-0" />
                                <CardHeader className="pt-8 px-8 bg-slate-50/50 border-b border-slate-100 p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center p-3">
                                            {journal.logoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={journal.logoUrl} alt={journal.name} className="max-h-full max-w-full" />
                                            ) : (
                                                <BookOpen className="h-8 w-8 text-indigo-600" />
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="font-mono text-[10px] tracking-tighter">{journal.issn || "NO ISSN"}</Badge>
                                    </div>
                                    <CardTitle className="text-2xl font-black group-hover:text-indigo-600 transition-colors leading-tight">{journal.name}</CardTitle>
                                    <CardDescription className="line-clamp-3 text-slate-500 pt-2 font-medium leading-relaxed italic">{journal.description || "No description provided for this journal."}</CardDescription>
                                </CardHeader>
                                <CardFooter className="px-8 pb-8 pt-4 flex justify-between items-center text-indigo-600 font-bold text-sm">
                                    <span className="flex items-center">
                                        Explore Archive <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                    <span className="text-slate-400 font-normal italic">Open Access</span>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))
                )}
            </div>

            <Card className="-to-br from-slate-900 to-indigo-950 text-white -[40px] p-8 md:p-16 relative overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-500/10 blur-3xl rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <h2 className="text-4xl font-black leading-tight">Empowering Researchers in the Global South.</h2>
                        <p className="text-slate-400 text-lg leading-relaxed italic">Our platform provides a robust ecosystem for academic excellence, ensuring that local research reaches a global audience with the highest publishing standards.</p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link href="/register">
                                <Button className="bg-white text-indigo-900 hover:bg-slate-100 font-black h-14 px-8 rounded-2xl shadow-lg">Become an Author</Button>
                            </Link>
                            <Link href="/about">
                                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold h-14 px-8 rounded-2xl">Editorial Guidelines</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { icon: Newspaper, label: "Published Articles", value: "2.4k+" },
                            { icon: Users, label: "Active Reviewers", value: "850+" },
                            { icon: GraduationCap, label: "Partner Institutions", value: "45" },
                            { icon: Info, label: "Average DOI Speed", value: "14d" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <stat.icon className="h-8 w-8 text-indigo-400 mb-4" />
                                <div className="text-3xl font-black">{stat.value}</div>
                                <div className="text-indigo-200/60 text-xs font-bold uppercase tracking-widest mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}
