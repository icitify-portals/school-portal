"use server";

import { db } from "@/db/db";
import { results, students, courses, enrollments, users } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function bulkUploadResults(data: any[], courseId: number, sessionId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        let successCount = 0;
        let errorCount = 0;

        for (const row of data) {
            // Normalise all keys: strip BOM (\uFEFF), trim whitespace, lower-case for matching
            const normRow: Record<string, any> = {};
            for (const [k, v] of Object.entries(row)) {
                const cleanKey = k.replace(/^\uFEFF/, '').trim();
                normRow[cleanKey] = v;
            }

            // Accept any sensible spelling of the matric-number column
            const matricNumber =
                normRow['Matric No'] ||
                normRow['matric_number'] ||
                normRow['matricNumber'] ||
                normRow['MatricNumber'] ||
                normRow['matric no'] ||
                normRow['MATRIC NO'] ||
                normRow['Matric Number'] ||
                normRow['matric number'] ||
                normRow['Matric_No'] ||
                normRow['matricNo'];

            if (!matricNumber) {
                errorCount++;
                continue;
            }

            // Find student by matric number
            const studentRecord = await db.select().from(students).where(eq(students.matricNumber, String(matricNumber).trim()));

            if (studentRecord.length === 0) {
                errorCount++;
                continue;
            }

            const studentId = studentRecord[0].id;

            // Accept any sensible spelling of the score columns
            const caScore  = parseFloat(normRow['CA Score']  || normRow['ca_score']  || normRow['caScore']  || normRow['CA']   || normRow['ca']   || '0');
            const examScore = parseFloat(normRow['Exam Score'] || normRow['exam_score'] || normRow['examScore'] || normRow['Exam'] || normRow['exam'] || '0');
            const totalScore = caScore + examScore;


            // Find the enrollment for this student, course, and session
            const enrollmentRecord = await db.select().from(enrollments).where(
                and(
                    eq(enrollments.studentId, studentId),
                    eq(enrollments.courseId, courseId),
                    eq(enrollments.sessionId, sessionId)
                )
            );

            if (enrollmentRecord.length === 0) {
                errorCount++;
                continue; // Student not enrolled in this course for this session
            }

            const enrollmentId = enrollmentRecord[0].id;

            // Check if result already exists for this enrollment
            const existing = await db.select().from(results).where(eq(results.enrollmentId, enrollmentId));

            if (existing.length > 0) {
                // Update existing
                await db.update(results).set({
                    caScore: caScore.toString(),
                    examScore: examScore.toString(),
                    totalScore: totalScore.toString(),
                    status: 'pending',
                    lastEditedBy: parseInt(session.user.id),
                    updatedAt: new Date()
                }).where(eq(results.id, existing[0].id));
            } else {
                // Insert new
                await db.insert(results).values({
                    enrollmentId,
                    caScore: caScore.toString(),
                    examScore: examScore.toString(),
                    totalScore: totalScore.toString(),
                    status: 'pending',
                    lastEditedBy: parseInt(session.user.id)
                });
            }
            successCount++;
        }

        revalidatePath("/admin/exams-records/upload");
        revalidatePath("/admin/exams-records/broadsheet");
        
        return { success: true, message: `Successfully processed ${successCount} records. ${errorCount > 0 ? 'Failed to find or match ' + errorCount + ' records.' : ''}` };
    } catch (error: any) {
        console.error("Bulk upload error:", error);
        return { success: false, error: error.message || "Failed to upload results" };
    }
}

export async function fetchCourseEnrollmentTemplate(courseId: number, sessionId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const enrolledStudents = await db.select({
            matricNumber: students.matricNumber,
            firstName: users.firstName,
            lastName: users.lastName,
            middleName: users.middleName
        })
        .from(enrollments)
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .where(
            and(
                eq(enrollments.courseId, courseId),
                eq(enrollments.sessionId, sessionId),
                eq(enrollments.status, 'approved')
            )
        );

        if (enrolledStudents.length === 0) {
            return { success: false, error: "No approved enrollments found for this course and session." };
        }

        // Format data for CSV
        const templateData = enrolledStudents.map(s => ({
            'Matric No': s.matricNumber,
            'Name': `${s.lastName || ''} ${s.firstName || ''} ${s.middleName || ''}`.trim(),
            'CA Score': '',
            'Exam Score': ''
        }));

        return { success: true, data: templateData };
    } catch (error: any) {
        console.error("Template generation error:", error);
        return { success: false, error: error.message || "Failed to generate template" };
    }
}
