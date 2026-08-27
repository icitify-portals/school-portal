import { auth } from "@/auth";
import { db } from "@/db/db";
import { admissionApplicationsV2, admissionFormTemplates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText, CheckCircle2, Clock, CreditCard, CheckSquare, Sparkles, Printer, GraduationCap, Globe, PartyPopper } from "lucide-react";
import { StartApplicationButton } from "./StartApplicationButton";
import { ProgramSelectionModal } from "./ProgramSelectionModal";
import { AdmissionsAnnouncement } from "@/components/AdmissionsAnnouncement";

/** Raw workflow statuses mapped to what applicants should actually read. */
function friendlyAdmissionLabel(status: string | null | undefined): { label: string; pending: boolean } {
    switch (status) {
        case 'admitted': return { label: 'ADMITTED', pending: false };
        case 'rejected': return { label: 'NOT ADMITTED', pending: false };
        default: return { label: 'PENDING', pending: true }; // draft/submitted/paid/screened
    }
}

export default async function ApplicantDashboard() {
    const session = await auth();
    const userId = Number(session?.user?.id);

    // Fetch ALL active form templates
    const templates = await db.select()
        .from(admissionFormTemplates)
        .where(eq(admissionFormTemplates.isActive, true))
        .orderBy(desc(admissionFormTemplates.createdAt));

    // Fetch applicant's existing applications
    const applications = await db.select({
        id: admissionApplicationsV2.id,
        status: admissionApplicationsV2.status,
        paymentStatus: admissionApplicationsV2.paymentStatus,
        processingFeeStatus: admissionApplicationsV2.processingFeeStatus,
        programmeId: admissionApplicationsV2.programmeId,
        appliedAt: admissionApplicationsV2.appliedAt,
        formNumber: admissionApplicationsV2.formNumber,
        templateId: admissionApplicationsV2.templateId,
    })
    .from(admissionApplicationsV2)
    .where(eq(admissionApplicationsV2.applicantId, userId));

    // Map applications by templateId for quick lookup
    const appsByTemplate = new Map<number, typeof applications[0]>();
    for (const app of applications) {
        // Keep the most recent (highest id) application per template
        const existing = appsByTemplate.get(app.templateId);
        if (!existing || app.id > existing.id) {
            appsByTemplate.set(app.templateId, app);
        }
    }

    // Admission status summary: admitted on ANY application wins; otherwise pending
    const admittedApp = applications.find(a => a.status === 'admitted');
    const rejectedAll = applications.length > 0 && applications.every(a => a.status === 'rejected');
    const anyApp = appsByTemplate.size > 0;

    return (
        <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-4 md:space-y-6">
            
            {/* Bento Identity Header */}
            <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8">
                <div className="absolute -right-20 -bottom-20 opacity-5 blur-2xl">
                    <Sparkles className="w-[400px] h-[400px]" />
                </div>
                <div className="relative z-10 text-left md:text-left">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">
                        Applicant Portal
                    </div>
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-1 leading-tight">Welcome, {session?.user?.name}</h2>
                    <p className="text-slate-400 text-sm font-medium">Track your admission applications and requirements here.</p>
                </div>
                <div className="relative z-10 flex flex-row sm:flex-row items-center gap-2 w-full md:w-auto">
                    <Link href="/guide/applicants" className="flex-1 md:flex-none">
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white border-none font-bold rounded-xl px-3 py-2 text-[10px] uppercase tracking-widest flex items-center gap-1.5 w-full">
                            <FileText className="w-3.5 h-3.5 shrink-0" /> Application Guide
                        </Button>
                    </Link>
                    <Link href="https://fssibadan.edu.ng" target="_blank" className="flex-1 md:flex-none">
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold rounded-xl px-3 py-2 text-[10px] uppercase tracking-widest flex items-center gap-1.5 w-full">
                            <Globe className="w-3.5 h-3.5 shrink-0" /> Main Website
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Admission Status Hero */}
            {admittedApp ? (
                <Link
                    href={`/admission/status/${admittedApp.id}`}
                    className="block bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden hover:shadow-emerald-200/50 transition-all group"
                >
                    <div className="absolute -right-16 -top-16 opacity-10">
                        <GraduationCap className="w-[200px] md:w-[300px] h-[200px] md:h-[300px]" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start md:items-center gap-4">
                            <div className="w-11 h-11 md:w-14 md:h-14 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                                <PartyPopper className="w-5 h-5 md:w-7 md:h-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Admission Status</p>
                                <h3 className="text-lg md:text-2xl lg:text-3xl font-black tracking-tight uppercase italic leading-tight">
                                    Congratulations — You&apos;ve Been Offered Admission!
                                </h3>
                                <p className="text-emerald-50 text-xs font-bold mt-1 leading-snug">
                                    Click to view your offer, pay your acceptance fee and download your admission letter.
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="w-6 h-6 md:w-8 md:h-8 shrink-0 group-hover:translate-x-2 transition-transform self-end md:self-auto" />
                    </div>
                </Link>
            ) : anyApp ? (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${rejectedAll ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-600'}`}>
                            {rejectedAll ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6 animate-pulse" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Admission Status</p>
                            <h3 className={`text-xl md:text-2xl font-black tracking-tight uppercase ${rejectedAll ? 'text-rose-600' : 'text-slate-800'}`}>
                                {rejectedAll ? 'Application Not Successful This Intake' : 'Pending — Under Review'}
                            </h3>
                            <p className="text-slate-500 text-xs font-medium mt-0.5">
                                {rejectedAll
                                    ? 'Thank you for applying. Watch this space for future intake announcements.'
                                    : 'Your application is received and awaiting the release of entrance examination results and admission decisions.'}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            <AdmissionsAnnouncement />

            {/* Program Selection Modal for New Applicants */}
            {applications.length === 0 && templates.length > 0 && (
                <ProgramSelectionModal templates={templates} />
            )}

            {/* Available Application Forms */}
            {templates.length === 0 ? (
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-12 text-center flex flex-col items-center justify-center min-h-[40vh]">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                        <GraduationCap className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Active Admissions</h3>
                    <p className="text-slate-500 font-medium mb-8 max-w-sm">There are no admission forms currently open. Please check back later.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => {
                        const app = appsByTemplate.get(template.id);
                        const hasApp = !!app;
                        
                        return (
                            <Card key={template.id} className="border-none shadow-sm hover:shadow-xl transition-all rounded-[2rem] bg-white group overflow-hidden flex flex-col">
                                <CardHeader className="bg-slate-50 p-6 border-b border-slate-100">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1.5">{template.level}</div>
                                            <CardTitle className="text-lg font-black text-slate-900 leading-tight">{template.name}</CardTitle>
                                        </div>
                                        {hasApp ? (
                                            (() => {
                                                const friendly = friendlyAdmissionLabel(app.status);
                                                return (
                                                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                                        !friendly.pending && app.status === 'admitted' ? 'bg-emerald-100 text-emerald-700' :
                                                        !friendly.pending ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {friendly.label}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <div className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm bg-slate-100 text-slate-500">
                                                Not Started
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                                    {hasApp ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4 mb-8">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                        <FileText className="w-3 h-3" /> Form No
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                                                        {app.formNumber || `APP-${app.id}`}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                        <CreditCard className="w-3 h-3" /> App Fee
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-fit bg-slate-50">
                                                        {app.paymentStatus === 'paid' ? (
                                                            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-sm font-bold text-emerald-700">Paid</span></>
                                                        ) : (
                                                            <><Clock className="w-3.5 h-3.5 text-amber-500" /><span className="text-sm font-bold text-amber-700">Pending</span></>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                        <CreditCard className="w-3 h-3" /> Processing Fee
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-fit bg-slate-50">
                                                        {app.processingFeeStatus === 'paid' ? (
                                                            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-sm font-bold text-emerald-700">Paid</span></>
                                                        ) : (
                                                            <><Clock className="w-3.5 h-3.5 text-amber-500" /><span className="text-sm font-bold text-amber-700">Pending</span></>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-3 mt-auto">
                                                <Link href={`/applicant/application/${app.id}`} className="flex-1">
                                                    <Button className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-6 rounded-xl flex items-center justify-between px-6 group-hover:shadow-lg transition-all text-xs uppercase tracking-widest">
                                                        <span>{app.status === 'draft' ? "Continue App" : "View Details"}</span>
                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                                    </Button>
                                                </Link>
                                                {app.status === 'submitted' && (
                                                    <Link href={`/applicant/application/${app.id}/print`} className="flex-shrink-0">
                                                        <Button variant="outline" className="h-full bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-black px-4 rounded-xl transition-all shadow-sm">
                                                            <Printer className="w-5 h-5" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mb-8">
                                                <p className="text-sm text-slate-500 font-medium">
                                                    {template.applicationFee ? `Application Fee: ₦${parseFloat(template.applicationFee.toString()).toLocaleString()}` : 'Free Application'}
                                                    {template.processingFee ? ` · Processing Fee: ₦${parseFloat(template.processingFee.toString()).toLocaleString()}` : ''}
                                                </p>
                                                {template.endDate && (
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mt-2">
                                                        Deadline: {new Date(template.endDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-auto">
                                                <StartApplicationButton templateId={template.id} templateName={template.name} />
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


