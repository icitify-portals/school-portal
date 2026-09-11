/**
 * CBT-2: One-time migration of legacy quizzes/cbtQuizzes into unifiedExams.
 *
 * Safety rules:
 * - Dry-run by default. Pass `execute: true` to write.
 * - Legacy tables are NEVER deleted or modified.
 * - Runs inside a DB transaction so partial writes roll back on error.
 * - Only runs when `CBT_UNIFIED` flag is enabled (caller responsibility).
 *
 * Usage:
 *   npx tsx src/services/migration/unifyCbt.ts           # dry run
 *   npx tsx src/services/migration/unifyCbt.ts --execute # real migration
 */
import { db } from "@/db/db";
import {
    quizzes,
    quizQuestions,
    quizAttempts,
    cbtQuizzes,
    cbtQuestions,
    cbtAttempts,
    cbtResponses,
    students,
    globalQuestionBanks,
    bankQuestions,
    unifiedExams,
    unifiedExamQuestions,
    unifiedExamAttempts,
    unifiedExamResponses,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { isFeatureEnabled } from "@/lib/feature-flags";

interface MigrationReport {
    dryRun: boolean;
    flagEnabled: boolean;
    examsCreated: number;
    banksCreated: number;
    bankQuestionsCreated: number;
    examQuestionsCreated: number;
    attemptsCreated: number;
    responsesCreated: number;
    skippedAttempts: number;
    skippedResponses: number;
    sourceCounts: {
        quizzes: number;
        quizQuestions: number;
        quizAttempts: number;
        cbtQuizzes: number;
        cbtQuestions: number;
        cbtAttempts: number;
        cbtResponses: number;
    };
}

function mapAttemptStatus(
    status: string | null
): typeof unifiedExamAttempts.$inferInsert["status"] {
    switch (status) {
        case "in_progress":
            return "in_progress";
        case "submitted":
        case "graded":
            return "completed";
        case "timed_out":
            return "timed_out";
        default:
            return "completed";
    }
}

export async function unifyCbt({
    dryRun = true,
    checkFlag = true,
}: { dryRun?: boolean; checkFlag?: boolean } = {}): Promise<MigrationReport> {
    const report: MigrationReport = {
        dryRun,
        flagEnabled: !checkFlag || isFeatureEnabled("CBT_UNIFIED"),
        examsCreated: 0,
        banksCreated: 0,
        bankQuestionsCreated: 0,
        examQuestionsCreated: 0,
        attemptsCreated: 0,
        responsesCreated: 0,
        skippedAttempts: 0,
        skippedResponses: 0,
        sourceCounts: {
            quizzes: 0,
            quizQuestions: 0,
            quizAttempts: 0,
            cbtQuizzes: 0,
            cbtQuestions: 0,
            cbtAttempts: 0,
            cbtResponses: 0,
        },
    };

    if (checkFlag && !report.flagEnabled) {
        console.warn("[unifyCbt] CBT_UNIFIED flag is disabled. Aborting.");
        return report;
    }

    // ── Load all legacy data ──
    const legacyQuizzes = await db.select().from(quizzes);
    const legacyQuizQuestions = await db.select().from(quizQuestions);
    const legacyQuizAttempts = await db.select().from(quizAttempts);

    const legacyCbtQuizzes = await db.select().from(cbtQuizzes);
    const legacyCbtQuestions = await db.select().from(cbtQuestions);
    const legacyCbtAttempts = await db.select().from(cbtAttempts);
    const legacyCbtResponses = await db.select().from(cbtResponses);

    report.sourceCounts = {
        quizzes: legacyQuizzes.length,
        quizQuestions: legacyQuizQuestions.length,
        quizAttempts: legacyQuizAttempts.length,
        cbtQuizzes: legacyCbtQuizzes.length,
        cbtQuestions: legacyCbtQuestions.length,
        cbtAttempts: legacyCbtAttempts.length,
        cbtResponses: legacyCbtResponses.length,
    };

    console.log("[unifyCbt] Source counts:", report.sourceCounts);
    if (dryRun) {
        console.log("[unifyCbt] Dry run — no writes performed.");
        return report;
    }

    // ── Build student -> user map for quizAttempts ──
    const studentIds = Array.from(
        new Set(legacyQuizAttempts.map((a) => a.studentId).filter(Boolean))
    ) as number[];
    const studentUserRows =
        studentIds.length > 0
            ? await db
                  .select({ id: students.id, userId: students.userId })
                  .from(students)
                  .where(inArray(students.id, studentIds))
            : [];
    const studentToUser = new Map(studentUserRows.map((s) => [s.id, s.userId]));

    await db.transaction(async (tx) => {
        // ═══════════════════════════════════════════════════════════
        // 1. Migrate legacy `quizzes` → unifiedExams + bankQuestions
        // ═══════════════════════════════════════════════════════════
        for (const quiz of legacyQuizzes) {
            const [examRes] = await tx.insert(unifiedExams).values({
                title: quiz.title,
                description: quiz.description,
                durationMinutes: quiz.timeLimitMinutes ?? 60,
                totalMarks: "100.00",
                passingScore: quiz.passingScore ? String(quiz.passingScore) : "50.00",
                contextType: "course",
                courseId: quiz.courseId,
                moduleId: quiz.moduleId,
                lessonId: quiz.lessonId,
                randomizeQuestions: quiz.randomizeQuestions ?? true,
                allowBacktrack: quiz.allowBacktrack ?? true,
                isActive: true,
                isPooled: quiz.isPooled ?? false,
                drawCount: quiz.drawCount,
                maxPoints: quiz.maxPoints,
                gradingStrategy: quiz.gradingStrategy ?? "absolute",
                proctoringEnabled: quiz.proctoringEnabled ?? false,
                examSlotId: quiz.slotId,
                availableFrom: quiz.availableFrom,
                availableUntil: quiz.availableUntil,
                visibilityRule: quiz.visibilityRule ?? "always",
                gracePeriodMinutes: quiz.gracePeriodMinutes ?? 0,
                includeInCa: quiz.includeInCa ?? false,
                caAveragingMethod: quiz.caAveragingMethod ?? "simple",
            });
            const examId = examRes.insertId;
            report.examsCreated++;

            const [bankRes] = await tx.insert(globalQuestionBanks).values({
                name: `Migrated from quiz: ${quiz.title}`,
                description: `Auto-migrated question bank for legacy quiz #${quiz.id}`,
            });
            const bankId = bankRes.insertId;
            report.banksCreated++;

            const questions = legacyQuizQuestions.filter((q) => q.quizId === quiz.id);
            const oldQuestionToNewUnifiedQuestion = new Map<number, number>();

            for (const q of questions) {
                const [bqRes] = await tx.insert(bankQuestions).values({
                    bankId,
                    questionText: q.questionText,
                    questionType: (q.type as any) ?? "multiple_choice",
                    options: q.options,
                    correctAnswer: q.correctAnswer ?? "",
                    points: q.points ? String(q.points) : "1.00",
                    explanation: q.explanation,
                    rubric: q.rubric,
                    aiGradingEnabled: q.aiGradingEnabled ?? false,
                    difficultyLevel: "medium",
                });
                const bankQuestionId = bqRes.insertId;
                report.bankQuestionsCreated++;

                const [ueqRes] = await tx.insert(unifiedExamQuestions).values({
                    examId,
                    bankQuestionId,
                    questionText: q.questionText,
                    questionType: (q.type as any) ?? "multiple_choice",
                    options: q.options,
                    correctAnswer: q.correctAnswer ?? "",
                    points: q.points ? String(q.points) : "1.00",
                    explanation: q.explanation,
                    rubric: q.rubric,
                    aiGradingEnabled: q.aiGradingEnabled ?? false,
                    displayOrder: q.id,
                });
                report.examQuestionsCreated++;
                oldQuestionToNewUnifiedQuestion.set(q.id, ueqRes.insertId);
            }

            // Migrate quizAttempts
            const attempts = legacyQuizAttempts.filter((a) => a.quizId === quiz.id);
            for (const attempt of attempts) {
                const userId = studentToUser.get(attempt.studentId);
                if (!userId) {
                    report.skippedAttempts++;
                    continue;
                }
                const [attemptRes] = await tx.insert(unifiedExamAttempts).values({
                    examId,
                    userId,
                    score: attempt.score ? String(attempt.score) : "0.00",
                    maxScore: attempt.maxScore ? String(attempt.maxScore) : "0.00",
                    passed: attempt.passed ?? false,
                    status: mapAttemptStatus(attempt.status),
                    submissionType: attempt.submissionType ?? "manual",
                    startTime: attempt.startedAt ?? new Date(),
                    endTime: attempt.completedAt,
                    mode: attempt.mode ?? "exam",
                    extraTimeMinutes: attempt.extraTimeMinutes ?? 0,
                    aiGradingStatus: attempt.aiGradingStatus ?? "none",
                    manualFeedback: attempt.manualFeedback,
                });
                report.attemptsCreated++;
            }
        }

        // ═══════════════════════════════════════════════════════════
        // 2. Migrate legacy `cbtQuizzes` → unifiedExams + bankQuestions
        // ═══════════════════════════════════════════════════════════
        for (const quiz of legacyCbtQuizzes) {
            const [examRes] = await tx.insert(unifiedExams).values({
                title: quiz.title,
                description: quiz.description,
                durationMinutes: quiz.durationMinutes ?? 60,
                totalMarks: quiz.totalMarks ?? "100.00",
                passingScore: "50.00",
                contextType: quiz.courseId ? "course" : "standalone",
                courseId: quiz.courseId,
                randomizeQuestions: quiz.randomizeQuestions ?? true,
                isActive: quiz.isActive ?? true,
                requireAssignment: quiz.requireAssignment ?? false,
            });
            const examId = examRes.insertId;
            report.examsCreated++;

            const [bankRes] = await tx.insert(globalQuestionBanks).values({
                name: `Migrated from CBT quiz: ${quiz.title}`,
                description: `Auto-migrated question bank for legacy CBT quiz #${quiz.id}`,
            });
            const bankId = bankRes.insertId;
            report.banksCreated++;

            const questions = legacyCbtQuestions.filter((q) => q.quizId === quiz.id);
            const oldQuestionToNewUnifiedQuestion = new Map<number, number>();

            for (const q of questions) {
                const [bqRes] = await tx.insert(bankQuestions).values({
                    bankId,
                    questionText: q.questionText,
                    questionType: (q.questionType as any) ?? "multiple_choice",
                    options: q.options,
                    correctAnswer: q.correctAnswer ?? "",
                    points: q.marks ?? "1.00",
                    explanation: q.explanation,
                    containsLatex: q.containsLatex ?? false,
                    difficultyLevel: "medium",
                });
                const bankQuestionId = bqRes.insertId;
                report.bankQuestionsCreated++;

                const [ueqRes] = await tx.insert(unifiedExamQuestions).values({
                    examId,
                    bankQuestionId,
                    questionText: q.questionText,
                    questionType: (q.questionType as any) ?? "multiple_choice",
                    options: q.options,
                    correctAnswer: q.correctAnswer ?? "",
                    points: q.marks ?? "1.00",
                    explanation: q.explanation,
                    containsLatex: q.containsLatex ?? false,
                    displayOrder: q.id,
                });
                report.examQuestionsCreated++;
                oldQuestionToNewUnifiedQuestion.set(q.id, ueqRes.insertId);
            }

            // Migrate cbtAttempts + cbtResponses
            const attempts = legacyCbtAttempts.filter((a) => a.quizId === quiz.id);
            const cbtAttemptToUnifiedAttempt = new Map<number, number>();

            for (const attempt of attempts) {
                if (!attempt.userId) {
                    report.skippedAttempts++;
                    continue;
                }
                const [attemptRes] = await tx.insert(unifiedExamAttempts).values({
                    examId,
                    userId: attempt.userId,
                    score: attempt.score ?? "0.00",
                    status: mapAttemptStatus(attempt.status),
                    startTime: attempt.startTime ?? new Date(),
                    endTime: attempt.endTime,
                    tabSwitches: attempt.tabSwitches ?? 0,
                    mode: "exam",
                });
                report.attemptsCreated++;
                cbtAttemptToUnifiedAttempt.set(attempt.id, attemptRes.insertId);
            }

            for (const response of legacyCbtResponses) {
                const newAttemptId = cbtAttemptToUnifiedAttempt.get(response.attemptId);
                const newQuestionId = oldQuestionToNewUnifiedQuestion.get(response.questionId);
                if (!newAttemptId || !newQuestionId) {
                    report.skippedResponses++;
                    continue;
                }
                await tx.insert(unifiedExamResponses).values({
                    attemptId: newAttemptId,
                    questionId: newQuestionId,
                    selectedAnswer: response.selectedAnswer,
                    isCorrect: response.isCorrect ?? false,
                    marksAwarded: response.marksAwarded ?? "0.00",
                });
                report.responsesCreated++;
            }
        }
    });

    console.log("[unifyCbt] Migration complete:", report);
    return report;
}

async function main() {
    const shouldExecute = process.argv.includes("--execute");
    const report = await unifyCbt({ dryRun: !shouldExecute });
    console.log("Report:", report);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((err) => {
        console.error("[unifyCbt] Failed:", err);
        process.exit(1);
    });
}
