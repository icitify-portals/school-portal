import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { lessonNotes, courses, academicSessions, staffProfiles } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { 
    Plus, BookOpen, Clock, CheckCircle, 
    XCircle, AlertCircle, Calendar, PlusCircle,
    ChevronRight, Search, Filter, BookOpenCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export default async function TeacherNotesPage() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'staff') {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);
    const [staff] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
    if (!staff) return <div className="p-8">Staff profile not found.</div>;

    const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
    if (!currentSession) return <div className="p-8 text-slate-500">No active academic session found.</div>;

    const notes = await db.select({
        id: lessonNotes.id,
        title: lessonNotes.title,
        week: lessonNotes.weekNumber,
        status: lessonNotes.status,
        updatedAt: lessonNotes.updatedAt,
        courseName: courses.name,
        courseCode: courses.code
    })
    .from(lessonNotes)
    .innerJoin(courses, eq(lessonNotes.courseId, courses.id))
    .where(and(
        eq(lessonNotes.teacherId, staff.id),
        eq(lessonNotes.sessionId, currentSession.id)
    ))
    .orderBy(desc(lessonNotes.updatedAt));

    const stats = {
        total: notes.length,
        approved: notes.filter(n => n.status === 'approved').length,
        pending: notes.filter(n => n.status === 'pending').length,
        rejected: notes.filter(n => n.status === 'rejected').length
    };

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-10 bg-slate-50/30 min-h-screen animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900 italic uppercase">
                        Teaching <span className="text-indigo-600">Manuscripts</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {currentSession.name} • Session Active
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <Link href="/staff/notes/new">
                        <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 gap-3 group transition-all">
                            <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span className="font-black uppercase tracking-tight">Draft New Note</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Notes", value: stats.total, icon: BookOpen, color: "text-slate-900", bg: "bg-white" },
                    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50/50" },
                    { label: "Awaiting Action", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50/50" },
                    { label: "Needs Correction", value: stats.rejected, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50/50" },
                ].map((stat) => (
                    <Card key={stat.label} className={cn("border-none shadow-sm rounded-2xl", stat.bg)}>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                                    <h3 className={cn("text-4xl font-black italic", stat.color)}>{stat.value}</h3>
                                </div>
                                <stat.icon className={cn("w-5 h-5 opacity-20", stat.color)} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Notes List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Recent Submissions</h2>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="rounded-full gap-2 text-[10px] font-black uppercase text-slate-400">
                            <Filter className="w-3.5 h-3.5" /> Filter Status
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4">
                    {notes.map((note) => (
                        <Card key={note.id} className="group border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all rounded-[2.5rem] bg-white overflow-hidden">
                            <Link href={`/staff/notes/edit/${note.id}`} className="flex items-center p-6 gap-6">
                                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors">
                                    <BookOpenCheck className="w-8 h-8 text-slate-300 group-hover:text-white transition-colors" />
                                </div>
                                
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{note.title}</h3>
                                        <Badge className={cn(
                                            "rounded-lg font-black text-[9px] uppercase tracking-tighter px-2",
                                            note.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                                            note.status === 'pending' ? "bg-amber-100 text-amber-700" :
                                            note.status === 'rejected' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {note.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full">{note.courseCode} — {note.courseName}</span>
                                        <span className="flex items-center gap-1.5">Week {note.week}</span>
                                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Updated {format(new Date(note.updatedAt!), 'MMM dd, HH:mm')}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        </Card>
                    ))}

                    {notes.length === 0 && (
                        <div className="py-20 text-center space-y-6 bg-white/50 border-2 border-dashed border-slate-100 rounded-[3rem]">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto opacity-50">
                                <BookOpen className="w-10 h-10 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">No Lesson Notes Yet</h3>
                                <p className="text-slate-500 max-w-md mx-auto mt-1">Start building your weekly pedagogical plan. Approved notes will be visible to your students automatically.</p>
                            </div>
                            <Link href="/staff/notes/new">
                                <Button className="rounded-2xl gap-2 font-black uppercase text-[10px] h-10 tracking-widest bg-slate-900">
                                    Create My First Note
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
