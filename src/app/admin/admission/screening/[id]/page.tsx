
import { db } from "@/db";
import { admissionApplications, oLevelResults, jambCandidates, programmes, departments, faculties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EnhancedScoringForm from "./enhanced-scoring-form";
import { User, ClipboardCheck, Award } from "lucide-react";

export default async function ApplicantScoringPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const appId = parseInt(id);

    const appRows = await db.select({
        application: admissionApplications,
        candidate: jambCandidates,
        programme: programmes,
        department: departments,
        faculty: faculties
    })
        .from(admissionApplications)
        .leftJoin(jambCandidates, eq(admissionApplications.jambRegNo, jambCandidates.jambRegNo))
        .leftJoin(programmes, eq(admissionApplications.programmeId, programmes.id))
        .leftJoin(departments, eq(jambCandidates.deptId, departments.id))
        .leftJoin(faculties, eq(jambCandidates.facultyId, faculties.id))
        .where(eq(admissionApplications.id, appId))
        .limit(1);

    if (appRows.length === 0 || !appRows[0].candidate) {
        notFound();
    }

    const application = {
        ...appRows[0].application,
        candidate: {
            ...appRows[0].candidate,
            department: appRows[0].department,
            faculty: appRows[0].faculty
        },
        programme: appRows[0].programme
    };

    if (!application || !application.candidate) {
        notFound();
    }

    // Fetch O-Level Results and Post-UTME Scores
    const oLevels = await db.select().from(oLevelResults).where(eq(oLevelResults.jambRegNo, application.candidate.jambRegNo));
    
    // Get scoring configuration
    const programmeScoring = await db.select().from(programmes).where(eq(programmes.id, application.programmeId)).limit(1).then(res => res[0]);

    return (
        <div className="p-6 max-w-[1600px] w-full mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Candidate Evaluation</h1>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Overview */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" /> Candidate Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground uppercase font-semibold">Name</p>
                            <p className="font-medium text-lg">{application.candidate.surname}, {application.candidate.firstname} {application.candidate.middlename}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground uppercase font-semibold">Reg NO</p>
                            <p className="font-mono">{application.candidate.jambRegNo}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground uppercase font-semibold">Department</p>
                            <p>{application.candidate.department?.name || "N/A"}</p>
                        </div>
                        <div className="space-y-1 pt-4 border-t">
                            <p className="text-sm text-muted-foreground uppercase font-semibold">UTME Performance</p>
                            <p className="text-2xl font-bold text-primary">{application.candidate.score}</p>
                            <div className="text-xs text-muted-foreground mt-1">
                                Subjects: {application.candidate.utmeSubjects || "Not Provided"}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Evaluation Form / Scoring */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5" /> Screening Scores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <EnhancedScoringForm
                            applicationId={application.id}
                            jambRegNo={application.candidate.jambRegNo}
                            programmeId={application.programmeId}
                            utmeScore={application.candidate.score || 0}
                            currentStatus={application.status || 'pending'}
                            scoringStrategy={programmeScoring?.scoringStrategy || 'JAMB_ONLY'}
                            cutOffMark={programmeScoring?.cutOffMark || 180}
                        />

                        {/* O-Level Preview */}
                        <div className="mt-8 pt-6 border-t space-y-4">
                            <div className="flex items-center gap-2 font-semibold">
                                <Award className="h-5 w-5 text-amber-500" /> O-Level Results
                            </div>
                            {oLevels.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No O-Level results uploaded/matched.</p>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {oLevels.map(ol => (
                                        <div key={ol.id} className="p-3 bg-slate-50 rounded-lg border">
                                            <p className="text-xs font-bold uppercase text-slate-500">{ol.examType} {ol.examYear}</p>
                                            <div className="mt-2 text-sm space-y-1">
                                                {Object.entries(JSON.parse(ol.subjects || '{}')).map(([sub, grade]) => (
                                                    <div key={sub} className="flex justify-between">
                                                        <span>{sub}</span>
                                                        <span className="font-bold">{grade as string}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
