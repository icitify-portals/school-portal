import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getStudentByUserId } from "@/actions/students";
import { getCourseContent } from "@/actions/lms";
import { getCourseRecordings } from "@/actions/live-class";
import { getApprovedNotesForCourse } from "@/actions/lesson-notes";
import CoursePlayer from "@/components/lms/CoursePlayer";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { db } from "@/db/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
    params: Promise<{
        courseId: string;
    }>;
}

export default async function StudentClassroomPage(props: PageProps) {
    const params = await props.params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);
    const student = await getStudentByUserId(userId);

    if (!student) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You must be a registered student to access this course.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const courseId = parseInt(params.courseId);
    const contentResult = await getCourseContent(courseId, student.id);

    if (!contentResult.success || !contentResult.content) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {contentResult.error || "Failed to load course content."}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Fetch Course Title
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);

    // Fetch Live Class Recordings
    const recordings = await getCourseRecordings(courseId);

    // Fetch Approved Lesson Notes
    const approvedNotes = await getApprovedNotesForCourse(courseId);

    if (approvedNotes.length > 0) {
        const notesModule = {
            id: 888888, // Unique ID for Notes Module
            title: "Handouts / Lesson Notes",
            isLocked: false,
            isCompleted: false,
            lessons: approvedNotes.map((note) => ({
                id: 200000 + note.id,
                title: `Week ${note.week}: ${note.title}`,
                contentType: 'text',
                contentBody: `
                    <div class="space-y-6">
                        <div class="p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-400">
                            <h4 class="text-xs font-black uppercase text-indigo-600 mb-1">Learning Objectives</h4>
                            <p class="text-sm italic text-indigo-900">${note.objectives || "No objectives defined."}</p>
                        </div>
                        <div class="prose prose-slate max-w-none">
                            ${note.content}
                        </div>
                    </div>
                `,
                isLocked: false,
                isCompleted: false
            }))
        };
        (contentResult.content as any[]).unshift(notesModule);
    }

    if (recordings.length > 0 && contentResult.content) {
        // Create a "Recordings" module
        const recordingsModule = {
            id: 999999, // Unique ID for Recordings Module
            title: "Live Class Recordings",
            isLocked: false,
            isCompleted: false,
            lessons: recordings.map((rec, index) => ({
                id: 100000 + rec.id, // Offset ID
                title: `${rec.title || 'Live Session'} (${new Date(rec.date!).toLocaleDateString()})`,
                contentType: 'video', // CoursePlayer handles 'video' type
                contentUrl: rec.url,
                isLocked: false,
                isCompleted: false,
                durationMinutes: Math.ceil((rec.duration || 0) / 60)
            }))
        };
        // Append to content
        (contentResult.content as any[]).push(recordingsModule);
    }

    if (!course) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Course Not Found</AlertTitle>
                    <AlertDescription>
                        The requested course does not exist.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <CoursePlayer
            courseId={courseId}
            studentId={student.id}
            initialContent={contentResult.content as any}
            courseTitle={course.name}
            courseFormat={course.courseFormat || 'topics'}
            courseStartDate={course.courseStartDate || undefined}
            flowControl={course.flowControl || 'open'}
            minPassingScore={course.minPassingScore || 75}
        />
    );
}
