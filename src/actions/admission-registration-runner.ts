"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/db";
import {
    academicSessions,
    admissionApplicationsV2,
    programmes,
    students,
    users,
} from "@/db/schema";
import { hasPermission, hasRole } from "@/lib/rbac";
import {
    loadPaymentEvidence,
    verifyAgainstEvidence,
    type AdmissionFeeVerification,
} from "@/services/AdmissionFeeVerificationService";
import { finalizeStudentAdmission } from "@/actions/admission_v2";

/**
 * Registration (applicant -> ND 1 / HND 1) is deliberately separated from level
 * promotion, which lives in actions/promotion.ts. This runner exists because
 * school fees are paid annually: an applicant becomes eligible the moment a
 * completed Remita payment naming the target session lands, so the registrar
 * needs a repeatable sweep rather than a per-student click.
 *
 * Payment policy enforced here (and mirrored in the per-application gate):
 *   - acceptance fee: completed and bound to the application
 *   - school fee:     completed, paid through Remita, naming the target session
 */

async function canRegisterStudents(): Promise<boolean> {
    return (
        (await hasPermission("admission.register.manage")) ||
        (await hasRole("admin")) ||
        (await hasRole("superadmin")) ||
        (await hasRole("academic_registrar")) ||
        (await hasRole("registrar")) ||
        (await hasRole("bursar")) ||
        (await hasRole("admission_officer"))
    );
}

async function resolveTargetSession(sessionId?: number) {
    if (sessionId) {
        const [byId] = await db
            .select()
            .from(academicSessions)
            .where(eq(academicSessions.id, sessionId))
            .limit(1);
        if (byId) return byId;
    }

    const nextYear = new Date().getFullYear();
    const [byName] = await db
        .select()
        .from(academicSessions)
        .where(eq(academicSessions.name, `${nextYear}/${nextYear + 1}`))
        .limit(1);
    if (byName) return byName;

    const [active] = await db
        .select()
        .from(academicSessions)
        .where(eq(academicSessions.isActive, true))
        .orderBy(desc(academicSessions.startDate))
        .limit(1);
    return active ?? null;
}

export interface PromotionCandidate {
    applicationId: number;
    formNumber: string | null;
    applicantId: number | null;
    applicantName: string | null;
    applicantEmail: string | null;
    programmeId: number | null;
    programmeName: string | null;
    deptId: number | null;
    acceptancePaymentStatus: string | null;
    verification: AdmissionFeeVerification;
    eligible: boolean;
    blockedReason: string | null;
    alreadyRegistered: boolean;
}

export interface PromotionPreview {
    sessionId: number | null;
    sessionName: string | null;
    eligible: PromotionCandidate[];
    awaitingSchoolFee: PromotionCandidate[];
    awaitingAcceptance: PromotionCandidate[];
    flagContradicted: PromotionCandidate[];
    blocked: PromotionCandidate[];
    alreadyRegisteredCount: number;
}

