import { auth } from "@/auth";
import { db } from "@/db/db";
import { admissionApplicationsV2, admissionFormTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Printer, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default async function ApplicantReceiptsPage() {
    const session = await auth();
    const userId = Number(session?.user?.id);

    const applications = await db.select({
        id: admissionApplicationsV2.id,
        applicationNumber: admissionApplicationsV2.applicationNumber,
        paymentStatus: admissionApplicationsV2.paymentStatus,
        paymentReference: admissionApplicationsV2.paymentReference,
        processingFeeStatus: admissionApplicationsV2.processingFeeStatus,
        processingFeeReference: admissionApplicationsV2.processingFeeReference,
        appliedAt: admissionApplicationsV2.appliedAt,
        template: {
            name: admissionFormTemplates.name,
            applicationFee: admissionFormTemplates.applicationFee,
            processingFee: admissionFormTemplates.processingFee,
        }
    }).from(admissionApplicationsV2)
      .innerJoin(admissionFormTemplates, eq(admissionApplicationsV2.templateId, admissionFormTemplates.id))
      .where(eq(admissionApplicationsV2.applicantId, userId));

    const paidReceipts = applications.filter(app => app.paymentStatus === 'paid' || app.processingFeeStatus === 'paid');

    return (
        <div className="p-8 w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 italic uppercase tracking-tighter">
                    <Receipt className="w-8 h-8 text-indigo-600" />
                    My Receipts
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Payment History and Receipts</p>
            </div>

            {paidReceipts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-700 italic uppercase">No Receipts Found</h3>
                    <p className="text-slate-400 text-sm font-medium max-w-md mx-auto mt-2">You haven't made any successful payments yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {paidReceipts.map((app) => (
                        <Card key={app.id} className="border border-slate-200 bg-white shadow-sm rounded-[2rem] overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black italic uppercase text-slate-900">{app.template.name}</CardTitle>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                                        App Number: {app.applicationNumber || `APP-${app.id}`}
                                    </p>
                                </div>
                                <span className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Paid
                                </span>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {app.paymentStatus === 'paid' && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Application Fee</p>
                                                <p className="text-lg font-black text-slate-900">₦{parseFloat(app.template.applicationFee?.toString() || "0").toLocaleString()}</p>
                                                <p className="text-[10px] font-bold text-slate-500 mt-1">Ref: {app.paymentReference}</p>
                                            </div>
                                            <Button variant="outline" className="rounded-xl border-slate-200 hover:border-indigo-600 hover:text-indigo-600 font-bold px-4 h-12 text-xs uppercase tracking-widest flex gap-2" asChild>
                                                <Link href={`/applicant/application/${app.id}/receipt?type=application`} target="_blank">
                                                    <Printer className="w-4 h-4" /> Print
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                    {app.processingFeeStatus === 'paid' && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Processing Fee</p>
                                                <p className="text-lg font-black text-slate-900">₦{parseFloat(app.template.processingFee?.toString() || "0").toLocaleString()}</p>
                                                <p className="text-[10px] font-bold text-slate-500 mt-1">Ref: {app.processingFeeReference}</p>
                                            </div>
                                            <Button variant="outline" className="rounded-xl border-slate-200 hover:border-indigo-600 hover:text-indigo-600 font-bold px-4 h-12 text-xs uppercase tracking-widest flex gap-2" asChild>
                                                <Link href={`/applicant/application/${app.id}/receipt?type=processing`} target="_blank">
                                                    <Printer className="w-4 h-4" /> Print
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
