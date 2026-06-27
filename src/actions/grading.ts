"use server";

import { db } from "@/db/db";
import {
    gradingConfigurations,
    results,
    enrollments,
    academicSessions,
    semesterSummaries,
    gradingSystems,
    gradePoints,
    degreeClassifications,
    gradingSystemSessions,
    courses,
    students,
    jambCandidates,
    users,
    academicCarryOvers,
} from "@/db/schema";
import { NotificationService } from "@/services/NotificationService";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { GradingService } from "@/services/GradingService";
import { auth } from "@/auth";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function setupGradingConfig(courseId: number, sessionId: number, configs: {
    name: string;
    type: 'assignment' | 'quiz' | 'attendance' | 'manual' | 'exam';
    linkedId?: number;
    maxMarks: number;
    weight: number;
    order: number;
}[]) {
    try {
        await db.delete(gradingConfigurations).where(and(
            eq(gradingConfigurations.courseId, courseId),
            eq(gradingConfigurations.sessionId, sessionId)
        ));

        // @ts-ignore
        await db.insert(gradingConfigurations).values(configs.map(c => ({
            ...c,
            courseId,
            sessionId
        })));

        revalidatePath(`/staff/courses/${courseId}/grading`);
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function submitExamScores(sessionId: number, scores: {
    enrollmentId: number;
    caScore: number;
    examScore: number;
    studentId: number;
    courseId: number;
}[]) {
    try {
        for (const entry of scores) {
            const [resultRecord] = await db.select().from(results).where(eq(results.enrollmentId, entry.enrollmentId)).limit(1);
            const isProrated = resultRecord?.isProrated || false;

            let totalScore = entry.caScore + entry.examScore;
            
            if (isProrated) {
                // If prorated, we should ensure the score is scaled correctly.
                // However, since caScore passed here is already scaled by calculateCA (in the UI/Service),
                // and examScore is absolute, we need to know the weights to scale the total if Exam was the ONLY thing done.
                // Or if CA was done but Exam missed.
                // We'll rely on GradingService to provide a final scaled total.
                totalScore = await GradingService.calculateFinalScaledScore(entry.studentId, entry.courseId, sessionId, entry.caScore, entry.examScore);
            }

            const gsId = await GradingService.resolveGradingSystem(entry.studentId, sessionId);
            const { grade, point } = await GradingService.computeGrade(totalScore, gsId);

            const [existing] = await db.select().from(results).where(eq(results.enrollmentId, entry.enrollmentId)).limit(1);

            if (existing) {
                await db.update(results).set({
                    caScore: entry.caScore.toString(),
                    examScore: entry.examScore.toString(),
                    totalScore: totalScore.toString(),
                    grade,
                    gradePoint: point.toString()
                }).where(eq(results.id, existing.id));
            } else {
                await db.insert(results).values({
                    enrollmentId: entry.enrollmentId,
                    caScore: entry.caScore.toString(),
                    examScore: entry.examScore.toString(),
                    totalScore: totalScore.toString(),
                    grade,
                    gradePoint: point.toString()
                });
            }
        }

        revalidatePath(`/staff/grading`);
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function processSemesterResults(studentId: number, sessionId: number, semester: '1' | '2') {
    try {
        const res = await GradingService.summarizeSemester(studentId, sessionId, semester);
        return { success: true, ...res };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function publishCourseResults(courseId: number, sessionId: number, semester: '1' | '2') {
    const allowed = await hasPermission("academic.results.approve") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to publish course results" };

    try {
        const [academicSession] = await db.select().from(academicSessions).where(eq(academicSessions.id, sessionId)).limit(1);
        if (!academicSession) throw new Error("Session not found");

        const studentEnrollments = await db.select({
            id: enrollments.id,
            studentId: enrollments.studentId,
            courseCode: courses.code,
            studentName: users.name,
            phone: jambCandidates.phone,
        })
            .from(enrollments)
            .leftJoin(courses, eq(enrollments.courseId, courses.id))
            .leftJoin(students, eq(enrollments.studentId, students.id))
            .leftJoin(users, eq(students.userId, users.id))
            .leftJoin(jambCandidates, eq(users.id, jambCandidates.claimedUserId))
            .where(and(
                eq(enrollments.courseId, courseId),
                eq(enrollments.academicYear, academicSession.name),
                eq(enrollments.semester, parseInt(semester))
            ));

        for (const enr of studentEnrollments) {
            await db.update(results)
                .set({ isApproved: true })
                .where(eq(results.enrollmentId, enr.id));

            await GradingService.summarizeSemester(enr.studentId as number, sessionId, semester as '1' | '2');

            // --- Carry Over Logic ---
            const [finalResult] = await db.select().from(results).where(eq(results.enrollmentId, enr.id)).limit(1);
            if (finalResult && enr.courseCode) { // Ensure course exists
                if (finalResult.grade === 'F') {
                    // Check if already a carry over
                    const [existing] = await db.select().from(academicCarryOvers).where(and(
                        eq(academicCarryOvers.studentId, enr.studentId as number),
                        eq(academicCarryOvers.courseId, courseId),
                        eq(academicCarryOvers.status, 'pending')
                    )).limit(1);

                    if (!existing) {
                        await db.insert(academicCarryOvers).values({
                            studentId: enr.studentId as number,
                            courseId: courseId,
                            failedSessionId: sessionId,
                            semester: semester as '1' | '2',
                            status: 'pending'
                        });
                    }
                } else if (finalResult.grade && finalResult.grade !== 'F') {
                    // Cleared a carry over
                    await db.update(academicCarryOvers)
                        .set({ status: 'cleared' })
                        .where(and(
                            eq(academicCarryOvers.studentId, enr.studentId as number),
                            eq(academicCarryOvers.courseId, courseId),
                            eq(academicCarryOvers.status, 'registered') // Or pending
                        ));
                }
            }
            // ------------------------

            // Send WhatsApp Alert
            if (enr.phone) {
                try {
                    await NotificationService.sendResultAlert(
                        enr.phone,
                        enr.studentName || "Student",
                        enr.courseCode || "Unknown Course",
                        semester === '1' ? "First" : "Second"
                    );
                } catch (err) {
                    console.error(`Failed to send result alert to ${enr.studentName}:`, err);
                }
            }
        }

        revalidatePath(`/staff/grading`);
        revalidatePath(`/results`);
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function recalculateStudentCGPA(studentId: number) {
    try {
        const summaries = await db.select().from(semesterSummaries)
            .where(eq(semesterSummaries.studentId, studentId))
            .orderBy(asc(semesterSummaries.sessionId), asc(semesterSummaries.semester));

        for (const s of summaries) {
            await GradingService.summarizeSemester(studentId, s.sessionId, s.semester as '1' | '2');
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getGradingSystems() {
    try {
        const systems = await db.select().from(gradingSystems);
        const allPoints = await db.select().from(gradePoints);
        const allClasses = await db.select().from(degreeClassifications);
        const allSessions = await db.select().from(gradingSystemSessions);

        return systems.map(s => ({
            ...s,
            points: allPoints.filter(p => p.gradingSystemId === s.id),
            classifications: allClasses.filter(c => c.gradingSystemId === s.id),
            sessions: allSessions.filter(se => se.gradingSystemId === s.id)
        }));
    } catch (error) {
        console.error("Error fetching grading systems:", error);
        return [];
    }
}

export async function getGradingSystemForStudent(studentId: number) {
    try {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
        if (!session) return null;

        const gsId = await GradingService.resolveGradingSystem(studentId, session.id);

        const [system] = await db.select().from(gradingSystems).where(eq(gradingSystems.id, gsId)).limit(1);
        if (!system) return null;

        const points = await db.select().from(gradePoints).where(eq(gradePoints.gradingSystemId, system.id)).orderBy(desc(gradePoints.minMark));
        const classifications = await db.select().from(degreeClassifications).where(eq(degreeClassifications.gradingSystemId, system.id));

        return {
            ...system,
            points: points.map(p => ({ ...p, points: parseFloat(p.points.toString()) })),
            classifications: classifications.map(c => ({ ...c, minCgpa: parseFloat(c.minCgpa.toString()), maxCgpa: parseFloat(c.maxCgpa.toString()) }))
        };
    } catch (error) {
        console.error("Error in getGradingSystemForStudent:", error);
        return null;
    }
}

export async function createGradingSystem(data: { name: string; scale: number; description?: string }) {
    const allowed = await hasPermission("academic.grading.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to create grading system" };

    try {
        await db.insert(gradingSystems).values({
            name: data.name,
            scale: data.scale,
            description: data.description,
            isDefault: false
        });
        revalidatePath("/admin/settings/grading");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function setGradePoints(systemId: number, points: any[]) {
    const allowed = await hasPermission("academic.grading.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to configure grade points" };

    try {
        await db.transaction(async (tx) => {
            await tx.delete(gradePoints).where(eq(gradePoints.gradingSystemId, systemId));
            for (const p of points) {
                await tx.insert(gradePoints).values({
                    gradingSystemId: systemId,
                    letterGrade: p.letterGrade,
                    minMark: p.minMark,
                    maxMark: p.maxMark,
                    points: p.points.toString(),
                    description: p.description
                });
            }
        });
        revalidatePath("/admin/settings/grading");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function setDegreeClassifications(systemId: number, classifications: any[]) {
    const allowed = await hasPermission("academic.grading.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to configure degree classifications" };

    try {
        await db.transaction(async (tx) => {
            await tx.delete(degreeClassifications).where(eq(degreeClassifications.gradingSystemId, systemId));
            for (const c of classifications) {
                await tx.insert(degreeClassifications).values({
                    gradingSystemId: systemId,
                    name: c.name,
                    minCgpa: c.minCgpa.toString(),
                    maxCgpa: c.maxCgpa.toString()
                });
            }
        });
        revalidatePath("/admin/settings/grading");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function assignGradingSystemToSession(sessionId: number, systemId: number) {
    const allowed = await hasPermission("academic.grading.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to assign grading system to session" };

    try {
        await db.delete(gradingSystemSessions).where(eq(gradingSystemSessions.sessionId, sessionId));
        await db.insert(gradingSystemSessions).values({
            sessionId,
            gradingSystemId: systemId
        });
        revalidatePath("/admin/settings/grading");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function seedGradingSystem() {
    const allowed = await hasPermission("academic.grading.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to seed grading system" };

    try {
        await db.transaction(async (tx) => {
            const [res] = await tx.insert(gradingSystems).values({
                name: "NUC 4.0 Standard",
                scale: 4,
                description: "National Universities Commission Standard 4.0 Scale",
                isDefault: true
            });
            const systemId = res.insertId;

            const standardPoints = [
                { letterGrade: 'A', minMark: 70, maxMark: 100, points: 4.0, description: 'Excellent' },
                { letterGrade: 'B', minMark: 60, maxMark: 69, points: 3.0, description: 'Very Good' },
                { letterGrade: 'C', minMark: 50, maxMark: 59, points: 2.0, description: 'Good' },
                { letterGrade: 'D', minMark: 45, maxMark: 49, points: 1.0, description: 'Fair' },
                { letterGrade: 'F', minMark: 0, maxMark: 44, points: 0.0, description: 'Fail' },
            ];

            for (const p of standardPoints) {
                await tx.insert(gradePoints).values({
                    gradingSystemId: systemId,
                    ...p,
                    points: p.points.toString()
                });
            }

            const standardClasses = [
                { name: 'First Class Honours', minCgpa: 3.50, maxCgpa: 4.00 },
                { name: 'Second Class Upper Division', minCgpa: 3.00, maxCgpa: 3.49 },
                { name: 'Second Class Lower Division', minCgpa: 2.00, maxCgpa: 2.99 },
                { name: 'Third Class Honours', minCgpa: 1.00, maxCgpa: 1.99 },
                { name: 'Pass', minCgpa: 0.00, maxCgpa: 0.99 },
            ];

            for (const c of standardClasses) {
                await tx.insert(degreeClassifications).values({
                    gradingSystemId: systemId,
                    ...c,
                    minCgpa: c.minCgpa.toString(),
                    maxCgpa: c.maxCgpa.toString()
                });
            }
        });

        revalidatePath("/admin/settings/grading");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export type AIProvider = 'openai' | 'gemini' | 'deepseek';

export async function bulkGradeAttempt(quizId: number, providerName: AIProvider) {
    try {
        const { getAIProvider } = await import("@/lib/ai-service");
        const { finalizeAttempt } = await import("./cbt");
        const { quizAttempts, quizResponses, quizQuestions, quizzes } = await import("@/db/schema");
        const { eq, and } = await import("drizzle-orm");

        const provider = getAIProvider(providerName);

        // 1. Fetch all submitted attempts for this quiz
        const attempts = await db.select().from(quizAttempts).where(
            and(
                eq(quizAttempts.quizId, quizId),
                eq(quizAttempts.status, 'submitted')
            )
        );

        for (const attempt of attempts) {
            // 2. Fetch essay questions and responses
            const responses = await db.select({
                res: quizResponses,
                q: quizQuestions
            })
                .from(quizResponses)
                .innerJoin(quizQuestions, eq(quizResponses.questionId, quizQuestions.id))
                .where(
                    and(
                        eq(quizResponses.attemptId, attempt.id),
                        eq(quizQuestions.type, 'essay')
                    )
                );

            for (const { res, q } of responses) {
                if (res.score !== null) continue; // Already graded

                const prompt = `
                Grade this student essay response based on the following rubric.
                
                Question: ${q.questionText}
                Rubric: ${q.rubric || "Grade based on clarity, accuracy, and completeness."}
                Student Answer: ${res.studentAnswer}
                Max Points: ${q.points || 1}

                Return a JSON object with:
                - score (number)
                - feedback (string, max 50 words)
                `;

                const result = await provider.analyzeJson(prompt);

                await db.update(quizResponses)
                    .set({
                        score: result.score || 0,
                        feedback: result.feedback || "AI Graded"
                    })
                    .where(eq(quizResponses.id, res.id));
            }

            // 3. Finalize total score
            await finalizeAttempt(attempt.id);
        }

        revalidatePath(`/admin/cbt/results/${quizId}`);
        return { success: true };
    } catch (error) {
        console.error("Bulk Grade Error:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function toggleProration(enrollmentIds: number[], isProrated: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.transaction(async (tx) => {
            for (const id of enrollmentIds) {
                const [existing] = await tx.select().from(results).where(eq(results.enrollmentId, id)).limit(1);
                if (existing) {
                    await tx.update(results).set({ isProrated }).where(eq(results.id, existing.id));
                } else {
                    await tx.insert(results).values({ enrollmentId: id, isProrated });
                }
            }
        });

        revalidatePath("/staff/grading");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Fetch students for grading with their existing scores
 */
export async function getStudentsForSubjectGrading(courseId: number, sessionId: number, semester: '1' | '2' | '3', groupId?: number) {
    const studentList = await db.select({
        studentId: students.id,
        enrollmentId: enrollments.id,
        name: sql<string>`concat(${students.lastName}, ' ', ${students.firstName})`,
        matricNumber: students.matricNumber,
        autoCA: sql<number>`0`, // Placeholder for automated CA logic if needed
        manualCA: sql<number>`CAST(${results.caScore} AS DECIMAL(5,2))`,
        examScore: sql<number>`CAST(${results.examScore} AS DECIMAL(5,2))`,
        total: sql<number>`CAST(${results.totalScore} AS DECIMAL(5,2))`,
        grade: results.grade,
        isProrated: results.isProrated
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .leftJoin(results, eq(enrollments.id, results.enrollmentId))
    .where(and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.sessionId, sessionId),
        eq(enrollments.semester, parseInt(semester)),
        groupId ? eq(students.groupId, groupId) : undefined
    ));

    return studentList.map(s => ({
        ...s,
        manualCA: s.manualCA || 0,
        examScore: s.examScore || 0,
        total: s.total || 0,
        grade: s.grade || "",
        isProrated: s.isProrated || false
    }));
}
