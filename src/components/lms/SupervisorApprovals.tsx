"use client";

import { useState, useEffect } from "react";
import { 
    CheckCircle, XCircle, Eye, MessageSquare, 
    Clock, Filter, Search, User, BookOpen, 
    ChevronRight, CheckSquare, AlertCircle, Loader2,
    Calendar, FileText, Layers, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { listPendingApprovals, reviewLessonNote, getLessonNoteDetails } from "@/actions/lesson-notes";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SupervisorApprovals({ supervisorId }: { supervisorId: number }) {
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, [supervisorId]);

    const fetchNotes = async () => {
        setLoading(true);
        const res = await listPendingApprovals(supervisorId);
        setNotes(res);
        setLoading(false);
    };

    const handleOpenReview = async (id: number) => {
        const details = await getLessonNoteDetails(id);
        setSelectedNote(details);
        setIsReviewOpen(true);
    };

    const handleReview = async (status: 'approved' | 'rejected') => {
        if (status === 'rejected' && !feedback) {
            toast.error("Please provide feedback for rejection");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await reviewLessonNote(selectedNote.id, supervisorId, status, feedback);
            if (res.success) {
                toast.success(status === 'approved' ? "Lesson Note Approved" : "Lesson Note Rejected");
                setIsReviewOpen(false);
                setFeedback("");
                fetchNotes();
            } else {
                toast.error("Failed to complete review");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 group">
                        Lesson Note <span className="text-indigo-600 italic">Approvals</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-wide">Review and verify weekly teaching plans for your departments.</p>
                </div>
                
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                    <Button variant="ghost" className="rounded-xl px-6 font-bold bg-indigo-50 text-indigo-700">Pending</Button>
                    <Button variant="ghost" className="rounded-xl px-6 font-bold text-slate-400">History</Button>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
                {/* Statistics / Sidebar */}
                <div className="col-span-3 space-y-6">
                    <Card className="p-6 rounded-[2rem] border-none shadow-xl bg-indigo-600 text-white space-y-4">
                        <div className="p-3 bg-indigo-500 rounded-2xl w-fit">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest">Waiting Action</p>
                            <h3 className="text-5xl font-black">{notes.length}</h3>
                        </div>
                        <p className="text-indigo-200 text-xs leading-relaxed">System-wide notes awaiting your pedagogical review and signature.</p>
                    </Card>

                    <Card className="p-6 rounded-[2rem] border-none shadow-xl bg-white space-y-4">
                        <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Quick Filters</h4>
                        <div className="space-y-2">
                            <button className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-500" /> All Departments
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </button>
                            <button className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-500" /> This Week
                                </span>
                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 font-black">{notes.length}</Badge>
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Main List */}
                <div className="col-span-9 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input 
                            placeholder="Search by teacher name or subject..." 
                            className="h-14 pl-12 rounded-2xl border-none shadow-lg bg-white/80 backdrop-blur-md"
                        />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Queue...</p>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white/50 rounded-[3rem] border border-dashed border-slate-200">
                            <CheckSquare className="w-16 h-16 text-emerald-400 opacity-20" />
                            <p className="text-slate-500 font-bold">You're all caught up! No pending reviews.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notes.map((note) => (
                                <Card key={note.id} className="group p-6 rounded-[2rem] border-none shadow-md hover:shadow-2xl transition-all bg-white flex items-center gap-6">
                                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                                        <BookOpen className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-black text-slate-800 text-lg">{note.title}</h3>
                                            <Badge variant="outline" className="rounded-full border-indigo-100 text-indigo-600 font-bold">Week {note.week}</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {note.teacherName}</span>
                                            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {note.courseName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button 
                                            onClick={() => handleOpenReview(note.id)}
                                            className="rounded-2xl gap-2 font-bold px-6 h-12 bg-slate-900 border-none hover:bg-indigo-600 shadow-lg shadow-indigo-100"
                                        >
                                            <Eye className="w-4 h-4" /> Review Note
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Review Dialog */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-[3rem] shadow-2xl bg-white">
                    <DialogHeader className="p-8 pb-4 bg-slate-50">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-3xl font-black text-slate-900">{selectedNote?.title}</DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium mt-1">
                                    Drafted by <span className="text-indigo-600 font-bold">Teacher ID: {selectedNote?.teacherId}</span> for Week {selectedNote?.weekNumber}
                                </DialogDescription>
                            </div>
                            <Badge className="bg-indigo-600 text-white rounded-xl px-4 py-1.5 font-bold uppercase tracking-wider text-[10px]">Pending Signature</Badge>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh] p-8">
                        <div className="space-y-8 pb-8">
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                    <Target className="w-4 h-4" /> Lesson Objectives
                                </h4>
                                <div className="p-4 bg-slate-50 rounded-2xl italic text-slate-600 text-sm border-l-4 border-indigo-400">
                                    {selectedNote?.objectives || "No objectives defined."}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Proposed Content
                                </h4>
                                <div 
                                    className="prose prose-slate max-w-none text-slate-700 bg-white p-6 rounded-3xl border border-slate-100"
                                    dangerouslySetInnerHTML={{ __html: selectedNote?.contentBody || "" }}
                                />
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-8 pt-0 flex flex-col gap-6">
                        <div className="w-full space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Supervisor Feedback / Corrections</Label>
                            <div className="relative group">
                                <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
                                <textarea 
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Enter your corrections or notes for the teacher here..."
                                    className="w-full h-24 pl-12 pr-4 pt-4 border-none bg-slate-50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all shadow-inner"
                                />
                            </div>
                        </div>
                        <div className="w-full flex justify-between items-center gap-4">
                            <Button 
                                variant="outline" 
                                className="rounded-2xl px-10 h-12 font-bold text-slate-400 hover:text-slate-600"
                                onClick={() => setIsReviewOpen(false)}
                            >
                                Close Preview
                            </Button>
                            <div className="flex gap-4">
                                <Button 
                                    onClick={() => handleReview('rejected')}
                                    disabled={isProcessing}
                                    className="rounded-2xl gap-2 font-bold px-8 h-12 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 hover:text-rose-700 shadow-none"
                                >
                                    <XCircle className="w-4 h-4" /> Reject Note
                                </Button>
                                <Button 
                                    onClick={() => handleReview('approved')}
                                    disabled={isProcessing}
                                    className="rounded-2xl gap-2 font-bold px-10 h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-100"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Approve & Publish
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

