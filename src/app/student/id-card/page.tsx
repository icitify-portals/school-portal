import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { students, users, departments, programmes, idCards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { IDCardService } from "@/services/IDCardService";
import { getIDCardSettings } from "@/actions/settings";
import IDCardTemplate1 from "@/components/id-cards/IDCardTemplate1";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestIDCardAction } from "@/actions/id-cards";
import { Badge } from "@/components/ui/badge";

export default async function StudentIDCardPage() {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id || user.role !== 'student') {
        redirect("/login");
    }

    const userId = parseInt(user.id);
    const card = await IDCardService.getActiveCard(userId);
    const settings = await getIDCardSettings();

    // Logic for window availability
    const isWindowOpen = settings.enabled && settings.studentWindow === 'open';

    // Fetch full student record with relations
    const [studentRecord] = await db
        .select({
            id: students.id,
            firstName: students.firstName,
            lastName: students.lastName,
            otherNames: students.otherNames,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            programmeType: students.programmeType,
            bloodGroup: students.bloodGroup,
            genotype: students.genotype,
            barcode: students.barcode,
            photoUrl: students.imageUrl,
            signatureUrl: students.signatureUrl,
            deptName: departments.name,
            programmeName: programmes.name,
            phone: users.phone,
            name: users.name,
        })
        .from(students)
        .leftJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .leftJoin(programmes, eq(students.programmeId, programmes.id))
        .where(eq(students.userId, userId))
        .limit(1);

    const studentFullName = studentRecord 
        ? [studentRecord.firstName, studentRecord.lastName, studentRecord.otherNames].filter(Boolean).join(" ") || studentRecord.name || user.name
        : user.name || "STUDENT NAME";

    const matricNo = studentRecord?.matricNumber || "PENDING";
    const deptName = studentRecord?.deptName || "ACADEMIC DEPARTMENT";
    const progName = studentRecord?.programmeName || `${studentRecord?.programmeType || "ND"} Programme`;
    const levelLabel = studentRecord?.programmeType 
        ? `${studentRecord.programmeType} ${studentRecord.currentLevel || 1}` 
        : `Level ${studentRecord?.currentLevel || 1}`;

    const barcodeVal = studentRecord?.barcode || matricNo;

    return (
        <div className="p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase italic">
                        Digital ID Card &amp; Attendance Credential
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight text-sm mt-1">
                        Your official institutional identity credential for academic identification, exam clearance, and attendance clock-in.
                    </p>
                </div>
                {!isWindowOpen && (
                    <Badge variant="outline" className="rounded-xl border-amber-200 bg-amber-50 text-amber-600 font-black uppercase text-[10px] tracking-widest px-4 py-2 flex gap-2">
                        <Lock className="w-3.5 h-3.5" /> Issuance Window Closed
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Visual Preview Section (7 cols) */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-200/80">
                    <div className="w-full mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                                Official PVC Card Proof
                            </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            ISO CR80 Standard &bull; High DPI
                        </span>
                    </div>

                    <IDCardTemplate1
                        studentName={studentFullName}
                        matricNumber={matricNo}
                        department={deptName}
                        programmeName={progName}
                        currentLevel={levelLabel}
                        phoneNumber={studentRecord?.phone || undefined}
                        bloodGroup={studentRecord?.bloodGroup || undefined}
                        genotype={studentRecord?.genotype || undefined}
                        photoUrl={studentRecord?.photoUrl || undefined}
                        signatureUrl={studentRecord?.signatureUrl || undefined}
                        barcode={barcodeVal}
                        verificationCode={card?.verificationCode || matricNo}
                        showControls={true}
                    />
                </div>

                {/* Information & Guidelines (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl bg-white">
                        <CardHeader className="bg-slate-900 text-white p-6">
                            <CardTitle className="text-lg font-black uppercase italic tracking-tight">
                                Card Usage Guidelines
                            </CardTitle>
                            <CardDescription className="text-slate-400 font-medium text-xs">
                                Rules and protocols governing your official ID credential.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-4">
                                <SecurityFeatureItem
                                    icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
                                    title="Attendance & Access Control"
                                    desc="The Code-128 barcode on the back is scanned at lecture halls, laboratories, and the library to log attendance."
                                />
                                <SecurityFeatureItem
                                    icon={<ShieldCheck className="w-4 h-4 text-indigo-600" />}
                                    title="Instant QR Verification"
                                    desc="Any invigilator or security personnel can scan the front or back QR code to verify your bona fide student enrollment status."
                                />
                                <SecurityFeatureItem
                                    icon={<Info className="w-4 h-4 text-amber-600" />}
                                    title="Physical PVC Card Collection"
                                    desc="The physical laminated plastic card is printed by the ICT unit. You will be notified when your batch is printed and ready for pickup."
                                />
                            </div>

                            {!card && isWindowOpen && (
                                <div className="pt-4 border-t border-slate-100">
                                    <form action={async () => {
                                        "use server";
                                        await requestIDCardAction('student');
                                    }}>
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 text-xs">
                                            Request Physical ID Card
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] overflow-hidden border border-slate-200/80 shadow-md bg-white p-6">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                            Need a Photo or Signature Correction?
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            If your photograph or signature is missing or needs updating, visit your <strong>Profile Settings</strong> to upload your specimen, or stop by the <strong>ICT Directorate (Photo Capture Unit)</strong> on campus.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SecurityFeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-xs font-black text-slate-900 uppercase italic tracking-tight">{title}</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">{desc}</p>
            </div>
        </div>
    );
}
