"use server";

import { PhdWorkflowService } from "@/services/PhdWorkflowService";
import { db } from "@/db/db";
import { 
    phdApplications, 
    phdTheses, 
    phdExaminers, 
    phdDefenses, 
    systemSettings, 
    users, 
    students 
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function assignSupervisorsAction(
    phdApplicationId: number,
    supervisors: Array<{
        type: 'internal' | 'external';
        staffProfileId?: number;
        name: string;
        email: string;
        phone?: string;
    }>
) {
    try {
        const result = await PhdWorkflowService.assignSupervisors(phdApplicationId, supervisors);
        revalidatePath(`/student/phd`);
        revalidatePath(`/admin/phd/review`);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function submitSupervisorResponseAction(token: string, accepted: boolean) {
    try {
        const result = await PhdWorkflowService.submitSupervisorResponse(token, accepted);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function verifyCandidacyFeesAction(phdApplicationId: number, sessionId: number) {
    try {
        const result = await PhdWorkflowService.verifyCandidacyFees(phdApplicationId, sessionId);
        revalidatePath(`/student/phd`);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function uploadInitialThesisAction(phdApplicationId: number, fileUrl: string) {
    try {
        return await db.transaction(async (tx) => {
            const [app] = await tx.select().from(phdApplications).where(eq(phdApplications.id, phdApplicationId)).limit(1);
            if (!app) throw new Error("PhD application not found");

            // Insert thesis
            const [inserted] = await tx.insert(phdTheses).values({
                phdApplicationId,
                fileUrl,
                status: 'dept_review',
                isCorrectedVersion: false
            });

            // Update application status
            await tx.update(phdApplications)
                .set({ status: 'thesis_uploaded' })
                .where(eq(phdApplications.id, phdApplicationId));

            revalidatePath(`/student/phd`);
            revalidatePath(`/admin/phd/review`);

            return { success: true, thesisId: inserted.insertId };
        });
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function submitThesisReviewAction(
    thesisId: number,
    reviewerId: number,
    stage: 'department' | 'subdean' | 'pg_committee' | 'provost',
    action: 'approve' | 'reject',
    comment: string
) {
    try {
        const result = await PhdWorkflowService.submitThesisReview(thesisId, reviewerId, stage, action, comment);
        revalidatePath(`/student/phd`);
        revalidatePath(`/admin/phd/review`);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function submitCorrectedThesisAction(
    phdApplicationId: number,
    fileUrl: string,
    turnitinReportUrl: string,
    turnitinScore: number
) {
    try {
        return await db.transaction(async (tx) => {
            // Retrieve plagiarism threshold from system settings (default is 15%)
            const [limitSetting] = await tx.select()
                .from(systemSettings)
                .where(eq(systemSettings.settingKey, 'phd_plagiarism_limit'))
                .limit(1);
            
            const plagiarismLimit = limitSetting && limitSetting.settingValue 
                ? parseInt(limitSetting.settingValue, 10) 
                : 15;

            if (turnitinScore > plagiarismLimit) {
                throw new Error(`Turnitin plagiarism similarity index (${turnitinScore}%) exceeds the maximum allowable threshold (${plagiarismLimit}%). Please revise and re-upload.`);
            }

            // Create new corrected thesis version
            const [inserted] = await tx.insert(phdTheses).values({
                phdApplicationId,
                fileUrl,
                turnitinReportUrl,
                turnitinScore,
                status: 'approved',
                isCorrectedVersion: true
            });

            // Update application status to approved corrections, which unlocks defense scheduling
            await tx.update(phdApplications)
                .set({ status: 'approved_corrections' })
                .where(eq(phdApplications.id, phdApplicationId));

            revalidatePath(`/student/phd`);
            revalidatePath(`/admin/phd/review`);

            return { success: true, thesisId: inserted.insertId };
        });
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function scheduleDefenseAction(
    phdApplicationId: number,
    defenseDate: Date,
    location: string,
    examiners: Array<{ name: string; email: string; type: 'internal' | 'external'; honorarium: number }>
) {
    try {
        const result = await PhdWorkflowService.scheduleDefense(phdApplicationId, defenseDate, location, examiners);
        revalidatePath(`/student/phd`);
        revalidatePath(`/admin/phd/review`);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function recordDefenseResultAction(phdApplicationId: number, status: 'successful' | 'failed') {
    try {
        return await db.transaction(async (tx) => {
            const [defense] = await tx.select().from(phdDefenses).where(eq(phdDefenses.phdApplicationId, phdApplicationId)).limit(1);
            if (!defense) throw new Error("No defense has been scheduled for this candidate.");

            await tx.update(phdDefenses)
                .set({ status })
                .where(eq(phdDefenses.id, defense.id));

            if (status === 'successful') {
                // If successful, examiners are approved for payment
                await tx.update(phdExaminers)
                    .set({ paymentStatus: 'approved_by_provost' })
                    .where(eq(phdExaminers.phdApplicationId, phdApplicationId));
            }

            revalidatePath(`/student/phd`);
            revalidatePath(`/admin/phd/review`);
            return { success: true };
        });
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function confirmGraduationAction(phdApplicationId: number) {
    try {
        return await db.transaction(async (tx) => {
            const [defense] = await tx.select().from(phdDefenses).where(eq(phdDefenses.phdApplicationId, phdApplicationId)).limit(1);
            if (!defense || defense.status !== 'successful') {
                throw new Error("Candidacy cannot be completed. The defense must be recorded as successful first.");
            }

            await tx.update(phdDefenses)
                .set({ provostApprovedAt: new Date() })
                .where(eq(phdDefenses.id, defense.id));

            await tx.update(phdApplications)
                .set({ status: 'completed' })
                .where(eq(phdApplications.id, phdApplicationId));

            revalidatePath(`/student/phd`);
            revalidatePath(`/admin/phd/review`);
            return { success: true };
        });
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getPhdCandidateStatusAction(studentId: number) {
    try {
        const [app] = await db.select()
            .from(phdApplications)
            .where(eq(phdApplications.studentId, studentId))
            .limit(1);
        
        if (!app) return { success: true, data: null };

        const supervisors = await db.select().from(phdSupervisors).where(eq(phdSupervisors.phdApplicationId, app.id));
        const theses = await db.select().from(phdTheses).where(eq(phdTheses.phdApplicationId, app.id)).orderBy(desc(phdTheses.createdAt));
        const examiners = await db.select().from(phdExaminers).where(eq(phdExaminers.phdApplicationId, app.id));
        const [defense] = await db.select().from(phdDefenses).where(eq(phdDefenses.phdApplicationId, app.id)).limit(1);

        return {
            success: true,
            data: {
                application: app,
                supervisors,
                theses,
                examiners,
                defense
            }
        };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getPhdApplicationsListAction() {
    try {
        const list = await db.select({
            id: phdApplications.id,
            studentId: phdApplications.studentId,
            studentName: users.name,
            researchTitle: phdApplications.researchTitle,
            status: phdApplications.status,
            createdAt: phdApplications.createdAt
        })
        .from(phdApplications)
        .innerJoin(students, eq(phdApplications.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .orderBy(desc(phdApplications.createdAt));

        return { success: true, data: list };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
