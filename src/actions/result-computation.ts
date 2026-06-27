"use server";

import { ResultComputationService } from "@/services/ResultComputationService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { resultMarks, semesterSummaries, students, users, courses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { hasRole, hasPermission } from "@/lib/rbac";

export async function computeStudentGPAction(studentId: number, sessionId: number, semester: '1' | '2') {
    try {
        const isAuth = await hasPermission("academic.results.compute") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("hod");
        if (!isAuth) throw new Error("Unauthorized: Admissions/HOD access required");

        const result = await ResultComputationService.computeSemesterGPA(studentId, sessionId, semester);
        revalidatePath("/admin/academic/results");
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getStudentSemesterResultAction(studentId: number, sessionId: number, semester: '1' | '2') {
    try {
        const summary = await db.select().from(semesterSummaries)
            .where(and(
                eq(semesterSummaries.studentId, studentId),
                eq(semesterSummaries.sessionId, sessionId),
                eq(semesterSummaries.semester, semester)
            )).limit(1);

        const marks = await db.select({
            id: resultMarks.id,
            courseCode: courses.code,
            courseName: courses.name,
            units: courses.creditUnits,
            total: resultMarks.totalScore,
            grade: resultMarks.grade,
            points: resultMarks.gradePoint
        })
        .from(resultMarks)
        .innerJoin(courses, eq(resultMarks.courseId, courses.id))
        .where(and(
            eq(resultMarks.studentId, studentId),
            eq(resultMarks.sessionId, sessionId),
            eq(resultMarks.semester, semester)
        ));

        return { success: true, summary: summary[0], marks };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function bulkComputeResultsAction(sessionId: number, semester: '1' | '2', studentIds: number[]) {
    try {
        const isAuth = await hasPermission("academic.results.compute") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAuth) throw new Error("Unauthorized");

        for (const id of studentIds) {
            await ResultComputationService.computeSemesterGPA(id, sessionId, semester);
        }

        revalidatePath("/admin/academic/results");
        return { success: true, message: `Computed results for ${studentIds.length} students.` };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
