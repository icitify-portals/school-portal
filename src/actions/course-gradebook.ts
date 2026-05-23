"use server";

import { db } from "@/db/db";
import {
    students,
    users,
    results,
    enrollments,
    assignments,
    assignmentSubmissions,
    quizzes,
    studentProgress,
    courses,
    academicSessions
} from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NotificationService } from "@/services/NotificationService";

export async function getGradebookData(courseId: number, sessionId: number) {
    try {
        // 1. Fetch all students enrolled in this course for this session
        const enrolledStudents = await db.select({
            studentId: students.id,
            userId: students.userId,
            fullName: users.name,
            regNo: students.matricNumber,
            enrollmentId: enrollments.id
        })
            .from(enrollments)
            .innerJoin(students, eq(enrollments.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .where(and(
                eq(enrollments.courseId, courseId),
                eq(enrollments.sessionId, sessionId)
            ));

        if (enrolledStudents.length === 0) return { success: true, data: [] };

        // 2. Fetch all assignments and quizzes for this course to calculate CA
        const courseAssignments = await db.select().from(assignments).where(eq(assignments.courseId, courseId));
        const courseQuizzes = await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));

        // 3. Fetch all submissions for these students
        const submissions = await db.select().from(assignmentSubmissions)
            .where(sql`${assignmentSubmissions.assignmentId} IN (
                ${sql.join(courseAssignments.map(a => a.id).concat([0]), sql`, `)}
            )`);

        // 4. Fetch results (Final Grades / Exams)
        const currentResults = await db.select({
            id: results.id,
            enrollmentId: results.enrollmentId,
            caScore: results.caScore,
            examScore: results.examScore,
            totalScore: results.totalScore,
            grade: results.grade,
            status: results.status,
            studentId: enrollments.studentId
        })
            .from(results)
            .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
            .where(and(
                eq(enrollments.courseId, courseId),
                eq(enrollments.sessionId, sessionId)
            ));

        // 5. Structure the data
        const gradebook = enrolledStudents.map(student => {
            const studentSubmissions = submissions.filter(s => s.studentId === student.studentId);
            const studentResult = currentResults.find(r => r.studentId === student.studentId);

            // Simple CA Calculation (Sum of assignment scores)
            // In a more complex system, we'd use weights.
            const caScore = studentSubmissions.reduce((acc, s) => acc + (s.score || 0), 0);
            const examScore = parseFloat(studentResult?.examScore || "0");
            const resultTotalScore = parseFloat(studentResult?.totalScore || "0");

            return {
                ...student,
                caScore,
                examScore,
                totalScore: resultTotalScore || (caScore + examScore),
                grade: studentResult?.grade || 'N/A',
                status: studentResult?.status || 'pending'
            };
        });

        return { success: true, data: gradebook };
    } catch (error) {
        console.error("Failed to fetch gradebook data:", error);
        return { success: false, error: "Failed to load gradebook" };
    }
}

export async function updateGradebookScores(courseId: number, sessionId: number, updates: { studentId: number; examScore?: number; caScore?: number }[]) {
    try {
        await db.transaction(async (tx) => {
            for (const update of updates) {
                const total = (update.caScore || 0) + (update.examScore || 0);

                // Determine Grade (Mock logic - should be configurable)
                let grade = 'F';
                if (total >= 70) grade = 'A';
                else if (total >= 60) grade = 'B';
                else if (total >= 50) grade = 'C';
                else if (total >= 45) grade = 'D';
                else if (total >= 40) grade = 'E';

                const [existing] = await tx.select().from(results)
                    .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
                    .where(and(
                        eq(enrollments.studentId, update.studentId),
                        eq(enrollments.courseId, courseId),
                        eq(enrollments.sessionId, sessionId)
                    )).limit(1);

                if (existing) {
                    await tx.update(results).set({
                        caScore: update.caScore?.toString() ?? existing.results.caScore,
                        examScore: update.examScore?.toString() ?? existing.results.examScore,
                        totalScore: total.toString(),
                        grade,
                        status: 'published'
                    }).where(eq(results.id, existing.results.id));
                } else {
                    // Find enrollment first
                    const [enrollment] = await tx.select({ id: enrollments.id })
                        .from(enrollments)
                        .where(and(
                            eq(enrollments.studentId, update.studentId),
                            eq(enrollments.courseId, courseId),
                            eq(enrollments.sessionId, sessionId)
                        )).limit(1);

                    if (enrollment) {
                        await tx.insert(results).values({
                            enrollmentId: enrollment.id,
                            caScore: (update.caScore || 0).toString(),
                            examScore: (update.examScore || 0).toString(),
                            totalScore: total.toString(),
                            grade,
                            status: 'published'
                        });
                    }
                }
            }
        });

        // 2. Fetch course details for the notification
        const [course] = await db.select({ name: courses.name, code: courses.code })
            .from(courses).where(eq(courses.id, courseId)).limit(1);

        // 3. Notify all updated students (Asynchronously)
        if (course) {
            const studentIds = updates.map(u => u.studentId);
            const userMappings = await db.select({ studentId: students.id, userId: students.userId })
                .from(students).where(inArray(students.id, studentIds));

            for (const mapping of userMappings) {
                if (mapping.userId) {
                    NotificationService.notifyUser(mapping.userId, {
                        title: "New Result Published",
                        message: `Your result for ${course.code} - ${course.name} has been published. Log in to your portal to view your grade.`,
                        type: 'success',
                        channels: ['toast', 'email', 'push']
                    }).catch(err => console.error(`Failed to notify user ${mapping.userId} about results:`, err));
                }
            }
        }

        revalidatePath(`/staff/courses/${courseId}/gradebook`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update gradebook scores:", error);
        return { success: false, error: "Failed to save grades" };
    }
}
