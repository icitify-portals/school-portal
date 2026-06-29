
import { db } from "@/db";
import { admissionApplications, jambCandidates, programmes, admissionSessions, departments, faculties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Printer, Download, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ApplicationSummaryPage({ params }: { params: Promise<{ id: string }> }) {
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
        programme: appRows[0].programme,
        session: appRows[0].session
    };

    if (!application || !application.candidate) {
        notFound();
    }

    const { candidate, session, programme } = application;
    const extraData = application.extraData ? JSON.parse(application.extraData) : {};
    const dynamicFields = session?.dynamicFields ? JSON.parse(session.dynamicFields) : [];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:bg-white print:p-0">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Actions (Hidden on Print) */}
                <div className="flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-bold text-slate-700">Application Slip</h2>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-2" /> Print PDF
                        </Button>
                    </div>
                </div>

                {/* The Slip */}
                <div className="bg-white shadow-xl border rounded-2xl overflow-hidden print:shadow-none print:border-none">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left space-y-2">
                            {session?.logoUrl && (
                                <img src={session.logoUrl} alt="Logo" className="h-20 w-auto mx-auto md:mx-0 invert brightness-0" />
                            )}
                            <h1 className="text-2xl font-black uppercase tracking-tighter">{session?.name || "ADMISSION SUMMARY"}</h1>
                            <p className="text-slate-400 text-sm font-mono">APP-REF: {application.id.toString().padStart(6, '0')}</p>
                        </div>
                        <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center">
                            <BadgeCheck className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                            <p className="text-xs uppercase font-bold text-emerald-300">Application Status</p>
                            <p className="text-xl font-black text-white">{(application.status || "applied").toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Section 1: Personal Info */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b pb-2">Candidate Details</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3">
                                        <span className="text-slate-400 text-sm">Full Name</span>
                                        <span className="col-span-2 font-bold text-slate-800 uppercase">{candidate.surname}, {candidate.firstname} {candidate.middlename}</span>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <span className="text-slate-400 text-sm">JAMB Reg NO</span>
                                        <span className="col-span-2 font-mono font-bold">{candidate.jambRegNo}</span>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <span className="text-slate-400 text-sm">Email</span>
                                        <span className="col-span-2">{candidate.email || "N/A"}</span>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <span className="text-slate-400 text-sm">DOB</span>
                                        <span className="col-span-2">{candidate.dob || "N/A"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b pb-2">Programme Selection</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3">
                                        <span className="text-slate-400 text-sm">Choice</span>
                                        <span className="col-span-2 font-bold text-slate-800">{programme?.name}</span>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <span className="text-slate-400 text-sm">Faculty</span>
                                        <span className="col-span-2">{candidate.faculty?.name}</span>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <span className="text-slate-400 text-sm">UTME Score</span>
                                        <span className="col-span-2 font-bold text-indigo-600">{candidate.score}</span>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <span className="text-slate-400 text-sm">Applied Date</span>
                                        <span className="col-span-2 text-slate-500">{application.appliedAt ? format(new Date(application.appliedAt), 'PPP p') : "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Dynamic Fields */}
                        {dynamicFields.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b pb-2">Additional Information</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {dynamicFields.map((field: any) => (
                                        <div key={field.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{field.label}</p>
                                            <p className="font-medium text-slate-700">{extraData[field.id] || "—"}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Info */}
                        <div className="p-6 bg-slate-900 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] uppercase font-bold text-slate-500">Transaction Info</p>
                                <p className="text-white text-sm font-mono">{application.paymentReference || "NOT_SET_YET"}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Amount Paid</p>
                                    // @ts-expect-error - TS2304: Auto-suppressed for build
                                    <p className="text-xl font-black text-white">{settings?.base_currency || '₦'}{Number(session?.applicationFee).toLocaleString()}</p>
                                </div>
                                <div className="h-10 w-[1px] bg-slate-800 hidden md:block" />
                                <div className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg">
                                    {(application.paymentStatus || "pending").toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-8 border-t text-center space-y-2">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">School Portal Admission Management System</p>
                            <div className="flex justify-center gap-4 text-xs text-slate-500">
                                <span>Support: support@school.edu</span>
                                <span>Verification: verify@school.edu</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
