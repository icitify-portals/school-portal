"use server";

import { db } from "@/db/db";
import {
    jobVacancies,
    jobApplicants,
    departments
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getJobVacancies() {
    const results = await db.select({
        vacancy: jobVacancies,
        department: departments
    })
        .from(jobVacancies)
        .leftJoin(departments, eq(jobVacancies.departmentId, departments.id))
        .orderBy(desc(jobVacancies.createdAt));

    return results;
}

export async function postJobVacancy(data: {
    title: string;
    departmentId: number | null;
    description: string;
    requirements: string;
}) {
    try {
        await db.insert(jobVacancies).values({
            title: data.title,
            departmentId: data.departmentId,
            description: data.description,
            requirements: data.requirements,
            status: 'open'
        });

        revalidatePath("/admin/hr/recruitment");
        return { success: true };
    } catch (error) {
        console.error("Post vacancy error:", error);
        return { success: false, error: "Failed to post vacancy" };
    }
}

export async function submitApplication(data: {
    vacancyId: number;
    name: string;
    email: string;
    resumeUrl?: string;
}) {
    try {
        await db.insert(jobApplicants).values({
            vacancyId: data.vacancyId,
            name: data.name,
            email: data.email,
            resumeUrl: data.resumeUrl,
            status: 'applied'
        });

        return { success: true };
    } catch (error) {
        console.error("Submit application error:", error);
        return { success: false, error: "Failed to submit application" };
    }
}

export async function getApplicants(vacancyId?: number) {
    let query = db.select({
        applicant: jobApplicants,
        vacancy: jobVacancies
    })
        .from(jobApplicants)
        .innerJoin(jobVacancies, eq(jobApplicants.vacancyId, jobVacancies.id));

    if (vacancyId) {
        // @ts-ignore
        query = query.where(eq(jobApplicants.vacancyId, vacancyId));
    }

    return await query.orderBy(desc(jobApplicants.appliedAt));
}

export async function updateApplicantStatus(applicantId: number, status: 'applied' | 'screening' | 'interview' | 'hired' | 'rejected') {
    try {
        await db.update(jobApplicants)
            .set({ status })
            .where(eq(jobApplicants.id, applicantId));

        revalidatePath("/admin/hr/recruitment");
        return { success: true };
    } catch (error) {
        console.error("Update applicant status error:", error);
        return { success: false, error: "Failed to update status" };
    }
}
