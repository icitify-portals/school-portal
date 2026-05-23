import { db } from "@/db/db";
import { 
    studentCourseRegistrations, 
    courses, 
    courseDepartmentSettings, 
    students, 
    semesterSummaries,
    coursePrerequisites,
    resultMarks,
    gradePoints,
    users,
    courseRegistrationWaivers
} from "@/db/schema";
import { eq, and, inArray, sql, exists } from "drizzle-orm";

export class CourseRegistrationService {

    /**
     * Checks if a student has met all prerequisites for a list of courses,
     * while respecting active waivers granted by HODs/Deans.
     */
    static async validatePrerequisites(studentId: number, courseIds: number[]) {
        const failedPrerequisites: { courseId: number, code: string, message: string }[] = [];

        // Fetch all active waivers for this student
        const activeWaivers = await db.select({ courseId: courseRegistrationWaivers.courseId })
            .from(courseRegistrationWaivers)
            .where(eq(courseRegistrationWaivers.studentId, studentId));
        
        const waivedCourseIds = activeWaivers.map(w => w.courseId);

        for (const courseId of courseIds) {
            // Skip check if course is waived
            if (waivedCourseIds.includes(courseId)) continue;

            const prerequisites = await db.select({
                id: courses.id,
                code: courses.code,
                name: courses.name,
                minGrade: coursePrerequisites.minGrade
            })
            .from(coursePrerequisites)
            .innerJoin(courses, eq(coursePrerequisites.prerequisiteId, courses.id))
            .where(eq(coursePrerequisites.courseId, courseId));

            for (const pre of prerequisites) {
                const record = await db.select()
                    .from(resultMarks)
                    .where(and(
                        eq(resultMarks.studentId, studentId),
                        eq(resultMarks.courseId, pre.id)
                    ))
                    .limit(1);

                if (!record[0] || (record[0] as any).grade === 'F') {
                    failedPrerequisites.push({
                        courseId,
                        code: pre.code,
                        message: `${pre.code} is required for this course.`
                    });
                }
            }
        }

        return failedPrerequisites;
    }

    /**
     * Validates and submits course registration with prerequisite and waiver checks.
     */
    static async submitRegistration(data: {
        studentId: number,
        sessionId: number,
        semester: '1' | '2',
        courseIds: number[]
    }) {
        // 1. Prerequisite & Waiver Validation
        const prerequisiteErrors = await this.validatePrerequisites(data.studentId, data.courseIds);
        if (prerequisiteErrors.length > 0) {
            throw new Error(`Prerequisite Failure: ${prerequisiteErrors.map(e => e.message).join(' ')}`);
        }

        // 2. Fetch Waivers to mark entries correctly
        const activeWaivers = await db.select({ courseId: courseRegistrationWaivers.courseId })
            .from(courseRegistrationWaivers)
            .where(eq(courseRegistrationWaivers.studentId, data.studentId));
        const waivedCourseIds = activeWaivers.map(w => w.courseId);

        // 3. Credit Unit Validation
        const selectedCourses = await db.select({ units: courses.creditUnits })
            .from(courses)
            .where(inArray(courses.id, data.courseIds));
        
        const totalUnits = selectedCourses.reduce((sum, c) => sum + (c.units || 0), 0);
        
        if (totalUnits < 15 || totalUnits > 24) {
            throw new Error(`Invalid credit units: ${totalUnits}. Allowed range: 15-24 units.`);
        }

        return await db.transaction(async (tx) => {
            await tx.delete(studentCourseRegistrations).where(and(
                eq(studentCourseRegistrations.studentId, data.studentId),
                eq(studentCourseRegistrations.sessionId, data.sessionId),
                eq(studentCourseRegistrations.semester, data.semester),
                eq(studentCourseRegistrations.advisorStatus, 'pending')
            ));

            const registrationEntries = data.courseIds.map(courseId => ({
                studentId: data.studentId,
                courseId: courseId,
                sessionId: data.sessionId,
                semester: data.semester,
                isWaiver: waivedCourseIds.includes(courseId),
                advisorStatus: 'pending' as const,
                hodStatus: 'pending' as const,
                finalStatus: 'pending' as const
            }));

            await tx.insert(studentCourseRegistrations).values(registrationEntries);

            await tx.insert(semesterSummaries).values({
                studentId: data.studentId,
                sessionId: data.sessionId,
                semester: data.semester,
                tcr: totalUnits
            }).onDuplicateKeyUpdate({ set: { tcr: totalUnits } });

            return { success: true, totalUnits };
        });
    }

    /**
     * Grants a course prerequisite waiver to a student.
     */
    static async grantWaiver(data: {
        studentId: number,
        courseId: number,
        grantedBy: number,
        reason: string
    }) {
        return await db.insert(courseRegistrationWaivers).values({
            studentId: data.studentId,
            courseId: data.courseId,
            grantedBy: data.grantedBy,
            reason: data.reason
        });
    }
}
