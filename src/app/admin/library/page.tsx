"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, ClipboardCheck, Search, Plus, Barcode, ArrowRightLeft, History, Package, Sparkles } from "lucide-react";
import { addLibraryResource, addPhysicalCopy, checkoutBook, returnBook, searchLibrary } from "@/actions/library";
import { toast } from "sonner";

export default function LibrarianWorkspace() {
    const [resources, setResources] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("inventory");

    // Form states
    const [resourceForm, setResourceForm] = useState({ title: "", authors: "", isbn: "", category: "General" });
    const [circulationBarcode, setCirculationBarcode] = useState("");
    const [studentId, setStudentId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        handleSearch();
    }, []);

    const handleSearch = async () => {
        const results = await searchLibrary(searchQuery);
        setResources(results);
    };

    const handleCheckout = async () => {
        if (!circulationBarcode || !studentId) return toast.error("Barcode and Student ID required");
        setIsLoading(true);
        const res = await checkoutBook(circulationBarcode, parseInt(studentId));
        if (res.success) {
            toast.success("Checkout successful!");
            setCirculationBarcode("");
            handleSearch();
        } else {
            toast.error(res.error || "Checkout failed");
        }
        setIsLoading(false);
    };

    const handleReturn = async () => {
        if (!circulationBarcode) return toast.error("Barcode required");
        setIsLoading(true);
        const res = await returnBook(circulationBarcode);
        if (res.success) {
            toast.success("Book returned!");
            setCirculationBarcode("");
            handleSearch();
        } else {
            toast.error(res.error || "Return failed");
        }
        setIsLoading(false);
    };

    return (
        <div className="p-10 space-y-10 max-w-[1600px] mx-auto">
            {/* Header / Hero */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <Badge className="bg-indigo-600 mb-2 px-3 py-1 rounded-full font-black uppercase text-[10px] tracking-widest animate-pulse">Library Admin</Badge>
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">Librarian Workspace</h1>
                    <p className="text-slate-500 mt-2 font-bold italic">Managing the future of school knowledge systems.</p>
                </div>
                <div className="flex gap-4">
                     <Button className="h-14 px-8 bg-slate-900 hover:bg-black rounded-2xl font-black shadow-xl" onClick={() => setIsAddOpen(true)}>
                        <Plus className="mr-2 h-5 w-5 text-indigo-400" /> Catalog New Book
                     </Button>
                </div>
            </div>

            <Tabs defaultValue="inventory" className="w-full">
                <TabsList className="bg-slate-100 p-1.5 rounded-3xl mb-10 h-16 border border-slate-200">
                    <TabsTrigger value="inventory" className="rounded-2xl px-10 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 h-full transition-all">
                        <Package className="mr-2 h-4 w-4" /> Global Inventory
                    </TabsTrigger>
                    <TabsTrigger value="circulation" className="rounded-2xl px-10 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 h-full transition-all">
                        <ArrowRightLeft className="mr-2 h-4 w-4" /> Circulation Desk
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inventory" className="space-y-6">
                    <div className="flex gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <Input 
                                placeholder="Search by Title, Author, or ISBN..." 
                                className="h-16 pl-14 rounded-3xl border-none shadow-2xl shadow-indigo-50 bg-white font-bold text-slate-700" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button className="h-16 px-10 bg-indigo-600 hover:bg-indigo-700 rounded-3xl font-black text-white" onClick={handleSearch}>Find</Button>
                    </div>

                    <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 border border-indigo-50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="border-none hover:bg-transparent">
                                    <TableHead className="px-8 py-6 font-black text-slate-900 uppercase text-[10px] tracking-widest">Resource</TableHead>
                                    <TableHead className="py-6 font-black text-slate-900 uppercase text-[10px] tracking-widest">ISBN</TableHead>
                                    <TableHead className="py-6 font-black text-slate-900 uppercase text-[10px] tracking-widest">Category</TableHead>
                                    <TableHead className="py-6 font-black text-slate-900 uppercase text-[10px] tracking-widest text-center">In Stock</TableHead>
                                    <TableHead className="px-8 py-6 text-right uppercase text-[10px] font-black">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resources.map((res) => (
                                    <TableRow key={res.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors group">
                                        <TableCell className="px-8 py-6">
                                            <div className="font-black text-lg text-slate-900">{res.title}</div>
                                            <div className="text-sm font-bold text-slate-400 italic">by {res.authors || "Unknown Author"}</div>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-600 text-xs">{res.isbn || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold px-4 py-1 rounded-full">{res.category}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex flex-col">
                                                <span className="font-black text-indigo-600 text-xl">{res.availableCopies}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase">of {res.totalCopies}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <Button variant="ghost" className="h-12 w-12 rounded-2xl group-hover:bg-white group-hover:shadow-md transition-all">
                                                <Barcode className="h-5 w-5 text-slate-400 group-hover:text-indigo-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="circulation">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <Card className="rounded-[40px] border-none shadow-2xl p-10 bg-slate-900 text-white space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black">Action Panel</h3>
                                <p className="text-indigo-300 font-medium">Scan barcode to trigger circulation event.</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase text-indigo-400 tracking-widest pl-2">Book Barcode</Label>
                                    <div className="relative">
                                        <Barcode className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                                        <Input 
                                            placeholder="Scan book..." 
                                            className="h-20 pl-16 rounded-3xl bg-white/10 border-none text-2xl font-black placeholder:text-white/20 text-white focus:ring-2 focus:ring-indigo-500"
                                            value={circulationBarcode}
                                            onChange={(e) => setCirculationBarcode(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase text-indigo-400 tracking-widest pl-2">Student ID / Patron Account</Label>
                                    <div className="relative">
                                        <Users className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                                        <Input 
                                            placeholder="Student ID..." 
                                            className="h-20 pl-16 rounded-3xl bg-white/10 border-none text-2xl font-black placeholder:text-white/20 text-white focus:ring-2 focus:ring-indigo-500"
                                            value={studentId}
                                            onChange={(e) => setStudentId(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <Button 
                                        className="h-20 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-xl font-black shadow-2xl"
                                        onClick={handleCheckout}
                                        disabled={isLoading}
                                    >
                                        CHECKOUT
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="h-20 rounded-3xl border-white/20 hover:bg-white/10 text-xl font-black"
                                        onClick={handleReturn}
                                        disabled={isLoading}
                                    >
                                        RETURN
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-[40px] border-none shadow-2xl p-10 bg-white space-y-8">
                             <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-900">Recent Desk Activity</h3>
                                <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-bold">Live Stream</Badge>
                             </div>

                             <div className="space-y-6">
                                {[1,2,3].map(i => (
                                    <div key={i} className="flex items-center gap-6 p-6 bg-slate-50 rounded-[30px] border border-slate-100">
                                        <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                                            <History className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-black text-slate-900 italic">Advanced Engineering Mathematics</div>
                                            <div className="text-xs font-bold text-slate-400 flex items-center mt-1">
                                                <Badge className="bg-emerald-100 text-emerald-700 text-[9px] mr-2 h-4">RETURNED</Badge>
                                                BY STUDENT #10294 • 2 MINS AGO
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Cataloging Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-[40px] p-10 border-none shadow-2xl overflow-hidden">
                    <DialogHeader className="mb-6">
                         <Badge className="w-fit bg-indigo-600 mb-2 px-3 py-1 rounded-full font-black uppercase text-[9px] tracking-widest">Catalog System</Badge>
                         <h2 className="text-3xl font-black tracking-tight">Add to Collection</h2>
                         <p className="text-slate-500 font-bold italic text-sm">Professional item registration with metadata alignment.</p>
                    </DialogHeader>
                    
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                             <Label className="text-[10px] font-black uppercase text-indigo-600 px-1 tracking-widest">Full Resource Title</Label>
                             <Input 
                                value={resourceForm.title} 
                                onChange={e => setResourceForm({...resourceForm, title: e.target.value})}
                                className="h-14 rounded-2xl bg-slate-50 border-none font-bold" 
                                placeholder="e.g. Fundamental Physics Volume 1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase text-indigo-600 px-1 tracking-widest">Author(s)</Label>
                                <Input 
                                    value={resourceForm.authors} 
                                    onChange={e => setResourceForm({...resourceForm, authors: e.target.value})}
                                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                                    placeholder="Jane Doe, John Smith"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase text-indigo-600 px-1 tracking-widest">ISBN / ISSN</Label>
                                <Input 
                                    value={resourceForm.isbn} 
                                    onChange={e => setResourceForm({...resourceForm, isbn: e.target.value})}
                                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold placeholder:text-slate-200"
                                    placeholder="978-0-..."
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-8">
                        <Button 
                            className="w-full h-16 bg-slate-900 hover:bg-black rounded-2xl text-lg font-black shadow-xl"
                            onClick={async () => {
                                setIsAddOpen(false);
                                const res = await addLibraryResource(resourceForm);
                                if (res.success) toast.success("Resource Cataloged Successfully!");
                                else toast.error("Failed to catalog resource");
                                handleSearch();
                            }}
                        >
                            Confirm Registration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
