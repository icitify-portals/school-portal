"use server";

import { db } from "@/db/db";
import { quizzes, quizQuestions, quizAttempts, quizResponses, questionBanks, quizIncidents, quizAttemptQuestions, users, students } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// --- Question Bank Management ---
export async function getQuestionBanks(courseId?: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const query = db.select().from(questionBanks);
        let conditions = [eq(questionBanks.createdById, parseInt(session.user.id))];

        if (courseId) {
            conditions.push(eq(questionBanks.courseId, courseId));
        }

        return await query.where(and(...conditions));
    } catch (error) {
        console.error("Failed to fetch banks:", error);
        return [];
    }
}

export async function createQuestionBank(name: string, courseId?: number, description?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.insert(questionBanks).values({
            name,
            courseId,
            description,
            createdById: parseInt(session.user.id)
        });
        revalidatePath("/admin/cbt/banks");
        return { success: true };
    } catch (error) {
        console.error("Create bank error:", error);
        return { success: false, error: "Failed to create bank" };
    }
}

export async function addQuestion(data: any) {
    try {
        const [result] = await db.insert(quizQuestions).values(data);
        return { success: true, id: result.insertId };
    } catch (error) {
        console.error("Add question error:", error);
        return { success: false, error: "Failed to add question" };
    }
}

// --- Quiz Management ---
export async function getQuizWithQuestions(quizId: number, attemptId?: number) {
    try {
        const quiz = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
        if (quiz.length === 0) return null;

        let questions: any[] = [];

        if (attemptId) {
            // Check for pooled questions assigned to this specific attempt
            const pooledQuestions = await db.select({
                q: quizQuestions
            })
                .from(quizAttemptQuestions)
                .innerJoin(quizQuestions, eq(quizAttemptQuestions.questionId, quizQuestions.id))
                .where(eq(quizAttemptQuestions.attemptId, attemptId))
                .orderBy(quizAttemptQuestions.order);

            if (pooledQuestions.length > 0) {
                questions = pooledQuestions.map(p => p.q);
            }
        }

        if (questions.length === 0) {
            // Default: Fetch all questions for the quiz
            questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));
        }

        // Randomize if enabled (and not already randomized by pooling)
        if (quiz[0].randomizeQuestions && (!attemptId || questions.length === 0)) {
            questions = questions.sort(() => Math.random() - 0.5);
        }

        let mode = 'exam';
        if (attemptId) {
            const [att] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId)).limit(1);
            if (att) mode = (att as any).mode;
        }

        const sanitizedQuestions = questions.map(q => {
            const { correctAnswer, ...rest } = q;
            return mode === 'practice' ? q : rest;
        });

        return { ...quiz[0], questions: sanitizedQuestions, mode };
    } catch (error) {
        console.error("Fetch quiz error:", error);
        return null;
    }
}

// --- Attempt Management ---
export async function startQuizAttempt(quizId: number, studentId: number, mode: 'exam' | 'practice' = 'exam') {
    try {
        // Check for existing in-progress attempt
        const existing = await db.select().from(quizAttempts)
            .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.studentId, studentId), eq(quizAttempts.status, 'in_progress')))
            .limit(1);

        if (existing.length > 0) return { success: true, attemptId: existing[0].id, mode: (existing[0] as any).mode };

        // 1. Fetch Quiz Settings
        const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
        if (!quiz) return { success: false, error: "Quiz not found" };

        // 1.5 Enforce Availability Window (Only for Exam mode)
        const now = new Date();
        if (mode === 'exam') {
            if (quiz.availableFrom && now < quiz.availableFrom) {
                return { success: false, error: `This examination will be available from ${quiz.availableFrom.toLocaleString()}` };
            }
            if (quiz.availableUntil && now > quiz.availableUntil) {
                return { success: false, error: "This examination window has closed." };
            }
        }

        return await db.transaction(async (tx) => {
            // 2. Create the Attempt
            const [result] = await tx.insert(quizAttempts).values({
                quizId,
                studentId,
                startedAt: new Date(),
                status: 'in_progress',
                mode
            });

            const attemptId = result.insertId;

            // 3. Handle Question Pooling / Random Draw
            if (quiz.isPooled && quiz.drawCount) {
                // Fetch all eligible questions for this quiz
                const allQuestions = await tx.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));

                // Shuffle and pick N
                const selected = allQuestions
                    .sort(() => Math.random() - 0.5)
                    .slice(0, quiz.drawCount);

                // Save selection for this specific attempt
                if (selected.length > 0) {
                    await tx.insert(quizAttemptQuestions).values(
                        selected.map((q, idx) => ({
                            attemptId,
                            questionId: q.id,
                            order: idx + 1
                        }))
                    );
                }
            }

            return { success: true, attemptId };
        });
    } catch (error) {
        console.error("Start attempt error:", error);
        return { success: false, error: "Failed to start attempt" };
    }
}

