import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { IDCardService } from "@/services/IDCardService";
import { getMyIDCardAction, generateQRAction } from "@/actions/id-cards";
import { IDCardVisual } from "@/components/credentials/IDCardVisual";
import { IDCardDownloader } from "@/components/credentials/IDCardDownloader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Info, AlertTriangle, Briefcase, Lock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestIDCardAction } from "@/actions/id-cards";
import { getIDCardSettings } from "@/actions/settings";
import { Badge } from "@/components/ui/badge";

export default async function StaffIDCardPage() {
    const session = await auth();
    if (!session?.user?.id || ((session.user as any).role !== 'staff' && (session.user as any).role !== 'admin')) {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);
    const card = await IDCardService.getActiveCard(userId);
    const settings = await getIDCardSettings();

    // Logic for window availability
    const isWindowOpen = settings.enabled && settings.staffWindow === 'open';

    // Fetch user details for the visual
    const verificationData = card ? await IDCardService.verifyIDCard(card.verificationCode) : null;
    const qrCode = card ? await IDCardService.generateVerificationQR(card.verificationCode) : undefined;

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-12 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Staff ID Services</h1>
                    <p className="text-slate-500 font-medium tracking-tight">Access your digital staff credential and coordination services.</p>
                </div>
                {!isWindowOpen && (
                    <Badge variant="outline" className="rounded-xl border-slate-200 bg-white text-slate-900 font-black uppercase text-[10px] tracking-widest px-4 py-2 flex gap-2">
                        <Lock className="w-3.5 h-3.5" /> Maintenance Mode
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Visual Preview */}
                <div className="flex justify-center lg:sticky lg:top-8">
                    {verificationData?.success ? (
                        <div className="space-y-6 flex flex-col items-center">
                            <IDCardVisual
                                data={{
                                    name: (verificationData as any).user.name,
                                    identifier: (verificationData as any).user.identifier!,
                                    designation: (verificationData as any).user.designation,
                                    department: (verificationData as any).user.department,
                                    issueDate: new Date((verificationData as any).card.issuedAt!).toLocaleDateString('en-GB'),
                                    expiryDate: new Date((verificationData as any).card.expiresAt!).toLocaleDateString('en-GB'),
                                    image: (verificationData as any).user.image || undefined,
                                    qrCode: qrCode || undefined
                                }}
                                userType="staff"
                            />
                            <div className="w-full max-w-[340px]">
                                {isWindowOpen ? (
                                    <IDCardDownloader
                                        card={{
                                            name: (verificationData as any).user.name,
                                            image: (verificationData as any).user.image || undefined,
                                            identifier: (verificationData as any).user.identifier!,
                                            designation: (verificationData as any).user.designation,
                                            department: (verificationData as any).user.department,
                                            issueDate: new Date((verificationData as any).card.issuedAt!).toLocaleDateString('en-GB'),
                                            expiryDate: new Date((verificationData as any).card.expiresAt!).toLocaleDateString('en-GB'),
                                            verificationCode: (verificationData as any).card.verificationCode
                                        }}
                                        userType="staff"
                                    />
                                ) : (
                                    <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 shadow-sm opacity-60">
                                        <Lock className="w-4 h-4 text-slate-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Downloads Suspended by HR</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="w-[340px] h-[540px] bg-white rounded-[32px] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center gap-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                <Briefcase className="w-10 h-10 text-slate-200" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-400 uppercase italic">ID Card Not Issued</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1">
                                    {isWindowOpen ? "Request your official staff identity card to enable access services." : "Staff issuance window is currently closed."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Information & Actions */}
                <div className="space-y-8">
                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-xl font-black uppercase italic tracking-tight">HR Staff Governance</CardTitle>
                            <CardDescription className="text-slate-400 font-medium">Compliance and verification requirements.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {!isWindowOpen && (
                                <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Info className="w-10 h-10 text-indigo-600 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Status: Governance Review</p>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">Credential generation is only available during promotion cycles or standard recruitment periods as defined by Human Resources.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Credential Protocols:</h4>
                                <ul className="grid grid-cols-1 gap-4">
                                    <SecurityFeatureItem
                                        icon={<Lock className="w-4 h-4 text-slate-900" />}
                                        title="Managed Access"
                                        desc="Your card issuance is linked to your current payroll and appointment status."
                                    />
                                    <SecurityFeatureItem
                                        icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
                                        title="Promotion Updates"
                                        desc="Upon promotion, a new card window will be opened for you by HR."
                                    />
                                </ul>
                            </div>

                            {!card && isWindowOpen && (
                                <div className="pt-8">
                                    <form action={async () => {
                                        "use server";
                                        await requestIDCardAction('staff');
                                    }}>
                                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95">
                                            Issue My Staff ID
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-lg font-black uppercase italic tracking-tight">HR Coordination</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                Staff ID card management is centralised within the **Human Resources (HR) Unit**. For technical issues with digital verification, please visit the HR administrative block.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SecurityFeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <li className="flex gap-4 items-start group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-md transition-all">
                {icon}
            </div>
            <div>
                <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{title}</p>
                <p className="text-xs text-slate-500 font-medium">{desc}</p>
            </div>
        </li>
    );
}
