"use server";

import { db } from "@/db/db";
import { 
    admissionExamSubjects, 
    admissionExamQuestions, 
    admissionExamResults,
    admissionEntranceExams
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveExamSubject(data: any) {
    try {
        const { id, examId, name, questionCount, marksPerQuestion } = data;
        if (id) {
            await db.update(admissionExamSubjects)
                .set({ name, questionCount, marksPerQuestion })
                .where(eq(admissionExamSubjects.id, id));
        } else {
            await db.insert(admissionExamSubjects).values({
                examId, name, questionCount, marksPerQuestion
            });
        }
        revalidatePath(`/admin/admission/exams/${examId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to save exam subject:", error);
        return { success: false, error: "Failed to save subject" };
    }
}

export async function saveExamQuestion(data: any) {
    try {
        const { id, subjectId, questionText, questionType, options, correctAnswer, explanation } = data;
        if (id) {
            await db.update(admissionExamQuestions)
                .set({ questionText, questionType, options: JSON.stringify(options), correctAnswer, explanation })
                .where(eq(admissionExamQuestions.id, id));
        } else {
            await db.insert(admissionExamQuestions).values({
                subjectId, questionText, questionType, options: JSON.stringify(options), correctAnswer, explanation
            });
        }
        return { success: true };
    } catch (error) {
        console.error("Failed to save exam question:", error);
        return { success: false, error: "Failed to save question" };
    }
}

export async function bulkUploadQuestions(subjectId: number, questions: any[]) {
    try {
        const formattedQuestions = questions.map(q => ({
            subjectId,
            questionText: q.questionText,
            questionType: q.questionType || 'multiple_choice',
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
        }));
        
        await db.insert(admissionExamQuestions).values(formattedQuestions);
        return { success: true, count: questions.length };
    } catch (error) {
        console.error("Failed to bulk upload questions:", error);
        return { success: false, error: "Bulk upload failed" };
    }
}

export async function getExamSessionData(examId: number) {
    try {
        const exam = await db.query.admissionEntranceExams.findFirst({
            where: eq(admissionEntranceExams.id, examId),
            with: {
                template: true
            }
        });

        const subjects = await db.query.admissionExamSubjects.findMany({
            where: eq(admissionExamSubjects.examId, examId),
            with: {
                questions: true
            }
        });

        return { exam, subjects };
    } catch (error) {
        console.error("Failed to fetch exam session data:", error);
        return null;
    }
}

export async function startExamSession(applicationId: number, examId: number) {
    try {
        const existing = await db.query.admissionExamResults.findFirst({
            where: and(
                eq(admissionExamResults.applicationId, applicationId),
                eq(admissionExamResults.examId, examId)
            )
        });

        if (existing) return { success: true, resultId: existing.id };

        const [result] = await db.insert(admissionExamResults).values({
            applicationId,
            examId,
            startTime: new Date(),
            status: 'started'
        });

        return { success: true, resultId: result.insertId };
    } catch (error) {
        console.error("Failed to start exam session:", error);
        return { success: false, error: "Failed to start session" };
    }
}

export async function submitExam(resultId: number, answers: any) {
    try {
        const result = await db.query.admissionExamResults.findFirst({
            where: eq(admissionExamResults.id, resultId),
            with: {
                exam: {
                    with: {
                        template: true
                    }
                }
            }
        });

        if (!result) return { success: false, error: "Session not found" };

        const subjects = await db.query.admissionExamSubjects.findMany({
            where: eq(admissionExamSubjects.examId, result.examId),
            with: {
                questions: true
            }
        });

        let totalScore = 0;
        const subjectScores: any = {};

        for (const subject of subjects) {
            let subjectScore = 0;
            const subjectAnswers = answers[subject.id] || {};

            for (const question of subject.questions) {
                const answer = subjectAnswers[question.id];
                if (answer === question.correctAnswer) {
                    subjectScore += parseFloat(subject.marksPerQuestion?.toString() || "1");
                }
            }
            
            subjectScores[subject.id] = subjectScore;
            totalScore += subjectScore;
        }

        await db.update(admissionExamResults)
            .set({
                subjectScores: JSON.stringify(subjectScores),
                totalScore: totalScore.toString(),
                endTime: new Date(),
                status: 'completed'
            })
            .where(eq(admissionExamResults.id, resultId));

        return { success: true, totalScore };
    } catch (error) {
        console.error("Failed to submit exam:", error);
        return { success: false, error: "Submission failed" };
    }
}
