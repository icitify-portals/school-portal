"use server";

import { PhdWorkflowService } from "@/services/PhdWorkflowService";
import { db } from "@/db/db";
import { 
    phdApplications, 
    phdTheses, 
    phdExaminers, 
    phdDefenses, 
    phdSupervisors,
    systemSettings, 
    users, 
    students 
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";
import { auth } from "@/auth";

// ─── Permission helpers ────────────────────────────────────────────────────

/** Admin / superadmin / postgraduate coordinator can perform any management action */
async function canManagePhd() {
    return (
        await hasRole("admin") ||
        await hasRole("superadmin") ||
        await hasPermission("phd.supervisors.assign") ||
        await hasPermission("phd.thesis.review")
    );
}

async function requirePermission(permission: string, fallbackRoles: string[] = []) {
    const permitted = await hasPermission(permission);
    if (permitted) return true;
    for (const role of fallbackRoles) {
        if (await hasRole(role)) return true;
    }
    return false;
}

// ─── Actions ───────────────────────────────────────────────────────────────

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
    const allowed = await requirePermission("phd.supervisors.assign", ["admin", "superadmin"]);
    if (!allowed) return { success: false, error: "Unauthorized: You do not have permission to assign PhD supervisors." };

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
    // Token-based — open to supervisor invitees, no session required
    try {
        const result = await PhdWorkflowService.submitSupervisorResponse(token, accepted);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function verifyCandidacyFeesAction(phdApplicationId: number, sessionId: number) {
    const allowed = await requirePermission("phd.fees.verify", ["admin", "superadmin", "bursar"]);
    if (!allowed) return { success: false, error: "Unauthorized: You do not have permission to verify candidacy fees." };

    try {
        const result = await PhdWorkflowService.verifyCandidacyFees(phdApplicationId, sessionId);
        revalidatePath(`/student/phd`);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function uploadInitialThesisAction(phdApplicationId: number, fileUrl: string) {
    // Only the student owning this application may upload their thesis
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized: You must be logged in." };

    try {
        return await db.transaction(async (tx) => {
            const [app] = await tx.select().from(phdApplications).where(eq(phdApplications.id, phdApplicationId)).limit(1);
            if (!app) throw new Error("PhD application not found");

            // Verify the authenticated user owns this application
            const [student] = await tx.select().from(students)
                .where(eq(students.id, app.studentId))
                .limit(1);
            if (!student || student.userId?.toString() !== session.user!.id) {
                return { success: false, error: "Unauthorized: This application does not belong to your account." };
            }

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
    const allowed = await requirePermission("phd.thesis.review", ["admin", "superadmin"]);
    if (!allowed) return { success: false, error: "Unauthorized: You do not have permission to review PhD theses." };

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
    // Only the student owning this application may submit corrections
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized: You must be logged in." };

    try {
        return await db.transaction(async (tx) => {
            // Verify ownership
            const [app] = await tx.select().from(phdApplications).where(eq(phdApplications.id, phdApplicationId)).limit(1);
            if (!app) throw new Error("PhD application not found");

            const [student] = await tx.select().from(students)
                .where(eq(students.id, app.studentId))
                .limit(1);
            if (!student || student.userId?.toString() !== session.user!.id) {
                return { success: false, error: "Unauthorized: This application does not belong to your account." };
            }

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
    const allowed = await requirePermission("phd.defense.schedule", ["admin", "superadmin"]);
    if (!allowed) return { success: false, error: "Unauthorized: You do not have permission to schedule PhD defenses." };

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
    const allowed = await requirePermission("phd.defense.record_result", ["admin", "superadmin"]);
    if (!allowed) return { success: false, error: "Unauthorized: You do not have permission to record PhD defense results." };

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
    const allowed = await requirePermission("phd.graduation.confirm", ["admin", "superadmin"]);
    if (!allowed) return { success: false, error: "Unauthorized: Provost-level approval is required to confirm PhD graduations." };

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
    // The student themselves OR any admin/coordinator can view
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const isAdmin = await hasRole("admin") || await hasRole("superadmin") || await hasPermission("phd.applications.view");

    if (!isAdmin) {
        // Verify this student belongs to the authenticated user
        const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
        if (!student || student.userId?.toString() !== session.user.id) {
            return { success: false, error: "Unauthorized: You can only view your own PhD status." };
        }
    }

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
    const allowed = await requirePermission("phd.applications.view", ["admin", "superadmin"]);
    if (!allowed) return { success: false, error: "Unauthorized: You do not have permission to view PhD applications." };

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
