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
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
            <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-indigo-650/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <Video className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                                Class Recordings
                            </h2>
                        </div>
                        <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                            Access and play back recorded live sessions from your enrolled courses
                        </p>
                    </div>
                </div>

                {recordings.length === 0 ? (
                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-12 text-center flex flex-col items-center max-w-2xl mx-auto space-y-4">
                        <div className="p-4 bg-slate-100 rounded-2xl text-slate-400">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-wider text-slate-800">No Recordings Available</h3>
                        <p className="text-slate-500 font-bold text-sm leading-relaxed">
                            There are currently no published recordings for any of your enrolled courses. Instructors must explicitly grant access to recordings.
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-8">
                        {recordings.map((rec) => (
                            <Card key={rec.id} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem] p-6 hover:-translate-y-0.5 transition-all duration-300">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Video Thumbnail / Play Trigger */}
                                    <div className="md:w-72 bg-slate-950 flex items-center justify-center min-h-[180px] relative group overflow-hidden rounded-[2rem] shadow-inner border border-white/10 shrink-0">
                                        <RecordingPlayer
                                            s3Key={rec.s3Key || ""}
                                            title={rec.title || "Class Session"}
                                            trigger={
                                                <button className="absolute inset-0 w-full h-full flex items-center justify-center focus:outline-none bg-black/40 group-hover:bg-black/20 transition-all">
                                                    <PlayCircle className="w-14 h-14 text-white/50 group-hover:text-indigo-400 group-hover:scale-110 transition-all drop-shadow-lg" />
                                                </button>
                                            }
                                        />
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between py-2">
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                <div>
                                                    <div className="text-[10px] font-black text-indigo-650 uppercase tracking-widest bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full w-fit mb-3">
                                                        {courseNames[rec.courseId] || "Course Recording"}
                                                    </div>
                                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                                        {rec.title || "Live Session"}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">
                                                        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-450" />
                                                            {new Date(rec.date!).toLocaleDateString(undefined, {
                                                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-mono">
                                                            <Clock className="w-3.5 h-3.5 text-slate-450" />
                                                            {Math.ceil((rec.duration || 0) / 60)} MINS
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <RecordingPlayer
                                                        s3Key={rec.s3Key || ""}
                                                        title={rec.title || "Class Session"}
                                                        trigger={
                                                            <Button size="sm" className="bg-indigo-650 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest px-5 py-5 rounded-xl shadow-md">
                                                                <PlayCircle className="w-4 h-4 mr-2" /> Play Recording
                                                            </Button>
                                                        }
                                                    />
                                                    <Button variant="outline" size="sm" className="hidden sm:inline-flex bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-black uppercase text-xs tracking-widest px-5 py-5 rounded-xl shadow-sm" asChild>
                                                        <Link href={`/student/classroom/${rec.courseId}`}>
                                                            <Video className="w-4 h-4 mr-2 text-slate-450" /> Classroom
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recording info */}
                                        <div className="pt-4 border-t border-white/40 text-xs font-bold text-slate-400 uppercase tracking-widest mt-6">
                                            Access is automatically granted for enrolled active students.
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
