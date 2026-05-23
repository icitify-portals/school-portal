"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUp, BookOpen, Send, Plus, Trash2, UserPlus, Info } from "lucide-react";
import { getAllJournals, submitArticle, getArticlesByUserId } from "@/actions/journal";
import { initiateJournalApcPayment } from "@/actions/journal-payments";
import { getActiveAnnouncements } from "@/actions/journal-announcements";
import { toast } from "sonner";
import { CheckCircle2, Clock, Ban } from "lucide-react";

export default function StudentJournalPage() {
    const [journals, setJournals] = useState<any[]>([]);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [form, setForm] = useState({
        journalId: "",
        title: "",
        abstract: "",
        keywords: "",
    });
    const [authors, setAuthors] = useState([{ name: "", email: "", affiliation: "", orcid: "" }]);
    const [files, setFiles] = useState([{ fileUrl: "", fileName: "", fileType: "manuscript" as const }]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isPaymentLoading, setIsPaymentLoading] = useState<number | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [journalData, subs, news] = await Promise.all([
                getAllJournals(),
                getArticlesByUserId(0),
                getActiveAnnouncements()
            ]);
            setJournals(journalData);
            setSubmissions(subs);
            setAnnouncements(news);
            if (subs.length > 0) setSelectedArticle(subs[0]);
        };
        fetchData();
    }, []);

    const handleAddAuthor = () => setAuthors([...authors, { name: "", email: "", affiliation: "", orcid: "" }]);
    const handleRemoveAuthor = (index: number) => setAuthors(authors.filter((_, i) => i !== index));
    
    const handleAddFile = () => setFiles([...files, { fileUrl: "", fileName: "", fileType: "manuscript" }]);
    const handleRemoveFile = (index: number) => setFiles(files.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.journalId || !form.title) {
            toast.error("Please fill in the required fields");
            return;
        }

        const res = await submitArticle({
            journalId: parseInt(form.journalId),
            title: form.title,
            abstract: form.abstract,
            keywords: form.keywords,
            authors,
            files
        });

        if (res.success) {
            toast.success("Manuscript submitted successfully!");
            setIsSubmitOpen(false);
            setForm({ journalId: "", title: "", abstract: "", keywords: "" });
            setAuthors([{ name: "", email: "", affiliation: "", orcid: "" }]);
            setFiles([{ fileUrl: "", fileName: "", fileType: "manuscript" }]);
        } else {
            toast.error((res as any).error || "Submission failed");
        }
    };

    const handlePayApc = async (articleId: number, gateway: 'paystack' | 'flutterwave') => {
        setIsPaymentLoading(articleId);
        const res = await initiateJournalApcPayment(articleId, gateway);
        if (res.success && res.paymentUrl) {
            window.location.href = res.paymentUrl;
        } else {
            toast.error(res.error || "Failed to initiate payment");
            setIsPaymentLoading(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-indigo-900 dark:text-indigo-100">Research & Publications</h1>
                    <p className="text-muted-foreground">Submit your manuscripts and track your academic publications.</p>
                </div>
                <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6">
                            <Send className="mr-2 h-4 w-4" /> Submit Manuscript
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">Submit New Manuscript</DialogTitle>
                            <DialogDescription>Fill in the details below to submit your research for review.</DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleSubmit} className="space-y-8 py-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                                    <Info className="mr-2 h-4 w-4" /> Submission Info
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Target Journal</Label>
                                        <Select onValueChange={(v) => setForm(p => ({ ...p, journalId: v }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a journal" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {journals.map(j => (
                                                    <SelectItem key={j.id} value={j.id.toString()}>{j.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Manuscript Title</Label>
                                        <Input 
                                            placeholder="Enter the full title of your research" 
                                            value={form.title} 
                                            onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                                            required 
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Abstract</Label>
                                        <Textarea 
                                            placeholder="Provide a concise summary of the research..." 
                                            className="min-h-[120px]"
                                            value={form.abstract} 
                                            onChange={(e) => setForm(p => ({ ...p, abstract: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                                        <UserPlus className="mr-2 h-4 w-4" /> Authors
                                    </h3>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddAuthor}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Author
                                    </Button>
                                </div>
                                {authors.map((auth, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 relative">
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Name</Label>
                                            <Input 
                                                value={auth.name} 
                                                onChange={(e) => {
                                                    const newAuths = [...authors];
                                                    newAuths[idx].name = e.target.value;
                                                    setAuthors(newAuths);
                                                }}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Email</Label>
                                            <Input 
                                                value={auth.email} 
                                                onChange={(e) => {
                                                    const newAuths = [...authors];
                                                    newAuths[idx].email = e.target.value;
                                                    setAuthors(newAuths);
                                                }}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">ORCID iD</Label>
                                            <Input 
                                                placeholder="0000-0000-0000-0000"
                                                value={auth.orcid} 
                                                onChange={(e) => {
                                                    const newAuths = [...authors];
                                                    newAuths[idx].orcid = e.target.value;
                                                    setAuthors(newAuths);
                                                }}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="grid gap-1 relative">
                                            <Label className="text-xs">Affiliation</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    value={auth.affiliation} 
                                                    onChange={(e) => {
                                                        const newAuths = [...authors];
                                                        newAuths[idx].affiliation = e.target.value;
                                                        setAuthors(newAuths);
                                                    }}
                                                    className="h-8"
                                                />
                                                {authors.length > 1 && (
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRemoveAuthor(idx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                                        <FileUp className="mr-2 h-4 w-4" /> Files
                                    </h3>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddFile}>
                                        <Plus className="h-3 w-3 mr-1" /> Add File
                                    </Button>
                                </div>
                                {files.map((file, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 border rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10">
                                        <div className="grid gap-1">
                                            <Label className="text-xs">File Type</Label>
                                            <Select 
                                                value={file.fileType} 
                                                onValueChange={(v: any) => {
                                                    const newFiles = [...files];
                                                    newFiles[idx].fileType = v;
                                                    setFiles(newFiles);
                                                }}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="manuscript">Main Manuscript</SelectItem>
                                                    <SelectItem value="supplementary">Supplementary Data</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Upload File (Mock)</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    placeholder="File path/URL" 
                                                    value={file.fileUrl} 
                                                    onChange={(e) => {
                                                        const newFiles = [...files];
                                                        newFiles[idx].fileUrl = e.target.value;
                                                        setFiles(newFiles);
                                                    }}
                                                    className="h-8"
                                                />
                                                {files.length > 1 && (
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRemoveFile(idx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <DialogFooter>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 w-full h-12 text-lg">
                                    Submit for Peer Review
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-md overflow-hidden">
                        <div className="h-1 bg-indigo-600 w-full" />
                        <CardHeader>
                            <CardTitle>My Submissions</CardTitle>
                            <CardDescription>View status and updates for your researchers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {submissions.length === 0 ? (
                                <div className="text-center py-16 opacity-60">
                                    <BookOpen className="mx-auto h-12 w-12 text-indigo-400 mb-4" />
                                    <p>You haven't submitted any manuscripts yet.</p>
                                    <p className="text-sm">Start your scholarly journey by submitting your first article.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Manuscript</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>APC Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {submissions.map((sub) => (
                                            <TableRow 
                                                key={sub.id} 
                                                className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedArticle?.id === sub.id ? 'bg-indigo-50/50' : ''}`}
                                                onClick={() => setSelectedArticle(sub)}
                                            >
                                                <TableCell>
                                                    <div className="font-bold">{sub.title}</div>
                                                    <div className="text-xs text-muted-foreground">{sub.journal?.name}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`capitalize ${
                                                        sub.status === 'copyediting' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        sub.status === 'production' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                                        ''
                                                    }`}>{sub.status.replace('_', ' ')}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {sub.isApcPaid ? (
                                                        <Badge className="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <Badge variant="secondary">Pending</Badge>
                                                            <div className="text-[10px] text-indigo-600 font-bold">{sub.journal?.apcCurrency} {sub.journal?.apcAmount}</div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {(sub.status === 'accepted' || sub.status === 'published') && !sub.isApcPaid && (
                                                        <div className="flex justify-end gap-2">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                className="h-8 text-[10px]" 
                                                                disabled={isPaymentLoading === sub.id}
                                                                onClick={() => handlePayApc(sub.id, 'paystack')}
                                                            >
                                                                Pay with Paystack
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                className="h-8 text-[10px]" 
                                                                disabled={isPaymentLoading === sub.id}
                                                                onClick={() => handlePayApc(sub.id, 'flutterwave')}
                                                            >
                                                                Flutterwave
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-indigo-900 text-white border-none shadow-lg outline outline-offset-4 outline-indigo-600/20">
                        <CardHeader>
                            <CardTitle className="text-indigo-100 italic">Call for Papers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {announcements.length === 0 ? (
                                <div className="p-3 text-center text-xs text-indigo-200 opacity-50 italic">
                                    No active calls for papers at this time.
                                </div>
                            ) : (
                                announcements.map((ann) => (
                                    <div key={ann.id} className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer group">
                                        <h4 className="font-bold flex items-center">
                                            {ann.title}
                                            <Plus className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </h4>
                                        {ann.expiryDate && <p className="text-xs text-indigo-200 mt-1">Deadline: {new Date(ann.expiryDate).toLocaleDateString()}</p>}
                                        <div className="mt-2 text-xs line-clamp-2 text-indigo-100/70 italic">{ann.content}</div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-indigo-200 shadow-lg">
                        <CardHeader className="pb-3 bg-slate-50 border-b">
                            <CardTitle className="text-xs font-bold uppercase tracking-tighter flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-600" />
                                Publication Tracker
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {selectedArticle ? (
                                <div className="px-6 py-6 space-y-4">
                                    <div className="mb-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                        <h4 className="text-xs font-bold text-indigo-900 truncate">{selectedArticle.title}</h4>
                                        <p className="text-[10px] text-indigo-600">Current Status: <span className="font-black uppercase">{selectedArticle.status.replace('_', ' ')}</span></p>
                                    </div>
                                    {[
                                        { s: "Submission Received", d: "Manuscript successfully uploaded", key: "submitted" },
                                        { s: "Under Peer Review", d: "Academic assessment in progress", key: "under_review" },
                                        { s: "Copyediting", d: "Style and formatting checks", key: "copyediting" },
                                        { s: "Production", d: "Final typesetting & DOI", key: "production" },
                                        { s: "Published Online", d: "Discoverable in Global Index", key: "published" },
                                    ].map((step, i) => {
                                        const statuses = ['submitted', 'under_review', 'copyediting', 'production', 'published'];
                                        const currentIndex = statuses.indexOf(selectedArticle.status);
                                        const isCompleted = i < currentIndex || selectedArticle.status === 'published';
                                        const isCurrent = i === currentIndex && selectedArticle.status !== 'published';
                                        
                                        return (
                                            <div key={i} className={`flex gap-4 relative ${!isCompleted && !isCurrent ? 'opacity-40 grayscale' : ''}`}>
                                                <div className="flex flex-col items-center">
                                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                        isCompleted ? 'bg-indigo-600 border-indigo-600' : 
                                                        isCurrent ? 'bg-white border-indigo-600 animate-pulse' : 
                                                        'bg-slate-100 border-slate-200'
                                                    }`}>
                                                        {isCompleted ? <CheckCircle2 className="h-4 w-4 text-white" /> : <div className={`h-2 w-2 rounded-full ${isCurrent ? 'bg-indigo-600' : 'bg-slate-300'}`} />}
                                                    </div>
                                                    {i < 4 && <div className={`w-[2px] h-full absolute top-6 ${isCompleted ? 'bg-indigo-600' : 'bg-slate-100'}`} />}
                                                </div>
                                                <div className="pb-6">
                                                    <h5 className={`text-sm font-bold ${isCurrent ? 'text-indigo-900' : ''}`}>{step.s}</h5>
                                                    <p className="text-[11px] text-muted-foreground">{step.d}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center opacity-40 italic text-sm">
                                    Select a manuscript to track its progress.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
