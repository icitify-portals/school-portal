import { auth } from "@/auth";
import { db } from "@/db/db";
import { parentStudentMappings, students, institutionalUnits } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranscriptAction, getAcademicSessions } from "@/actions/transcripts";
import { TranscriptVisual } from "@/components/academics/TranscriptVisual";
import { TranscriptDownloader } from "@/components/academics/TranscriptDownloader";
import { TranscriptFilters } from "@/components/academics/TranscriptFilters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

export default async function ParentChildTranscriptPage(props: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ sessionId?: string, semester?: string }>
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const sessionToken = await auth();

    if (!sessionToken?.user?.id || (sessionToken.user as any).role !== 'parent') {
        redirect("/login");
    }

    const parentId = parseInt(sessionToken.user.id);
    const studentId = parseInt(params.id);

    // Security Check: Verify this student belongs to this parent
    const mapping = await db.select().from(parentStudentMappings).where(and(
        eq(parentStudentMappings.parentId, parentId),
        eq(parentStudentMappings.studentId, studentId)
    )).limit(1);

    if (mapping.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 max-w-xl mx-auto">
                    <h2 className="text-xl font-black mb-2">Access Denied</h2>
                    <p className="font-medium mb-4">You do not have permission to view this student's records.</p>
                    <Link href="/parent/dashboard" className="text-indigo-600 font-black flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Academic tier guard: redirect K-12 students to report card
    const [studentObj] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    if (studentObj && studentObj.unitId) {
        const [unit] = await db.select().from(institutionalUnits).where(eq(institutionalUnits.id, studentObj.unitId)).limit(1);
        if (unit && unit.academicTier === 'k12') {
            redirect(`/parent/child/${studentId}/report-card`);
        }
    }

    const sessionId = searchParams.sessionId ? parseInt(searchParams.sessionId) : undefined;
    const semester = searchParams.semester ? parseInt(searchParams.semester) : undefined;

    const { success, data, error } = await getTranscriptAction(studentId, 'full', sessionId, semester);
    const sessions = await getAcademicSessions();

    if (!success || !data) {
        return (
            <div className="p-8 max-w-[1600px] w-full mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link 
                        href={`/parent/child/${studentId}`}
                        className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Transcript</h1>
                </div>
                <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Result Collection Failed</AlertTitle>
                    <AlertDescription>{error || "No academic results found for your child's profile yet."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
            <div className="max-w-[210mm] mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 no-print">
                    <div className="flex items-center gap-4">
                        <Link 
                            href={`/parent/child/${studentId}`}
                            className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-100 transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Transcript</h1>
                            <p className="text-sm text-slate-500 font-medium">Official academic record for {data.student.name}</p>
                        </div>
                    </div>
                    <TranscriptDownloader fileName={`Transcript_${data.student.matricNumber.replace(/\//g, '_')}`} />
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
