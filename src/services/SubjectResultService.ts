import { db } from "@/db/db";
import { results, enrollments, students, resultAuditLogs, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { GradingService } from "./GradingService";

export class SubjectResultService {
    
    /**
     * Implements 'save_subject_edit' from Rust.
     * Saves bulk scores for a subject in a specific class cohort.
     */
    static async saveSubjectEdit(
        classCode: string, 
        division: string, 
        term: number, 
        sessionId: number, 
        subjectId: number, 
        teacherId: number, 
        resultData: Record<string, { ca: number, exam: number }>,
        branchId?: number
    ) {
        console.log(`[SUBJECT_EDIT] Saving scores for Subject:${subjectId} in Class:${classCode}-${division}`);

        // 1. Resolve Course and Level
        const [course] = await db.select().from(courses).where(eq(courses.id, subjectId)).limit(1);
        if (!course) throw new Error("Subject not found");

        const updatedCount = 0;

        for (const [admissionNumber, scores] of Object.entries(resultData)) {
            // Find student and enrollment
            const [enrollment] = await db.select({
                id: enrollments.id,
                studentId: enrollments.studentId,
                resultId: results.id,
                oldCa: results.caScore,
                oldExam: results.examScore,
                oldTotal: results.totalScore
            })
            .from(enrollments)
            .innerJoin(students, eq(enrollments.studentId, students.id))
            .leftJoin(results, eq(enrollments.id, results.enrollmentId))
            .where(and(
                eq(students.admissionNumber, admissionNumber),
                eq(enrollments.courseId, subjectId),
                eq(enrollments.semester, term.toString() as any)
            ))
            .limit(1);

            if (!enrollment) {
                console.warn(`[SUBJECT_EDIT] No enrollment found for student ${admissionNumber}`);
                continue;
            }

            const total = scores.ca + scores.exam;
            const { grade, remark } = await GradingService.getGradeAndRemark(total, branchId);

            if (enrollment.resultId) {
                // Update existing result
                await db.update(results)
                    .set({
                        caScore: scores.ca.toFixed(2),
                        examScore: scores.exam.toFixed(2),
                        totalScore: total.toFixed(2),
                        grade,
                        lastEditedBy: teacherId,
                        lastEditedAt: new Date()
                    })
                    .where(eq(results.id, enrollment.resultId));

                // Log audit
                await db.insert(resultAuditLogs).values({
                    resultId: enrollment.resultId,
                    editorId: teacherId,
                    oldCaScore: enrollment.oldCa,
                    newCaScore: scores.ca.toFixed(2),
                    oldExamScore: enrollment.oldExam,
                    newExamScore: scores.exam.toFixed(2),
                    oldTotalScore: enrollment.oldTotal,
                    newTotalScore: total.toFixed(2),
                    reason: "Bulk subject edit by teacher"
                });
            } else {
                // Create new result
                await db.insert(results).values({
                    enrollmentId: enrollment.id,
                    caScore: scores.ca.toFixed(2),
                    examScore: scores.exam.toFixed(2),
                    totalScore: total.toFixed(2),
                    grade,
                    lastEditedBy: teacherId,
                    lastEditedAt: new Date()
                });
            }
        }

        return { success: true };
    }
}