export async function submitResponse(attemptId: number, questionId: number, answer: string) {
    try {
        // Simple auto-grading for objective types
        const question = await db.select().from(quizQuestions).where(eq(quizQuestions.id, questionId)).limit(1);
        if (question.length === 0) return { success: false };

        let score = 0;
        const q = question[0];

        if (q.type === 'multiple_choice' || q.type === 'true_false' || q.type === 'numerical') {
            if (answer && q.correctAnswer && answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
                score = q.points ?? 0;
            }
        } else if (q.type === 'short_answer') {
            // Check if answer matches one of the comma-separated options in correctAnswer
            const possibleAnswers = q.correctAnswer?.split(',').map(a => a.trim().toLowerCase()) || [];
            if (possibleAnswers.includes(answer.trim().toLowerCase())) {
                score = q.points ?? 0;
            }
        } else if (q.type === 'matching') {
            // Student sends JSON array of pairs. Correct is in q.options
            try {
                const correct = JSON.parse(q.options || '[]');
                const student = JSON.parse(answer || '[]');
                let matches = 0;
                correct.forEach((c: any) => {
                    if (student.some((s: any) => s.left === c.left && s.right === c.right)) {
                        matches++;
                    }
                });
                if (matches === correct.length && correct.length > 0) {
                    score = q.points ?? 0;
                }
            } catch (e) { }
        } else if (q.type === 'ordering') {
            // Student sends JSON array of items. Correct is in q.options
            try {
                const correct = JSON.parse(q.options || '[]');
                const student = JSON.parse(answer || '[]');
                if (JSON.stringify(correct) === JSON.stringify(student)) {
                    score = q.points ?? 0;
                }
            } catch (e) { }
        } else if (q.type === 'hotspot') {
            // Student sends {x, y}. Correct is hotspots in q.options
            try {
                const config = JSON.parse(q.options || '{}');
                const student = JSON.parse(answer || '{}');
                const isCorrect = config.hotspots?.some((h: any) => {
                    const dist = Math.sqrt(Math.pow(h.x - student.x, 2) + Math.pow(h.y - student.y, 2));
                    return dist <= (h.radius || 10);
                });
                if (isCorrect) score = q.points ?? 0;
            } catch (e) { }
        }
        // Essay is manual grading (score remains null or 0)

        // Upsert response
        const existing = await db.select().from(quizResponses)
            .where(and(eq(quizResponses.attemptId, attemptId), eq(quizResponses.questionId, questionId)))
            .limit(1);

        if (existing.length > 0) {
            await db.update(quizResponses).set({ studentAnswer: answer, score })
                .where(eq(quizResponses.id, existing[0].id));
        } else {
            await db.insert(quizResponses).values({ attemptId, questionId, studentAnswer: answer, score });
        }

        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function finalizeAttempt(attemptId: number) {
    try {
        const responses = await db.select().from(quizResponses).where(eq(quizResponses.attemptId, attemptId));
        const totalScore = responses.reduce((acc, r) => acc + (r.score || 0), 0);

        const attempt = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId)).limit(1);
        if (attempt.length === 0) return { success: false };

        const quiz = await db.select().from(quizzes).where(eq(quizzes.id, attempt[0].quizId)).limit(1);
        const passed = totalScore >= (quiz[0]?.passingScore || 50);

        // Check if manual grading is needed (e.g. essay questions)
        const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, attempt[0].quizId));
        const needsManual = questions.some(q => q.type === 'essay');

        // Calculate weighted score if applicable
        let weightedScore = totalScore;
        if (quiz[0]?.maxPoints && quiz[0]?.totalWeight) {
            const rawMaxPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);
            if (rawMaxPoints > 0) {
                // Scale raw points to maxPoints, then apply weighting
                const scaledScore = (totalScore / rawMaxPoints) * quiz[0].maxPoints;
                weightedScore = (scaledScore / quiz[0].maxPoints) * quiz[0].totalWeight;
            }
        }

        await db.update(quizAttempts).set({
            score: totalScore,
            weightedScore: weightedScore.toString(),
            passed,
            status: needsManual ? 'submitted' : 'graded',
            completedAt: new Date()
        }).where(eq(quizAttempts.id, attemptId));

        // --- Gamification: Award XP ---
        const { awardXP } = await import("@/actions/gamification");
        const mode = attempt[0].mode || 'exam';
        const rawMaxPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);
        const percentage = rawMaxPoints > 0 ? (totalScore / rawMaxPoints) : 0;

        let xpAmount = 0;
        if (mode === 'practice') {
            xpAmount = 100 + Math.floor(percentage * 50);
        } else {
            xpAmount = 200 + Math.floor(percentage * 100);
            if (passed) xpAmount += 500;
        }

        await awardXP(xpAmount, `quiz_completion_${mode}`, attemptId.toString(), quiz[0].courseId);

        // --- Achievement Check ---
        const { checkAchievements } = await import("@/actions/gamification");
        await checkAchievements(attempt[0].studentId, 'quiz');

        return { success: true, graded: !needsManual };
    } catch (error) {
        return { success: false };
    }
}

