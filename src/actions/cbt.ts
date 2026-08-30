"use server";

import { db } from "@/db/db";
import { cbtQuizzes, cbtQuestions, cbtAttempts, cbtResponses, cbtAssignments, users } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
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
        const quizList = await db.select().from(cbtQuizzes).where(eq(cbtQuizzes.id, quizId)).limit(1);
        if (quizList.length === 0) return { success: false, error: "Quiz not found" };
        const quiz = quizList[0];

        if (quiz.requireAssignment) {
            const assignment = await db.select().from(cbtAssignments)
                .where(eq(cbtAssignments.quizId, quizId));
            const isAssigned = assignment.some(a => a.userId === userId);
            
            if (!isAssigned) {
                return { success: false, error: "Access Denied: You are not assigned to this exam." };
            }
        }

        // Enforce max attempts from security settings
        const { examSecuritySettings } = await import("@/db/schema");
        const [secSettings] = await db.select().from(examSecuritySettings).limit(1);
        const maxAttempts = secSettings?.maxAttempts ?? 1;

        const existingAttempts = await db.select().from(cbtAttempts)
            .where(eq(cbtAttempts.quizId, quizId));
        const userAttempts = existingAttempts.filter(a => a.userId === userId && (a.status === 'completed' || a.status === 'auto_submitted'));

        if (userAttempts.length >= maxAttempts) {
            return { success: false, error: `Maximum attempts (${maxAttempts}) reached for this exam.` };
        }

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
            newStatus = 'flagged';
        }

        // Auto-submit if configured
        const { examSecuritySettings } = await import("@/db/schema");
        const [secSettings] = await db.select().from(examSecuritySettings).limit(1);
        
        if (secSettings?.autoSubmitOnTabSwitch && newStatus !== 'flagged') {
            const responses = await db.select().from(cbtResponses).where(eq(cbtResponses.attemptId, attemptId));
            let totalScore = 0;
            responses.forEach(r => { totalScore += parseFloat(r.marksAwarded as string); });

            await db.update(cbtAttempts).set({
                tabSwitches: newSwitches,
                status: 'auto_submitted',
                endTime: new Date(),
                score: totalScore.toFixed(2),
            }).where(eq(cbtAttempts.id, attemptId));
            
            return { success: true, tabSwitches: newSwitches, flagged: true, autoSubmitted: true };
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

    let questions = await db.select().from(cbtQuestions).where(eq(cbtQuestions.quizId, quizId));

    if (quiz[0].randomizeQuestions) {
        questions = questions.sort(() => Math.random() - 0.5);
    }

    return { ...quiz[0], questions };
}

export async function getCBTStats() {
    try {
        const quizzes = await db.select().from(cbtQuizzes);
        const attempts = await db.select().from(cbtAttempts);
        const questions = await db.select().from(cbtQuestions);

        const activeQuizzes = quizzes.filter(q => q.isActive).length;
        const pendingGrading = attempts.filter(a => a.status === 'flagged' || a.status === 'auto_submitted').length;
        const completedAttempts = attempts.filter(a => a.status === 'completed' || a.status === 'auto_submitted');
        const passRate = completedAttempts.length > 0
            ? Math.round((completedAttempts.filter(a => parseFloat(a.score || '0') >= parseFloat(quizzes.find(q => q.id === a.quizId)?.totalMarks || '100') * 0.5).length / completedAttempts.length) * 100)
            : 0;

        const recentQuizzes = quizzes.slice(-5).reverse().map(q => ({
            id: q.id,
            title: q.title,
            questionCount: questions.filter(qq => qq.quizId === q.id).length,
            durationMinutes: q.durationMinutes,
        }));

        return {
            activeQuizzes,
            totalQuizzes: quizzes.length,
            pendingGrading,
            passRate,
            recentQuizzes,
            totalAttempts: attempts.length,
        };
    } catch (error) {
        return { activeQuizzes: 0, totalQuizzes: 0, pendingGrading: 0, passRate: 0, recentQuizzes: [], totalAttempts: 0 };
    }
}
}


