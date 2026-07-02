import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Calendar, CheckCircle, AlertCircle, BookOpen, Clock, Award } from "lucide-react";
import { getPhdCandidateStatusAction } from "@/actions/phd-actions";
import { getStudentByUserId } from "@/actions/students";

export const dynamic = "force-dynamic";

export default async function StudentPhdDashboard() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if ((session.user as any).role !== 'student') redirect("/");

    const userId = parseInt(session.user.id || "0");
    const studentRecord = await getStudentByUserId(userId);
    if (!studentRecord) redirect("/");

    const response = await getPhdCandidateStatusAction(studentRecord.id);
    const data = response.data;

    // If no application exists, show prompt to apply
    if (!data || !data.application) {
        return (
            <div className="p-8 max-w-[1200px] mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-12 h-12 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">PhD Processing Portal</h1>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                    You do not currently have an active PhD application. To begin your candidacy, please submit your research proposal and initial forms through the admissions office.
                </p>
                <Button disabled className="bg-slate-800 text-white font-bold px-8 h-12 rounded-xl">
                    Application Open Soon
                </Button>
            </div>
        );
    }

    const { application, supervisors, theses, defense } = data;
    const activeThesis = theses && theses.length > 0 ? theses[0] : null;

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'applied': return <Badge className="bg-slate-100 text-slate-800 border-slate-200">Application Received</Badge>;
            case 'supervisors_pending': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Awaiting Supervisors</Badge>;
            case 'supervisors_accepted': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Supervisors Assigned</Badge>;
            case 'fees_paid': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Ready for Thesis</Badge>;
            case 'under_review': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Thesis Under Review</Badge>;
            case 'approved_corrections': return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Corrections Approved</Badge>;
            case 'defense_scheduled': return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Defense Scheduled</Badge>;
            case 'completed': return <Badge className="bg-emerald-600 text-white border-emerald-700">Graduation Confirmed</Badge>;
            default: return <Badge variant="outline">{status.replace('_', ' ')}</Badge>;
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-[1200px] mx-auto min-h-screen text-slate-800">
            
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-900 text-white rounded-2xl p-8 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Award className="w-48 h-48 text-white" />
                </div>
                
                <div className="space-y-3 relative z-10 text-center md:text-left w-full">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-none">
                                PhD Candidacy Dashboard
                            </h1>
                            <p className="text-slate-400 mt-2 font-medium">
                                Research Title: <span className="text-slate-200 italic">"{application.researchTitle}"</span>
                            </p>
                        </div>
                        <div className="hidden md:block">
                            {renderStatusBadge(application.status || '')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Left Column: Progress & Actions */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* Active Stage Card */}
                    <Card className="-200 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="w-5 h-5 text-indigo-600" /> Current Stage Action Required
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {(application.status === 'supervisors_accepted' || application.status === 'applied') && (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                            <AlertCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Fee Verification Required</h4>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Before you can upload your thesis for review, you must verify that all current session school fees are paid.
                                            </p>
                                        </div>
                                    </div>
                                    <Button className="w-full sm:w-auto mt-2">Verify Fees Payment</Button>
                                </div>
                            )}

                            {application.status === 'fees_paid' && (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Upload Initial Thesis</h4>
                                            <p className="text-sm text-slate-600 mt-1">
                                                You are cleared to upload your draft thesis for the Departmental Review stage.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Select File</Button>
                                    </div>
                                </div>
                            )}

                            {application.status === 'under_review' && (
                                <div className="space-y-4 text-center py-6">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-bold text-slate-900">Thesis is Under Review</h4>
                                    <p className="text-sm text-slate-600 max-w-sm mx-auto">
                                        Your thesis is currently at the <span className="font-bold uppercase text-slate-800">{activeThesis?.status?.replace('_', ' ')}</span> stage. You will be notified once a decision is made.
                                    </p>
                                </div>
                            )}

                            {application.status === 'defense_scheduled' && defense && (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Defense Scheduled</h4>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Your PhD defense has been scheduled.
                                            </p>
                                            <div className="mt-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <p className="text-sm"><strong>Date:</strong> {new Date(defense.defenseDate).toLocaleString()}</p>
                                                <p className="text-sm mt-1"><strong>Location:</strong> {defense.location}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Thesis Submissions History */}
                    <Card className="-200 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-lg">Thesis History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {theses && theses.length > 0 ? theses.map((thesis: any, i: number) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="font-bold text-sm text-slate-900">
                                                    {thesis.isCorrectedVersion ? "Corrected Thesis" : "Initial Draft"}
                                                </p>
                                                <p className="text-xs text-slate-500">Submitted: {new Date(thesis.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline">{thesis.status?.replace('_', ' ')}</Badge>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-500 text-sm">
                                        No thesis submissions yet.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Right Column: Supervisors & Examiners */}
                <div className="space-y-6">
                    <Card className="-200 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-lg">Supervisory Team</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {supervisors && supervisors.length > 0 ? supervisors.map((sup: any, i: number) => (
                                    <div key={i} className="p-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-bold text-sm text-slate-900">{sup.name}</p>
                                            {sup.status === 'accepted' ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Accepted</Badge>
                                            ) : sup.status === 'rejected' ? (
                                                <Badge className="bg-red-100 text-red-800 text-[10px]">Rejected</Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-800 text-[10px]">Pending</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 capitalize">{sup.type} Supervisor</p>
                                        <p className="text-xs text-slate-400 mt-1">{sup.email}</p>
                                    </div>
                                )) : (
                                    <div className="p-6 text-center text-slate-500 text-sm">
                                        No supervisors assigned yet.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>

        </div>
    );
}
