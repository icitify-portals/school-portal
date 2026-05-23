"use client";

import { useState, useEffect } from "react";
import { 
    Book, 
    Download, 
    Smartphone, 
    Wifi, 
    WifiOff, 
    Search,
    BookOpen,
    Trash2,
    CheckCircle2,
    Clock,
    FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Textbook {
    id: string;
    title: string;
    subject: string;
    level: string;
    size: string;
    coverColor: string;
    isDownloaded?: boolean;
}

const mockBooks: Textbook[] = [
    { id: "1", title: "Advanced Mathematics", subject: "Mathematics", level: "SS3", size: "12MB", coverColor: "bg-blue-600" },
    { id: "2", title: "Simplified Physics", subject: "Physics", level: "SS2", size: "15MB", coverColor: "bg-indigo-600" },
    { id: "3", title: "Modern Biology", subject: "Biology", level: "SS1", size: "18MB", coverColor: "bg-emerald-600" },
    { id: "4", title: "English Mastery", subject: "English", level: "All", size: "8MB", coverColor: "bg-rose-600" },
    { id: "5", title: "Economics for West Africa", subject: "Economics", level: "SS2", size: "10MB", coverColor: "bg-amber-600" },
    { id: "6", title: "Civic Education Explorer", subject: "Civics", level: "SS1", size: "5MB", coverColor: "bg-purple-600" },
];

export default function SmartBooksPage() {
    const [books, setBooks] = useState<Textbook[]>(mockBooks);
    const [search, setSearch] = useState("");
    const [isOffline, setIsOffline] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        // Load downloaded status from localStorage
        const downloaded = JSON.parse(localStorage.getItem('smartbooks_offline') || '[]');
        setBooks(prev => prev.map(b => ({ ...b, isDownloaded: downloaded.includes(b.id) })));

        // Monitor connection
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const toggleDownload = (id: string) => {
        setDownloading(id);
        
        // Simulate download
        setTimeout(() => {
            const current = JSON.parse(localStorage.getItem('smartbooks_offline') || '[]');
            let next;
            if (current.includes(id)) {
                next = current.filter((x: string) => x !== id);
                toast.info("Book removed from offline storage");
            } else {
                next = [...current, id];
                toast.success("Book downloaded for offline use");
            }
            localStorage.setItem('smartbooks_offline', JSON.stringify(next));
            setBooks(prev => prev.map(b => b.id === id ? { ...b, isDownloaded: !b.isDownloaded } : b));
            setDownloading(null);
        }, 1500);
    };

    const filteredBooks = books.filter(b => 
        b.title.toLowerCase().includes(search.toLowerCase()) || 
        b.subject.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header with Connectivity Status */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Smart<span className="text-indigo-600">Books</span></h1>
                    <p className="text-lg text-slate-500 font-medium italic">Nigeria curriculum textbooks, available anytime, anywhere.</p>
                </div>
                
                <div className={cn(
                    "flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all shadow-lg",
                    isOffline ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                )}>
                    {isOffline ? (
                        <>
                            <WifiOff className="w-5 h-5 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest">Offline Mode Active</span>
                        </>
                    ) : (
                        <>
                            <Wifi className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Cloud Sync Active</span>
                        </>
                    )}
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input 
                        placeholder="Search by title, subject or curriculum level..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-14 h-16 rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white text-lg font-medium"
                    />
                </div>
            </div>

            {/* Book Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBooks.map((book) => (
                    <Card key={book.id} className="group border-none shadow-2xl shadow-slate-500/5 rounded-[3rem] overflow-hidden bg-white flex flex-col h-full hover:scale-[1.02] transition-all duration-500">
                        {/* Book Spine/Cover Area */}
                        <div className={cn("h-64 relative flex items-center justify-center p-8", book.coverColor)}>
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                            
                            <div className="w-40 h-52 bg-white rounded-lg shadow-2xl relative p-6 flex flex-col justify-between overflow-hidden">
                                <div className={cn("absolute top-0 left-0 w-2 h-full", book.coverColor)} />
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{book.subject}</p>
                                    <h3 className="text-xs font-black text-slate-900 leading-tight">{book.title}</h3>
                                </div>
                                <div className="flex justify-between items-end">
                                    <Badge variant="outline" className="text-[6px] border-slate-200">{book.level}</Badge>
                                    <BookOpen className={cn("w-4 h-4", book.coverColor.replace('bg-', 'text-'))} />
                                </div>
                            </div>

                            {book.isDownloaded && (
                                <div className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                    <Smartphone className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        <CardContent className="p-8 flex-1 flex flex-col justify-between space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                                    <span className="text-[10px] font-black uppercase text-slate-400">{book.size}</span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Complete Nigeria Curriculum ({book.level}) content optimized for mobile study.</p>
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    disabled={isOffline && !book.isDownloaded}
                                    className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase tracking-widest text-[10px]"
                                >
                                    <BookOpen className="w-4 h-4 mr-2" /> Read Now
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => toggleDownload(book.id)}
                                    disabled={downloading === book.id}
                                    className={cn(
                                        "h-14 w-14 rounded-2xl border-2 flex items-center justify-center p-0 transition-all",
                                        book.isDownloaded ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-slate-100 hover:border-indigo-600"
                                    )}
                                >
                                    {downloading === book.id ? (
                                        <Clock className="w-5 h-5 animate-spin" />
                                    ) : book.isDownloaded ? (
                                        <Trash2 className="w-5 h-5" />
                                    ) : (
                                        <Download className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Offline Info Box */}
            <Card className="border-none bg-slate-50 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Offline Study Protocol</h4>
                    <p className="text-slate-500 font-medium">All downloaded SmartBooks are stored in your browser's persistent cache. You can access them even without data or an internet connection. Perfect for study sessions in low-connectivity areas.</p>
                </div>
            </Card>
        </div>
    );
}