export async function createQuiz(quizData: any, questionList: any[]) {
    try {
        return await db.transaction(async (tx) => {
            const [quizRes] = await tx.insert(quizzes).values({
                title: quizData.title,
                courseId: parseInt(quizData.courseId),
                timeLimitMinutes: parseInt(quizData.timeLimit),
                passingScore: parseInt(quizData.passingScore),
                randomizeQuestions: quizData.randomize,
                totalWeight: parseInt(quizData.totalWeight) || 100,
                maxPoints: quizData.maxPoints ? parseInt(quizData.maxPoints) : null,
                gradingStrategy: quizData.maxPoints ? 'weighted' : 'absolute',
                proctoringEnabled: quizData.proctoringEnabled || false,
                isPooled: quizData.isPooled || false,
                drawCount: quizData.isPooled ? parseInt(quizData.drawCount) : null,
                availableFrom: quizData.availableFrom ? new Date(quizData.availableFrom) : null,
                availableUntil: quizData.availableUntil ? new Date(quizData.availableUntil) : null
            });

            const quizId = quizRes.insertId;

            if (questionList.length > 0) {
                await tx.insert(quizQuestions).values(
                    questionList.map(q => ({
                        quizId,
                        questionText: q.text,
                        type: q.type,
                        options: JSON.stringify(q.options || q.matching || []),
                        correctAnswer: q.correct,
                        points: q.points || 1,
                        rubric: q.rubric,
                        aiGradingEnabled: q.aiGradingEnabled || false
                    }))
                );
            }

            revalidatePath("/admin/cbt");
            return { success: true, id: quizId };
        });
    } catch (error) {
        console.error("Create quiz error:", error);
        return { success: false, error: "Failed to create assessment" };
    }
}

