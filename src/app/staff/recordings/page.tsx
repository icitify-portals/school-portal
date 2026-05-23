import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLecturerRecordings } from "@/actions/live-class";
import { AlertCircle, Video, Calendar, Clock, Download, Share2, PlayCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecordingPlayer from "@/components/live/RecordingPlayer";

export default async function RecordingsPage() {
    const session = await auth();

    if (!session?.user?.id || (session.user as any).role !== 'staff') {
        redirect("/login");
    }

    const lecturerId = parseInt(session.user.id);
    const recordings = await getLecturerRecordings(lecturerId);

    return (
        <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Class Recordings</h1>
                <p className="text-slate-500 mt-2">
                    Manage and publish your Live Class session recordings.
                    Published recordings will be visible to enrolled students.
                </p>
            </div>

            {recordings.length === 0 ? (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Recordings Found</AlertTitle>
                    <AlertDescription>
                        You have not recorded any live classes yet. To record a class, click "Record" inside a live session.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid gap-6">
                    {recordings.map((rec) => (
                        <Card key={rec.id} className="overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row">
                                {/* Video Thumbnail / Play Trigger */}
                                <div className="md:w-64 bg-slate-900 flex items-center justify-center min-h-[160px] relative group overflow-hidden">
                                    <RecordingPlayer
                                        s3Key={rec.s3Key || ""}
                                        title={rec.title || "Class Recording"}
                                        trigger={
                                            <button className="absolute inset-0 w-full h-full flex items-center justify-center focus:outline-none bg-black/40 group-hover:bg-black/20 transition-all">
                                                <PlayCircle className="w-12 h-12 text-white/50 group-hover:text-indigo-400 group-hover:scale-110 transition-all shadow-2xl" />
                                            </button>
                                        }
                                    />
                                </div>

                                <div className="flex-1 p-6 flex flex-col justify-center">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                                {rec.title}
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
                                        <div className="flex items-center gap-3">
                                            <RecordingPlayer
                                                s3Key={rec.s3Key || ""}
                                                title={rec.title || "Recording"}
                                                trigger={
                                                    <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                                        <PlayCircle className="w-4 h-4 mr-2" /> Play
                                                    </Button>
                                                }
                                            />
                                            <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
                                                <a href={rec.url || "#"} target="_blank" rel="noreferrer">
                                                    <Share2 className="w-4 h-4 mr-2" /> Details
                                                </a>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Recording info */}
                                    <div className="mt-auto pt-4 border-t border-slate-100 text-sm text-slate-500">
                                        Recordings are available to enrolled students automatically.
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
