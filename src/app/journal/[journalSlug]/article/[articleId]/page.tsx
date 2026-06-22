import React from "react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Download, ChevronLeft, Quote, Award } from "lucide-react";
import { getArticleById } from "@/actions/journal";
import Link from "next/link";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, generateScholarlyArticleSchema } from "@/components/seo/JsonLd";
import { format } from "date-fns";

interface Author {
    id: number;
    articleId: number;
    name: string;
    email: string | null;
    orcid: string | null;
    affiliation: string | null;
    order: number | null;
    isCorresponding: boolean | null;
}

interface ArticleFile {
    id: number;
    articleId: number;
    fileUrl: string;
    fileName: string | null;
    fileType: "manuscript" | "supplementary" | "review_version" | "galley";
    uploadedAt: Date | null;
}

export async function generateMetadata({ params }: { params: Promise<{ journalSlug: string, articleId: string }> }) {
    const { articleId } = await params;
    const article = await getArticleById(parseInt(articleId));

    if (!article) return {};

    return {
        title: article.title,
        description: article.abstract?.substring(0, 160),
        openGraph: {
            title: article.title,
            description: article.abstract?.substring(0, 160),
            type: "article",
        }
    };
}

export default async function ArticlePage({ params }: { params: Promise<{ journalSlug: string, articleId: string }> }) {
    const { journalSlug, articleId } = await params;
    const article = await getArticleById(parseInt(articleId));

    if (!article) notFound();

    const authors = (article.authors as unknown as Author[]).map((a) => a.name);
    const publishDate = article.publishedDate || article.createdAt;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://schoolportal.edu";
    const canonicalUrl = `${siteUrl}/journal/${journalSlug}/article/${articleId}`;

    const pdfFile = (article.files as unknown as ArticleFile[])?.find(
        (f) => f.fileType === "galley" || f.fileType === "manuscript"
    );
    const citationPdfUrl = pdfFile 
        ? (pdfFile.fileUrl.startsWith("http") ? pdfFile.fileUrl : `${siteUrl}${pdfFile.fileUrl}`)
        : undefined;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
            <SEOHead 
                title={article.title}
                description={article.abstract || undefined}
                keywords={article.keywords || undefined}
                canonical={canonicalUrl}
                ogType="article"
                citationTitle={article.title}
                citationAuthors={authors}
                citationJournalTitle={article.journal?.name}
                citationPublicationDate={publishDate ? format(new Date(publishDate), "yyyy/MM/dd") : undefined}
                citationVolume={article.issue?.volume || undefined}
                citationIssue={article.issue?.number || undefined}
                citationDoi={article.doi || undefined}
                citationPdfUrl={citationPdfUrl}
                dcTitle={article.title}
                dcCreator={authors.join(", ")}
                dcDescription={article.abstract || undefined}
                dcDate={publishDate ? format(new Date(publishDate), "yyyy-MM-dd") : undefined}
            />
            <JsonLd data={generateScholarlyArticleSchema(article)} />

            <Link href={`/journal/${journalSlug}`} className="group text-indigo-600 font-bold flex items-center transition-transform">
                <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Journal
            </Link>

            <section className="space-y-6">
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Badge className="bg-indigo-600 font-black">Open Access Article</Badge>
                        <Badge variant="outline" className="border-slate-300 font-bold">Research Article</Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-900 border-l-8 border-indigo-600 pl-6">
                        {article.title}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-slate-500 font-bold text-sm uppercase italic">
                        <span className="flex items-center"><User className="mr-1.5 h-4 w-4" /> {authors.join(", ")}</span>
                        <span className="opacity-30">•</span>
                        <span>Published on {publishDate ? format(new Date(publishDate), "MMMM d, yyyy") : "N/A"}</span>
                        {article.doi && (
                            <>
                                <span className="opacity-30">•</span>
                                <span className="text-indigo-600">DOI: {article.doi}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button className="h-14 bg-slate-900 hover:bg-black rounded-2xl text-lg font-black shadow-xl shadow-slate-200">
                        <Download className="mr-2 h-5 w-5" /> Download Full PDF
                    </Button>
                    <Button variant="outline" className="h-14 border-slate-200 rounded-2xl text-lg font-black italic">
                        <Quote className="mr-2 h-5 w-5 text-indigo-600" /> How to Cite
                    </Button>
                </div>
            </section>

            <Tabs defaultValue="abstract" className="w-full">
                <TabsList className="bg-white border p-1 rounded-2xl h-14 mb-8">
                    <TabsTrigger value="abstract" className="rounded-xl px-8 h-full font-black">Abstract</TabsTrigger>
                    <TabsTrigger value="details" className="rounded-xl px-8 h-full font-black">Article Info</TabsTrigger>
                </TabsList>

                <TabsContent value="abstract" className="space-y-6">
                    <Card className="border-none shadow-none bg-slate-50 rounded-2xl p-8">
                        <CardHeader className="p-0 mb-4">
                            <CardTitle className="text-sm font-black uppercase text-indigo-600 tracking-widest flex items-center">
                                <Award className="mr-2 h-4 w-4" /> Executive Summary
                            </CardTitle>
                        </CardHeader>
                        <p className="text-lg leading-relaxed text-slate-700 italic">
                            {article.abstract || "No abstract provided for this article."}
                        </p>
                    </Card>
                    
                    {article.keywords && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-black">Keywords</h3>
                            <div className="flex flex-wrap gap-2">
                                {article.keywords.split(',').map((kw: string) => (
                                    <Badge key={kw} variant="secondary" className="bg-white border-slate-200 px-4 py-1 rounded-full text-slate-600">{kw.trim()}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="details">
                     <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>Bibliographic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                <div className="grid grid-cols-3 p-6">
                                    <div className="font-bold text-slate-400 text-xs uppercase tracking-widest">Journal</div>
                                    <div className="col-span-2 font-bold text-slate-900">{article.journal?.name}</div>
                                </div>
                                <div className="grid grid-cols-3 p-6">
                                    <div className="font-bold text-slate-400 text-xs uppercase tracking-widest">Issue</div>
                                    <div className="col-span-2 font-bold text-slate-900">
                                        {article.issue ? `Vol ${article.issue.volume}, No ${article.issue.number} (${article.issue.year})` : "Pre-issue / In Production"}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 p-6">
                                    <div className="font-bold text-slate-400 text-xs uppercase tracking-widest">Authors</div>
                                    <div className="col-span-2">
                                        {(article.authors as unknown as Author[]).map((auth, i) => (
                                            <div key={i} className="mb-2">
                                                <div className="font-bold text-slate-900">{auth.name}</div>
                                                <div className="text-xs text-slate-500 font-medium italic">{auth.affiliation}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
