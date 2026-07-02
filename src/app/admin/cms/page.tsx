"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    FileText,
    ExternalLink,
    MoreVertical,
    Edit,
    Globe,
    Lock,
    Copy,
    AlertCircle,
    Newspaper,
    Calendar,
    Stamp,
    Clock,
    XCircle,
    CheckCircle2,
    Eye,
    Trash2,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getPages, deletePage, duplicatePage } from "@/actions/cms";
import { getNews, getEvents, getReviewQueue, approveContent, rejectContent } from "@/actions/cms-publishing";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CmsDashboard() {
    const router = useRouter();
    const [pages, setPages] = useState<any[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [reviewQueue, setReviewQueue] = useState<any>({ pages: [], news: [], events: [] });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = async () => {
        setLoading(true);
        const [pagesRes, newsRes, eventsRes, reviewRes] = await Promise.all([
            getPages(),
            getNews(),
            getEvents(),
            getReviewQueue()
        ]);

        if (pagesRes.success) setPages(pagesRes.data || []);
        if (newsRes.success) setNews(newsRes.data || []);
        if (eventsRes.success) setEvents(eventsRes.data || []);
        if (reviewRes.success) setReviewQueue(reviewRes.data);
        
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this page? This cannot be undone.")) return;
        const res = await deletePage(id);
        if (res.success) {
            toast.success("Page deleted successfully");
            fetchData();
        } else {
            toast.error(res.error || "Failed to delete page");
        }
    };

    const handleDuplicate = async (id: number) => {
        const res = await duplicatePage(id);
        if (res.success) {
            toast.success("Page duplicated! Redirecting to draft...");
            router.push(`/admin/cms/${res.id}/edit`);
        } else {
            toast.error(res.error || "Duplication failed");
        }
    };

    const filteredPages = pages.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Globe className="w-12 h-12 text-rose-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic">
                                    Institutional Hub
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Manage institutional news, campus events, public announcements, and academic web content.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                            <Button asChild className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-6 rounded-2xl transition-all uppercase tracking-widest text-xs border border-white/20 backdrop-blur-md">
                                <Link href="/admin/cms/news/new">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Post News
                                </Link>
                            </Button>
                            <Button asChild className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-6 rounded-2xl shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)] transition-all uppercase tracking-widest text-xs border border-white/10">
                                <Link href="/admin/cms/new">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create Page
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Shared Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border border-indigo-100/50 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Pages</CardTitle>
                            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="text-4xl font-black text-slate-900 tracking-tighter">{pages.length}</div>
                            <p className="text-[10px] uppercase font-bold text-slate-500 mt-2 tracking-widest">Institutional Web Pages</p>
                        </CardContent>
                    </Card>
                    <Card className="border border-emerald-100/50 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Published News</CardTitle>
                            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
                                <Newspaper className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="text-4xl font-black text-slate-900 tracking-tighter">{news.length}</div>
                            <p className="text-[10px] uppercase font-bold text-slate-500 mt-2 tracking-widest">Press Releases & Blogs</p>
                        </CardContent>
                    </Card>
                    <Card className="border border-amber-100/50 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Upcoming Events</CardTitle>
                            <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shadow-inner group-hover:scale-110 transition-transform">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="text-4xl font-black text-slate-900 tracking-tighter">{events.length}</div>
                            <p className="text-[10px] uppercase font-bold text-slate-500 mt-2 tracking-widest">Campus Calendar Items</p>
                        </CardContent>
                    </Card>
                    <Card className="border border-rose-500 shadow-[0_0_40px_-10px_rgba(244,63,94,0.3)] bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                            <CardTitle className="text-xs font-black text-rose-100 uppercase tracking-widest">Review queue</CardTitle>
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white shadow-inner group-hover:scale-110 transition-transform">
                                <Stamp className="w-5 h-5 animate-pulse" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="text-4xl font-black text-white tracking-tighter">
                                {reviewQueue.pages.length + reviewQueue.news.length + reviewQueue.events.length}
                            </div>
                            <p className="text-[10px] uppercase font-bold text-rose-200 mt-2 tracking-widest">Action items pending</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="pages" className="space-y-8">
                    <div className="flex gap-2 p-1.5 bg-slate-200/50 backdrop-blur-xl rounded-2xl w-fit border border-slate-200 shadow-inner">
                        <TabsList className="bg-transparent border-none p-0 h-auto">
                            <TabsTrigger value="pages" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-md transition-all">Pages</TabsTrigger>
                            <TabsTrigger value="news" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-md transition-all">Press Hub</TabsTrigger>
                            <TabsTrigger value="events" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-md transition-all">Events</TabsTrigger>
                            <TabsTrigger value="review" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-rose-600 data-[state=active]:text-white relative transition-all">
                                Review Queue
                                {(reviewQueue.pages.length + reviewQueue.news.length + reviewQueue.events.length) > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full text-rose-600 text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-rose-600">{reviewQueue.pages.length + reviewQueue.news.length + reviewQueue.events.length}</span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="pages">

                {/* Main Content Table */}
                <Card className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                    <CardHeader className="border-b border-white/40 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40">
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Pages List</CardTitle>
                            <CardDescription className="text-slate-500 font-medium tracking-tight mt-1">View and manage all dynamic website content</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search pages..."
                                className="pl-11 h-12 rounded-2xl bg-white/50 border border-white/50 focus:ring-2 focus:ring-indigo-500/20 shadow-inner backdrop-blur-sm transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-100/30">
                                    <TableRow>
                                        <TableHead className="font-bold text-slate-700 h-12">Title</TableHead>
                                        <TableHead className="font-bold text-slate-700 h-12">Slug/URL</TableHead>
                                        <TableHead className="font-bold text-slate-700 h-12">Status</TableHead>
                                        <TableHead className="font-bold text-slate-700 h-12 text-right px-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [1, 2, 3].map(i => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={4} className="h-16 animate-pulse bg-slate-50/30" />
                                            </TableRow>
                                        ))
                                    ) : filteredPages.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-slate-500 font-medium">
                                                No pages found. Start by creating a new one!
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPages.map((page) => (
                                            <TableRow key={page.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <TableCell>
                                                    <div className="font-bold text-slate-900">{page.title}</div>
                                                    {page.isSystemPage && <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest mt-1 text-indigo-500 bg-indigo-50 border-indigo-200">System</Badge>}
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                                                        /{page.slug}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                                                        page.status === 'published'
                                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                                            : "bg-amber-50 text-amber-600 border border-amber-200"
                                                    )}>
                                                        {page.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" asChild className="h-9 w-9 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                            <Link href={`/${page.slug}`} target="_blank">
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" asChild className="h-9 w-9 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                            <Link href={`/admin/cms/${page.id}/edit`}>
                                                                <Edit className="w-4 h-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                            onClick={() => handleDuplicate(page.id)}
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                "h-9 w-9 rounded-lg transition-colors",
                                                                page.isSystemPage 
                                                                    ? "text-slate-200 cursor-not-allowed" 
                                                                    : "text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                            )}
                                                            onClick={() => !page.isSystemPage && handleDelete(page.id)}
                                                            disabled={page.isSystemPage}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="md:hidden">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-100">
                                                                <DropdownMenuItem asChild className="rounded-lg">
                                                                    <Link href={`/${page.slug}`} target="_blank" className="flex items-center">
                                                                        <Eye className="w-4 h-4 mr-2" /> View Public
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild className="rounded-lg">
                                                                    <Link href={`/admin/cms/${page.id}/edit`} className="flex items-center">
                                                                        <Edit className="w-4 h-4 mr-2" /> Edit Page
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="rounded-lg" onClick={() => handleDuplicate(page.id)}>
                                                                    <Copy className="w-4 h-4 mr-2" /> Duplicate
                                                                </DropdownMenuItem>
                                                                {!page.isSystemPage && (
                                                                    <DropdownMenuItem className="text-red-600 rounded-lg" onClick={() => handleDelete(page.id)}>
                                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

                    <TabsContent value="news">
                        <Card className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                            <CardHeader className="border-b border-white/40 p-6 sm:p-8 flex flex-row items-center justify-between bg-white/40">
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Press & Official News</CardTitle>
                                    <CardDescription className="text-slate-500 font-medium tracking-tight mt-1">Manage university press releases and departmental news.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-100/30">
                                        <TableRow>
                                            <TableHead className="font-bold text-slate-700 h-12">Headline</TableHead>
                                            <TableHead className="font-bold text-slate-700 h-12">Category</TableHead>
                                            <TableHead className="font-bold text-slate-700 h-12">Status</TableHead>
                                            <TableHead className="font-bold text-slate-700 h-12 text-right px-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {news.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-400">No news articles yet.</TableCell></TableRow>
                                        ) : news.map(item => (
                                            <TableRow key={item.id} className="group">
                                                <TableCell className="font-bold text-slate-900">{item.title}</TableCell>
                                                <TableCell><Badge variant="outline" className="rounded-full bg-indigo-50 text-indigo-600 border-indigo-100">{item.category}</Badge></TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                                                        item.status === 'published' ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500"
                                                    )}>{item.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 hover:bg-slate-100 rounded-lg">
                                                        <Link href={`/admin/cms/news/${item.id}/edit`}><Edit className="w-4 h-4" /></Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="review">
                        <div className="space-y-6">
                            {(reviewQueue.pages.length + reviewQueue.news.length + reviewQueue.events.length) === 0 ? (
                                <Card className="p-12 text-center text-slate-500 font-medium italic rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50">
                                    Queue is empty. Institutional peace!
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {reviewQueue.pages.map((p: any) => (
                                        <ReviewCard key={p.id} item={p} type="page" onAction={fetchData} />
                                    ))}
                                    {reviewQueue.news.map((n: any) => (
                                        <ReviewCard key={n.id} item={n} type="news" onAction={fetchData} />
                                    ))}
                                    {reviewQueue.events.map((e: any) => (
                                        <ReviewCard key={e.id} item={e} type="event" onAction={fetchData} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function ReviewCard({ item, type, onAction }: { item: any; type: string; onAction: () => void }) {
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        const res = await approveContent(type as any, item.id);
        if (res.success) {
            toast.success("Content published!");
            onAction();
        }
        setLoading(false);
    };

    const handleReject = async () => {
        setLoading(true);
        const res = await rejectContent(type as any, item.id);
        if (res.success) {
            toast.info("Content sent back to editor");
            onAction();
        }
        setLoading(false);
    };

    return (
        <Card className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden p-5 space-y-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
                <Badge className="bg-indigo-600 text-white border-none rounded-lg text-[9px] uppercase font-black px-2">{type}</Badge>
                <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase">{new Date(item.updatedAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div>
                <h4 className="font-bold text-slate-900 leading-tight line-clamp-2">{item.title}</h4>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Submitted for Review
                </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReject} 
                    disabled={loading}
                    className="rounded-xl border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 font-bold text-[10px] uppercase h-8"
                >
                    <XCircle className="w-3 h-3 mr-1.5" /> Reject
                </Button>
                <Button 
                    size="sm" 
                    onClick={handleApprove} 
                    disabled={loading}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-[10px] uppercase h-8"
                >
                    <CheckCircle2 className="w-3 h-3 mr-1.5" /> Approve
                </Button>
            </div>
        </Card>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
