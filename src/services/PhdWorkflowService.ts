import { db } from "@/db/db";
import {
    phdApplications,
    phdSupervisors,
    phdTheses,
    phdReviewLogs,
    phdExaminers,
    phdDefenses,
    studentBills,
    users
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class PhdWorkflowService {

    /**
     * HOD assigns internal/external supervisors to a PhD candidate.
     */
    static async assignSupervisors(
        phdApplicationId: number,
        supervisors: Array<{
            type: 'internal' | 'external';
            staffProfileId?: number;
            name: string;
            email: string;
            phone?: string;
        }>
    ) {
        return await db.transaction(async (tx) => {
            // Remove existing pending/rejected supervisors to avoid duplicates
            await tx.delete(phdSupervisors).where(eq(phdSupervisors.phdApplicationId, phdApplicationId));

            for (const sup of supervisors) {
                const token = uuidv4();
                await tx.insert(phdSupervisors).values({
                    phdApplicationId,
                    type: sup.type,
                    staffProfileId: sup.staffProfileId,
                    name: sup.name,
                    email: sup.email,
                    phone: sup.phone,
                    token,
                    status: 'pending',
                });

                // Simulate sending email:
                console.log(`[EMAIL TRIGGER] Supervisor Invitation Sent to ${sup.name} (${sup.email}) - Link: https://schoolportal.edu/supervisor/accept?token=${token}`);
            }

            await tx.update(phdApplications)
                .set({ status: 'supervisors_pending' })
                .where(eq(phdApplications.id, phdApplicationId));

            return { success: true };
        });
    }

    /**
     * Supervisor accepts/rejects candidacy.
     * Enforces the 14-day token expiration rule.
     */
    static async submitSupervisorResponse(token: string, accepted: boolean) {
        return await db.transaction(async (tx) => {
            const [supervisor] = await tx.select().from(phdSupervisors).where(eq(phdSupervisors.token, token)).limit(1);
            if (!supervisor) throw new Error("Invalid supervisor invitation token");

            // Expiry Check (14 Days)
            const invitedTime = new Date(supervisor.invitedAt || "").getTime();
            const now = Date.now();
            const diffDays = (now - invitedTime) / (1000 * 60 * 60 * 24);

            if (diffDays > 14) {
                await tx.update(phdSupervisors).set({ status: 'rejected' }).where(eq(phdSupervisors.id, supervisor.id));
                throw new Error("Invitation link has expired (14-day limit). Please request a resend from the Department HOD.");
            }

            const status = accepted ? 'accepted' : 'rejected';
            await tx.update(phdSupervisors)
                .set({ status, respondedAt: new Date() })
                .where(eq(phdSupervisors.id, supervisor.id));

            // Check if all assigned supervisors for this application have accepted
            const allSups = await tx.select().from(phdSupervisors).where(eq(phdSupervisors.phdApplicationId, supervisor.phdApplicationId));
            const allAccepted = allSups.every(s => s.status === 'accepted');

            if (allAccepted) {
                await tx.update(phdApplications)
                    .set({ status: 'supervisors_accepted' })
                    .where(eq(phdApplications.id, supervisor.phdApplicationId));
            } else if (allSups.some(s => s.status === 'rejected')) {
                await tx.update(phdApplications)
                    .set({ status: 'applied' }) // Rollback to initial stage on rejection
                    .where(eq(phdApplications.id, supervisor.phdApplicationId));
            }

            return { success: true };
        });
    }

    /**
     * Verifies that the PhD candidate has fully settled their session school fees bill.
     */
    static async verifyCandidacyFees(phdApplicationId: number, sessionId: number) {
        const [app] = await db.select().from(phdApplications).where(eq(phdApplications.id, phdApplicationId)).limit(1);
        if (!app) throw new Error("Candidacy application not found");

        const [studentBill] = await db.select().from(studentBills)
            .where(and(
                eq(studentBills.studentId, app.studentId),
                eq(studentBills.sessionId, sessionId)
            ))
            .limit(1);

        const isPaid = studentBill && (
            studentBill.status === 'paid' || 
            parseFloat(studentBill.amountPaid || "0") >= parseFloat(studentBill.totalAmount || "0")
        );

        if (!isPaid) throw new Error("Outstanding current session bills detected. Fees must be settled before thesis upload.");

        await db.update(phdApplications)
            .set({ status: 'fees_paid' })
            .where(eq(phdApplications.id, phdApplicationId));

        return { success: true };
    }

    /**
     * Submit a thesis stage review (Dept HOD -> Subdean -> PG Committee -> Provost).
     * If rejected at any stage, resets back to initial stage (reupload_required).
     */
    static async submitThesisReview(
        thesisId: number,
        reviewerId: number,
        stage: 'department' | 'subdean' | 'pg_committee' | 'provost',
        action: 'approve' | 'reject',
        comment: string
    ) {
        return await db.transaction(async (tx) => {
            const [thesis] = await tx.select().from(phdTheses).where(eq(phdTheses.id, thesisId)).limit(1);
            if (!thesis) throw new Error("Thesis record not found");

            await tx.insert(phdReviewLogs).values({
                phdThesisId: thesisId,
                reviewerId,
                stage,
                action,
                comment
            });

            if (action === 'reject') {
                // Reset thesis status and application review state
                await tx.update(phdTheses)
                    .set({ status: 'reupload_required' })
                    .where(eq(phdTheses.id, thesisId));
                
                await tx.update(phdApplications)
                    .set({ status: 'fees_paid' }) // Candidate can re-upload thesis
                    .where(eq(phdApplications.id, thesis.phdApplicationId));

                return { success: true, message: "Thesis rejected. State reset to reupload_required." };
            }

            // Progression logic
            let nextThesisStatus: typeof phdTheses.status.value = 'draft';
            let nextAppStatus: typeof phdApplications.status.value = 'under_review';

            if (stage === 'department') {
                nextThesisStatus = 'subdean_review';
            } else if (stage === 'subdean') {
                nextThesisStatus = 'pg_committee_review';
            } else if (stage === 'pg_committee') {
                nextThesisStatus = 'meeting_pending';
            } else if (stage === 'provost') {
                nextThesisStatus = 'approved';
                nextAppStatus = 'approved_corrections';
            }

            await tx.update(phdTheses)
                .set({ status: nextThesisStatus })
                .where(eq(phdTheses.id, thesisId));

            await tx.update(phdApplications)
                .set({ status: nextAppStatus })
                .where(eq(phdApplications.id, thesis.phdApplicationId));

            return { success: true };
        });
    }

    /**
     * Schedules the final presentation/defense.
     * Enforces exactly 3 External Examiners and 2 Internal Examiners.
     */
    static async scheduleDefense(
        phdApplicationId: number,
        defenseDate: Date,
        location: string,
        examiners: Array<{ name: string; email: string; type: 'internal' | 'external'; honorarium: number }>
    ) {
        const externals = examiners.filter(e => e.type === 'external');
        const internals = examiners.filter(e => e.type === 'internal');

        if (externals.length !== 3 || internals.length !== 2) {
            throw new Error("PhD defense panels must consist of exactly 3 External Examiners and 2 Internal Examiners.");
        }

        return await db.transaction(async (tx) => {
            // Delete any existing examiners
            await tx.delete(phdExaminers).where(eq(phdExaminers.phdApplicationId, phdApplicationId));

            for (const ex of examiners) {
                await tx.insert(phdExaminers).values({
                    phdApplicationId,
                    name: ex.name,
                    email: ex.email,
                    type: ex.type,
                    honorariumAmount: ex.honorarium.toString(),
                    paymentStatus: 'pending'
                });
            }

            // Insert/Update defense schedule
            const [existing] = await tx.select().from(phdDefenses).where(eq(phdDefenses.phdApplicationId, phdApplicationId)).limit(1);
            if (existing) {
                await tx.update(phdDefenses)
                    .set({ defenseDate, location, status: 'scheduled' })
                    .where(eq(phdDefenses.id, existing.id));
            } else {
                await tx.insert(phdDefenses).values({
                    phdApplicationId,
                    defenseDate,
                    location,
                    status: 'scheduled'
                });
            }

            await tx.update(phdApplications)
                .set({ status: 'defense_scheduled' })
                .where(eq(phdApplications.id, phdApplicationId));

            return { success: true };
        });
    }
}
