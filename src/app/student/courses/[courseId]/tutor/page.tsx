import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { courses, courseLessons, lessonNotes, studentProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function TutorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  const cid = parseInt(courseId);
  const [course] = await db.select().from(courses).where(eq(courses.id, cid)).limit(1);
  if (!course) return <div className="p-8">Course not found</div>;
  const lessons = await db.select().from(courseLessons).where(eq(courseLessons.moduleId, cid)).limit(5).catch(() => []);
  const notes = await db.select().from(lessonNotes).where(eq(lessonNotes.courseId, cid)).limit(3);
  const progress = await db.select().from(studentProgress).where(eq(studentProgress.courseId, cid)).limit(10);
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-black">{course.code} — AI Tutor (RAG)</h1>
      <p className="text-sm text-slate-500">Ask about {course.name} — grounded in lessonNotes + rubrics, suggests next lesson via progress gaps.</p>
      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="font-bold text-sm">Suggested next lesson</h2>
        {progress.length === 0 ? <p className="text-sm text-slate-400">Start with first lesson: {lessons[0]?.title || "No lessons yet"}</p> : <p className="text-sm">Continue where you left off — {progress[0]?.lessonId ? `Lesson ${progress[0].lessonId}` : "Next module"}</p>}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800">RAG source: {notes.length} lessonNotes, {lessons.length} lessons</p>
        <p className="text-xs text-amber-700 mt-1">Ask: &quot;Explain {lessons[0]?.title || "this course"}&quot; — tutor will answer from course docs.</p>
      </div>
      <div className="border rounded-xl p-4 bg-white">
        <p className="text-sm font-bold">Chat (mock)</p>
        <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">Hello! I can help with {course.name}. What would you like to review?</div>
      </div>
    </div>
  );
}