function extractName(data: unknown): string | null {
    if (!data) return null;
    if (typeof data === "object") {
        const bag = data as Record<string, unknown>;
        const first = bag.firstName ?? bag.firstname ?? bag.surname;
        if (typeof first === "string") return first;
    }
    if (typeof data === "string") {
        try {
            return extractName(JSON.parse(data));
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Read-only sweep. Classifies every admitted, not-yet-registered application so
 * the registrar can see who is eligible, who is still waiting on a payment, and
 * whose self-declared flag contradicts the payment record.
 */
export async function getRegistrationPreview(
    sessionId?: number
): Promise<{ success: boolean; error?: string; preview?: PromotionPreview }> {
    try {
        const allowed = await canRegisterStudents();
        if (!allowed) {
            return { success: false, error: "Unauthorized: insufficient permissions to run registration" };
        }

        const session = await resolveTargetSession(sessionId);
        if (!session) {
            return { success: false, error: "No academic session could be resolved for registration." };
        }

        const sessionYear = session.startDate
            ? new Date(session.startDate).getFullYear()
            : new Date().getFullYear();
        const verifyOptions = {
            sessionName: session.name,
            remitaOnlySchoolFee: true,
            notBefore: new Date(sessionYear, 0, 1),
        };

        const applications = await db
            .select({
                id: admissionApplicationsV2.id,
                applicantId: admissionApplicationsV2.applicantId,
                programmeId: admissionApplicationsV2.programmeId,
                acceptancePaymentStatus: admissionApplicationsV2.acceptancePaymentStatus,
                formNumber: admissionApplicationsV2.formNumber,
                data: admissionApplicationsV2.data,
            })
            .from(admissionApplicationsV2)
            .where(eq(admissionApplicationsV2.status, "admitted"));

        if (applications.length === 0) {
            return {
                success: true,
                preview: {
                    sessionId: session.id,
                    sessionName: session.name,
                    eligible: [],
                    awaitingSchoolFee: [],
                    awaitingAcceptance: [],
                    flagContradicted: [],
                    blocked: [],
                    alreadyRegisteredCount: 0,
                },
            };
        }

        const applicantIds = applications
            .map((a) => a.applicantId)
            .filter((v): v is number => typeof v === "number");

        const { gatewayTxs, legacyByUser } = await loadPaymentEvidence(applicantIds);

        // Which applicants already hold a student row, so they are never re-registered.
        // Checked two ways: the application linking, and a direct student row, because
        // a student can also have been created outside the admission flow.
        const existingStudentUserIds = new Set<number>();
        if (applicantIds.length > 0) {
            const linked = await db
                .select({ userId: admissionApplicationsV2.applicantId, studentId: admissionApplicationsV2.studentId })
                .from(admissionApplicationsV2)
                .where(inArray(admissionApplicationsV2.applicantId, applicantIds));
            for (const row of linked) {
                if (row.studentId !== null && row.studentId !== undefined && row.userId !== null) {
                    existingStudentUserIds.add(row.userId);
                }
            }

            const direct = await db
                .select({ userId: students.userId })
                .from(students)
                .where(inArray(students.userId, applicantIds));
            for (const row of direct) {
                if (row.userId !== null) existingStudentUserIds.add(row.userId);
            }
        }

        const programmeIds = applications
            .map((a) => a.programmeId)
            .filter((v): v is number => typeof v === "number");
        const programmeMap = new Map<number, { name: string; deptId: number | null }>();
        if (programmeIds.length > 0) {
            const progs = await db
                .select({ id: programmes.id, name: programmes.name, deptId: programmes.deptId })
                .from(programmes)
                .where(inArray(programmes.id, programmeIds));
            for (const p of progs) programmeMap.set(p.id, { name: p.name, deptId: p.deptId });
        }

        const userIds = applicantIds;
        const userMap = new Map<number, { name: string | null; email: string | null }>();
        if (userIds.length > 0) {
            const rows = await db
                .select({ id: users.id, name: users.name, email: users.email })
                .from(users)
                .where(inArray(users.id, userIds));
            for (const r of rows) userMap.set(r.id, { name: r.name, email: r.email });
        }

        const preview: PromotionPreview = {
            sessionId: session.id,
            sessionName: session.name,
            eligible: [],
            awaitingSchoolFee: [],
            awaitingAcceptance: [],
            flagContradicted: [],
            blocked: [],
            alreadyRegisteredCount: 0,
        };

        for (const app of applications) {
            const alreadyRegistered =
                app.applicantId !== null && existingStudentUserIds.has(app.applicantId);
            if (alreadyRegistered) {
                preview.alreadyRegisteredCount += 1;
                continue;
            }

            const verification = verifyAgainstEvidence(
                {
                    id: app.id,
                    applicantId: app.applicantId,
                    acceptancePaymentStatus: app.acceptancePaymentStatus,
                    acceptancePaymentReference: app.acceptancePaymentReference,
                },
                gatewayTxs,
                app.applicantId ? legacyByUser.get(app.applicantId) ?? [] : [],
                verifyOptions
            );

            const prog = app.programmeId ? programmeMap.get(app.programmeId) : undefined;
            const user = app.applicantId ? userMap.get(app.applicantId) : undefined;

            let blockedReason: string | null = null;
            if (!app.programmeId || !prog) {
                blockedReason = "No programme assigned to the application.";
            } else if (app.applicantId === null) {
                blockedReason = "Application is not linked to a user account.";
            }

            const candidate: PromotionCandidate = {
                applicationId: app.id,
                formNumber: app.formNumber,
                applicantId: app.applicantId,
                applicantName: user?.name ?? extractName(app.data),
                applicantEmail: user?.email ?? null,
                programmeId: app.programmeId,
                programmeName: prog?.name ?? null,
                deptId: prog?.deptId ?? null,
                acceptancePaymentStatus: app.acceptancePaymentStatus,
                verification,
                eligible: verification.verified && blockedReason === null,
                blockedReason,
                alreadyRegistered: false,
            };

            if (candidate.eligible) preview.eligible.push(candidate);
            else if (blockedReason) preview.blocked.push(candidate);
            else if (verification.acceptancePaid && !verification.schoolFeePaid)
                preview.awaitingSchoolFee.push(candidate);
            else if (!verification.acceptancePaid && verification.schoolFeePaid)
                preview.awaitingAcceptance.push(candidate);
            else preview.blocked.push(candidate);

            if (verification.flagContradicted) {
                preview.flagContradicted.push(candidate);
            }
        }

        return { success: true, preview };
    } catch (error) {
        console.error("getRegistrationPreview error:", error);
        return { success: false, error: "Failed to build the registration preview." };
    }
}

export interface RegistrationRunResult {
    attempted: number;
    promoted: number;
    skipped: number;
    failed: number;
    results: {
        applicationId: number;
        formNumber: string | null;
        applicantName: string | null;
        outcome: "promoted" | "skipped" | "failed";
        detail: string;
    }[];
}

/**
 * Register every currently-eligible applicant. Idempotent: applications whose
 * applicant already holds a student row are skipped, and the payment gate inside
 * finalizeStudentAdmission re-checks every fee immediately before writing, so a
 * payment being reversed between preview and run cannot slip through.
 */
export async function runRegistration(
    options: { sessionId?: number; applicationIds?: number[] } = {}
): Promise<{ success: boolean; error?: string; run?: RegistrationRunResult }> {
    try {
        const authSession = await auth();
        if (!authSession?.user?.id) return { success: false, error: "Unauthorized" };

        const allowed = await canRegisterStudents();
        if (!allowed) {
            return { success: false, error: "Unauthorized: insufficient permissions to register students" };
        }

        const { preview, error } = await getRegistrationPreview(options.sessionId);
        if (!preview) return { success: false, error: error ?? "Unable to build preview." };

        const filter = options.applicationIds?.length
            ? new Set(options.applicationIds)
            : null;
        const targets = preview.eligible.filter(
            (c) => filter === null || filter.has(c.applicationId)
        );

        const run: RegistrationRunResult = {
            attempted: targets.length,
            promoted: 0,
            skipped: 0,
            failed: 0,
            results: [],
        };

        for (const candidate of targets) {
            const outcome = await finalizeStudentAdmission(candidate.applicationId);
            if (outcome?.success) {
                run.promoted += 1;
                run.results.push({
                    applicationId: candidate.applicationId,
                    formNumber: candidate.formNumber,
                    applicantName: candidate.applicantName,
                    outcome: "promoted",
                    detail: "Registered as a new student.",
                });
            } else {
                run.failed += 1;
                run.results.push({
                    applicationId: candidate.applicationId,
                    formNumber: candidate.formNumber,
                    applicantName: candidate.applicantName,
                    outcome: "failed",
                    detail: outcome?.error ?? "Registration failed.",
                });
            }
        }

        revalidatePath("/admin/admission/registration-runner");
        revalidatePath("/admin/admission/register");
        revalidatePath("/admin/admission/v2");

        return { success: true, run };
    } catch (error) {
        console.error("runRegistration error:", error);
        return { success: false, error: "Registration run failed." };
    }
}
