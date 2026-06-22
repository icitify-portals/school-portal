import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/db/db";
import { libraryResources } from "@/db/schema";
import { like, or } from "drizzle-orm";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, generateFaqSchema } from "@/components/seo/JsonLd";
import { generateAiMetaDescription, suggestLongTailKeywords } from "@/actions/seo-ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles, BookCopy, GraduationCap, Microscope } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params;
    const catName = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
    
    const description = await generateAiMetaDescription(`A comprehensive list of educational resources, books, and courses related to ${catName}.`, "page");

    return {
        title: `Best ${catName} Resources & Study Materials`,
        description: description,
    };
}

export default async function CategoryLandingPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params;
    const catName = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');

    // Fetch resources belonging to this category or matching the name in tags
    const resources = await db.query.libraryResources.findMany({
        where: or(
            like(libraryResources.category, `%${catName}%`),
            like(libraryResources.aiTags, `%${catName}%`),
            like(libraryResources.title, `%${catName}%`)
        ),
        limit: 12
    });

    if (resources.length === 0) notFound();

    const longTailSuggestions = await suggestLongTailKeywords(catName);

    const faqs = [
        { question: `What are the best books for ${catName}?`, answer: `Our library features a curated collection of top-rated ${catName} resources, including textbooks and research papers verified by academic experts.` },
        { question: `Are there ${catName} courses available?`, answer: `Yes, we offer specialized eLearning courses for ${catName} tailored for exam preparation like WAEC and JAMB.` },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            <SEOHead 
                title={`${catName} Resources`}
                description={`Explore the top-rated ${catName} books, research papers, and study guides selected for academic excellence.`}
            />
            <JsonLd data={generateFaqSchema(faqs)} />

            {/* Programmatic Hero */}
            <div className="relative py-32 flex items-center justify-center overflow-hidden border-b border-slate-900">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 to-slate-950 z-0" />
                <div className="relative z-10 max-w-4xl px-6 text-center space-y-8">
                     <Badge className="bg-indigo-600 text-white px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-[.2em] shadow-2xl">
                        {category.toUpperCase()} HUB
                     </Badge>
                     <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none italic">
                        Mastering <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{catName}</span>
                     </h1>
                     <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        Access our curated collection of {resources.length} professional resources specifically selected for students and researchers focusing on <span className="text-white">{catName}</span>.
                     </p>
                </div>
            </div>

            {/* SEO Keyword Cloud (UX and Crawler benefit) */}
            <div className="max-w-[1600px] w-full mx-auto px-6 py-12 flex flex-wrap justify-center gap-4">
                {longTailSuggestions.map((kw, i) => (
                    <Badge key={i} variant="outline" className="border-slate-800 text-slate-500 font-bold hover:text-indigo-400 transition-colors cursor-default">
                        #{kw.replace(/\s+/g, '')}
                    </Badge>
                ))}
            </div>

            {/* Results Grid */}
            <div className="max-w-[1600px] w-full mx-auto px-6 mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {resources.map((book, i) => (
                    <Link href={`/books/${book.id}`} key={i} className="group">
                        <div className="p-8 bg-slate-900/50 rounded-[40px] border border-slate-800 hover:border-indigo-500/50 transition-all flex gap-6 items-center h-full relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 h-24 w-24 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-all" />
                            <div className="h-32 w-24 bg-slate-800 rounded-2xl overflow-hidden shrink-0 shadow-xl transition-transform group-hover:scale-105">
                                <img src={book.coverUrl || "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1974&auto=format&fit=crop"} className="h-full w-full object-cover" />
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-black uppercase text-indigo-400 tracking-widest flex items-center">
                                    <Sparkles className="mr-1 h-3 w-3 fill-current" /> TOP RESOURCE
                                </div>
                                <h3 className="font-black text-xl line-clamp-2 leading-tight italic group-hover:text-indigo-400 transition-colors">{book.title}</h3>
                                <p className="text-xs font-bold text-slate-500 line-clamp-1">By {book.authors}</p>
                                <div className="flex items-center gap-2 pt-2">
                                    <ArrowRight className="h-4 w-4 text-slate-700 group-hover:translate-x-2 group-hover:text-indigo-500 transition-all" />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Programmatic CTAs */}
            <div className="max-w-4xl mx-auto px-6 mt-32">
                <div className="p-12 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[50px] text-center space-y-8 shadow-2xl relative overflow-hidden">
                    <GraduationCap className="absolute -left-10 -bottom-10 h-64 w-64 text-white/5 rotate-12" />
                    <h2 className="text-4xl font-black tracking-tight relative z-10 leading-tight">
                        Preparing for an Exam in {catName}?
                    </h2>
                    <p className="text-indigo-100 text-lg font-medium relative z-10 max-w-xl mx-auto leading-relaxed">
                        Join 5,000+ other students using our specialized courses and study groups to excel in {catName}.
                    </p>
                    <div className="relative z-10 flex justify-center gap-4">
                        <Button className="h-16 px-12 rounded-2xl bg-white text-indigo-900 hover:bg-slate-100 font-black text-lg shadow-xl">
                            Join Study Group
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
