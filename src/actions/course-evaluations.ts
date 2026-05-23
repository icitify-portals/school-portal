"use server";

import { EvaluationService } from "@/services/EvaluationService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { studentCourseRegistrations, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function submitCourseEvaluationAction(data: {
    studentId: number,
    courseId: number,
    sessionId: number,
    semester: '1' | '2',
    ratings: Record<string, number>,
    comments?: string,
    isAnonymous?: boolean
}) {
    try {
        await EvaluationService.submitEvaluation(data);
        revalidatePath("/student/courses/evaluations");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getStudentEvaluatableCoursesAction(studentId: number, sessionId: number) {
    try {
        const coursesList = await db.select({
            id: courses.id,
            name: courses.name,
            code: courses.code
        })
        .from(studentCourseRegistrations)
        .innerJoin(courses, eq(studentCourseRegistrations.courseId, courses.id))
        .where(and(
            eq(studentCourseRegistrations.studentId, studentId),
            eq(studentCourseRegistrations.sessionId, sessionId)
        ));

        return { success: true, data: coursesList };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
