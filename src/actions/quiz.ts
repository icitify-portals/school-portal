"use server";

import { db } from "@/db/db";
import {
    quizzes,
    quizQuestions,
    quizAttempts,
    studentProgress,
    courseLessons,
    examSlots
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- INSTRUCTOR ACTIONS ---

export async function getQuizDetails(lessonId: number) {
    try {
        const quiz = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId)).limit(1);
        if (quiz.length === 0) return { success: false, error: "Quiz not found" };

        const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quiz[0].id));

        return { success: true, quiz: quiz[0], questions };
    } catch (error) {
        return { success: false, error: "Failed to fetch quiz details" };
    }
}

export async function saveQuestion(quizId: number, question: {
    id?: number;
    text: string;
    type: 'multiple_choice' | 'true_false';
    options: string[];
    correctAnswer: string;
    points: number;
}) {
    try {
        const payload = {
            quizId,
            questionText: question.text,
            type: question.type,
            options: JSON.stringify(question.options), // Store as JSON string
            correctAnswer: question.correctAnswer,
            points: question.points
        };

        if (question.id) {
            await db.update(quizQuestions).set(payload).where(eq(quizQuestions.id, question.id));
        } else {
            await db.insert(quizQuestions).values(payload);
        }

        revalidatePath(`/staff/courses`);
        return { success: true };
    } catch (error) {
        console.error("Save question error:", error);
        return { success: false, error: "Failed to save question" };
    }
}

export async function deleteQuestion(questionId: number) {
    try {
        await db.delete(quizQuestions).where(eq(quizQuestions.id, questionId));
        revalidatePath(`/staff/courses`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete question" };
    }
}

// --- STUDENT ACTIONS ---

export async function getStudentQuizQuestions(quizId: number) {
    try {
        const questions = await db.select({
            id: quizQuestions.id,
            quizId: quizQuestions.quizId,
            questionText: quizQuestions.questionText,
            type: quizQuestions.type,
            options: quizQuestions.options,
            points: quizQuestions.points
        }).from(quizQuestions).where(eq(quizQuestions.quizId, quizId));

        return { success: true, questions };
    } catch (error) {
        return { success: false, error: "Failed to load questions" };
    }
}

export async function startQuizAttempt(quizId: number, studentId: number) {
    try {
        // Check for existing active attempt? 
        // For now, simplify: just create a new one.
        // In strictly timed mode, we might check if one exists and is within time window.

        const [res] = await db.insert(quizAttempts).values({
            quizId,
            studentId,
            score: 0,
            passed: false,
            startedAt: new Date(),
        });

        return { success: true, attemptId: res.insertId };
    } catch (error) {
        return { success: false, error: "Failed to start quiz" };
    }
}

export async function submitQuiz(
    attemptId: number,
    answers: Record<number, string>, // questionId -> selectedOption
    submissionType: 'manual' | 'auto_timer' | 'auto_global' = 'manual'
) {
    try {
        // 1. Fetch Attempt & Quiz
        const attempt = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId)).limit(1);
        if (!attempt.length) return { success: false, error: "Invalid attempt" };

        const quiz = await db.select({
            quiz: quizzes,
            slot: examSlots
        })
        .from(quizzes)
        .leftJoin(examSlots, eq(quizzes.slotId, examSlots.id))
        .where(eq(quizzes.id, attempt[0].quizId))
        .limit(1);

        if (!quiz.length) return { success: false, error: "Quiz not found" };
        const quizData = quiz[0].quiz;
        const slotData = quiz[0].slot;

        const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizData.id));

        // 2. Calculate Score
        let totalPoints = 0;
        let earnedPoints = 0;

        questions.forEach(q => {
            totalPoints += (q.points || 1);
            if (answers[q.id] === q.correctAnswer) {
                earnedPoints += (q.points || 1);
            }
        });

        const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
        const passed = percentage >= (quizData.passingScore || 50);

        // 3. Update Attempt
        const isTimedOut = submissionType !== 'manual';
        await db.update(quizAttempts).set({
            score: Math.round(percentage),
            passed,
            status: isTimedOut ? 'timed_out' : 'submitted',
            submissionType,
            completedAt: new Date()
        }).where(eq(quizAttempts.id, attemptId));

        // 4. Update Course Progress if Passed
        if (passed && quizData.courseId && quizData.lessonId) {
            const studentId = attempt[0].studentId;
            const existing = await db.select().from(studentProgress).where(and(
                eq(studentProgress.studentId, studentId),
                eq(studentProgress.lessonId, quizData.lessonId)
            )).limit(1);

            if (existing.length === 0) {
                await db.insert(studentProgress).values({
                    studentId,
                    courseId: quizData.courseId,
                    moduleId: quizData.moduleId,
                    lessonId: quizData.lessonId,
                    isCompleted: true,
                    lastAccessed: new Date(),
                    quizScore: Math.round(percentage)
                });
            } else {
                if ((existing[0].quizScore || 0) < percentage) {
                    await db.update(studentProgress).set({
                        isCompleted: true,
                        quizScore: Math.round(percentage),
                        lastAccessed: new Date()
                    }).where(eq(studentProgress.id, existing[0].id));
                }
            }
        }

        revalidatePath(`/student/classroom/${quizData.courseId}`);
        return { success: true, score: Math.round(percentage), passed };

    } catch (error) {
        console.error("Submit quiz error:", error);
        return { success: false, error: "Failed to submit quiz" };
    }
}
