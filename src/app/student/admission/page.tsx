
import { getStudentAdmissionProfile } from "@/actions/admission-application";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCircle2, AlertCircle, Printer, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admission Status | Student Portal",
    description: "Check your admission status and apply for screening.",
};

export default async function StudentAdmissionPage() {
    const { success, candidate, error } = await getStudentAdmissionProfile() as any;

    if (!success || !candidate) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || "Could not load admission profile."}</AlertDescription>
                </Alert>
                <div className="mt-4">
                    <Link href="/admission/claim">
                        <Button variant="outline">Claim Profile</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const application = candidate.applications && candidate.applications.length > 0 ? candidate.applications[0] : null;
    const isAdmitted = application?.status === 'admitted';
    const utmeSubjects = candidate.utmeSubjects ? JSON.parse(candidate.utmeSubjects) : [];

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Admission & Screening</h1>

            {isAdmitted && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-emerald-900 flex items-center gap-2">
                                    <BadgeCheck className="w-6 h-6 text-emerald-600" />
                                    Congratulations! You have been Admitted
                                </CardTitle>
                                <p className="text-emerald-700 text-sm mt-1">
                                    You have been offered provisional admission into the {application.session?.name} Academic Session.
                                </p>
                            </div>
                            <Link href={`/student/admission/letter/${application.id}`} target="_blank">
                                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                                    <Printer className="w-4 h-4 mr-2" /> Print Admission Letter
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                            <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
                                <p className="text-[10px] uppercase font-black text-emerald-600 mb-1">Admission Year</p>
                                <p className="text-lg font-bold text-slate-900">{application.session?.name || "N/A"}</p>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
                                <p className="text-[10px] uppercase font-black text-emerald-600 mb-1">JAMB Reg Number</p>
                                <p className="text-lg font-bold text-slate-900">{candidate.jambRegNo}</p>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm md:col-span-2">
                                <p className="text-[10px] uppercase font-black text-emerald-600 mb-1">Admitted Course</p>
                                <p className="text-lg font-bold text-slate-900">{application.programme?.name || candidate.course?.name || "N/A"}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="text-[10px] uppercase font-black text-emerald-600 mb-2">JAMB UTME Subjects</p>
                            <div className="flex flex-wrap gap-2">
                                {utmeSubjects.length > 0 ? utmeSubjects.map((sub: string, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-white text-emerald-700 border-emerald-200 font-bold px-3 py-1">
                                        {sub}
                                    </Badge>
                                )) : (
                                    <p className="text-sm text-slate-500 italic">No JAMB subjects found.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>JAMB Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Full Name</p>
                                <p className="font-medium">{candidate.surname}, {candidate.firstname} {candidate.middlename}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">JAMB Reg No</p>
                                <p className="font-medium">{candidate.jambRegNo}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Proposed Course</p>
                                <p className="font-medium">{candidate.course?.name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">UTME Score</p>
                                <p className="font-bold text-lg text-primary">{candidate.score}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Course Quota</p>
                                <p className="font-medium">{candidate.course?.name || "N/A"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Post-UTME Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!application ? (
                            <div className="text-center py-6 space-y-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-full w-fit mx-auto">
                                    <Info className="w-6 h-6" />
                                </div>
                                <p className="text-muted-foreground">You have not applied for Post-UTME screening yet.</p>
                                <Link href="/student/admission/apply">
                                    <Button className="w-full">Apply for Screening</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium">Application Status</span>
                                    <Badge variant={
                                        application.status === 'admitted' ? 'default' : // "success" variant not standard in shadcn default
                                            application.status === 'rejected' ? 'destructive' : 'secondary'
                                    }>
                                        {application.status.toUpperCase()}
                                    </Badge>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium">Payment Status</span>
                                    <Badge variant={
                                        application.paymentStatus === 'paid' ? 'outline' : // was 'success'
                                            application.paymentStatus === 'failed' ? 'destructive' : 'secondary'
                                    } className={application.paymentStatus === 'paid' ? 'border-emerald-500 text-emerald-600' : ''}>
                                        {application.paymentStatus.toUpperCase()}
                                    </Badge>
                                </div>

                                {application.paymentStatus === 'pending' && (
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                                        Pay Screening Fee
                                    </Button>
                                )}

                                <Link href={`/student/admission/summary/${application.id}`} target="_blank">
                                    <Button variant="outline" className="w-full mt-2">
                                        <Printer className="h-4 w-4 mr-2" /> Print Application Slip
                                    </Button>
                                </Link>

                                {application.screeningScore !== null && (
                                    <div className="p-4 border rounded-lg space-y-2">
                                        <p className="text-sm text-muted-foreground">Screening Performance</p>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs uppercase tracking-wider text-muted-foreground">Score</p>
                                                <p className="text-xl font-bold">{application.screeningScore}</p>
                                            </div>
                                            {application.aggregateScore && (
                                                <div className="text-right">
                                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Aggregate</p>
                                                    <p className="text-xl font-bold text-indigo-600">{application.aggregateScore}%</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
