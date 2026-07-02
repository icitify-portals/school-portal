import { getStudentHealthData } from "@/actions/health";
import { getStudentByUserId } from "@/actions/students";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, FileUp, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import HealthReportUploadForm from "./upload-form";
import { Badge } from "@/components/ui/badge";

export default async function HealthRecordsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const studentData = await getStudentByUserId(parseInt(session.user.id));
    if (!studentData) redirect("/student");

    const healthRes = await getStudentHealthData(studentData.id);
    const health = healthRes.success ? healthRes.data : null;

    if (!health) {
        return <div className="p-8 text-center text-red-500">Failed to load health data.</div>;
    }

    const records = health.healthRecords || [];

    return (
        <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-6">
                <Card className="-100/50 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-600" />
                            My Medical Reports
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {records.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No medical reports uploaded yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {records.map((record: any) => (
                                    <div key={record.id} className="p-6 flex items-start justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{record.title}</h4>
                                                <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">Type: {record.type.replace('_', ' ')}</p>
                                                {record.description && <p className="text-sm text-slate-600">{record.description}</p>}
                                                <p className="text-xs text-slate-400 mt-2">Uploaded: {new Date(record.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            {record.status === 'pending' && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1"><Clock className="w-3 h-3" /> Pending</Badge>}
                                            {record.status === 'verified' && <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>}
                                            {record.status === 'rejected' && <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>}
                                            {record.rejectionReason && <p className="text-xs text-red-500 max-w-[200px] mt-1">{record.rejectionReason}</p>}
                                            <a href={record.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline mt-2">
                                                View Document
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-1">
                <Card className="-100/50 sticky top-24 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-indigo-600 text-white rounded-t-xl">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileUp className="w-5 h-5" />
                            Upload New Report
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <HealthReportUploadForm studentId={studentData.id} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
