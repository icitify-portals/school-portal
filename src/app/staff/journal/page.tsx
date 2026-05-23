"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Users, ClipboardCheck, Calendar, CheckCircle2, XCircle, Clock, Eye, FileEdit, Package, Sparkles, Wand2, Megaphone, Trash2, Languages, Save } from "lucide-react";
import { getAllJournals, getArticlesByJournalId, updateArticleStatus, assignReviewer, generateArticleDoi, registerArticleDoiWithCrossref, updateArticleMetadata } from "@/actions/journal";
import { summarizeSubmission, suggestSemanticReviewers, translateArticleMetadata } from "@/actions/journal-ai";
import { createAnnouncement, getActiveAnnouncements, deleteAnnouncement } from "@/actions/journal-announcements";
import { getUsers } from "@/actions/rbac";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function StaffJournalPage() {
    const [journals, setJournals] = useState<any[]>([]);
    const [selectedJournalId, setSelectedJournalId] = useState<string>("");
    const [articles, setArticles] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [reviewerId, setReviewerId] = useState<string>("");
    const [doi, setDoi] = useState<string>("");
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isAnnounceDialogOpen, setIsAnnounceDialogOpen] = useState(false);
    const [newAnnounce, setNewAnnounce] = useState({ title: "", content: "", type: "news", isPublic: true });
    const [isTranslationDialogOpen, setIsTranslationDialogOpen] = useState(false);
    const [translationData, setTranslationData] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            const [journalsData, usersData, announceData] = await Promise.all([
                getAllJournals(),
                getUsers(),
                getActiveAnnouncements()
            ]);
            setJournals(journalsData);
            if (journalsData.length > 0) {
                setSelectedJournalId(journalsData[0].id.toString());
            }
            setUsers(usersData);
            setAnnouncements(announceData);
        };
        init();
    }, []);

    useEffect(() => {
        if (selectedJournalId) {
            fetchArticles(parseInt(selectedJournalId));
        }
    }, [selectedJournalId]);

    const fetchArticles = async (journalId: number) => {
        setIsLoading(true);
        const data = await getArticlesByJournalId(journalId);
        setArticles(data);
        setIsLoading(false);
    };

    const handleAssignReviewer = async () => {
        if (!selectedArticle || !reviewerId) return;
        const res = await assignReviewer(selectedArticle.id, parseInt(reviewerId));
        if (res.success) {
            toast.success("Reviewer assigned successfully");
            setIsReviewDialogOpen(false);
            fetchArticles(parseInt(selectedJournalId));
        } else {
            toast.error((res as any).error || "Failed to assign reviewer");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "submitted": return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Pending Review</Badge>;
            case "under_review": return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center"><Clock className="h-3 w-3 mr-1" /> Under Review</Badge>;
            case "accepted": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Accepted</Badge>;
            case "declined": return <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-200 flex items-center"><XCircle className="h-3 w-3 mr-1" /> Declined</Badge>;
            case "copyediting": return <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center"><FileEdit className="h-3 w-3 mr-1" /> Copyediting</Badge>;
            case "production": return <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 flex items-center"><Package className="h-3 w-3 mr-1" /> Production</Badge>;
            case "published": return <Badge className="bg-indigo-600">Published</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen dark:bg-slate-950/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Editorial Dashboard</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage scholarly peer review and publication workflows.</p>
                </div>
                <div className="w-full md:w-64">
                    <Select value={selectedJournalId} onValueChange={setSelectedJournalId}>
                        <SelectTrigger className="w-full h-11 border-slate-200 dark:border-slate-800 focus:ring-indigo-500">
                            <SelectValue placeholder="Select Journal" />
                        </SelectTrigger>
                        <SelectContent>
                            {journals.map(j => (
                                <SelectItem key={j.id} value={j.id.toString()}>{j.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="submissions" className="w-full">
                <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 h-12 rounded-xl mb-6">
                    <TabsTrigger value="submissions" className="rounded-lg px-6 font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                        <BookOpen className="w-4 h-4 mr-2" /> Manuscripts
                    </TabsTrigger>
                    <TabsTrigger value="announcements" className="rounded-lg px-6 font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                        <Megaphone className="w-4 h-4 mr-2" /> Announcements
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="submissions">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="md:col-span-3 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
                            <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-xl font-bold flex items-center">
                                        <BookOpen className="mr-2 h-5 w-5 text-indigo-600" /> Recent Submissions
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold" onClick={() => fetchArticles(parseInt(selectedJournalId))}>
                                        Refresh List
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-indigo-600"></div>
                                        <p className="text-slate-500 text-sm font-medium">Synchronizing manuscripts...</p>
                                    </div>
                                ) : articles.length === 0 ? (
                                    <div className="text-center py-24">
                                        <div className="bg-slate-100 dark:bg-slate-800 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Clock className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg">Queue Empty</h3>
                                        <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">No manuscripts are currently pending evaluation for this journal.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                                <TableHead className="py-4 px-6 text-slate-900 dark:text-slate-200 font-bold uppercase tracking-wider text-[10px]">Manuscript Detail</TableHead>
                                                <TableHead className="py-4 px-6 text-slate-900 dark:text-slate-200 font-bold uppercase tracking-wider text-[10px]">Submission Date</TableHead>
                                                <TableHead className="py-4 px-6 text-slate-900 dark:text-slate-200 font-bold uppercase tracking-wider text-[10px]">Status</TableHead>
                                                <TableHead className="py-4 px-6 text-slate-900 dark:text-slate-200 font-bold uppercase tracking-wider text-[10px] text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {articles.map((article) => (
                                                <TableRow key={article.id} className="border-slate-50 dark:border-slate-800/50 group transition-colors hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5">
                                                    <TableCell className="py-5 px-6">
                                                        <div className="max-w-md">
                                                            <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{article.title}</div>
                                                            <div className="text-xs text-slate-500 font-medium mt-1 truncate italic">Journal Tracking ID: #JM-{article.id.toString().padStart(5, '0')}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-6">
                                                        <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm font-medium">
                                                            <Calendar className="mr-2 h-4 w-4 opacity-50" />
                                                            {article.submissionDate ? new Date(article.submissionDate).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-6">
                                                        {getStatusBadge(article.status)}
                                                    </TableCell>
                                                    <TableCell className="py-5 px-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full group-hover:bg-white dark:group-hover:bg-slate-800 shadow-none hover:shadow-sm" title="Quick View">
                                                                <Eye className="h-4 w-4 text-slate-600" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-9 w-9 rounded-full group-hover:bg-white dark:group-hover:bg-slate-800 shadow-none hover:shadow-sm" 
                                                                title="Workflow Management"
                                                                onClick={() => {
                                                                    setSelectedArticle(article);
                                                                    setDoi(article.doi || "");
                                                                    setIsReviewDialogOpen(true);
                                                                }}
                                                            >
                                                                <ClipboardCheck className="h-4 w-4 text-indigo-600" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 text-white rounded-2xl">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-bold flex items-center">
                                        <Users className="mr-2 h-5 w-5" /> Editorial Team
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors cursor-pointer">
                                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold">AS</div>
                                        <div>
                                            <div className="text-sm font-bold">Prof. Adamu Smith</div>
                                            <div className="text-[10px] text-indigo-200">Editor-in-Chief</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors cursor-pointer">
                                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold">JD</div>
                                        <div>
                                            <div className="text-sm font-bold">Dr. Jane Doe</div>
                                            <div className="text-[10px] text-indigo-200">Section Editor (Science)</div>
                                        </div>
                                    </div>
                                    <Button variant="secondary" className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl mt-2">
                                        Manage Editorial Board
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 dark:border-slate-800 rounded-2xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-500">Live Statistics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-2">
                                    <div className="flex justify-between items-end">
                                        <div className="text-slate-500 text-xs font-medium">Acceptance Rate</div>
                                        <div className="text-lg font-black text-slate-900 dark:text-slate-100">22.4%</div>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full w-[22.4%]" />
                                    </div>
                                    
                                    <div className="flex justify-between items-end pt-2">
                                        <div className="text-slate-500 text-xs font-medium">Avg Review</div>
                                        <div className="text-lg font-black text-slate-900 dark:text-slate-100">42 Days</div>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-amber-500 h-full w-[60%]" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="announcements">
                    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-50 flex flex-row justify-between items-center px-6">
                            <div>
                                <CardTitle className="text-xl font-bold">Public Announcements</CardTitle>
                                <CardDescription>Manage news and calls for papers shown to students.</CardDescription>
                            </div>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => setIsAnnounceDialogOpen(true)}>
                                <Megaphone className="w-4 h-4 mr-2" /> Create News
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="px-6">Announcement</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Visibility</TableHead>
                                        <TableHead className="text-right px-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {announcements.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-24 text-slate-400 italic">No announcements found.</TableCell>
                                        </TableRow>
                                    ) : announcements.map(ann => (
                                        <TableRow key={ann.id}>
                                            <TableCell className="px-6">
                                                <div className="font-bold text-slate-900">{ann.title}</div>
                                                <div className="text-xs text-slate-500 line-clamp-1 italic">{ann.content}</div>
                                            </TableCell>
                                            <TableCell><Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">{ann.type.replace('_',' ')}</Badge></TableCell>
                                            <TableCell>{ann.isPublic ? <Badge className="bg-emerald-500">Public</Badge> : <Badge variant="secondary">Internal</Badge>}</TableCell>
                                            <TableCell className="text-right px-6">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-red-500 hover:bg-red-50 rounded-full" 
                                                    onClick={async () => {
                                                        const res = await deleteAnnouncement(ann.id);
                                                        if (res.success) {
                                                            setAnnouncements(announcements.filter(a => a.id !== ann.id));
                                                            toast.success("Deleted");
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">Workflow Management</DialogTitle>
                        <DialogDescription className="font-medium text-slate-500 italic mt-1">
                            {selectedArticle?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase tracking-widest text-indigo-600">Assign Peer Reviewer</Label>
                            <Select value={reviewerId} onValueChange={setReviewerId}>
                                <SelectTrigger className="h-11 border-slate-200 font-medium">
                                    <SelectValue placeholder="Select faculty member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.filter(u => u.role === 'staff' || u.role === 'admin').map(u => (
                                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-rose-600">Editorial Decision</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold" onClick={() => updateArticleStatus(selectedArticle.id, "accepted")}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
                                    </Button>
                                    <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold" onClick={() => updateArticleStatus(selectedArticle.id, "declined")}>
                                        <XCircle className="mr-2 h-4 w-4" /> Decline
                                    </Button>
                                    <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 font-bold" onClick={() => updateArticleStatus(selectedArticle.id, "copyediting")}>
                                        <FileEdit className="mr-2 h-4 w-4" /> Copyediting
                                    </Button>
                                    <Button variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 font-bold" onClick={() => updateArticleStatus(selectedArticle.id, "production")}>
                                        <Package className="mr-2 h-4 w-4" /> Production
                                    </Button>
                                </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <Label className="text-xs font-bold uppercase tracking-widest text-indigo-600">AI Editorial Suite</Label>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 bg-indigo-50/50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 font-bold"
                                    onClick={async () => {
                                        setIsSummarizing(true);
                                        const res = await summarizeSubmission(selectedArticle.id);
                                        if (res.success) {
                                            toast.success("AI Summary Generated!");
                                            setSelectedArticle({...selectedArticle, aiSummary: res.summary});
                                        } else toast.error("Summarization failed");
                                        setIsSummarizing(false);
                                    }}
                                    disabled={isSummarizing}
                                >
                                    <Sparkles className={`mr-2 h-4 w-4 ${isSummarizing ? "animate-spin" : ""}`} /> 
                                    {selectedArticle?.aiSummary ? "Regenerate" : "Summarize"}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 bg-purple-50/50 text-purple-700 border-purple-100 hover:bg-purple-100 font-bold"
                                    onClick={async () => {
                                        setIsSuggesting(true);
                                        const res = await suggestSemanticReviewers(selectedArticle.id);
                                        if (res.success) {
                                            setAiSuggestions(res.suggestions || []);
                                            toast.success("AI Suggestions Ready!");
                                        } else toast.error("Matching failed");
                                        setIsSuggesting(false);
                                    }}
                                    disabled={isSuggesting}
                                >
                                    <Wand2 className={`mr-2 h-4 w-4 ${isSuggesting ? "animate-spin" : ""}`} /> Match
                                </Button>
                            </div>
                            
                            {selectedArticle?.aiSummary && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 italic">
                                    <p className="font-bold mb-1 text-slate-800 not-italic">AI Executive Summary:</p>
                                    {selectedArticle.aiSummary}
                                </div>
                            )}

                            {aiSuggestions.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase font-black text-slate-400 px-1">AI Recommended Experts</p>
                                    <div className="space-y-2">
                                        {aiSuggestions.map(s => (
                                            <div key={s.userId} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-slate-900">{s.name}</span>
                                                    <Button size="sm" variant="ghost" className="h-6 text-indigo-600 font-black text-[9px]" onClick={() => setReviewerId(s.userId.toString())}>SELECT</Button>
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-1">{s.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <Label className="text-xs font-bold uppercase tracking-widest text-indigo-600">Identifiers & Distribution</Label>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Manual DOI (e.g. 10.1234/...)" 
                                        value={doi} 
                                        onChange={(e) => setDoi(e.target.value)}
                                        className="h-10"
                                    />
                                    <Button size="icon" variant="outline" className="h-10 w-10 border-indigo-200 text-indigo-600 shrink-0" onClick={async () => {
                                        const res = await generateArticleDoi(selectedArticle.id);
                                        if (res.success && res.doi) {
                                            setDoi(res.doi);
                                            toast.success("Local DOI Generated!");
                                        } else toast.error("Generation failed");
                                    }}>
                                        <Wand2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button 
                                    className="w-full h-11 bg-slate-900 hover:bg-black font-black text-[11px] tracking-widest uppercase"
                                    onClick={async () => {
                                        setIsRegistering(true);
                                        const res = await registerArticleDoiWithCrossref(selectedArticle.id);
                                        if (res.success) toast.success("DOI Submitted to Crossref!");
                                        else toast.error(res.error || "Crossref submission failed");
                                        setIsRegistering(false);
                                    }}
                                    disabled={isRegistering || !selectedArticle?.doi}
                                >
                                    {isRegistering ? "SUBMITTING..." : "REGISTER WITH CROSSREF"}
                                </Button>
                                <Button 
                                    variant="outline"
                                    className="w-full h-11 border-indigo-200 text-indigo-700 font-black text-[11px] tracking-widest uppercase"
                                    onClick={async () => {
                                        setIsTranslating(true);
                                        const res = await translateArticleMetadata(selectedArticle.id);
                                        if (res.success) {
                                            setTranslationData(res.translatedMetadata);
                                            setIsTranslationDialogOpen(true);
                                            toast.success("Translations Ready for Review");
                                        } else toast.error("Translation Hub error");
                                        setIsTranslating(false);
                                    }}
                                    disabled={isTranslating}
                                >
                                    {isTranslating ? "TRANSLATING..." : "REVIEW TRANSLATIONS"}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-12 rounded-xl shadow-lg" onClick={handleAssignReviewer}>
                            Confirm Workflow Action
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAnnounceDialogOpen} onOpenChange={setIsAnnounceDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Announcement</DialogTitle>
                        <DialogDescription>This news will be visible to researchers and public viewers.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={newAnnounce.title} onChange={e => setNewAnnounce(p => ({...p, title: e.target.value}))} placeholder="e.g. Call for Papers" />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={newAnnounce.type} onValueChange={v => setNewAnnounce(p => ({...p, type: v}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="news">News</SelectItem>
                                    <SelectItem value="call_for_papers">Call for Papers</SelectItem>
                                    <SelectItem value="deadline">Deadline</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Content</Label>
                            <Textarea value={newAnnounce.content} onChange={e => setNewAnnounce(p => ({...p, content: e.target.value}))} placeholder="Describe the announcement..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAnnounceDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-indigo-600" onClick={async () => {
                             const res = await createAnnouncement({...newAnnounce, journalId: parseInt(selectedJournalId)});
                             if (res.success) {
                                 toast.success("Announcement published!");
                                 setIsAnnounceDialogOpen(false);
                                 getActiveAnnouncements().then(setAnnouncements);
                             }
                        }}>Publish Announcement</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isTranslationDialogOpen} onOpenChange={setIsTranslationDialogOpen}>
                <DialogContent className="sm:max-w-[700px] h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Languages className="w-5 h-5 text-indigo-600" /> Review Multilingual Metadata
                        </DialogTitle>
                        <DialogDescription>Review AI-generated translations for 13 African languages.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {translationData && Object.entries(translationData).map(([lang, data]: [string, any]) => (
                            <div key={lang} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <h4 className="font-black text-indigo-900 uppercase text-xs mb-3">{lang} Edition</h4>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400">TITLE</Label>
                                        <Input value={data.title} onChange={(e) => {
                                            const newData = {...translationData};
                                            newData[lang].title = e.target.value;
                                            setTranslationData(newData);
                                        }} className="bg-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400">ABSTRACT</Label>
                                        <Textarea value={data.abstract} onChange={(e) => {
                                            const newData = {...translationData};
                                            newData[lang].abstract = e.target.value;
                                            setTranslationData(newData);
                                        }} className="bg-white min-h-[100px]" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="sticky bottom-0 bg-white pt-2">
                        <Button variant="outline" onClick={() => setIsTranslationDialogOpen(false)}>Save Draft</Button>
                        <Button className="bg-indigo-600" onClick={async () => {
                             const res = await updateArticleMetadata(selectedArticle.id, { translatedMetadata: translationData });
                             if (res.success) {
                                 toast.success("Metadata finalized!");
                                 setIsTranslationDialogOpen(false);
                             }
                        }}>
                             <Save className="w-4 h-4 mr-2" /> Finalize Translations
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
