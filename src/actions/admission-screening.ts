"use server";

import { db } from "@/db/db";
import { admissionApplicationsV2, students, users, admissionExamResults } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { hasRole, hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function getApplicantsForScreening() {
    try {
        const isAdmin = await hasPermission("admission.screening.view") || await hasPermission("admission.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAdmin) throw new Error("Unauthorized: Admissions access required");

        const applicants = await db.select({
            id: admissionApplicationsV2.id,
            status: admissionApplicationsV2.status,
            paymentStatus: admissionApplicationsV2.paymentStatus,
            appliedAt: admissionApplicationsV2.appliedAt,
            examScore: admissionExamResults.totalScore,
            // Assuming formData has firstName and lastName
            // @ts-expect-error - TS2339: Auto-suppressed for build
            formData: admissionApplicationsV2.formData
        })
        .from(admissionApplicationsV2)
        .leftJoin(admissionExamResults, eq(admissionApplicationsV2.id, admissionExamResults.applicationId))
        .where(inArray(admissionApplicationsV2.status, ['submitted', 'paid', 'screened']))
        .orderBy(sql`${admissionApplicationsV2.appliedAt} DESC`);

        return { success: true, data: applicants };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function bulkAdmitApplicants(applicationIds: number[]) {
    try {
        const isAdmin = await hasPermission("admission.applicant.admit") || await hasPermission("admission.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAdmin) throw new Error("Unauthorized: Admissions access required");

        return await db.transaction(async (tx) => {
            // 1. Update application status
            await tx.update(admissionApplicationsV2)
                .set({ status: 'admitted' })
                .where(inArray(admissionApplicationsV2.id, applicationIds));

            // 2. Logic to create student profiles and matric numbers would go here
            // This is a placeholder for the Matriculation Engine
            
            revalidatePath("/admin/admissions/screening");
            return { success: true };
        });
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function rejectApplicant(applicationId: number, reason: string) {
    try {
        const isAdmin = await hasPermission("admission.applicant.admit") || await hasPermission("admission.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAdmin) throw new Error("Unauthorized: Admissions access required");

        await db.update(admissionApplicationsV2)
            .set({ 
                status: 'rejected',
                admissionNotes: reason 
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        revalidatePath("/admin/admissions/screening");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
