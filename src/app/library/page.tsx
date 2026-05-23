"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, BookOpen, Clock, FileText, Video, Headphones, Book, Database } from "lucide-react";
import { searchLibraryBento } from "@/actions/library";
import { toast } from "sonner";
import LibraryChatBot from "@/components/library/LibraryChatBot";
import CitationGenerator from "@/components/library/CitationGenerator";

export default function LibraryBentoBox() {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [departmentMap, setDepartmentMap] = useState<string>("");
    
    const [physicalBooks, setPhysicalBooks] = useState<any[]>([]);
    const [digitalAssets, setDigitalAssets] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        const performSearch = async () => {
            setIsSearching(true);
            try {
                const results = await searchLibraryBento(debouncedQuery, { category: departmentMap });
                setPhysicalBooks(results.physicalHits || []);
                setDigitalAssets(results.digitalHits || []);
            } catch (err) {
                toast.error("Failed to fetch library resources.");
            } finally {
                setIsSearching(false);
            }
        };
        performSearch();
    }, [debouncedQuery, departmentMap]);

    const getFormatIcon = (format: string | undefined) => {
        switch(format) {
            case 'pdf': case 'epub': return <FileText className="h-4 w-4" />;
            case 'mp4': case 'video': return <Video className="h-4 w-4" />;
            case 'mp3': case 'audiobook': return <Headphones className="h-4 w-4" />;
            default: return <Database className="h-4 w-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* Sidebar Filters */}
            <div className="w-72 bg-slate-900 border-r border-slate-800 p-6 hidden lg:flex flex-col gap-8 h-[100dvh] sticky top-0 overflow-y-auto">
                <div>
                    <h2 className="font-black text-2xl flex items-center gap-2"><BookOpen className="text-indigo-500"/> OPAC</h2>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1">THE "TWO-IN-ONE" ENGINE</p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Filter by Dept.</h3>
                    {['Computer Science', 'Physics', 'Philosophy', 'Engineering'].map(dept => (
                        <div key={dept} className="flex items-center gap-3">
                            <input 
                                type="radio" 
                                name="dept" 
                                checked={departmentMap === dept}
                                onChange={() => setDepartmentMap(departmentMap === dept ? "" : dept)}
                                className="accent-indigo-500 w-4 h-4 cursor-pointer" 
                            />
                            <span className="text-sm font-bold">{dept}</span>
                        </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setDepartmentMap("")} className="text-xs mt-2 w-full text-slate-400 hover:text-white">Clear Filters</Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto w-full p-6 lg:p-10">
                {/* Search Header */}
                <div className="max-w-4xl mx-auto space-y-6 mb-12">
                    <h1 className="text-5xl font-black tracking-tighter">Bento Discovery.</h1>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[30px] blur opacity-25 group-focus-within:opacity-75 transition-opacity" />
                        <div className="relative flex items-center">
                            <Search className="absolute left-6 h-5 w-5 text-slate-400" />
                            <Input 
                                placeholder="Search physical shelves and digital repositories concurrently..." 
                                className="h-16 pl-16 rounded-[30px] bg-slate-900 border-slate-800 text-lg font-bold placeholder:text-slate-600 focus-visible:ring-0 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {isSearching ? (
                   <div className="flex justify-center mt-20"><Sparkles className="h-10 w-10 text-indigo-500 animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        {/* LEFT: Physical Circulation */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                                <Book className="h-6 w-6 text-indigo-400" />
                                <h2 className="text-2xl font-black">Physical Shelf</h2>
                                <Badge className="ml-auto bg-slate-800">{physicalBooks.length} records</Badge>
                            </div>
                            <div className="space-y-4">
                                {physicalBooks.length === 0 ? <p className="text-slate-500 font-bold italic">No physical books found.</p> : null}
                                {physicalBooks.map((item, i) => (
                                    <div key={i} className="flex gap-4 p-5 bg-slate-900 rounded-3xl border border-slate-800 hover:border-indigo-500/50 transition-all">
                                        <div className="h-24 w-16 bg-slate-800 rounded-xl overflow-hidden shrink-0 shadow-lg">
                                            {item.resource.coverUrl ? <img src={item.resource.coverUrl} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-slate-800 flex items-center justify-center"><Book className="text-slate-600 h-6 w-6"/></div>}
                                        </div>
                                        <div className="flex-1 space-y-1 relative">
                                            <div className="flex justify-between items-start">
                                                <div className="font-black text-lg line-clamp-1">{item.resource.title}</div>
                                                <Badge className={Number(item.copiesAvailable) > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                                                    {Number(item.copiesAvailable) > 0 ? `${item.copiesAvailable} Available` : 'Borrowed'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm font-bold text-slate-400">{item.resource.authors}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mt-2">
                                                Call Number: {item.resource.callNumber || "N/A"}
                                            </div>
                                            <div className="absolute right-0 bottom-0 flex gap-2">
                                                <CitationGenerator resource={item.resource} />
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-8 text-xs font-bold bg-slate-900 border-slate-700 hover:bg-slate-800"
                                                    onClick={() => {
                                                        const saved = JSON.parse(localStorage.getItem('library-saved') || '[]');
                                                        if (!saved.find((s: any) => s.id === item.resource.id)) {
                                                            localStorage.setItem('library-saved', JSON.stringify([...saved, item.resource]));
                                                            toast.success("Saved for offline!");
                                                        } else {
                                                            toast.info("Already saved!");
                                                        }
                                                    }}
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Digital Repository */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                                <Database className="h-6 w-6 text-purple-400" />
                                <h2 className="text-2xl font-black">Digital Repository</h2>
                                <Badge className="ml-auto bg-slate-800">{digitalAssets.length} assets</Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {digitalAssets.length === 0 ? <p className="text-slate-500 font-bold italic col-span-2">No digital resources found.</p> : null}
                                {digitalAssets.map((item, i) => (
                                    <div key={i} className="group p-5 bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-3xl border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                                         <div className="absolute -right-6 -bottom-6 h-32 w-32 bg-purple-500/5 blur-3xl rounded-full group-hover:bg-purple-500/20 transition-all" />
                                         <div className="flex justify-between items-start relative z-10 gap-2">
                                            <Badge className="bg-slate-800 text-purple-300 gap-1 rounded-full uppercase tracking-widest text-[10px] shrink-0">
                                                {getFormatIcon(item.asset?.fileType)} {item.asset?.fileType || 'PDF'}
                                            </Badge>
                                            <div className="flex gap-1 shrink-0">
                                                <CitationGenerator resource={item.resource} />
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        const saved = JSON.parse(localStorage.getItem('library-saved') || '[]');
                                                        localStorage.setItem('library-saved', JSON.stringify([...saved, item.resource]));
                                                        toast.success("Archived offline!");
                                                    }}
                                                >
                                                    <BookOpen className="h-4 w-4" />
                                                </Button>
                                            </div>
                                         </div>
                                         <div className="relative z-10 mt-4">
                                            <div className="font-black text-md leading-tight line-clamp-2">{item.resource.title}</div>
                                            <div className="text-xs text-slate-400 font-bold mt-1 line-clamp-1">{item.resource.authors}</div>
                                         </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <LibraryChatBot />
        </div>
    );
}