export async function gradeEssayResponse(responseId: number, score: number, feedback?: string) {
    try {
        await db.update(quizResponses).set({ score, feedback }).where(eq(quizResponses.id, responseId));
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function getAttemptDetail(attemptId: number) {
    try {
        const rows = await db.select({
            attempt: quizAttempts,
            quiz: quizzes,
            student: students,
            user: users
        })
            .from(quizAttempts)
            .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
            .innerJoin(students, eq(quizAttempts.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(quizAttempts.id, attemptId));

        if (rows.length === 0) return null;

        const row = rows[0];

        // Fetch responses separately to avoid massive duplication in join
        const responses = await db.select({
            response: quizResponses,
            question: quizQuestions
        })
            .from(quizResponses)
            .innerJoin(quizQuestions, eq(quizResponses.questionId, quizQuestions.id))
            .where(eq(quizResponses.attemptId, attemptId));

        return {
            ...row.attempt,
            quiz: row.quiz,
            student: { ...row.student, user: row.user },
            responses: responses.map(r => ({ ...r.response, question: r.question }))
        };
    } catch (error) {
        return null;
    }
}

export async function bulkImportQuestions(bankId: number, questions: any[]) {
    try {
        await db.insert(quizQuestions).values(
            questions.map(q => ({
                bankId,
                questionText: q.questionText || q.question,
                type: q.type || 'multiple_choice',
                options: q.options ? JSON.stringify(q.options) : null,
                correctAnswer: q.correctAnswer || q.answer,
                points: parseInt(q.points) || 1
            }))
        );
        revalidatePath("/admin/cbt/banks");
        return { success: true };
    } catch (error) {
        console.error("Bulk import error:", error);
        return { success: false, error: "Failed to import questions. Check your data format." };
    }
}

export async function getQuestionBankQuestions(bankId: number) {
    try {
        return await db.select().from(quizQuestions).where(eq(quizQuestions.bankId, bankId));
    } catch (error) {
        return [];
    }
}

export async function logQuizIncident(attemptId: number, type: 'tab_blur' | 'window_resize' | 'fullscreen_exit' | 'hardware_change', metadata?: string) {
    try {
        await db.insert(quizIncidents).values({
            attemptId,
            type,
            metadata
        });

        // Count total incidents for this attempt
        const incidents = await db.select({ count: sql<number>`count(*)` })
            .from(quizIncidents)
            .where(eq(quizIncidents.attemptId, attemptId));

        const count = incidents[0]?.count || 0;

        // If threshold exceeded (e.g. 3), we might want to flag the attempt
        // For now, just return the count so the UI can decide what to do
        return { success: true, incidentCount: count };
    } catch (error) {
        console.error("Log incident error:", error);
        return { success: false };
    }
}

export async function grantExtraTime(attemptId: number, minutes: number) {
    try {
        await db.update(quizAttempts).set({ extraTimeMinutes: minutes }).where(eq(quizAttempts.id, attemptId));
        revalidatePath(`/admin/cbt/results`);
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function getAttemptWithTime(quizId: number, studentId: number) {
    try {
        const attempt = await db.select().from(quizAttempts)
            .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.studentId, studentId), eq(quizAttempts.status, 'in_progress')))
            .limit(1);

        if (attempt.length === 0) return null;
        return attempt[0];
    } catch (error) {
        return null;
    }
}

export async function getQuizResults(quizId: number) {
    try {
        const results = await db.select({
            id: quizAttempts.id,
            student: users.name,
            rawScore: quizAttempts.score,
            maxRaw: quizAttempts.maxScore,
            weighted: quizAttempts.weightedScore,
            status: quizAttempts.status,
            aiStatus: quizAttempts.aiGradingStatus,
            date: quizAttempts.completedAt,
        })
            .from(quizAttempts)
            .innerJoin(students, eq(quizAttempts.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(quizAttempts.quizId, quizId));

        return results;
    } catch (error) {
        console.error("Get quiz results error:", error);
        return [];
    }
}

export async function getQuizAnalyticsData(quizId: number) {
    try {
        const questionsList = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));
        const attemptsList = await db.select().from(quizAttempts).where(eq(quizAttempts.quizId, quizId));

        const responsesResults = await db.select()
            .from(quizResponses)
            .innerJoin(quizAttempts, eq(quizResponses.attemptId, quizAttempts.id))
            .where(eq(quizAttempts.quizId, quizId));

        return {
            questions: questionsList,
            attempts: attemptsList,
            responses: responsesResults.map(r => r.quiz_responses)
        };
    } catch (error) {
        console.error("Analytics data error:", error);
        return { questions: [], attempts: [], responses: [] };
    }
}
