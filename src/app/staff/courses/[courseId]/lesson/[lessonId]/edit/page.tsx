import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { courseLessons, assignments, quizzes } from "@/db/schema";
import { eq } from "drizzle-orm";
import LessonEditor from "@/components/lms/LessonEditor";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
    params: Promise<{
        courseId: string;
        lessonId: string;
    }>;
}

export default async function LessonEditPage(props: PageProps) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user || ((session.user as any).role !== 'staff' && (session.user as any).role !== 'admin')) {
        redirect("/");
    }

    const courseId = parseInt(params.courseId);
    const lessonId = parseInt(params.lessonId);

    // Fetch Lesson and Linked Content
    const [lesson] = await db.select().from(courseLessons).where(eq(courseLessons.id, lessonId)).limit(1);

    if (!lesson) {
        return <div>Lesson not found</div>;
    }

    let assignmentData = null;
    let quizData = null;

    if (lesson.contentType === 'assignment') {
        const rows = await db.select().from(assignments).where(eq(assignments.lessonId, lessonId)).limit(1);
        assignmentData = rows[0] || null;
    } else if (lesson.contentType === 'quiz') {
        const rows = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId)).limit(1);
        quizData = rows[0] || null;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-[1600px] w-full mx-auto">
                <div className="mb-6">
                    <Link href={`/staff/courses/${courseId}/editor`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Course Editor
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Edit Lesson: {lesson.title}</h1>
                    <p className="text-slate-500 capitalize">Type: {lesson.contentType}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <LessonEditor
                        courseId={courseId}
                        lesson={lesson}
                        assignment={assignmentData}
                        quiz={quizData}
                    />
                </div>
            </div>
        </div>
    );
}
