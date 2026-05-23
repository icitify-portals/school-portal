"use server";

import { db } from "@/db/db";
import { admissionEntranceExams, admissionExamQuestions, admissionExamResults, admissionExamSubjects } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function startEntranceExam(applicationId: number, examId: number) {
    try {
        // 1. Check if already started or completed
        const existing = await db.select().from(admissionExamResults)
            .where(and(
                eq(admissionExamResults.applicationId, applicationId),
                eq(admissionExamResults.examId, examId)
            )).limit(1);

        if (existing.length > 0 && existing[0].status === 'completed') {
            throw new Error("Exam already completed.");
        }

        if (existing.length === 0) {
            await db.insert(admissionExamResults).values({
                applicationId,
                examId,
                startTime: new Date(),
                status: 'started'
            });
        }

        // 2. Fetch questions for the exam (randomized)
        const subjects = await db.select().from(admissionExamSubjects).where(eq(admissionExamSubjects.examId, examId));
        const questions = [];
        
        for (const sub of subjects) {
            const subQuestions = await db.select().from(admissionExamQuestions)
                .where(eq(admissionExamQuestions.subjectId, sub.id))
                .orderBy(sql`RAND()`)
                .limit(sub.questionCount || 10);
            questions.push(...subQuestions);
        }

        return { success: true, questions };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function submitEntranceExam(applicationId: number, examId: number, answers: any) {
    try {
        // Logic to calculate score
        // This is a simplified version
        let totalScore = 0;
        const subjectScores: any = {};

        // In a real app, we'd fetch the correct answers and compare
        totalScore = 75; // Placeholder

        await db.update(admissionExamResults)
            .set({
                status: 'completed',
                endTime: new Date(),
                totalScore: totalScore.toString(),
                subjectScores: JSON.stringify(subjectScores)
            })
            .where(and(
                eq(admissionExamResults.applicationId, applicationId),
                eq(admissionExamResults.examId, examId)
            ));

        revalidatePath("/admission/exam/result");
        return { success: true, score: totalScore };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
