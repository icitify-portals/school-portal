import { verifyCertificateAction } from "@/actions/credentials";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Calendar, GraduationCap, Award, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const res = await verifyCertificateAction(code);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <Card className="max-w-2xl w-full -100 -[32px] overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="h-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

                <CardHeader className="text-center pt-10 pb-6 bg-slate-50/50 border-b border-slate-100 p-6">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 ring-1 ring-indigo-100 shadow-inner">
                        <ShieldCheck className={`w-10 h-10 ${res.success ? 'text-indigo-600' : 'text-slate-300'}`} />
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
                        Credential Verification
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium">
                        Public registry for academic achievements and certifications.
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-10 pb-12 space-y-8 p-6">
                    {res.success ? (
                        <div className="space-y-8">
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                                <div>
                                    <p className="text-emerald-900 font-black uppercase text-xs tracking-widest leading-none mb-1">Authenticity Verified</p>
                                    <p className="text-emerald-700 text-sm font-medium">This certificate is valid and issued by the Academic Portal registry.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Name</p>
                                    <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{(res as any).certificate.studentName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issuance Date</p>
                                    <p className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                        {new Date((res as any).certificate.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credential Name</p>
                                    <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-amber-500" />
                                        <p className="text-lg font-bold text-slate-800">{(res as any).certificate.courseName}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Code</p>
                                    <p className="text-lg font-bold text-slate-800">{(res as any).certificate.courseCode}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credential ID</p>
                                    <p className="text-sm font-mono font-bold text-indigo-600">{(res as any).certificate.certificateCode}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issuer</p>
                                    <p className="text-sm font-bold text-slate-700 uppercase italic">Official Academic Portal</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 text-center">
                            <div className="bg-red-50 border border-red-100 p-8 rounded-[32px] inline-block mx-auto">
                                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <h3 className="text-red-900 font-black uppercase text-sm tracking-widest">Verification Failed</h3>
                                <p className="text-red-700 text-sm font-medium mt-2 max-w-xs">{(res as any).error || "The provided certificate code does not match any record in our registry."}</p>
                            </div>
                            <div className="pt-4">
                                <Button asChild variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold uppercase text-[10px] tracking-widest">
                                    <Link href="/">Return to Portal</Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="pt-10 border-t border-slate-100 flex justify-center">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Academic Portal System Registry</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
