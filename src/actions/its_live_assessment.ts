"use server";

import { db } from "@/db/db";
import { 
    itsQuestions, 
    itsResponses, 
    itsSessions,
    students 
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getLessonQuestions(lessonId: number) {
    try {
        return await db.select().from(itsQuestions).where(eq(itsQuestions.lessonId, lessonId));
    } catch (error) {
        return [];
    }
}

export async function submitITSResponse(data: {
    sessionId: number;
    studentId: number;
    questionId: number;
    response: string;
}) {
    try {
        const [question] = await db.select().from(itsQuestions).where(eq(itsQuestions.id, data.questionId)).limit(1);
        if (!question) return { success: false };

        const isCorrect = question.correctAnswer === data.response;

        await db.insert(itsResponses).values({
            ...data,
            isCorrect,
        });

        revalidatePath("/admin/its/classroom");
        return { success: true, isCorrect };
    } catch (error) {
        return { success: false };
    }
}

export async function getLiveResponses(sessionId: number, questionId: number) {
    try {
        const responses = await db.select({
            id: itsResponses.id,
            response: itsResponses.response,
            isCorrect: itsResponses.isCorrect,
            student: {
                id: students.id,
                userId: students.userId,
            }
        })
        .from(itsResponses)
        .innerJoin(students, eq(itsResponses.studentId, students.id))
        .where(and(
            eq(itsResponses.sessionId, sessionId),
            eq(itsResponses.questionId, questionId)
        ));

        return responses;
    } catch (error) {
        return [];
    }
}
