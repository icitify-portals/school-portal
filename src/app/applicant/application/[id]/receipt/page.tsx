import { db } from "@/db/db";
import { admissionApplicationsV2, admissionFormTemplates, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { School, CheckCircle2, MapPin, Mail, Phone } from "lucide-react";
import { format } from "date-fns";

export default async function ApplicationReceipt(props: { params: Promise<{ id: string }>, searchParams: Promise<{ type?: string }> }) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const applicationId = parseInt(params.id);
    const receiptType = searchParams.type || 'application'; // 'application' or 'processing'

    const [application] = await db.select({
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
        },
        applicant: {
            name: users.name,
            email: users.email,
            phone: users.phone,
        }
    }).from(admissionApplicationsV2)
      .innerJoin(admissionFormTemplates, eq(admissionApplicationsV2.templateId, admissionFormTemplates.id))
      .innerJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
      .where(eq(admissionApplicationsV2.id, applicationId))
      .limit(1);

    if (!application) {
        return <div className="p-8 text-center text-red-500 font-bold">Application not found</div>;
    }

    const isAppFee = receiptType === 'application';
    const feeAmount = isAppFee ? application.template.applicationFee : application.template.processingFee;
    const refNumber = isAppFee ? application.paymentReference : application.processingFeeReference;
    const feeStatus = isAppFee ? application.paymentStatus : application.processingFeeStatus;

    if (feeStatus !== 'paid') {
        return <div className="p-8 text-center text-red-500 font-bold">This fee has not been paid yet.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8 flex items-start justify-center print:bg-white print:p-0">
            <Card className="w-full max-w-2xl border-none shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:rounded-none">
                <CardContent className="p-0">
                    <div className="bg-slate-900 text-white p-8 md:p-12 text-center print:bg-slate-900 print:text-white print:-webkit-print-color-adjust-exact">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <School className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">FEDERAL SCHOOL OF STATISTICS, IBADAN</h1>
                        <div className="flex justify-center items-center gap-4 mt-4 text-slate-300 text-xs font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Ibadan, Oyo State</span>
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> info@fssibadan.edu.ng</span>
                        </div>
                    </div>
                    
                    <div className="p-8 md:p-12 space-y-12 bg-white">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-2 rounded-full mb-6 print:bg-emerald-50 print:text-emerald-700 print:-webkit-print-color-adjust-exact">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-black text-sm tracking-widest uppercase">Payment Successful</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase">OFFICIAL RECEIPT</h2>
                            <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mt-2">Date: {format(new Date(), 'PPP')}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 border-y border-dashed border-slate-200 py-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Receipt To</p>
                                <p className="font-black text-slate-900 text-lg uppercase">{application.applicant.name}</p>
                                <p className="font-bold text-slate-500 text-xs mt-1">{application.applicant.email}</p>
                                <p className="font-bold text-slate-500 text-xs mt-1">{application.applicant.phone || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Payment Reference</p>
                                <p className="font-black text-slate-900 text-lg uppercase">{refNumber}</p>
                                <p className="font-bold text-slate-500 text-xs mt-1">App No: {application.applicationNumber || `APP-${application.id}`}</p>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-4">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Description</p>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Amount</p>
                            </div>
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <p className="font-black text-slate-900 uppercase">{application.template.name}</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isAppFee ? 'Application Fee' : 'Processing Fee'}</p>
                                </div>
                                <p className="font-black text-slate-900 text-xl">₦{parseFloat(feeAmount?.toString() || "0").toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl text-center print:bg-slate-50 print:-webkit-print-color-adjust-exact">
                            <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-md mx-auto">
                                This is a computer generated receipt and does not require a physical signature. Keep this receipt safe for your records.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <script dangerouslySetInnerHTML={{ __html: `setTimeout(() => window.print(), 1000);` }} />
        </div>
    );
}
