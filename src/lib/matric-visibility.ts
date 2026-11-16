import { db } from "@/db/db";
import { admissionApplicationsV2, academicSessions, transactions } from "@/db/schema";
import { eq, and, or, desc, isNotNull, like } from "drizzle-orm";
import {
    verifyAdmissionFeesForApplication,
    loadPaymentEvidence,
    verifyAgainstEvidence,
} from "@/services/AdmissionFeeVerificationService";

function parseJsonSafe(raw: any): Record<string, any> {
    if (!raw) return {};
    if (typeof raw === "object") return { ...raw };
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

/**
 * Determines whether an admitted V2 application has unlocked its matriculation
 * number for student visibility.
 *
 * Rules:
 * 1. Any application already finalized prior to pre-assignment (where
 *    admissionNotes contains "Admission accepted and finalized" or "Matric Number:")
 *    or where data.matricUnlocked === true is UNLOCKED.
 * 2. Otherwise, both Acceptance Fee and School Fees must be verified as paid via
 *    verifyAdmissionFeesForApplication(). When verified, data.matricUnlocked is
 *    persisted as true automatically so subsequent checks are instant.
 */
export async function isApplicationMatricUnlocked(app: {
    id: number;
    status?: string | null;
    applicantId?: number | null;
    studentId?: number | null;
    acceptancePaymentStatus?: string | null;
    acceptancePaymentReference?: string | null;
    processingFeeReference?: string | null;
    admissionNotes?: string | null;
    data?: string | Record<string, any> | null;
}): Promise<boolean> {
    if (!app || app.status !== "admitted") return false;

    const formData = parseJsonSafe(app.data);

    // Explicitly unlocked or historically finalized before pre-generation feature
    if (formData.matricUnlocked === true) return true;
    const notes = String(app.admissionNotes || "");
    if (
        formData.matricUnlocked !== false &&
        (notes.includes("Admission accepted and finalized") || notes.includes("Matric Number:"))
    ) {
        return true;
    }

    // Check live payment evidence for Acceptance Fee + School Fees
    const year = new Date().getFullYear();
    const nextSessionName = `${year}/${year + 1}`;
    let [targetSession] = await db
        .select()
        .from(academicSessions)
        .where(eq(academicSessions.name, nextSessionName))
        .limit(1);

    if (!targetSession) {
        const [activeSession] = await db
            .select()
            .from(academicSessions)
            .where(eq(academicSessions.isActive, true))
            .orderBy(desc(academicSessions.startDate))
            .limit(1);
        targetSession = activeSession;
    }

    const sessionYear = targetSession?.startDate
        ? new Date(targetSession.startDate).getFullYear()
        : year;

    const feeCheck = await verifyAdmissionFeesForApplication(
        {
            id: app.id,
            applicantId: app.applicantId ?? null,
            acceptancePaymentStatus: app.acceptancePaymentStatus ?? null,
            acceptancePaymentReference: app.acceptancePaymentReference ?? null,
        },
        {
            notBefore: new Date(sessionYear, 0, 1),
            sessionName: targetSession?.name ?? null,
            remitaOnlySchoolFee: true,
        }
    );

    if (feeCheck.verified) {
        // Require post-school-fee Processing Fee (PROC-{appId}-...) before unlocking matriculation number
        const hasProcRef = String(app.processingFeeReference || "").startsWith(`PROC-${app.id}-`);
        let hasProcTx = hasProcRef;
        if (!hasProcTx) {
            const [procTx] = await db
                .select({ id: transactions.id })
                .from(transactions)
                .where(
                    and(
                        like(transactions.gatewayReference, `PROC-${app.id}-%`),
                        eq(transactions.status, "completed")
                    )
                )
                .limit(1);
            hasProcTx = Boolean(procTx);
        }

        if (!hasProcTx) {
            return false;
        }

        // Persist unlock state so future reads are fast and consistent
        try {
            formData.matricUnlocked = true;
            formData.matricUnlockedAt = formData.matricUnlockedAt || new Date().toISOString();
            const matricStr = formData.matricNumber || "";
            const updatedNotes = matricStr
                ? `Admission accepted and finalized. Matric Number: ${matricStr}`
                : notes;
            await db
                .update(admissionApplicationsV2)
                .set({
                    data: JSON.stringify(formData),
                    admissionNotes: updatedNotes,
                    updatedAt: new Date(),
                })
                .where(eq(admissionApplicationsV2.id, app.id));
        } catch (err) {
            console.warn("[matric-visibility] Failed to persist auto-unlock state:", err);
        }
        return true;
    }

    return false;
}

/**
 * Checks whether a student's matriculation number is currently LOCKED (hidden from the student)
 * because they are a newly admitted ND 1 / HND 1 candidate who has not yet paid both
 * Acceptance Fee and School Fees.
 *
 * Returns `false` (NOT locked) for all existing finalized students, ND 2 / HND 2 students,
 * graduants, and any ND 1 / HND 1 student who has paid both fees.
 */
export async function isStudentMatricLocked(params: {
    studentId?: number | null;
    userId?: number | null;
}): Promise<boolean> {
    const { studentId, userId } = params;
    if (!studentId && !userId) return false;

    try {
        const matchConds = [];
        if (studentId) matchConds.push(eq(admissionApplicationsV2.studentId, studentId));
        if (userId) matchConds.push(eq(admissionApplicationsV2.applicantId, userId));

        const apps = await db
            .select({
                id: admissionApplicationsV2.id,
                status: admissionApplicationsV2.status,
                applicantId: admissionApplicationsV2.applicantId,
                studentId: admissionApplicationsV2.studentId,
                acceptancePaymentStatus: admissionApplicationsV2.acceptancePaymentStatus,
                acceptancePaymentReference: admissionApplicationsV2.acceptancePaymentReference,
                processingFeeReference: admissionApplicationsV2.processingFeeReference,
                admissionNotes: admissionApplicationsV2.admissionNotes,
                data: admissionApplicationsV2.data,
            })
            .from(admissionApplicationsV2)
            .where(and(eq(admissionApplicationsV2.status, "admitted"), or(...matchConds)))
            .orderBy(desc(admissionApplicationsV2.id))
            .limit(1);

        if (apps.length === 0) {
            // No admitted V2 application record -> legacy or upper-level student -> NOT locked
            return false;
        }

        const unlocked = await isApplicationMatricUnlocked(apps[0]);
        return !unlocked;
    } catch (error) {
        console.error("[isStudentMatricLocked] Error checking visibility:", error);
        return false;
    }
}

/**
 * Batch helper that returns a Set of studentIds whose matriculation numbers are
 * pre-assigned for NELFUND / admin use but currently HIDDEN from the student
 * (awaiting Acceptance Fee and/or School Fees).
 */
export async function getLockedMatricStudentIds(): Promise<Set<number>> {
    const lockedIds = new Set<number>();
    try {
        const apps = await db
            .select({
                id: admissionApplicationsV2.id,
                status: admissionApplicationsV2.status,
                applicantId: admissionApplicationsV2.applicantId,
                studentId: admissionApplicationsV2.studentId,
                acceptancePaymentStatus: admissionApplicationsV2.acceptancePaymentStatus,
                acceptancePaymentReference: admissionApplicationsV2.acceptancePaymentReference,
                processingFeeReference: admissionApplicationsV2.processingFeeReference,
                admissionNotes: admissionApplicationsV2.admissionNotes,
                data: admissionApplicationsV2.data,
            })
            .from(admissionApplicationsV2)
            .where(
                and(
                    eq(admissionApplicationsV2.status, "admitted"),
                    isNotNull(admissionApplicationsV2.studentId)
                )
            );

        if (apps.length === 0) return lockedIds;

        // Filter candidates that aren't already marked unlocked/finalized
        const needsCheck = apps.filter((app) => {
            const fd = parseJsonSafe(app.data);
            if (fd.matricUnlocked === true) return false;
            const notes = String(app.admissionNotes || "");
            if (
                fd.matricUnlocked !== false &&
                (notes.includes("Admission accepted and finalized") || notes.includes("Matric Number:"))
            ) {
                return false;
            }
            return true;
        });

        if (needsCheck.length === 0) return lockedIds;

        const year = new Date().getFullYear();
        const applicantIds = Array.from(
            new Set(needsCheck.map((a) => a.applicantId).filter((id): id is number => typeof id === "number"))
        );
        const { gatewayTxs, legacyByUser } = await loadPaymentEvidence(applicantIds);
        const verifyOpts = {
            notBefore: new Date(year, 0, 1),
            sessionName: `${year}/${year + 1}`,
            remitaOnlySchoolFee: true,
        };

        for (const app of needsCheck) {
            if (!app.studentId) continue;
            const check = verifyAgainstEvidence(
                {
                    id: app.id,
                    applicantId: app.applicantId,
                    acceptancePaymentStatus: app.acceptancePaymentStatus,
                    acceptancePaymentReference: app.acceptancePaymentReference,
                },
                gatewayTxs,
                app.applicantId ? legacyByUser.get(app.applicantId) ?? [] : [],
                verifyOpts
            );
            if (!check.verified) {
                lockedIds.add(app.studentId);
            }
        }

        return lockedIds;
    } catch (error) {
        console.error("[getLockedMatricStudentIds] Error:", error);
        return lockedIds;
    }
}
