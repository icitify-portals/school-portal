import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCourseContent } from "@/actions/lms";
import CourseEditor from "@/components/lms/CourseEditor";
import { db } from "@/db/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PageProps {
    params: Promise<{
        courseId: string;
    }>;
}

export default async function CourseEditorPage(props: PageProps) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user || ((session.user as any).role !== 'staff' && (session.user as any).role !== 'admin')) {
        redirect("/");
    }

    const courseId = parseInt(params.courseId);

    // Fetch Course Details
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);

    if (!course) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Course not found.</AlertDescription>
                </Alert>
            </div>
        );
    }

    // Fetch Content
    const contentRes = await getCourseContent(courseId);

    if (!contentRes.success || !contentRes.content) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{contentRes.error || "Failed to load content"}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-4 bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto mb-4">
                <div className="text-sm text-slate-500 mb-1">Editing Course</div>
                <h1 className="text-3xl font-bold text-slate-900">{course.name}</h1>
            </div>
            <CourseEditor
                courseId={courseId}
                initialModules={contentRes.content as any}
            />
        </div>
    );
}
