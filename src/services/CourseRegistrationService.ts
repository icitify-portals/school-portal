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
     * Retrieves all available courses for a student based on their Department, Level, and Semester.
     * ND 1 students see ND 1 courses, ND 2 students see ND 2 courses + eligible carry-overs/electives.
     */
    static async getAvailableCourses(studentId: number, semester: '1' | '2') {
        const studentRecord = await db.select({
            id: students.id,
            departmentId: students.departmentId,
            level: students.level
        })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);

        if (!studentRecord.length) return [];
        const student = studentRecord[0];
        const studentLevel = student.level || 100;
        const studentDeptId = student.departmentId;

        let available = await db.select({
            id: courses.id,
            name: courses.name,
            code: courses.code,
            units: courses.creditUnits,
            status: courseDepartmentSettings.status,
            isUniversityRequired: courses.isUniversityRequired,
            capacity: (courseDepartmentSettings as any).capacity,
            enrolledCount: (courseDepartmentSettings as any).enrolledCount,
        })
        .from(courses)
        .innerJoin(courseDepartmentSettings, eq(courses.id, courseDepartmentSettings.courseId))
        .where(and(
            eq(courseDepartmentSettings.semester, semester),
            studentDeptId ? eq(courseDepartmentSettings.deptId, studentDeptId) : sql`1=1`,
            sql`(${courseDepartmentSettings.level} = ${studentLevel} OR ${courseDepartmentSettings.level} <= ${studentLevel})`
        ));

        // Capacity filter (if flag enabled, hide full courses)
        try {
            const { isFeatureEnabled } = await import("@/lib/feature-flags");
            if (isFeatureEnabled("COURSE_CAPACITY")) {
                available = available.filter((c: any) => !c.capacity || (c.enrolledCount || 0) < c.capacity);
            }
        } catch {}

        // Timetable clash check (non-breaking, just annotate)
        try {
            const { timetableSlots, courseLecturers } = await import("@/db/schema");
            const studentRegs = await db.select({ courseId: studentCourseRegistrations.courseId }).from(studentCourseRegistrations).where(and(eq(studentCourseRegistrations.studentId, studentId), eq(studentCourseRegistrations.sessionId, (await db.select().from(students).where(eq(students.id, studentId)).limit(1))[0]?.currentSessionId || 0))).limit(50);
            const registeredIds = studentRegs.map(r => r.courseId).filter(Boolean);
            if (registeredIds.length > 0) {
                const existingSlots = await db.select({ courseId: courseLecturers.courseId, day: timetableSlots.day, startTime: timetableSlots.startTime, endTime: timetableSlots.endTime }).from(timetableSlots).innerJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id)).where(inArray(courseLecturers.courseId, registeredIds as number[]));
                const newSlots = await db.select({ courseId: courseLecturers.courseId, day: timetableSlots.day, startTime: timetableSlots.startTime, endTime: timetableSlots.endTime }).from(timetableSlots).innerJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id)).where(inArray(courseLecturers.courseId, available.map((c:any) => c.id)));
                // Annotate clash (not filtering, just flag)
                for (const c of available as any[]) {
                    const clash = newSlots.some(ns => ns.courseId === c.id && existingSlots.some(es => es.day === ns.day && es.startTime === ns.startTime));
                    if (clash) (c as any).hasClash = true;
                }
            }
        } catch {}

        return available;
    }

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

        // 1b. Capacity check (if enabled) - waitlist instead of throw
        const waitlistedCourseIds: number[] = [];
        try {
            const { isFeatureEnabled } = await import("@/lib/feature-flags");
            if (isFeatureEnabled("COURSE_CAPACITY")) {
                for (const cid of data.courseIds) {
                    const [setting] = await db.select({ capacity: (courseDepartmentSettings as any).capacity, enrolledCount: (courseDepartmentSettings as any).enrolledCount }).from(courseDepartmentSettings).where(and(eq(courseDepartmentSettings.courseId, cid), eq(courseDepartmentSettings.deptId, (await db.select({ deptId: students.deptId }).from(students).where(eq(students.id, data.studentId)).limit(1))[0]?.deptId || 0))).limit(1) as any;
                    if (setting && (setting as any).capacity && (setting as any).enrolledCount >= (setting as any).capacity) {
                        waitlistedCourseIds.push(cid);
                    }
                }
            }
        } catch {}

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
                advisorStatus: (waitlistedCourseIds.includes(courseId) ? 'pending' : 'pending') as const,
                hodStatus: 'pending' as const,
                finalStatus: 'pending' as const
            }));
            // For waitlisted, we will set enrollments status to waitlisted after insert via separate enrollments table if needed
            // Here studentCourseRegistrations doesn't have waitlisted, so we keep pending but enrollments will be waitlisted

            await tx.insert(studentCourseRegistrations).values(registrationEntries);

            // Handle enrollments waitlist for capacity-full courses
            if (waitlistedCourseIds.length > 0) {
                const student = await tx.select({ academicYear: students.admissionYear }).from(students).where(eq(students.id, data.studentId)).limit(1);
                const year = student[0]?.academicYear?.toString() || new Date().getFullYear().toString();
                for (const cid of waitlistedCourseIds) {
                    await tx.insert(enrollments).values({
                        studentId: data.studentId,
                        courseId: cid,
                        sessionId: data.sessionId,
                        academicYear: year,
                        semester: parseInt(data.semester),
                        status: 'waitlisted' as any,
                    } as any);
                }
            }

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
