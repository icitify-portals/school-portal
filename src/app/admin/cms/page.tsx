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
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight italic">Institutional Hub</h1>
                        <p className="text-slate-500 mt-1">Manage institutional news, campus events, and academic content.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button asChild variant="outline" className="rounded-xl border-slate-200 font-bold px-6">
                            <Link href="/admin/cms/news/new">
                                <Plus className="w-5 h-5 mr-2" />
                                Post News
                            </Link>
                        </Button>
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 rounded-xl transition-all h-11 px-6 font-bold">
                            <Link href="/admin/cms/new">
                                <Plus className="w-5 h-5 mr-2" />
                                Create Page
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Shared Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Pages</CardTitle>
                            <FileText className="w-5 h-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900 italic">{pages.length}</div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Institutional Web Pages</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Published News</CardTitle>
                            <Newspaper className="w-5 h-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900 italic">{news.length}</div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Press Releases & Blogs</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Upcoming Events</CardTitle>
                            <Calendar className="w-5 h-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900 italic">{events.length}</div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Campus Calendar Items</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-none shadow-sm bg-indigo-600 text-white overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-black text-indigo-300 uppercase tracking-widest">Review queue</CardTitle>
                            <Stamp className="w-5 h-5 text-white animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white italic">
                                {reviewQueue.pages.length + reviewQueue.news.length + reviewQueue.events.length}
                            </div>
                            <p className="text-[10px] uppercase font-bold text-indigo-200 mt-1">Action items pending</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="pages" className="space-y-6">
                    <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 h-auto">
                        <TabsTrigger value="pages" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">Pages</TabsTrigger>
                        <TabsTrigger value="news" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">Press Hub</TabsTrigger>
                        <TabsTrigger value="events" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">Events</TabsTrigger>
                        <TabsTrigger value="review" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white relative">
                            Review Queue
                            {(reviewQueue.pages.length + reviewQueue.news.length + reviewQueue.events.length) > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center border-2 border-white">{reviewQueue.pages.length + reviewQueue.news.length + reviewQueue.events.length}</span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pages">

                {/* Main Content Table */}
                <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b border-slate-50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900">Pages List</CardTitle>
                            <CardDescription>View and manage all dynamic website content</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search pages..."
                                className="pl-10 h-10 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
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
                        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold">Press & Official News</CardTitle>
                                    <CardDescription>Manage university press releases and departmental news.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
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
                                <Card className="p-12 text-center text-slate-500 font-medium italic rounded-2xl bg-white border-none">
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
        <Card className="rounded-2xl border-none shadow-lg bg-white overflow-hidden p-5 space-y-4">
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
