import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/db/db";
import { libraryResources } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, generateBookSchema } from "@/components/seo/JsonLd";
import { generateAiMetaDescription, generateAiSummary } from "@/actions/seo-ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Star, BookOpen, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getLibraryRecommendations } from "@/actions/library";

/**
 * Metadata Generation for ISR
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const resource = await db.query.libraryResources.findFirst({
        where: eq(libraryResources.id, parseInt(id))
    });

    if (!resource) return {};

    const description = resource.description || await generateAiMetaDescription(resource.title, "book");

    return {
        title: resource.title,
        description: description,
        openGraph: {
            title: resource.title,
            description: description,
            images: [resource.coverUrl || "https://schoolportal.com/default-book.png"],
        }
    };
}

export default async function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const resourceId = parseInt(id);
    
    const resource = await db.query.libraryResources.findFirst({
        where: eq(libraryResources.id, resourceId)
    });

    if (!resource) notFound();

    const recommendations = await getLibraryRecommendations(resourceId);
    const aiSummary = await generateAiSummary(`${resource.title} by ${resource.authors}. ${resource.description}`);

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            <SEOHead 
                title={resource.title}
                description={resource.description || undefined}
                ogType="book"
                ogImage={resource.coverUrl || undefined}
            />
            <JsonLd data={generateBookSchema(resource)} />

            {/* Navigation */}
            <div className="max-w-[1600px] w-full mx-auto px-6 py-12">
                <Link href="/library" className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-black uppercase tracking-widest">Back to Library</span>
                </Link>
            </div>

            <div className="max-w-[1600px] w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Book Cover */}
                <div className="lg:col-span-4">
                    <div className="aspect-[2/3] rounded-[40px] overflow-hidden shadow-2xl relative group">
                        <img 
                            src={resource.coverUrl || "https://images.unsplash.com/photo-1543004218-ee141104975a?q=80&w=1974&auto=format&fit=crop"} 
                            className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                            alt={resource.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="space-y-4">
                        <Badge className="bg-indigo-600 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest">
                            {resource.category || "Scholarly Resource"}
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none italic">
                            {resource.title}
                        </h1>
                        <div className="flex items-center gap-4 text-slate-400">
                            <span className="font-bold text-xl italic">By {resource.authors}</span>
                            <div className="h-4 w-[1px] bg-slate-800" />
                            <span className="text-sm font-medium">ISBN: {resource.isbn || "N/A"}</span>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-12">
                        <div className="space-y-1">
                            <div className="text-2xl font-black">{resource.availableCopies}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Available Copies</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-black">{resource.totalCopies}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Cataloged</div>
                        </div>
                    </div>

                    {/* AI Summary */}
                    {aiSummary && (
                        <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[40px] space-y-4 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 h-24 w-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all" />
                            <div className="flex items-center gap-2 text-indigo-400 font-black uppercase text-[10px] tracking-[.2em]">
                                <Star className="h-4 w-4 fill-current" /> AI Insights
                            </div>
                            <p className="text-lg text-indigo-100 font-medium italic leading-relaxed">
                                "{aiSummary}"
                            </p>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black tracking-tight">Full Description</h2>
                        <p className="text-slate-400 leading-relaxed text-lg max-w-3xl">
                            {resource.description || "No description available for this resource."}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Button className="h-16 px-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg shadow-xl shadow-indigo-600/20">
                            Reserve Now
                        </Button>
                        <Button variant="outline" className="h-16 px-8 rounded-2xl border-slate-800 bg-transparent hover:bg-slate-900 font-black">
                            <Bookmark className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="max-w-[1600px] w-full mx-auto px-6 mt-32 space-y-12">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black tracking-tight">Expand Your Knowledge</h2>
                        <p className="text-slate-500 font-bold italic">Related resources based on your interest.</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
                        {recommendations.map((rec, i) => (
                            <Link href={`/books/${rec.id}`} key={i} className="group space-y-4">
                                <div className="aspect-[2/3] bg-slate-900 rounded-[30px] overflow-hidden shadow-xl transition-all group-hover:-translate-y-4">
                                    <img src={rec.coverUrl || "https://images.unsplash.com/photo-1543004218-ee141104975a?q=80&w=1974&auto=format&fit=crop"} className="h-full w-full object-cover" />
                                </div>
                                <div className="font-black text-sm line-clamp-1 italic group-hover:text-indigo-400 transition-colors">{rec.title}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
