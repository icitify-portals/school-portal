"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, User, FileText, Download, ChevronRight, Mail, MapPin, Globe, Share2, Info } from "lucide-react";
import { getJournalBySlug, getIssuesByJournalId, getArticlesByJournalId } from "@/actions/journal";

interface Journal {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    issn: string | null;
    logoUrl: string | null;
    contactEmail: string | null;
    managerId: number | null;
    apcAmount: string | null;
    apcCurrency: string | null;
    license: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
}

interface Issue {
    id: number;
    journalId: number;
    volume: number;
    number: number;
    year: number;
    title: string | null;
    description: string | null;
    coverUrl: string | null;
    isPublished: boolean | null;
    publishedAt: Date | string | null;
    createdAt: Date | null;
}

interface Article {
    id: number;
    journalId: number;
    issueId: number | null;
    title: string;
    abstract: string | null;
    keywords: string | null;
    status: string | null;
    doi: string | null;
    doiStatus: string | null;
    doiError: string | null;
    rorId: string | null;
    aiSummary: string | null;
    translatedMetadata: string | null;
    isFeatured: boolean | null;
    isApcPaid: boolean | null;
    submissionDate: Date | string | null;
    publishedDate: Date | string | null;
    funding: string | null;
    conflictOfInterest: string | null;
    section: string | null;
    pages: string | null;
    startingPage: number | null;
    endingPage: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export default function JournalDetailPage() {
    const params = useParams();
    const slug = params.journalSlug as string;
    
    const [journal, setJournal] = useState<Journal | null>(null);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const jData = await getJournalBySlug(slug);
            if (jData) {
                // jData is returned as a plain object matching the Journal type
                setJournal(jData as unknown as Journal);
                const [iData, aData] = await Promise.all([
                    getIssuesByJournalId(jData.id),
                    getArticlesByJournalId(jData.id)
                ]);
                setIssues(iData as unknown as Issue[]);
                setArticles(aData as unknown as Article[]);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!journal) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Journal not found</h2>
                <Button variant="link" asChild>
                    <Link href="/journal">Back to all journals</Link>
                </Button>
            </div>
        );
    }

    const currentIssue = issues.find(i => i.isPublished);

    return (
        <div className="bg-slate-50/30 dark:bg-slate-950/20 min-h-screen">
            {/* Hero Section */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pt-12 pb-16">
                <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                        <div className="h-48 w-48 rounded-[32px] bg-slate-50 dark:bg-slate-800 shadow-inner flex items-center justify-center p-6 shrink-0 outline outline-offset-4 outline-slate-100 dark:outline-slate-800">
                             {journal.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={journal.logoUrl} alt={journal.name} className="max-h-full max-w-full" />
                            ) : (
                                <BookOpen className="h-20 w-20 text-indigo-600" />
                            )}
                        </div>
                        <div className="space-y-6 flex-1">
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-indigo-600 px-3 py-0.5 rounded-full uppercase text-[10px] tracking-widest font-black">Open Access</Badge>
                                    <Badge variant="outline" className="px-3 py-0.5 rounded-full uppercase text-[10px] tracking-widest font-bold border-slate-200">ISSN: {journal.issn || "PENDING"}</Badge>
                                </div>
                                <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-[1.1]">{journal.name}</h1>
                                <p className="text-xl text-slate-500 max-w-4xl italic leading-relaxed">{journal.description}</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-6 text-slate-500 font-bold text-sm uppercase tracking-tighter">
                                <div className="flex items-center"><Mail className="mr-2 h-4 w-4 text-indigo-400" /> {journal.contactEmail}</div>
                                <div className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-indigo-400" /> University Press</div>
                                <div className="flex items-center"><Globe className="mr-2 h-4 w-4 text-indigo-400" /> academic-journals.edu</div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 rounded-2xl shadow-xl shadow-indigo-500/20 text-lg font-black">
                                    <Link href={`/journal/${slug}/submit`}>Submit Manuscript</Link>
                                </Button>
                                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-slate-200">
                                    <Share2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Tabs defaultValue="current" className="space-y-10 group">
                    <TabsList className="bg-white dark:bg-slate-900 h-16 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 w-full md:w-auto relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-slate-50 dark:bg-slate-800" />
                        <TabsTrigger value="current" className="rounded-2xl px-8 h-full font-black text-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            Current Issue
                        </TabsTrigger>
                        <TabsTrigger value="archive" className="rounded-2xl px-8 h-full font-black text-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            Archive
                        </TabsTrigger>
                        <TabsTrigger value="editorial" className="rounded-2xl px-8 h-full font-black text-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            Editorial Team
                        </TabsTrigger>
                        <TabsTrigger value="about" className="rounded-2xl px-8 h-full font-black text-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            About & Guidelines
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="current" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {currentIssue ? (
                            <div className="space-y-8">
                                <div className="bg-indigo-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row gap-12 items-center shadow-2xl relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 blur-3xl rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
                                     <div className="h-64 w-48 bg-slate-800 rounded-2xl shadow-2xl overflow-hidden shrink-0 border-4 border-white/10 group-hover:scale-105 transition-transform">
                                        {currentIssue.coverUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={currentIssue.coverUrl} alt="Issue Cover" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center p-4 text-center">
                                                <FileText className="h-12 w-12 text-indigo-400 opacity-50" />
                                            </div>
                                        )}
                                     </div>
                                     <div className="space-y-6 flex-1">
                                        <div className="space-y-2">
                                            <Badge className="bg-indigo-500/20 text-indigo-200 border-none px-3 font-black">VOL {currentIssue.volume} NO {currentIssue.number} ({currentIssue.year})</Badge>
                                            <h2 className="text-4xl font-black tracking-tight">{currentIssue.title || `Issue ${currentIssue.number}, Vol ${currentIssue.volume}`}</h2>
                                            <p className="text-indigo-100/60 max-w-2xl text-lg italic">{currentIssue.description || "The current volume highlights emerging trends and interdisciplinary research findings from the recent academic sessions."}</p>
                                        </div>
                                        <div className="flex items-center text-sm font-bold text-indigo-300">
                                            <Calendar className="mr-2 h-4 w-4" /> 
                                            Published on {currentIssue.publishedAt ? new Date(currentIssue.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                        </div>
                                     </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-2xl font-black px-4 border-l-4 border-indigo-600">Table of Contents</h3>
                                    <div className="grid gap-4">
                                        {articles.filter(a => a.issueId === currentIssue.id && a.status === 'published').length === 0 ? (
                                            <Card className="p-12 text-center text-slate-400 border-none shadow-none bg-slate-50 dark:bg-slate-900/50 rounded-[32px]">
                                                <Info className="mx-auto h-8 w-8 opacity-20 mb-2" />
                                                <p className="italic font-medium">Articles for this issue are currently in production.</p>
                                            </Card>
                                        ) : (
                                            articles.filter(a => a.issueId === currentIssue.id && a.status === 'published').map((article) => (
                                                <Card key={article.id} className="group/item hover:bg-white dark:hover:bg-slate-900 border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl p-8 bg-transparent md:bg-white dark:md:bg-slate-900 border-slate-100 dark:border-slate-800">
                                                    <div className="flex flex-col md:flex-row gap-8">
                                                        <div className="flex-1 space-y-4">
                                                            <h4 className="text-xl font-black group-hover/item:text-indigo-600 transition-colors leading-tight">{article.title}</h4>
                                                            <div className="flex flex-wrap gap-2 text-sm font-bold text-slate-400 lowercase italic">
                                                                <span className="flex items-center"><User className="mr-1.5 h-3 w-3" /> Dr. Olumide Johnson</span>
                                                                <span className="opacity-30">•</span>
                                                                <span>University of Lagos</span>
                                                            </div>
                                                            <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed italic">{article.abstract}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <Button asChild className="rounded-2xl h-12 bg-slate-900 hover:bg-black font-black px-6 shadow-lg shadow-slate-200 dark:shadow-none">
                                                                <Link href={`/journal/${slug}/article/${article.id}`}>
                                                                    Read Full Text <ChevronRight className="ml-2 h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200">
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100">
                                <BookOpen className="mx-auto h-16 w-16 text-indigo-200 mb-4" />
                                <h3 className="text-2xl font-black">Coming Soon</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mt-2 italic">The inaugural issue is currently deep in the peer-review cycle.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="archive" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {issues.filter(i => i.isPublished).length === 0 ? (
                                <div className="col-span-full py-20 text-center opacity-40 italic font-medium">Archive is currently empty.</div>
                            ) : (
                                issues.filter(i => i.isPublished).map((issue) => (
                                    <Card key={issue.id} className="group hover:border-indigo-200 transition-all rounded-2xl overflow-hidden shadow-sm hover:shadow-xl">
                                        <div className="h-40 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            {issue.coverUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={issue.coverUrl} alt="Cover" className="h-full w-full object-cover" />
                                            ) : (
                                                <BookOpen className="h-12 w-12 text-slate-300" />
                                            )}
                                        </div>
                                        <CardHeader className="p-6">
                                            <div className="text-xs font-black text-indigo-600 mb-1">VOL {issue.volume} NO {issue.number}</div>
                                            <CardTitle className="text-lg font-black leading-tight">{issue.title || `Issue ${issue.number}, ${issue.year}`}</CardTitle>
                                            <CardDescription className="text-xs italic font-medium pt-1">Published: {issue.publishedAt ? new Date(issue.publishedAt).getFullYear() : issue.year}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="editorial" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="rounded-2xl border-slate-100 p-6 space-y-4">
                                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 flex items-center justify-center font-black">C</div>
                                <div>
                                    <h4 className="font-black text-lg">Dr. Adegoke Babatunde</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Editor-in-Chief</p>
                                    <p className="text-xs text-slate-500 mt-2 font-medium">Department of Statistics, Federal School of Statistics, Nigeria</p>
                                </div>
                            </Card>
                            <Card className="rounded-2xl border-slate-100 p-6 space-y-4">
                                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 flex items-center justify-center font-black">A</div>
                                <div>
                                    <h4 className="font-black text-lg">Prof. Elizabeth Carter</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Associate Editor</p>
                                    <p className="text-xs text-slate-500 mt-2 font-medium">School of Mathematics & Computing, University of Manchester, UK</p>
                                </div>
                            </Card>
                            <Card className="rounded-2xl border-slate-100 p-6 space-y-4">
                                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 flex items-center justify-center font-black">T</div>
                                <div>
                                    <h4 className="font-black text-lg">Dr. Marcus Vance</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Technical Review Editor</p>
                                    <p className="text-xs text-slate-500 mt-2 font-medium">Department of Data Analytics, MIT, USA</p>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="about" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-black border-l-4 border-indigo-600 pl-3">Aims & Scope</h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-serif">
                                    The journal publishes high-quality original research articles, review papers, and technical notes in statistical methodologies, data sciences, computing, and social demographics. We bridge pure statistical theory with robust engineering and empirical applications across developing economies.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xl font-black border-l-4 border-indigo-600 pl-3">Peer Review Policy</h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-serif">
                                    All manuscript submissions undergo a rigorous <strong>Double-Blind Peer Review</strong> process. The identities of reviewers are anonymized to authors, and author identities are removed from materials provided to reviewers. Reviewers utilize structured feedback focusing on scientific validity, research significance, and citation relevance.
                                </p>
                            </div>
                        </div>

                        <div className="border border-slate-100 rounded-2xl p-8 bg-slate-50/50 space-y-4">
                            <h3 className="text-xl font-black">Author Submission Guidelines</h3>
                            <ul className="list-disc pl-5 text-sm text-slate-500 space-y-2 leading-relaxed">
                                <li><strong>Titles</strong> must be descriptive, succinct, and formatted in sentence case.</li>
                                <li><strong>Abstracts</strong> must be a single cohesive paragraph of 150 to 500 words.</li>
                                <li><strong>Keywords</strong> must consist of 5 to 10 terms separated by commas.</li>
                                <li>Manuscript files must be uploaded as <strong>PDF format only</strong>. Ensure all author identities are removed from the document body for blind reviews.</li>
                            </ul>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
