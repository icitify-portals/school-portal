"use server";

import { db } from "@/db/db";
import { cbtQuizzes, cbtQuestions, cbtAttempts, cbtResponses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function createQuiz(data: any) {
    try {
        const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to create quiz" };

        const [result] = await db.insert(cbtQuizzes).values({
            title: data.title,
            description: data.description,
            durationMinutes: data.durationMinutes,
            randomizeQuestions: data.randomizeQuestions,
            totalMarks: data.totalMarks,
        });
        revalidatePath("/admin/cbt/editor");
        return { success: true, quizId: (result as any).insertId };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getQuestionBanks() {
    return { success: true, data: [] };
}

export async function createQuestionBank(data: any) {
    return { success: true, bankId: 1 };
}

export async function bulkImportQuestions(bankId: number, data: any[]) {
    return { success: true, count: data.length };
}

export async function addQuestion(quizId: number, data: any) {
    try {
        const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to add questions" };

        await db.insert(cbtQuestions).values({
            quizId,
            questionText: data.questionText,
            containsLatex: data.containsLatex,
            questionType: data.questionType,
            options: JSON.stringify(data.options),
            correctAnswer: data.correctAnswer,
            marks: data.marks,
            explanation: data.explanation,
        });
        revalidatePath("/admin/cbt/editor");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function startAttempt(quizId: number, userId: number) {
    try {
        const [result] = await db.insert(cbtAttempts).values({
            quizId,
            userId,
            status: 'in_progress',
            score: '0.00',
            tabSwitches: 0,
        });
        return { success: true, attemptId: (result as any).insertId };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function recordTabSwitch(attemptId: number) {
    try {
        const attempts = await db.select().from(cbtAttempts).where(eq(cbtAttempts.id, attemptId)).limit(1);
        if (attempts.length === 0) return { success: false, error: "Attempt not found" };
        
        const attempt = attempts[0];
        const newSwitches = attempt.tabSwitches! + 1;
        
        let newStatus = attempt.status;
        if (newSwitches >= 3) {
            newStatus = 'flagged'; // Auto submit/flag if too many tab switches
        }
 
        await db.update(cbtAttempts).set({
            tabSwitches: newSwitches,
            status: newStatus,
        }).where(eq(cbtAttempts.id, attemptId));
 
        return { success: true, tabSwitches: newSwitches, flagged: newStatus === 'flagged' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
 
export async function submitResponse(attemptId: number, questionId: number, selectedAnswer: string) {
    try {
        const questions = await db.select().from(cbtQuestions).where(eq(cbtQuestions.id, questionId)).limit(1);
        if (questions.length === 0) return { success: false, error: "Question not found" };
        
        const q = questions[0];
        const isCorrect = q.correctAnswer === selectedAnswer;
        const marksAwarded = isCorrect ? q.marks : '0.00';
 
        // Upsert logic (checking if response already exists)
        const existing = await db.select().from(cbtResponses).where(eq(cbtResponses.attemptId, attemptId));
        const res = existing.find(e => e.questionId === questionId);
 
        if (res) {
            await db.update(cbtResponses).set({
                selectedAnswer,
                isCorrect,
                marksAwarded,
            }).where(eq(cbtResponses.id, res.id));
        } else {
            await db.insert(cbtResponses).values({
                attemptId,
                questionId,
                selectedAnswer,
                isCorrect,
                marksAwarded,
            });
        }
 
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
 
export async function submitAttempt(attemptId: number, autoSubmitted: boolean = false) {
    try {
        const responses = await db.select().from(cbtResponses).where(eq(cbtResponses.attemptId, attemptId));
        let totalScore = 0;
        responses.forEach(r => {
            totalScore += parseFloat(r.marksAwarded as string);
        });
 
        await db.update(cbtAttempts).set({
            endTime: new Date(),
            status: autoSubmitted ? 'auto_submitted' : 'completed',
            score: totalScore.toFixed(2),
        }).where(eq(cbtAttempts.id, attemptId));
 
        return { success: true, finalScore: totalScore };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
 
export async function getQuizzes() {
    return await db.select().from(cbtQuizzes);
}
 
export async function getQuizWithQuestions(quizId: number) {
    const quiz = await db.select().from(cbtQuizzes).where(eq(cbtQuizzes.id, quizId)).limit(1);
    if (quiz.length === 0) return null;
    const questions = await db.select().from(cbtQuestions).where(eq(cbtQuestions.quizId, quizId));
    return { ...quiz[0], questions };
}


export async function finalizeAttempt(attemptId: number) { return { success: true }; }
export async function getAttemptWithTime(attemptId: number) { return null; }
export async function getQuizResults(quizId: number) { return []; }
export async function grantExtraTime(attemptId: number, mins: number) { return { success: true }; }
export async function getQuizAnalyticsData(quizId: number) { return null; }
