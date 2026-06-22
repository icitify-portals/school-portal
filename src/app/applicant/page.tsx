import { auth } from "@/auth";
import { db } from "@/db/db";
import { admissionApplicationsV2, admissionFormTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText, CheckCircle2, Clock } from "lucide-react";

export default async function ApplicantDashboard() {
    const session = await auth();
    const userId = Number(session?.user?.id);

    // Fetch applicant's applications
    const applications = await db.select({
        id: admissionApplicationsV2.id,
        status: admissionApplicationsV2.status,
        paymentStatus: admissionApplicationsV2.paymentStatus,
        appliedAt: admissionApplicationsV2.appliedAt,
        template: {
            name: admissionFormTemplates.name,
            level: admissionFormTemplates.level,
            slug: admissionFormTemplates.slug,
            flowType: admissionFormTemplates.flowType
        }
    })
    .from(admissionApplicationsV2)
    .innerJoin(admissionFormTemplates, eq(admissionApplicationsV2.templateId, admissionFormTemplates.id))
    .where(eq(admissionApplicationsV2.applicantId, userId));

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-wider">Welcome, {session?.user?.name}</h2>
                <p className="text-slate-400 text-sm font-medium">Manage and track your admission applications here.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {applications.length === 0 ? (
                    <Card className="bg-slate-900 border-slate-800 md:col-span-2 p-12 text-center flex flex-col items-center justify-center">
                        <FileText className="w-16 h-16 text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Applications Found</h3>
                        <p className="text-slate-400 text-sm mb-6">You haven't started any admission applications yet.</p>
                        <Link href="/">
                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl">Browse Available Programs</Button>
                        </Link>
                    </Card>
                ) : (
                    applications.map((app) => (
                        <Card key={app.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                            <CardHeader className="border-b border-slate-800/50 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">{app.template.level}</div>
                                        <CardTitle className="text-lg font-bold text-white leading-tight">{app.template.name}</CardTitle>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        app.status === 'admitted' ? 'bg-emerald-500/10 text-emerald-400' :
                                        app.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' :
                                        'bg-slate-800 text-slate-300'
                                    }`}>
                                        {app.status}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Application ID</div>
                                        <div className="text-sm font-medium text-slate-300">APP-{new Date().getFullYear()}-{app.id}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Payment Status</div>
                                        <div className="flex items-center gap-1.5">
                                            {app.paymentStatus === 'paid' ? (
                                                <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-sm font-medium text-emerald-500">Paid</span></>
                                            ) : (
                                                <><Clock className="w-3.5 h-3.5 text-amber-500" /><span className="text-sm font-medium text-amber-500">Pending</span></>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <Link href={`/applicant/application/${app.id}`} className="block">
                                    <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 group">
                                        {app.status === 'draft' ? "Continue Application" : "View Details"}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
