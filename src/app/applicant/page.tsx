import { auth } from "@/auth";
import { db } from "@/db/db";
import { admissionApplicationsV2, admissionFormTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText, CheckCircle2, Clock, Map, CreditCard, CheckSquare, Sparkles } from "lucide-react";

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
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
            
            {/* Bento Identity Header */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="absolute -right-20 -bottom-20 opacity-5 blur-2xl">
                    <Sparkles className="w-[400px] h-[400px]" />
                </div>
                <div className="relative z-10 text-center md:text-left">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-black uppercase tracking-widest text-slate-300 mb-4">
                        Applicant Portal
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Welcome, {session?.user?.name}</h2>
                    <p className="text-slate-400 font-medium">Track your admission applications and requirements here.</p>
                </div>
            </div>

            {applications.length === 0 ? (
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-12 text-center flex flex-col items-center justify-center min-h-[40vh]">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                        <Map className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Your Journey Starts Here</h3>
                    <p className="text-slate-500 font-medium mb-8 max-w-sm">You haven't started any admission applications yet. Browse programs to apply.</p>
                    <Link href="/">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-6 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-indigo-200">
                            Browse Programs
                        </Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Active Applications Bento Board */}
                    {applications.map((app) => (
                        <Card key={app.id} className="border-none shadow-sm hover:shadow-xl transition-all rounded-[2rem] bg-white group overflow-hidden flex flex-col">
                            <CardHeader className="bg-slate-50 p-6 border-b border-slate-100">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1.5">{app.template.level}</div>
                                        <CardTitle className="text-lg font-black text-slate-900 leading-tight">{app.template.name}</CardTitle>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                        app.status === 'admitted' ? 'bg-emerald-100 text-emerald-700' :
                                        app.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-200 text-slate-600'
                                    }`}>
                                        {app.status}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 flex-1 flex flex-col justify-between">
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            <CheckSquare className="w-3 h-3" /> App ID
                                        </div>
                                        <div className="text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                                            APP-{new Date().getFullYear()}-{app.id}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            <CreditCard className="w-3 h-3" /> Fee
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-fit bg-slate-50">
                                            {app.paymentStatus === 'paid' ? (
                                                <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-sm font-bold text-slate-700">Paid</span></>
                                            ) : (
                                                <><Clock className="w-3.5 h-3.5 text-amber-500" /><span className="text-sm font-bold text-slate-700">Pending</span></>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <Link href={`/applicant/application/${app.id}`} className="block mt-auto">
                                    <Button className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-6 rounded-xl flex items-center justify-between px-6 group-hover:shadow-lg transition-all text-xs uppercase tracking-widest">
                                        <span>{app.status === 'draft' ? "Continue App" : "View Details"}</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                    
                    {/* Add New Application Tile (Bento Style) */}
                    <Link href="/" className="md:col-span-1 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-[2rem] flex flex-col items-center justify-center p-8 min-h-[300px] transition-all group text-center cursor-pointer">
                        <div className="w-16 h-16 bg-slate-100 group-hover:bg-indigo-100 rounded-[1.5rem] flex items-center justify-center mb-4 transition-colors">
                            <Sparkles className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <h4 className="text-lg font-black text-slate-700 group-hover:text-indigo-900 tracking-tight mb-1">New Application</h4>
                        <p className="text-xs font-medium text-slate-500">Apply for another programme</p>
                    </Link>
                </div>
            )}
        </div>
    );
}
