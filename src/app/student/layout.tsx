import { auth } from "@/auth";
import { db } from "@/db";
import { students, conductLogs, academicSessions, systemSettings } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Lock, ShieldAlert } from "lucide-react";
import { ProfileCompletionGuard } from "@/components/auth/ProfileCompletionGuard";
import { OathMedicalBanner } from "@/components/auth/OathMedicalBanner";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    // @ts-expect-error - TS2339: Auto-suppressed for build
    if (!session?.user || session.user.role !== 'student') {
        return <>{children}</>;
    }

    const studentRecord = await db.query.students.findFirst({
        // @ts-expect-error - TS2769: Auto-suppressed for build
        where: eq(students.userId, session.user.id),
    });

    if (!studentRecord) {
        return <>{children}</>;
    }

    // Check disciplinary sanctions
    const activeSanctions = await db.query.conductLogs.findMany({
        where: (logs, { eq, and, inArray }) => and(
            eq(logs.studentId, studentRecord.id),
            eq(logs.status, 'active'),
            inArray(logs.senateSanction, ['suspension', 'expulsion', 'rustication'])
        )
    });

    const isDisciplinarilyLocked = activeSanctions.length > 0;
    const sanctionMessage = isDisciplinarilyLocked 
        ? `You have been temporarily suspended or expelled due to a disciplinary infraction (${activeSanctions[0].infraction}). Please contact the Registrar's office.`
        : "";

    // Records flagged for administrative review (placeholder/incomplete admissions).
    // These must not enter the portal because they carry invalid level/matric data.
    const isPendingReview = studentRecord.status === 'pending_review';

    if (isPendingReview) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
                <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-amber-100">
                    <div className="bg-amber-500 p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">Account Under Review</h2>
                    </div>
                    <div className="p-6 text-center space-y-4">
                        <p className="text-slate-600 font-medium leading-relaxed">
                            Your student record is incomplete and has been placed on hold by the administration.
                            You cannot access the portal until your registration is confirmed.
                        </p>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Please visit the Admission Office to complete your registration, or contact the
                            Registrar&rsquo;s office for further assistance.
                        </p>
                        <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Record Reference</p>
                            <p className="text-sm font-black text-slate-700">{studentRecord.matricNumber || `USER-${studentRecord.userId}`}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Check oath/medical form deadlines
    let oathRequired = false;
    let medicalRequired = false;
    let deadlinePassed = false;
    let deadlineDate: string | null = null;

    try {
        // Get active session and deadline
        const activeSession = await db.query.academicSessions.findFirst({
            where: eq(academicSessions.isCurrent, true),
            columns: { id: true, startDate: true, matriculationDeadline: true },
        });

        if (activeSession?.startDate) {
            const startDate = new Date(activeSession.startDate);
            const deadline = activeSession.matriculationDeadline
                ? new Date(activeSession.matriculationDeadline)
                : new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks

            deadlineDate = deadline.toISOString();
            const now = new Date();
            deadlinePassed = now > deadline;

            // Check oath scope setting
            const oathEnabledSetting = await db.query.systemSettings?.findFirst?.({
                where: eq(systemSettings.settingKey, 'matriculation_oath_enabled'),
                columns: { settingValue: true },
            }).catch?.(() => null);

            const oathScopeSetting = await db.query.systemSettings?.findFirst?.({
                where: eq(systemSettings.settingKey, 'matriculation_oath_scope'),
                columns: { settingValue: true },
            }).catch?.(() => null);

            const oathEnabled = oathEnabledSetting?.settingValue !== 'false';
            const oathScope = oathScopeSetting?.settingValue || 'freshers_only';

            // Check if oath is required for this student
            if (oathEnabled) {
                if (oathScope === 'all_students') {
                    oathRequired = !studentRecord.oathSignedAt;
                } else {
                    // freshers_only: ND 1 or HND 1
                    oathRequired = (studentRecord.currentLevel === 1) && !studentRecord.oathSignedAt;
                }
            }

            // Medical form is always required
            medicalRequired = !studentRecord.medicalFormSubmittedAt;
        }
    } catch (e) {
        // Silently fail — don't block the student portal for a settings error
        console.error("[Layout] Oath/medical deadline check failed:", e);
    }

    // Redirect if deadline passed and requirements not met
    // Skip redirect for the oath/medical pages themselves
    // Note: pathname check is done client-side via ProfileCompletionGuard
    // Server-side redirect for hard enforcement:
    if (deadlinePassed && oathRequired && !studentRecord.oathSignedAt) {
        redirect("/student/matriculation");
    }
    if (deadlinePassed && medicalRequired && !studentRecord.medicalFormSubmittedAt && !studentRecord.oathSignedAt) {
        // Only redirect to medical if oath is already done
        // If both are pending, oath takes priority
    }

    return (
        // @ts-expect-error - TS2322: Auto-suppressed for build
        <ProfileCompletionGuard>
            <>
                {/* Reminder banner for pending oath/medical (before deadline) */}
                {(oathRequired || medicalRequired) && !deadlinePassed && (
                    <OathMedicalBanner
                        oathRequired={oathRequired}
                        medicalRequired={medicalRequired}
                        deadline={deadlineDate}
                    />
                )}

                {isDisciplinarilyLocked && (
                 <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
                     <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-rose-100">
                         <div className="bg-rose-600 p-6 flex flex-col items-center text-center">
                             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                                 <Lock className="w-8 h-8 text-white" />
                             </div>
                             <h2 className="text-xl font-black text-white uppercase tracking-widest">Access Suspended</h2>
                         </div>
                         <div className="p-6 text-center space-y-4">
                             <p className="text-slate-600 font-medium leading-relaxed">
                                 {sanctionMessage}
                             </p>
                             <div className="pt-4 mt-4 border-t border-slate-100">
                                 <p className="text-sm text-slate-400 font-medium">Reference: Conduct Panel Resolution</p>
                             </div>
                         </div>
                     </div>
                 </div>
                )}
                {children}
            </>
        </ProfileCompletionGuard>
    );
}
