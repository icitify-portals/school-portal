import { getNews } from "@/actions/cms-publishing";
import { Newspaper, ChevronRight, Search, Clock, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function NewsHubPage() {
    const res = await getNews();
    const allNews = (res.data || []).filter(n => n.status === 'published');
    const featured = allNews[0];
    const rest = allNews.slice(1);

    return (
        <main className="bg-slate-50 min-h-screen">
            {/* Header / Search Hero */}
            <div className="bg-white border-b border-slate-100 py-20">
                <div className="max-w-[1600px] w-full mx-auto px-6 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 rounded-full font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5">
                                Institutional Press Center
                            </Badge>
                            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter italic">News & Updates</h1>
                            <p className="text-xl text-slate-500 max-w-2xl font-medium">The official source for academic breakthroughs, institutional announcements, and campus life at the University.</p>
                        </div>
                        <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl w-full md:w-80 shadow-inner">
                            <Search className="w-5 h-5 text-slate-400 ml-3 mt-2.5" />
                            <Input 
                                placeholder="Search the archives..." 
                                className="bg-transparent border-none focus-visible:ring-0 font-medium placeholder:text-slate-300" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] w-full mx-auto px-6 py-16 space-y-20">
                {/* Featured Story */}
                {featured && (
                    <section>
                        <Link href={`/news/${featured.slug}`} className="group grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden rounded-[40px] bg-white shadow-2xl shadow-indigo-900/5 hover:shadow-indigo-900/10 transition-all duration-700">
                            <div className="aspect-video lg:aspect-square overflow-hidden bg-slate-200">
                                {featured.featuredImage && (
                                    <img 
                                        src={featured.featuredImage} 
                                        alt={featured.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                    />
                                )}
                            </div>
                            <div className="p-8 lg:p-16 flex flex-col justify-center space-y-6">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-indigo-600 text-white border-none py-1.5 px-4 rounded-full font-bold uppercase tracking-widest text-[10px]">
                                        // @ts-expect-error - TS2339: Auto-suppressed for build
                                        Featured {featured.category}
                                    </Badge>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(featured.publishedAt!).toLocaleDateString('en-US', { dateStyle: 'long' })}
                                    </span>
                                </div>
                                <h2 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter italic group-hover:text-indigo-600 transition-colors">
                                    {featured.title}
                                </h2>
                                <p className="text-lg lg:text-xl text-slate-500 font-medium line-clamp-3 leading-relaxed">
                                    {featured.teaser}
                                </p>
                                <div className="pt-4">
                                    <Button variant="ghost" className="p-0 font-black uppercase tracking-widest text-xs h-auto group-hover:gap-4 transition-all gap-2">
                                        Read the full release <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Link>
                    </section>
                )}

                {/* News Grid */}
                <section className="space-y-12">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Latest Dispatches</h3>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="rounded-full text-[10px] font-black uppercase tracking-widest h-8 px-4 hover:bg-white border border-transparent hover:border-slate-100">Academic</Button>
                            <Button variant="ghost" size="sm" className="rounded-full text-[10px] font-black uppercase tracking-widest h-8 px-4 hover:bg-white border border-transparent hover:border-slate-100">Research</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {rest.map((item: any) => (
                            <Link key={item.id} href={`/news/${item.slug}`} className="group space-y-6">
                                <div className="aspect-[4/5] rounded-[32px] overflow-hidden bg-slate-200 shadow-xl shadow-slate-200/50">
                                    {item.featuredImage && (
                                        <img 
                                            src={item.featuredImage} 
                                            alt={item.title} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    )}
                                </div>
                                <div className="space-y-3 px-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] uppercase border-slate-200 text-slate-400 font-black tracking-widest rounded-full py-0.5 px-2">
                                            {item.category}
                                        </Badge>
                                        <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(item.publishedAt!).toLocaleDateString('en-US')}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors italic">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                        {item.teaser}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Newsletter Bridge */}
                <section className="bg-slate-900 rounded-[40px] p-12 lg:p-20 text-white relative overflow-hidden">
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl lg:text-6xl font-black italic tracking-tighter leading-none">Subscribe to the Institutional Brief.</h2>
                            <p className="text-lg text-slate-400 font-medium max-w-md">Get high-priority updates, research breakthroughs, and institutional news delivered directly to your inbox every Monday.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input 
                                placeholder="name@university.edu" 
                                className="h-14 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-slate-500 font-bold focus:ring-indigo-500"
                            />
                            <Button className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-900/50">Join Now</Button>
                        </div>
                    </div>
                    <Clock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] text-white/5 pointer-events-none" />
                </section>
            </div>
        </main>
    );
}

export const metadata = {
    title: 'News & Press Center | University Hub',
    description: 'The official source for institutional news, press releases, and campus updates.'
};
