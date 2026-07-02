import { auth } from "@/auth";
import { getTranscriptAction, getAcademicSessions } from "@/actions/transcripts";
import { TranscriptVisual } from "@/components/academics/TranscriptVisual";
import { TranscriptDownloader } from "@/components/academics/TranscriptDownloader";
import { TranscriptFilters } from "@/components/academics/TranscriptFilters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, FileText } from "lucide-react";
import React from "react";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { students, institutionalUnits } from "@/db/schema";
import { redirect } from "next/navigation";

export default async function StudentTranscriptPage(props: {
    searchParams: Promise<{ sessionId?: string, semester?: string }>
}) {
    const searchParams = await props.searchParams;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'student') {
        return <div className="p-8">Unauthorized</div>;
    }

    // @ts-expect-error - TS2345: Auto-suppressed for build
    const userId = parseInt(session.user.id);
    const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
    
    if (student && student.unitId) {
        const [unit] = await db.select().from(institutionalUnits).where(eq(institutionalUnits.id, student.unitId)).limit(1);
        if (unit && unit.academicTier === 'k12') {
            redirect("/student/report-card");
        }
    }

    const sessionId = searchParams.sessionId ? parseInt(searchParams.sessionId) : undefined;
    const semester = searchParams.semester ? parseInt(searchParams.semester) : undefined;

    const { success, data, error } = await getTranscriptAction(undefined, 'full', sessionId, semester);
    const sessions = await getAcademicSessions();

    if (!success || !data) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Result Collection Failed</AlertTitle>
                    <AlertDescription>{error || "No academic results found for your profile yet."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8">
            <div className="max-w-[210mm] mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl border border-slate-800 no-print relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 opacity-50 mix-blend-overlay" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                            <FileText className="w-8 h-8 text-indigo-400 drop-shadow-md" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic drop-shadow-md">Academic Transcript</h1>
                            <p className="text-xs text-slate-300 font-bold uppercase tracking-widest mt-1 opacity-90">Official student personal transcript record</p>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <TranscriptDownloader fileName={`Transcript_${data.student.matricNumber.replace(/\//g, '_')}`} />
                    </div>
                </div>

                <TranscriptFilters sessions={sessions} />

                <div className="relative overflow-auto pb-12">
                    <TranscriptVisual data={data} />

                    {/* Watermark/Notice for Web View */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] opacity-[0.03] pointer-events-none select-none no-print">
                        <span className="text-9xl font-black uppercase text-slate-900">Academic Portal Official</span>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0; }
                    .max-w-[210mm] { width: 100% !important; max-width: none !important; margin: 0 !important; }
                    #transcript-printable { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
                }
            `}} />
        </div>
    );
}
