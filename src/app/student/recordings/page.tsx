import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getStudentRecordings } from "@/actions/live-class";
import { getStudentByUserId } from "@/actions/students";
import { AlertCircle, Video, Calendar, Clock, Download, PlayCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import RecordingPlayer from "@/components/live/RecordingPlayer";
import { db } from "@/db/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function StudentRecordingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);
    const student = await getStudentByUserId(userId);

    if (!student) {
        return (
            <div className="p-6 md:p-10 max-w-[1600px] w-full mx-auto">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You must be a registered student to view class recordings.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const recordings = await getStudentRecordings(student.id);

    // Fetch related course names
    const courseNames: Record<number, string> = {};
    if (recordings.length > 0) {
        const uniqueCourseIds = Array.from(new Set(recordings.map(r => r.courseId)));

        // Cannot use Drizzle inArray efficiently here if empty, but we verified length > 0
        for (const cid of uniqueCourseIds) {
            const courseRes = await db.select({ name: courses.name }).from(courses).where(eq(courses.id, cid)).limit(1);
            if (courseRes.length > 0) {
                courseNames[cid] = courseRes[0].name;
            }
        }
    }

    return (
        <div className="p-6 md:p-10 space-y-6 max-w-[1600px] w-full mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Class Recordings</h1>
                <p className="text-slate-500 mt-2">
                    Access and download recorded live sessions from your enrolled courses.
                </p>
            </div>

            {recordings.length === 0 ? (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Recordings Available</AlertTitle>
                    <AlertDescription>
                        There are currently no published recordings for any of your enrolled courses. Instructors must explicitly grant access to recordings.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid gap-6">
                    {recordings.map((rec) => (
                        <Card key={rec.id} className="overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row">
                                {/* Video Thumbnail Placeholder */}
                                <div className="md:w-64 bg-slate-900 flex items-center justify-center min-h-[160px] relative group">
                                    <Video className="w-12 h-12 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                </div>

                                <div className="flex-1 p-6 flex flex-col justify-center">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
                                                {courseNames[rec.courseId] || "Course Recording"}
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                                {rec.title || "Live Session"}
                                            </h3>
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {new Date(rec.date!).toLocaleDateString(undefined, {
                                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                                    })}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    {Math.ceil((rec.duration || 0) / 60)} minutes
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <RecordingPlayer
                                                s3Key={rec.s3Key || ""}
                                                title={rec.title || "Class Session"}
                                                trigger={
                                                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                                        <PlayCircle className="w-4 h-4 mr-2" /> Play Recording
                                                    </Button>
                                                }
                                            />
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/student/classroom/${rec.courseId}`}>
                                                    <Video className="w-4 h-4 mr-2" /> Go to Classroom
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
