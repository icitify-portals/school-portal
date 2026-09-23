import { db } from "@/db/db";
import {
    gradingSystems,
    gradePoints,
    gradingSystemSessions,
    enrollments,
    results,
    students,
    users,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class GradingService {

    /**
     * Returns the list of enrolled students for a course with their current scores.
     * Used by the /staff/courses/[courseId]/grading page to populate ScoreEntry.
     */
    static async getCourseGrades(courseId: number, sessionId: number): Promise<{
        studentId: number;
        enrollmentId: number;
        name: string;
        matricNumber: string | null;
        autoCA: number;
        manualCA: number;
        examScore: number;
        total: number;
        grade: string;
        isProrated: boolean;
    }[]> {
        // Fetch all approved enrollments for this course + session
        const enrolled = await db
            .select({
                enrollmentId: enrollments.id,
                studentId: enrollments.studentId,
                studentName: users.name,
                matricNumber: students.matricNumber,
                caScore: results.caScore,
                examScore: results.examScore,
                totalScore: results.totalScore,
                grade: results.grade,
                isProrated: results.isProrated,
            })
            .from(enrollments)
            .innerJoin(students, eq(students.id, enrollments.studentId))
            .innerJoin(users, eq(users.id, students.userId))
            .leftJoin(results, eq(results.enrollmentId, enrollments.id))
            .where(
                and(
                    eq(enrollments.courseId, courseId),
                    eq(enrollments.sessionId, sessionId),
                )
            );

        return enrolled.map((row) => {
            const caScore = parseFloat(row.caScore?.toString() ?? '0') || 0;
            const examScore = parseFloat(row.examScore?.toString() ?? '0') || 0;
            const total = parseFloat(row.totalScore?.toString() ?? '0') || (caScore + examScore);
            return {
                studentId: row.studentId!,
                enrollmentId: row.enrollmentId,
                name: row.studentName ?? 'Unknown Student',
                matricNumber: row.matricNumber ?? null,
                autoCA: 0,         // auto-CA from LMS activities — not computed here
                manualCA: caScore, // stored CA score as manual CA
                examScore: examScore,
                total: total,
                grade: row.grade ?? '—',
                isProrated: row.isProrated ?? false,
            };
        });
    }

    /**
     * Dynamically calculates the Grade and Remark based on the system's grading rubrics.
     * Maps to Result::grade and Result::remark in the Rust system.
     */
    static async getGradeAndRemark(
        score: number, 
        levelId?: string | number, 
        context: string = "exam", 
        branchId?: number, 
        sessionId?: number
    ): Promise<{ grade: string, remark: string, gradePoint: number }> {
        
        let gradingSystemIdToUse: number | null = null;

        // In a fully dynamic system, we look up the specific grading system 
        // assigned to the session, branch, or class level.
        if (sessionId) {
            const activeSystem = await db.select().from(gradingSystemSessions)
                .where(eq(gradingSystemSessions.sessionId, sessionId))
                .limit(1);
            if (activeSystem.length > 0) {
                gradingSystemIdToUse = activeSystem[0].gradingSystemId;
            }
        }

        // Fallback to default grading system if none mapped specifically
        if (!gradingSystemIdToUse) {
            const defaultSystem = await db.select().from(gradingSystems)
                .where(eq(gradingSystems.isDefault, true))
                .limit(1);
            if (defaultSystem.length > 0) {
                gradingSystemIdToUse = defaultSystem[0].id;
            } else {
                // Hard fallback if database is empty
                return this.getFallbackGrade(score);
            }
        }

        // Fetch Grade Points configured for this Grading System
        const points = await db.select().from(gradePoints)
            .where(eq(gradePoints.gradingSystemId, gradingSystemIdToUse));

        // Math mapping
        for (const pt of points) {
            if (score >= pt.minMark && score <= pt.maxMark) {
                return {
                    grade: pt.letterGrade,
                    remark: pt.description || "Satisfactory", // description acts as the context-aware Remark
                    gradePoint: parseFloat(pt.points?.toString() || '0')
                };
            }
        }

        // If score is somehow out of bounds (e.g. over 100 or negative)
        return { grade: "N/A", remark: "Invalid Score Range", gradePoint: 0 };
    }

    /**
     * Mathematical fallback if the database grading systems are not fully seeded yet.
     */
    private static getFallbackGrade(score: number): { grade: string, remark: string, gradePoint: number } {
        if (score >= 75) return { grade: "A", remark: "Excellent", gradePoint: 4.0 };
        if (score >= 70) return { grade: "AB", remark: "Very Good", gradePoint: 3.5 };
        if (score >= 65) return { grade: "B", remark: "Good", gradePoint: 3.25 };
        if (score >= 60) return { grade: "BC", remark: "Above Average", gradePoint: 3.0 };
        if (score >= 55) return { grade: "C", remark: "Average", gradePoint: 2.75 };
        if (score >= 50) return { grade: "CD", remark: "Below Average", gradePoint: 2.5 };
        if (score >= 45) return { grade: "D", remark: "Pass", gradePoint: 2.25 };
        if (score >= 40) return { grade: "E", remark: "Poor", gradePoint: 2.0 };
        return { grade: "F", remark: "Fail", gradePoint: 0.0 };
    }
}
