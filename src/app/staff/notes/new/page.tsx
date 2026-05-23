import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { staffProfiles, academicSessions, courseLecturers, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import LessonNoteForm from "@/components/lms/LessonNoteForm";
import { getStaffTier } from "@/actions/lesson-notes";

export default async function NewLessonNotePage() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'staff') {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);
    const [staff] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
    
    if (!staff) {
        return <div className="p-8 text-center font-bold text-slate-500">Staff profile not found. Please contact HR.</div>;
    }

    const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
    if (!currentSession) {
        return <div className="p-8 text-center font-bold text-slate-500">No active academic session found.</div>;
    }

    // Get courses assigned to this staff member for the current session
    const assignedCourses = await db.select({
        id: courses.id,
        name: courses.name,
        code: courses.code
    })
    .from(courseLecturers)
    .innerJoin(courses, eq(courseLecturers.courseId, courses.id))
    .where(and(
        eq(courseLecturers.staffId, staff.id),
        eq(courseLecturers.sessionId, currentSession.id)
    ));

    const tier = await getStaffTier(staff.id);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/30 min-h-screen">
            <header className="space-y-1">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 group">
                    Draft New <span className="text-indigo-600 italic">Lesson Note</span>
                </h1>
                <p className="text-slate-500 font-medium tracking-wide italic">Prepare your weekly teaching plan. Use our AI assistant to help build rich educational content.</p>
            </header>

            <LessonNoteForm 
                courses={assignedCourses} 
                teacherId={staff.id} 
                sessionId={currentSession.id} 
                tier={tier}
            />
        </div>
    );
}
