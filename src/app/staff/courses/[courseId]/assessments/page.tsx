import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { courses, assignments, unifiedExams } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { UnifiedBanner } from "@/components/cbt/UnifiedBanner";

export default async function AssessmentsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  const cid = parseInt(courseId);
  const [course] = await db.select().from(courses).where(eq(courses.id, cid)).limit(1);
  if (!course) return <div className="p-8">Course not found</div>;
  const assigns = await db.select().from(assignments).where(eq(assignments.courseId, cid));
  const exams = await db.select().from(unifiedExams).where(eq(unifiedExams.courseId, cid));
  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-black">{course.code} — Assessments (Unified)</h1>
      <UnifiedBanner />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-3">Assignments ({assigns.length})</h2>
          {assigns.length === 0 ? <p className="text-sm text-slate-400">No assignments</p> : assigns.map(a => <div key={a.id} className="py-2 border-b last:border-0 text-sm"><span className="font-bold">{a.title}</span> — {a.maxScore} marks</div>)}
        </div>
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-3">Unified Exams ({exams.length})</h2>
          {exams.length === 0 ? <p className="text-sm text-slate-400">No exams — legacy quizzes still in /cbt and /unified-exam</p> : exams.map(e => <div key={e.id} className="py-2 border-b last:border-0 text-sm"><span className="font-bold">{e.title}</span> — {e.durationMinutes}min {e.isPooled ? `(Pooled ${e.drawCount})` : ""}</div>)}
        </div>
      </div>
      <p className="text-xs text-slate-400">Legacy <code>quizzes</code> + <code>cbtQuizzes</code> remain readable via <UnifiedBanner /> flag. No data loss.</p>
    </div>
  );
}
