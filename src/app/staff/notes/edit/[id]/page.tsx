import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { staffProfiles, academicSessions, courseLecturers, courses, lessonNotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import LessonNoteForm from "@/components/lms/LessonNoteForm";
import { getLessonNoteDetails, getStaffTier } from "@/actions/lesson-notes";
import { AlertCircle } from "lucide-react";

export default async function EditLessonNotePage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'staff') {
        redirect("/login");
    }

    const noteId = parseInt(params.id);
    const userId = parseInt(session.user.id);
    const [staff] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
    
    if (!staff) return <div className="p-8">Staff profile not found.</div>;

    const note = await getLessonNoteDetails(noteId);
    if (!note) return <div className="p-8 flex items-center gap-3 text-rose-500 font-bold"><AlertCircle /> Lesson note not found.</div>;

    // Security Check: Only the owner or a supervisor can edit (though supervisor edit might be restricted to feedback)
    if (note.teacherId !== staff.id) {
        redirect("/staff/notes");
    }

    const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.id, note.sessionId)).limit(1);

    const assignedCourses = await db.select({
        id: courses.id,
        name: courses.name,
        code: courses.code
    })
    .from(courseLecturers)
    .innerJoin(courses, eq(courseLecturers.courseId, courses.id))
    .where(and(
        eq(courseLecturers.staffId, staff.id),
        eq(courseLecturers.sessionId, note.sessionId)
    ));

    const tier = await getStaffTier(staff.id);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/30 min-h-screen">
            <header className="space-y-1">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 group">
                    Refine <span className="text-indigo-600 italic">Lesson Note</span>
                </h1>
                <p className="text-slate-500 font-medium tracking-wide italic">Updating manuscript for Week {note.weekNumber}. {note.status === 'rejected' && <span className="text-rose-500 font-bold underline decoration-rose-200">Attention: Previous version was returned for corrections.</span>}</p>
            </header>

            {note.status === 'rejected' && note.supervisorFeedback && (
                <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2rem] space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Supervisor Feedback
                    </h4>
                    <p className="text-sm font-medium text-rose-900 italic">"{note.supervisorFeedback}"</p>
                </div>
            )}

            <LessonNoteForm 
                courses={assignedCourses} 
                teacherId={staff.id} 
                sessionId={note.sessionId}
                tier={tier}
                initialData={note}
            />
        </div>
    );
}
