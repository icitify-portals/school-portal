"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, Settings, ExternalLink, Mail, Hash } from "lucide-react";
import { getAllJournals, createJournal } from "@/actions/journal";
import { updateJournalApcSettings } from "@/actions/journal-payments";
import { toast } from "sonner";

export default function AdminJournalPage() {
    const [journals, setJournals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newJournal, setNewJournal] = useState({
        name: "",
        slug: "",
        description: "",
        issn: "",
        contactEmail: "",
        apcAmount: "0",
        apcCurrency: "NGN",
    });

    useEffect(() => {
        fetchJournals();
    }, []);

    const fetchJournals = async () => {
        setIsLoading(true);
        const data = await getAllJournals();
        setJournals(data);
        setIsLoading(false);
    };

    const handleCreateJournal = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createJournal(newJournal);
        if (res.success) {
            toast.success("Journal created successfully");
            setIsCreateOpen(false);
            setNewJournal({ name: "", slug: "", description: "", issn: "", contactEmail: "", apcAmount: "0", apcCurrency: "NGN" });
            fetchJournals();
        } else {
            toast.error((res as any).error || "Failed to create journal");
        }
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    };

    const onNameChange = (name: string) => {
        setNewJournal(prev => ({ ...prev, name, slug: generateSlug(name) }));
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Journal Management</h1>
                    <p className="text-muted-foreground">Manage scholarly journals and editorial boards.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" /> New Journal
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle>Create New Journal</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateJournal} className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Journal Name</Label>
                                <Input 
                                    id="name" 
                                    placeholder="e.g. Journal of Advanced Technology" 
                                    value={newJournal.name} 
                                    onChange={(e) => onNameChange(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="slug">URL Slug</Label>
                                <Input 
                                    id="slug" 
                                    placeholder="journal-of-advanced-tech" 
                                    value={newJournal.slug} 
                                    onChange={(e) => setNewJournal(prev => ({ ...prev, slug: e.target.value }))}
                                    required 
                                />
                                <p className="text-xs text-muted-foreground">This will be used in the URL: /journal/{newJournal.slug || "slug"}</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="issn">ISSN</Label>
                                <Input 
                                    id="issn" 
                                    placeholder="e.g. 1234-5678" 
                                    value={newJournal.issn} 
                                    onChange={(e) => setNewJournal(prev => ({ ...prev, issn: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Contact Email</Label>
                                <Input 
                                    id="email" 
                                    type="email"
                                    placeholder="editor@journal.edu" 
                                    value={newJournal.contactEmail} 
                                    onChange={(e) => setNewJournal(prev => ({ ...prev, contactEmail: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea 
                                    id="description" 
                                    placeholder="Describe the journal's scope and aims..." 
                                    value={newJournal.description} 
                                    onChange={(e) => setNewJournal(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="apcAmount">APC Amount</Label>
                                    <Input 
                                        id="apcAmount" 
                                        type="number"
                                        value={newJournal.apcAmount} 
                                        onChange={(e) => setNewJournal(prev => ({ ...prev, apcAmount: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="apcCurrency">Currency</Label>
                                    <Select value={newJournal.apcCurrency} onValueChange={(v) => setNewJournal(prev => ({ ...prev, apcCurrency: v }))}>
                                        <SelectTrigger id="apcCurrency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NGN">NGN (₦)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 w-full">Create Journal</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle>Active Journals</CardTitle>
                    <CardDescription>A list of all journals currently hosted on the platform.</CardDescription>
                </CardHeader>
                <CardContent className=" p-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : journals.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                            <h3 className="mt-4 text-lg font-semibold">No journals found</h3>
                            <p className="text-muted-foreground">Get started by creating your first academic journal.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                                Create Journal
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Journal Name</TableHead>
                                    <TableHead>ISSN</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>APC Fee</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {journals.map((journal) => (
                                    <TableRow key={journal.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium flex items-center">
                                                    {journal.name}
                                                    <Badge variant="outline" className="ml-2 text-[10px] uppercase font-normal">/{journal.slug}</Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground line-clamp-1">{journal.description}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{journal.issn || "N/A"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-xs">
                                                <Mail className="mr-1 h-3 w-3" />
                                                {journal.contactEmail || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs font-bold text-indigo-600">
                                                {journal.apcCurrency} {journal.apcAmount}
                                            </div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Publication Fee</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={journal.isActive ? "default" : "secondary"} className={journal.isActive ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}>
                                                {journal.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" title="View Public Page">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Editorial Settings">
                                                    <Settings className="h-4 w-4" />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-lg font-medium flex items-center">
                            <BookOpen className="mr-2 h-5 w-5" /> Submissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="text-3xl font-bold">0</div>
                        <p className="text-indigo-100 text-xs mt-1">Pending editorial review</p>
                    </CardContent>
                </Card>
                <Card className="-to-br from-emerald-500 to-teal-600 text-white border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-lg font-medium flex items-center">
                            <Hash className="mr-2 h-5 w-5" /> Issues
                        </CardTitle>
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="text-3xl font-bold">0</div>
                        <p className="text-emerald-100 text-xs mt-1">Total published issues</p>
                    </CardContent>
                </Card>
                <Card className="-to-br from-amber-500 to-orange-600 text-white border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-lg font-medium flex items-center">
                            <Plus className="mr-2 h-5 w-5" /> Peer Reviews
                        </CardTitle>
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="text-3xl font-bold">0</div>
                        <p className="text-amber-100 text-xs mt-1">Active peer review cycles</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