export async function finalizeAttempt(attemptId: number) {
    try {
        const attempts = await db.select().from(cbtAttempts).where(eq(cbtAttempts.id, attemptId)).limit(1);
        if (attempts.length === 0) return { success: false, error: "Attempt not found" };

        const attempt = attempts[0];
        if (attempt.status === 'completed') return { success: true, score: attempt.score };

        const responses = await db.select().from(cbtResponses).where(eq(cbtResponses.attemptId, attemptId));
        let totalScore = 0;
        responses.forEach(r => { totalScore += parseFloat(r.marksAwarded as string); });

        await db.update(cbtAttempts).set({
            endTime: new Date(),
            status: 'completed',
            score: totalScore.toFixed(2),
        }).where(eq(cbtAttempts.id, attemptId));

        return { success: true, score: totalScore.toFixed(2) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAttemptWithTime(attemptId: number) {
    try {
        const attempts = await db.select().from(cbtAttempts).where(eq(cbtAttempts.id, attemptId)).limit(1);
        if (attempts.length === 0) return null;

        const attempt = attempts[0];
        const quizzes = await db.select().from(cbtQuizzes).where(eq(cbtQuizzes.id, attempt.quizId)).limit(1);
        if (quizzes.length === 0) return null;

        const quiz = quizzes[0];
        const durationMs = (quiz.durationMinutes || 60) * 60 * 1000;
        const elapsed = attempt.startTime ? Date.now() - new Date(attempt.startTime).getTime() : 0;
        const remainingMs = Math.max(0, durationMs - elapsed);

        return { ...attempt, durationMinutes: quiz.durationMinutes, remainingMs };
    } catch (error) {
        return null;
    }
}

export async function getQuizResults(quizId: number) {
    try {
        const results = await db.select({
            attemptId: cbtAttempts.id,
            userId: cbtAttempts.userId,
            userName: users.name,
            userEmail: users.email,
            userMatricNumber: users.matricNumber,
            score: cbtAttempts.score,
            startTime: cbtAttempts.startTime,
            endTime: cbtAttempts.endTime,
            status: cbtAttempts.status,
            tabSwitches: cbtAttempts.tabSwitches,
        }).from(cbtAttempts)
          .innerJoin(users, eq(cbtAttempts.userId, users.id))
          .where(eq(cbtAttempts.quizId, quizId))
          .orderBy(cbtAttempts.endTime);

        return results;
    } catch (error) {
        return [];
    }
}

export async function grantExtraTime(attemptId: number, mins: number) {
    try {
        const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized" };

        const attempts = await db.select().from(cbtAttempts).where(eq(cbtAttempts.id, attemptId)).limit(1);
        if (attempts.length === 0) return { success: false, error: "Attempt not found" };

        // Extend by resetting startTime earlier (effectively adding time)
        const attempt = attempts[0];
        const extraMs = mins * 60 * 1000;
        const newStart = new Date(new Date(attempt.startTime!).getTime() - extraMs);

        await db.update(cbtAttempts).set({ startTime: newStart }).where(eq(cbtAttempts.id, attemptId));
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getQuizAnalyticsData(quizId: number) {
    try {
        const questions = await db.select().from(cbtQuestions).where(eq(cbtQuestions.quizId, quizId));
        const attempts = await db.select().from(cbtAttempts).where(eq(cbtAttempts.quizId, quizId));
        const allResponses = await db.select().from(cbtResponses);

        const totalStudents = attempts.length;
        const completedAttempts = attempts.filter(a => a.status === 'completed' || a.status === 'auto_submitted');
        const totalScore = completedAttempts.reduce((sum, a) => sum + parseFloat(a.score || '0'), 0);
        const avgScore = completedAttempts.length > 0 ? totalScore / completedAttempts.length : 0;

        const questionStats = questions.map(q => {
            const qResponses = allResponses.filter(r => r.questionId === q.id);
            const correctCount = qResponses.filter(r => r.isCorrect).length;
            const totalCount = qResponses.length;
            const pValue = totalCount > 0 ? correctCount / totalCount : 0;

            return {
                questionId: q.id,
                questionText: q.questionText,
                pValue: Math.round(pValue * 100) / 100,
                discriminationIndex: Math.round((pValue - (avgScore / (parseFloat(q.marks || '1') * questions.length || 1))) * 100) / 100,
                responseCount: totalCount,
                correctCount,
            };
        });

        const avgPValue = questionStats.length > 0 ? questionStats.reduce((s, q) => s + q.pValue, 0) / questionStats.length : 0;
        const easyQuestions = questionStats.filter(q => q.pValue >= 0.7).length;
        const moderateQuestions = questionStats.filter(q => q.pValue >= 0.3 && q.pValue < 0.7).length;
        const difficultQuestions = questionStats.filter(q => q.pValue < 0.3).length;

        return {
            totalStudents,
            completedAttempts: completedAttempts.length,
            avgScore: Math.round(avgScore * 100) / 100,
            avgPValue: Math.round(avgPValue * 100) / 100,
            easyQuestions,
            moderateQuestions,
            difficultQuestions,
            questionStats,
        };
    } catch (error) {
        return null;
    }
}

// --- Assignment Management ---
export async function assignStudentToQuiz(quizId: number, userId: number) {
    try {
        const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { success: false, error: "Unauthorized" };

        const existing = await db.select().from(cbtAssignments)
            .where(eq(cbtAssignments.quizId, quizId));
        if (existing.some(e => e.userId === userId)) {
            return { success: true }; // already assigned
        }

        await db.insert(cbtAssignments).values({ quizId, userId });
        revalidatePath(`/admin/cbt/editor`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeStudentFromQuiz(quizId: number, userId: number) {
    try {
        const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { success: false, error: "Unauthorized" };

        // We have to delete by both quizId and userId.
        // Drizzle-orm 'and' is imported via eq, and. Let's just fetch and delete by id.
        const existing = await db.select().from(cbtAssignments)
            .where(eq(cbtAssignments.quizId, quizId));
        const target = existing.find(e => e.userId === userId);
        
        if (target) {
            await db.delete(cbtAssignments).where(eq(cbtAssignments.id, target.id));
            revalidatePath(`/admin/cbt/editor`);
        }
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAssignedStudents(quizId: number) {
    try {
        const assignments = await db.select({
            id: cbtAssignments.id,
            userId: cbtAssignments.userId,
            email: users.email,
            name: users.name,
            matricNumber: users.matricNumber,
        }).from(cbtAssignments)
          .innerJoin(users, eq(cbtAssignments.userId, users.id))
          .where(eq(cbtAssignments.quizId, quizId));
        
        return { success: true, data: assignments };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function searchUsersForAssignment(query: string) {
    // simplified search for external/internal students
    try {
        const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { success: false, error: "Unauthorized" };

        const allUsers = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            matricNumber: users.matricNumber,
        }).from(users);

        const lowerQuery = query.toLowerCase();
        const filtered = allUsers.filter(u => 
            (u.email && u.email.toLowerCase().includes(lowerQuery)) ||
            (u.name && u.name.toLowerCase().includes(lowerQuery)) ||
            (u.matricNumber && u.matricNumber.toLowerCase().includes(lowerQuery))
        ).slice(0, 10);

        return { success: true, data: filtered };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleRequireAssignment(quizId: number, requireAssignment: boolean) {
    try {
        const allowed = await hasPermission("cbt.manage") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { success: false, error: "Unauthorized" };

        await db.update(cbtQuizzes)
            .set({ requireAssignment })
            .where(eq(cbtQuizzes.id, quizId));
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
