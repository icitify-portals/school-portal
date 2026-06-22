"use server";

import { db } from "@/db/db";
import { gradingSystems, gradePoints, documentTemplates, annualSummaries, resultEditLogs, students } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { AdmissionLetterService } from "@/services/AdmissionLetterService";
import { sendInAppNotification } from "./notifications";

async function ensureAdminAccess() {
    const isAdmin = await hasRole("admin") || await hasRole("superadmin");
    if (!isAdmin) throw new Error("Unauthorized: Academic admin access required");
}

export async function createGradingSystem(data: {
    name: string,
    scale: number,
    description?: string,
    grades: Array<{ letterGrade: string, minMark: number, maxMark: number, points: number, description?: string }>
}) {
    try {
        await ensureAdminAccess();
        
        return await db.transaction(async (tx) => {
            const [system] = await tx.insert(gradingSystems).values({
                name: data.name,
                scale: data.scale,
                description: data.description
            });

            const systemId = (system as { insertId: number }).insertId;

            if (data.grades.length > 0) {
                await tx.insert(gradePoints).values(
                    data.grades.map(g => ({
                        gradingSystemId: systemId,
                        letterGrade: g.letterGrade,
                        minMark: g.minMark,
                        maxMark: g.maxMark,
                        points: g.points.toFixed(2),
                        description: g.description
                    }))
                );
            }

            revalidatePath("/admin/academic/grading");
            return { success: true, systemId };
        });
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function saveDocumentTemplate(data: {
    name: string,
    type: 'result_slip' | 'transcript' | 'admission_letter' | 'certificate' | 'id_card',
    level: 'primary' | 'secondary' | 'tertiary' | 'postgraduate',
    html: string,
    css?: string
}) {
    try {
        await ensureAdminAccess();
        await db.insert(documentTemplates).values({
            name: data.name,
            type: data.type,
            level: data.level,
            templateHtml: data.html,
            templateCss: data.css
        });
        revalidatePath("/admin/academic/templates");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getDocumentTemplates() {
    try {
        await ensureAdminAccess();
        const templates = await db.select().from(documentTemplates);
        return { success: true, data: templates };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function generateAdmissionLetterAction(applicationId: number) {
    try {
        const result = await AdmissionLetterService.generateLetter(applicationId);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function approveK12ResultAction(summaryId: number) {
    try {
        const isPrincipal = await hasRole("principal") || await hasRole("superadmin");
        if (!isPrincipal) throw new Error("Unauthorized: Principal access required");
        
        const userId = 1; 

        await db.update(annualSummaries)
            .set({
                status: 'published',
                principalApprovedBy: userId,
                principalApprovedAt: new Date()
            })
            .where(eq(annualSummaries.id, summaryId));

        revalidatePath("/admin/academic/results/k12");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function editStudentScoreAction(data: {
    studentId: number,
    courseId: number,
    sessionId: number,
    term: string,
    newScore: number,
    oldScore?: number,
    reason: string
}) {
    try {
        const canEdit = await hasRole("principal") || await hasRole("superadmin");
        if (!canEdit) throw new Error("Unauthorized: Edit permissions required");
        
        const userId = 1;

        return await db.transaction(async (tx) => {
            // 1. Log the edit
            await tx.insert(resultEditLogs).values({
                studentId: data.studentId,
                courseId: data.courseId,
                sessionId: data.sessionId,
                term: data.term,
                oldScore: data.oldScore?.toString(),
                newScore: data.newScore.toString(),
                reason: data.reason,
                editedBy: userId
            });

            // 2. Update the actual score (assuming marks are in a marks/scores table)
            // Implementation depends on the specific marks table structure
            
            return { success: true };
        });
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function dispatchResultNotificationsAction(studentId: number, method: 'email' | 'whatsapp') {
    try {
        const { AcademicNotificationService } = await import("@/services/AcademicNotificationService");
        if (method === 'email') {
            await AcademicNotificationService.sendResultEmail(studentId, {});
            
            const [student] = await db.select({ userId: students.userId }).from(students).where(eq(students.id, studentId)).limit(1);
            if (student?.userId) {
                await sendInAppNotification({
                    userId: student.userId,
                    title: "Results Published",
                    message: "Your academic result has been published and is now available.",
                    type: "info",
                    link: "/student/academics/results"
                });
            }
        } else {
            await AcademicNotificationService.sendResultWhatsApp(studentId, "Your academic result is now available.");
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
