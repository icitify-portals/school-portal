import { getNews } from "@/actions/cms-publishing";
import { Newspaper, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function NewsFeedBlock({ title, subtitle }: { title?: string; subtitle?: string }) {
    const res = await getNews();
    const latestNews = (res.data || [])
        .filter(n => n.status === 'published')
        .slice(0, 3);

    if (latestNews.length === 0) return null;

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-1 rounded-full bg-indigo-600" />
                            <span className="text-sm font-black uppercase tracking-[0.3em] text-indigo-600">Press Center</span>
                        </div>
                        <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter italic leading-none">
                            {title || "Institutional Dispatches"}
                        </h2>
                        <p className="text-xl text-slate-500 font-medium max-w-2xl italic">
                            {subtitle || "The latest breakthroughs from our research labs and academic communities."}
                        </p>
                    </div>
                    <Button asChild variant="ghost" className="group rounded-full font-black uppercase tracking-widest text-xs h-12 px-8 hover:bg-slate-50 border border-slate-100 transition-all gap-3">
                        <Link href="/news">
                            Explore Archives
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {latestNews.map((item: any, idx) => (
                        <Link 
                            key={item.id} 
                            href={`/news/${item.slug}`} 
                            className="group flex flex-col h-full bg-slate-50 rounded-[40px] overflow-hidden hover:bg-white hover:shadow-2xl hover:shadow-indigo-900/10 transition-all duration-500 border border-transparent hover:border-indigo-50"
                        >
                            <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-200">
                                {item.featuredImage && (
                                    <img 
                                        src={item.featuredImage} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                    />
                                )}
                                <div className="absolute top-6 left-6">
                                    <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none rounded-full py-1.5 px-4 font-black uppercase tracking-widest text-[9px] shadow-lg">
                                        {item.category}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-8 lg:p-10 flex flex-col flex-1 space-y-4">
                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-2">
                                    <Newspaper className="w-3 h-3" />
                                    {new Date(item.publishedAt!).toLocaleDateString("en-US", { dateStyle: 'long' })}
                                </div>
                                <h3 className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight tracking-tighter italic group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {item.title}
                                </h3>
                                <p className="text-slate-500 font-medium leading-relaxed line-clamp-3 text-sm">
                                    {item.teaser}
                                </p>
                                <div className="mt-auto pt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
                                    Briefing Details <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            
            {/* Background Aesthetic */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        </section>
    );
}
