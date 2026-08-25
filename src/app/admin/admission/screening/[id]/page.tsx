import { db } from "@/db";
import { admissionApplicationsV2, admissionFormTemplates, admissionExamResults, programmes, departments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScoringPanelV2 from "./scoring-panel-v2";
import { User, ClipboardCheck, ArrowLeft, CalendarX2, GraduationCap, Mail, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

function parseApplicantData(raw: unknown): Record<string, unknown> {
    try {
        if (typeof raw === 'string') return JSON.parse(raw || '{}');
        return (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
    } catch {
        return {};
    }
}

export default async function ApplicantScoringPageV2({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const appId = parseInt(id);
    if (isNaN(appId)) notFound();

    // Explicit joins (not the relational API) for maximum DB-version portability
    const [row] = await db.select({
        app: admissionApplicationsV2,
        templateName: admissionFormTemplates.name,
        templateCutoff: admissionFormTemplates.cutoffPercent,
        programmeName: programmes.name,
        departmentName: departments.name,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
    })
        .from(admissionApplicationsV2)
        .leftJoin(admissionFormTemplates, eq(admissionApplicationsV2.templateId, admissionFormTemplates.id))
        .leftJoin(programmes, eq(admissionApplicationsV2.programmeId, programmes.id))
        .leftJoin(departments, eq(programmes.deptId, departments.id))
        .leftJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
        .where(eq(admissionApplicationsV2.id, appId))
        .limit(1);

    if (!row) notFound();
    const app = row.app;

    // Effective attendance = explicit mark OR CBT participation
    const [examResult] = await db.select({ applicationId: admissionExamResults.applicationId })
        .from(admissionExamResults)
        .where(eq(admissionExamResults.applicationId, appId))
        .limit(1);

    const attendance = (app.examAttendanceStatus && app.examAttendanceStatus !== 'pending')
        ? app.examAttendanceStatus
        : (examResult ? 'present' : 'pending');

    const form = parseApplicantData(app.data);
    const name = `${form.firstName || form.first_name || ''} ${form.surname || form.lastName || form.last_name || ''}`.trim()
        || row.userName
        || 'N/A';
    const email = row.userEmail || form.email || form.email_address || '';
    const phone = row.userPhone || form.phone || form.phone_number || '';

    const globalDefault = 40; // per-exercise value is authoritative when set
    const cutoffPercent = parseFloat(row.templateCutoff || '') || globalDefault;

    return (
        <div className="p-6 max-w-[1600px] w-full mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/admission/screening">
                    <Button variant="outline" className="rounded-xl h-10">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Screening
                    </Button>
                </Link>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Candidate Evaluation</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Profile Overview */}
                <Card className="md:col-span-1 border-none shadow-xl rounded-[2rem] bg-white overflow-hidden h-fit">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" /> Applicant Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground uppercase font-semibold">Name</p>
                            <p className="font-bold text-lg">{name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground uppercase font-semibold">Form Number</p>
                            <span className="inline-flex items-center justify-center bg-teal-100 text-teal-800 font-black text-xs rounded-lg px-2.5 py-1">
                                {app.formNumber || `#${app.id}`}
                            </span>
                        </div>
                        {(email || phone) && (
                            <div className="space-y-1.5 pt-2">
                                {email && (
                                    <p className="flex items-center gap-2 text-sm text-slate-600">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {String(email)}
                                    </p>
                                )}
                                {phone && (
                                    <p className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {String(phone)}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className="space-y-1 pt-4 border-t">
                            <p className="text-sm text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
                                <GraduationCap className="w-4 h-4" /> Exercise & Programme
                            </p>
                            <p className="text-sm font-bold">{row.templateName}</p>
                            <p className="text-sm text-slate-600">{row.programmeName || 'Pending Course Selection'}</p>
                            {row.departmentName && (
                                <p className="text-xs text-slate-400">{row.departmentName}</p>
                            )}
                        </div>
                        <div className="pt-4 border-t space-y-2">
                            <p className="text-sm text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
                                <CalendarX2 className="w-4 h-4" /> Exam Attendance
                            </p>
                            <p className={`text-sm font-black uppercase tracking-widest ${
                                attendance === 'present' ? 'text-emerald-600' :
                                attendance === 'absent' ? 'text-rose-600' : 'text-slate-400'
                            }`}>
                                {attendance === 'absent' && '⚠ '}{attendance}
                            </p>
                            {attendance === 'absent' && (
                                <p className="text-xs text-rose-500 font-medium">Absent applicants are never offered admission regardless of score.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Scoring Panel */}
                <Card className="md:col-span-2 border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5" /> Screening Scores & Decision
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ScoringPanelV2
                            applicationId={app.id}
                            applicantName={name}
                            cutoffPercent={cutoffPercent}
                            currentStatus={app.status || 'submitted'}
                            decisionSource={app.decisionSource ?? null}
                            attendance={attendance}
                            acceptancePaymentStatus={app.acceptancePaymentStatus || 'pending'}
                            existingMathScore={app.mathScore ?? null}
                            existingEnglishScore={app.englishScore ?? null}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
