import { getNewsBySlug, getNews } from "@/actions/cms-publishing";
import { notFound } from "next/navigation";
import { sanitizeRichContent } from "@/lib/sanitizer";
import { Calendar, User, Tag, Clock, ChevronRight, Share2, Facebook, Twitter, Linkedin, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function NewsArticlePage({ params }: { params: { slug: string } }) {
    const res = await getNewsBySlug(params.slug);
    if (!res.success || !res.data) return notFound();

    const article = res.data;
    const moreNewsRes = await getNews();
    const moreNews = (moreNewsRes.data || [])
        .filter(n => n.id !== article.id && n.status === 'published')
        .slice(0, 3);

    // JSON-LD for SEO
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "image": [article.featuredImage],
        "datePublished": article.publishedAt?.toISOString(),
        "dateModified": article.updatedAt?.toISOString(),
        "author": [{
            "@type": "Organization",
            "name": "Institutional Communications",
            "url": "https://portal-moodle.edu"
        }],
        "description": article.teaser
    };

    return (
        <main className="bg-white min-h-screen">
            {/* SEO Metadata injection - standard Next.js head handled by metadata export */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Premium News Header */}
            <div className="relative h-[60vh] min-h-[400px] w-full bg-slate-900 overflow-hidden">
                {article.featuredImage && (
                    <img 
                        src={article.featuredImage} 
                        alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                
                <div className="absolute bottom-0 left-0 w-full p-8 lg:p-20">
                    <div className="max-w-[1600px] w-full mx-auto space-y-6">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-indigo-600 text-white border-none py-1.5 px-4 rounded-full font-bold uppercase tracking-widest text-xs">
                                {article.category}
                            </Badge>
                            <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-tighter">
                                <Clock className="w-4 h-4" />
                                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Draft'}
                            </div>
                        </div>
                        <h1 className="text-4xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter drop-shadow-2xl italic">
                            {article.title}
                        </h1>
                        <p className="text-xl lg:text-2xl text-slate-200 font-medium max-w-3xl leading-relaxed italic opacity-90">
                            {article.teaser}
                        </p>
                    </div>
                </div>
            </div>

            {/* Article Content Area */}
            <div className="max-w-[1600px] w-full mx-auto px-6 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-12">
                        <div className="prose prose-slate prose-xl max-w-none 
                            prose-headings:font-black prose-headings:italic prose-headings:tracking-tighter
                            prose-p:text-slate-600 prose-p:leading-relaxed
                            prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-slate-100"
                        >
                            {/* SECURITY FIX H-2c: Sanitize article content before render */}
                            <div dangerouslySetInnerHTML={{ __html: sanitizeRichContent(article.content) }} />
                        </div>

                        {/* Social Share */}
                        <div className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-black uppercase text-slate-400 tracking-widest">Circulate this update</span>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" className="rounded-full hover:bg-blue-50 hover:text-blue-600"><Facebook className="w-5 h-5" /></Button>
                                    <Button size="icon" variant="ghost" className="rounded-full hover:bg-sky-50 hover:text-sky-600"><Twitter className="w-5 h-5" /></Button>
                                    <Button size="icon" variant="ghost" className="rounded-full hover:bg-indigo-50 hover:text-indigo-600"><Linkedin className="w-5 h-5" /></Button>
                                    <Button size="icon" variant="ghost" className="rounded-full hover:bg-slate-50"><Share2 className="w-5 h-5" /></Button>
                                </div>
                            </div>
                            <Button asChild variant="outline" className="rounded-full border-2 border-slate-200 font-bold p-6 hover:bg-slate-50">
                                <Link href="/news">Back to Press Center</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-12">
                        <div className="bg-slate-50 rounded-2xl p-8 space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">Institutional Feed</h3>
                            <div className="space-y-8">
                                {moreNews.map((n: any) => (
                                    <Link key={n.id} href={`/news/${n.slug}`} className="group block space-y-3">
                                        <div className="aspect-video rounded-2xl overflow-hidden bg-slate-200">
                                            {n.featuredImage && (
                                                <img src={n.featuredImage} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Badge variant="outline" className="text-[10px] uppercase border-slate-200 text-slate-500 rounded-full px-2">{n.category}</Badge>
                                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{n.title}</h4>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* School Badge/CTA */}
                        <div className="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
                            <div className="relative z-10 space-y-4">
                                <h3 className="text-xl font-black italic tracking-tighter">Stay updated on institutional progress.</h3>
                                <p className="text-indigo-100 text-sm">Join our mailing list for weekly briefings from the Vice Chancellor's office.</p>
                                <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl font-bold h-12 shadow-xl shadow-indigo-900/20">Subscribe Now</Button>
                            </div>
                            <Newspaper className="absolute -bottom-10 -right-10 w-40 h-40 text-indigo-500/30 rotate-12" />
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

// Metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }) {
    const res = await getNewsBySlug(params.slug);
    if (!res.success || !res.data) return { title: 'News Not Found' };
    
    return {
        title: `${res.data.title} | University Press Center`,
        description: res.data.teaser,
        openGraph: {
            images: [res.data.featuredImage],
            title: res.data.title,
            description: res.data.teaser
        }
    };
}
