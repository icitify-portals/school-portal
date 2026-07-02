import { getVerificationDataAction } from "@/actions/id-cards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, ShieldAlert, Calendar, MapPin, CheckCircle2, XCircle } from "lucide-react";
import React from "react";

export default async function IDCardVerificationPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const res = await getVerificationDataAction(code);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-[24px] shadow-xl flex items-center justify-center mx-auto ring-1 ring-slate-100">
                        <ShieldCheck className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Credential Registry</h1>
                        <p className="text-slate-500 font-medium tracking-tight">Official Institutional Verification Service</p>
                    </div>
                </div>

                {res.success ? (
                    <Card className="-[40px] overflow-hidden ring-1 ring-slate-200/50 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className={`h-24 ${(res as any).card.status === 'active' ? 'bg-indigo-600' : 'bg-red-600'} relative p-6 flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                                {(res as any).card.status === 'active' ? (
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-white" />
                                )}
                                <span className="text-white font-black uppercase text-xs tracking-widest italic">{(res as any).card.status} Credential</span>
                            </div>
                            <span className="text-white/40 font-black text-[8px] uppercase tracking-widest">UID: {(res as any).card.issueId}</span>
                        </div>

                        <CardContent className="p-8 space-y-8">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="w-32 h-32 rounded-[40px] border-4 border-white shadow-2xl ring-1 ring-slate-100 mb-6">
                                    <AvatarImage src={(res as any).user.image || undefined} />
                                    <AvatarFallback className="bg-slate-900 text-white font-black text-3xl">{(res as any).user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight">{(res as any).user.name}</h2>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 mt-2">{(res as any).user.designation}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <VerificationDetailItem
                                    icon={<ShieldCheck className="w-4 h-4 text-slate-400" />}
                                    label="Official Identifier"
                                    value={(res as any).user.identifier || "N/A"}
                                />
                                <VerificationDetailItem
                                    icon={<MapPin className="w-4 h-4 text-slate-400" />}
                                    label="Administrative Unit"
                                    value={(res as any).user.department}
                                />
                                <VerificationDetailItem
                                    icon={<Calendar className="w-4 h-4 text-slate-400" />}
                                    label="Issuance Record"
                                    value={new Date((res as any).card.issuedAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-50">
                                <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-4">
                                    <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-tighter">
                                        This record is cryptographically signed and verified by the central institutional registry. Any discrepancies should be reported to the ICT unit.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="-[40px] overflow-hidden p-12 text-center space-y-6 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                            <ShieldAlert className="w-10 h-10 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Invalid Card</h2>
                            <p className="text-sm text-slate-500 font-medium mt-2">The verification code provided does not match any active record in our registry.</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Error Code: ERR_VREF_NULL</p>
                    </Card>
                )}

                <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest pt-8">
                    © {new Date().getFullYear()} Institutional Security & Registry Services
                </p>
            </div>
        </div>
    );
}

function VerificationDetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-black text-slate-800 tracking-tight italic uppercase">{value}</p>
            </div>
        </div>
    );
}
