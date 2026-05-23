
import { db } from "@/db";
import { admissionApplications, jambCandidates, programmes, admissionSessions, departments, faculties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdmissionLetterPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const appId = parseInt(id);

    const appRows = await db.select({
        application: admissionApplications,
        candidate: jambCandidates,
        programme: programmes,
        session: admissionSessions,
        department: departments,
        faculty: faculties
    })
        .from(admissionApplications)
        .leftJoin(jambCandidates, eq(admissionApplications.jambRegNo, jambCandidates.jambRegNo))
        .leftJoin(programmes, eq(admissionApplications.programmeId, programmes.id))
        .leftJoin(admissionSessions, eq(admissionApplications.sessionId, admissionSessions.id))
        .leftJoin(departments, eq(jambCandidates.deptId, departments.id))
        .leftJoin(faculties, eq(jambCandidates.facultyId, faculties.id))
        .where(eq(admissionApplications.id, appId))
        .limit(1);

    if (appRows.length === 0 || !appRows[0].candidate || appRows[0].application.status !== 'admitted') {
        notFound();
    }

    const { application, candidate, session, programme, faculty, department } = appRows[0];

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 print:bg-white print:p-0">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Actions (Hidden on Print) */}
                <div className="flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-bold text-slate-700">Admission Letter</h2>
                    <Button onClick={() => window.print()} className="bg-indigo-600">
                        <Printer className="h-4 w-4 mr-2" /> Print Letter
                    </Button>
                </div>

                {/* The Letter */}
                <div className="bg-white shadow-2xl p-12 md:p-20 min-h-[1100px] border-t-8 border-indigo-600 print:shadow-none print:border-none print:p-0">
                    {/* Header */}
                    <div className="text-center space-y-4 border-b pb-8 mb-12">
                        {session?.logoUrl ? (
                            <img src={session.logoUrl} alt="Logo" className="h-24 w-auto mx-auto" />
                        ) : (
                            <div className="h-24 w-24 bg-indigo-600 rounded-full mx-auto flex items-center justify-center">
                                <ShieldCheck className="h-12 w-12 text-white" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">University Admission Office</h1>
                            <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">OFFICIAL PROVISIONAL ADMISSION LETTER</p>
                        </div>
                    </div>

                    {/* Meta Data */}
                    <div className="flex justify-between text-sm mb-12">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-900">Ref: ADM/{session?.name.replace('/', '-')}/{application.id.toString().padStart(4, '0')}</p>
                            <p className="text-slate-500">Date: {format(new Date(), 'PPP')}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-slate-900">Session: {session?.name}</p>
                            <BadgeCheck className="h-8 w-8 text-emerald-500 ml-auto" />
                        </div>
                    </div>

                    {/* Candidate */}
                    <div className="mb-10">
                        <p className="text-slate-500 text-sm mb-2 uppercase font-bold tracking-tighter">Candidate Address:</p>
                        <h2 className="text-xl font-black text-slate-900 uppercase">{candidate.surname}, {candidate.firstname} {candidate.middlename}</h2>
                        <p className="text-slate-700 font-mono">JAMB REG: {candidate.jambRegNo}</p>
                        <p className="text-slate-600">{candidate.email}</p>
                    </div>

                    {/* Body */}
                    <div className="space-y-6 text-slate-800 leading-relaxed text-justify prose prose-slate max-w-none">
                        <p className="font-bold">Dear {candidate.firstname},</p>

                        <p>
                            We are pleased to inform you that you have been offered <span className="font-black text-slate-900">PROVISIONAL ADMISSION</span> into this institution for the
                            <span className="font-bold"> {session?.name} </span> Academic Session to pursue a course of study leading to the award of the degree of:
                        </p>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 my-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] uppercase font-black text-slate-400">Course of Study</p>
                                    <p className="text-lg font-black text-indigo-700 leading-tight">{programme?.name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black text-slate-400">Faculty/School</p>
                                    <p className="text-lg font-bold text-slate-900">{faculty?.name || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        <p>
                            This offer is subject to the following conditions:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Presentation of original JAMB Admission Letter and Result Slip.</li>
                            <li>Verification of your O'level results (WAEC/NECO/NABTEB) as presented during screening.</li>
                            <li>Payment of the prescribed acceptance and tuition fees within the stipulated timeframe.</li>
                            <li>Satisfactory medical clearance from the University Health Center.</li>
                        </ul>

                        <p>
                            Please note that this admission can be withdrawn at any time if it is discovered that you do not possess the
                            qualifications on the basis of which this offer was made, or if you provided false information during the application process.
                        </p>

                        <p>
                            Accept our warm congratulations on your well-deserved success.
                        </p>
                    </div>

                    {/* Signature */}
                    <div className="mt-20 pt-12">
                        <div className="w-48 h-px bg-slate-300 mb-4" />
                        <p className="font-black uppercase text-slate-900">Registrar</p>
                        <p className="text-xs text-slate-500 italic">This is a system-generated document and requires no physical signature for initial processing.</p>
                    </div>

                    {/* Footer / QR */}
                    <div className="mt-24 pt-8 border-t flex justify-between items-end">
                        <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                            <p>Official Admission Portal</p>
                            <p>© {new Date().getFullYear()} Undergraduate Admissions</p>
                        </div>
                        <div className="opacity-20 hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 bg-slate-200 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BadgeCheck({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
    )
}
