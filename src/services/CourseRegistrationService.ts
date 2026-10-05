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
    enrollments,
    academicSessions,
    courseRegistrationWaivers
} from "@/db/schema";
import { eq, and, or, inArray, isNull, sql } from "drizzle-orm";
import { resolveLevel, COURSE_LEVELS } from "@/lib/levels";
import { getAutoApproveFlags } from "@/actions/settings";
import { assertActivityUnlocked, buildStudentLockContext, ACTIVITIES } from "./ActivityLockService";

export class CourseRegistrationService {

/**
     * Retrieves the courses a student may register for.
     *
     * A student sees their OWN level's courses only. Courses from a lower level
     * are surfaced solely when the student has an unresolved carry-over on that
     * exact course, so nobody is offered a whole lower level to browse.
     *
     * Carry-over is authoritative from academic_carry_overs, and falls back to an
     * unambiguous F in student_results. Grades outside the portal's grading
     * scale are never treated as failures.
     */
    static async getAvailableCourses(studentId: number, semester: '1' | '2') {
        const studentRecord = await db.select({
            id: students.id,
            deptId: students.deptId,
            level: students.currentLevel,
            programmeType: students.programmeType,
            currentSessionId: students.currentSessionId
        })
        .from(students)
        .where(and(eq(students.id, studentId), isNull(students.deletedAt)))
        .limit(1);

        if (!studentRecord.length) return [];
        const student = studentRecord[0];

        const resolved = resolveLevel(student.level, student.programmeType);
        if (!resolved) return [];
        const ownLevel = resolved.numeric;
        const levelName = resolved.label;

        const studentDeptId = student.deptId;

        // A student with no department must not be shown the catalogue.
        //
        // The department filter used to degrade to `1 = 1` here, which listed
        // every level's courses from every department: 81 such students each
        // saw 91 courses across all six departments. Those records have no
        // programme, no matric number and no current session, so there is
        // nothing to bill against and no way to tell which course is theirs.
        // With both approval stages automated this also let a placeholder
        // record self-register straight into an approved session.
        if (!studentDeptId) return [];

        // Courses the student still owes from an earlier level.
        const carryOverCourseIds = await this.getCarryOverCourseIds(studentId);

        const lowerLevels = COURSE_LEVELS.filter(l => l < ownLevel);

        let available = await db.select({
            id: courses.id,
name: sql<string>`COALESCE(${courseDepartmentSettings.courseTitle}, ${courses.name})`,
            code: courses.code,
            units: sql<number>`COALESCE(${courseDepartmentSettings.creditUnits}, ${courses.creditUnits})`.mapWith(Number),
            status: courseDepartmentSettings.status,
            level: courseDepartmentSettings.level,
            isUniversityRequired: courses.isUniversityRequired,
            capacity: (courseDepartmentSettings as any).capacity,
            enrolledCount: (courseDepartmentSettings as any).enrolledCount,
        })
        .from(courses)
        .innerJoin(courseDepartmentSettings, eq(courses.id, courseDepartmentSettings.courseId))
        .where(and(
            eq(courseDepartmentSettings.semester, semester),
            eq(courseDepartmentSettings.deptId, studentDeptId),
            or(
                // Own level: the full catalogue.
                eq(courseDepartmentSettings.level, ownLevel),
                // Lower level: only a specific owed course, and only when one exists.
                carryOverCourseIds.length > 0 && lowerLevels.length > 0
                    ? and(
                        inArray(courseDepartmentSettings.level, lowerLevels),
                        inArray(courses.id, carryOverCourseIds)
                    )
                    : undefined
            )
        ));

        // Badge the carry-overs so the UI can distinguish an owed course.
        if (carryOverCourseIds.length > 0) {
            const owed = new Set(carryOverCourseIds);
            for (const c of available as any[]) {
                if (owed.has(c.id)) c.isCarryOver = true;
            }
        }

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
            const sessionId = student.currentSessionId;
            const registeredIds = sessionId
                ? (await db.select({ courseId: studentCourseRegistrations.courseId })
                    .from(studentCourseRegistrations)
                    .where(and(
                        eq(studentCourseRegistrations.studentId, studentId),
                        eq(studentCourseRegistrations.sessionId, sessionId)
                    ))
                ).map(r => r.courseId)
                : [];
            if (registeredIds.length > 0 && available.length > 0) {
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
     * Courses a student still has to clear from an earlier level.
     *
     * academic_carry_overs is authoritative when a row exists. Otherwise an
     * unambiguous F in student_results counts, because the portal's grading scale
     * defines F as 0 points. Grades outside that scale are ignored rather than
     * guessed at. A later pass in the same course clears the carry-over.
     */
    private static async getCarryOverCourseIds(studentId: number): Promise<number[]> {
        const carried = new Set<number>();

        try {
            const { academicCarryOvers } = await import("@/db/schema");
            const rows = await db.select({ courseId: academicCarryOvers.courseId })
                .from(academicCarryOvers)
                .where(and(
                    eq(academicCarryOvers.studentId, studentId),
                    inArray(academicCarryOvers.status, ['pending', 'registered'])
                ));
            for (const r of rows) if (r.courseId) carried.add(r.courseId);
        } catch {}

        if (carried.size === 0) {
            try {
                const { studentResults } = await import("@/db/schema");
                const failed = await db.select({ courseId: studentResults.courseId })
                    .from(studentResults)
                    .where(and(
                        eq(studentResults.studentId, studentId),
                        sql`${studentResults.grade} IN ('F')`
                    ));
                for (const r of failed) if (r.courseId) carried.add(r.courseId);
            } catch {}
        }

        // Anything the student has since passed is no longer owed.
        if (carried.size > 0) {
            try {
                const { studentResults } = await import("@/db/schema");
                const cleared = await db.select({ courseId: studentResults.courseId })
                    .from(studentResults)
                    .where(and(
                        eq(studentResults.studentId, studentId),
                        inArray(studentResults.courseId, [...carried]),
                        sql`${studentResults.grade} NOT IN ('F')`
                    ));
                for (const r of cleared) carried.delete(r.courseId);
            } catch {}
        }

        return [...carried];
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
        // 0. Activity lock check (e.g. course registration freeze by level/programme)
        const [lockStudent] = await db.select({
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            deptId: students.deptId,
        }).from(students).where(eq(students.id, data.studentId)).limit(1);
        if (lockStudent) {
            const lockCheck = await assertActivityUnlocked(ACTIVITIES.COURSE_REGISTRATION, buildStudentLockContext(lockStudent));
            if (!lockCheck.success) {
                throw new Error(lockCheck.error || "Course registration is currently closed.");
            }
        }

        // 1. Prerequisite & Waiver Validation
        const prerequisiteErrors = await this.validatePrerequisites(data.studentId, data.courseIds);
        if (prerequisiteErrors.length > 0) {
            throw new Error(`Prerequisite Failure: ${prerequisiteErrors.map(e => e.message).join(' ')}`);
        }

        // 1b. Capacity & timetable clash check (if enabled) - fail late with clear message
        const capacityErrors: string[] = [];
        const clashErrors: string[] = [];
        try {
            const { isFeatureEnabled } = await import("@/lib/feature-flags");
            if (isFeatureEnabled("COURSE_CAPACITY")) {
                const studentDept = await db.select({ deptId: students.deptId }).from(students).where(eq(students.id, data.studentId)).limit(1);
                const deptId = studentDept[0]?.deptId;
                for (const cid of data.courseIds) {
                    if (!deptId) continue;
                    const [setting] = await db.select({
                        capacity: courseDepartmentSettings.capacity,
                        enrolledCount: courseDepartmentSettings.enrolledCount,
                        courseCode: courses.code
                    })
                        .from(courseDepartmentSettings)
                        .innerJoin(courses, eq(courseDepartmentSettings.courseId, courses.id))
                        .where(and(
                            eq(courseDepartmentSettings.courseId, cid),
                            eq(courseDepartmentSettings.deptId, deptId)
                        ))
                        .limit(1);
                    if (setting?.capacity && (setting.enrolledCount || 0) >= setting.capacity) {
                        capacityErrors.push(`${setting.courseCode} is full (${setting.enrolledCount}/${setting.capacity})`);
                    }
                }
            }

            // Timetable clash check against already-registered courses
            const { timetableSlots, courseLecturers } = await import("@/db/schema");
            const studentRegs = await db.select({ courseId: studentCourseRegistrations.courseId })
                .from(studentCourseRegistrations)
                .where(and(
                    eq(studentCourseRegistrations.studentId, data.studentId),
                    eq(studentCourseRegistrations.sessionId, data.sessionId)
                ))
                .limit(50);
            const registeredIds = studentRegs.map(r => r.courseId).filter(Boolean) as number[];
            if (registeredIds.length > 0) {
                const existingSlots = await db.select({
                    courseId: courseLecturers.courseId,
                    day: timetableSlots.day,
                    startTime: timetableSlots.startTime,
                    endTime: timetableSlots.endTime
                })
                    .from(timetableSlots)
                    .innerJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
                    .where(inArray(courseLecturers.courseId, registeredIds));

                const newSlots = await db.select({
                    courseCode: courses.code,
                    courseId: courseLecturers.courseId,
                    day: timetableSlots.day,
                    startTime: timetableSlots.startTime,
                    endTime: timetableSlots.endTime
                })
                    .from(timetableSlots)
                    .innerJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
                    .innerJoin(courses, eq(courseLecturers.courseId, courses.id))
                    .where(inArray(courseLecturers.courseId, data.courseIds));

                for (const ns of newSlots) {
                    const overlap = existingSlots.some(es =>
                        es.day === ns.day &&
                        es.startTime && es.endTime && ns.startTime && ns.endTime &&
                        ns.startTime < es.endTime && ns.endTime > es.startTime
                    );
                    if (overlap) {
                        clashErrors.push(`${ns.courseCode} clashes with your existing timetable`);
                    }
                }
            }
        } catch {}

        if (capacityErrors.length > 0) {
            throw new Error(`Capacity reached: ${capacityErrors.join('; ')}`);
        }
        if (clashErrors.length > 0) {
            throw new Error(`Timetable clash: ${clashErrors.join('; ')}`);
        }

        // 2. Fetch Waivers to mark entries correctly
        const activeWaivers = await db.select({ courseId: courseRegistrationWaivers.courseId })
            .from(courseRegistrationWaivers)
            .where(eq(courseRegistrationWaivers.studentId, data.studentId));
        const waivedCourseIds = activeWaivers.map(w => w.courseId);

        // 3. Credit Unit Validation (per-department credits where available)
        const studentDept = await db.select({ deptId: students.deptId })
            .from(students)
            .where(eq(students.id, data.studentId))
            .limit(1);
const deptId = studentDept[0]?.deptId;

        // Same reason as getAvailableCourses: without a department there is no
        // defined credit unit for the student. The join below would otherwise
        // match every department offering each course and add the same course
        // into the total once per department.
        if (!deptId) {
            throw new Error(
                'Your student record has no department set, so your course credits cannot be determined. ' +
                'Please contact the registrar.'
            );
        }

        const selectedCourses = await db.select({
            courseUnits: courses.creditUnits,
            deptUnits: courseDepartmentSettings.creditUnits
        })
            .from(courses)
            .leftJoin(courseDepartmentSettings, and(
                eq(courseDepartmentSettings.courseId, courses.id),
                eq(courseDepartmentSettings.deptId, deptId)
            ))
            .where(inArray(courses.id, data.courseIds));

        const totalUnits = selectedCourses.reduce((sum, c) => sum + (c.deptUnits ?? c.courseUnits ?? 0), 0);
        
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

            // Advisor and HOD are approved independently, so the portal can run
            // with either stage automated and the other still reviewed by a human.
            const { advisor: autoApproveAdvisor, hod: autoApproveHod } = await getAutoApproveFlags();
            const now = new Date();

            const advisorStatus = autoApproveAdvisor ? 'approved' as const : 'pending' as const;
            const hodStatus = autoApproveHod ? 'approved' as const : 'pending' as const;
            const finalStatus = autoApproveAdvisor && autoApproveHod ? 'approved' as const : 'pending' as const;

            const registrationEntries = data.courseIds.map(courseId => ({
                studentId: data.studentId,
                courseId: courseId,
                sessionId: data.sessionId,
                semester: data.semester,
                isWaiver: waivedCourseIds.includes(courseId),
                advisorStatus,
                hodStatus,
                finalStatus,
                ...(autoApproveAdvisor ? { advisorApprovedAt: now } : {}),
                ...(autoApproveHod ? { hodApprovedAt: now } : {})
            }));

            await tx.insert(studentCourseRegistrations).values(registrationEntries);

            // Forward-only projection into `enrollments`, which is what the
            // timetable reads. Only the current registration is written: no
            // historical legacy enrolment data is read, migrated or reused.
            const [session] = await tx.select({
                name: academicSessions.name,
                currentSemester: academicSessions.currentSemester
            })
            .from(academicSessions)
            .where(eq(academicSessions.id, data.sessionId))
            .limit(1);

            if (session?.name) {
                const academicYear = session.name;
                const semesterNo = data.semester === '2' || session.currentSemester === '2' ? 2 : 1;

                await tx.delete(enrollments).where(and(
                    eq(enrollments.studentId, data.studentId),
                    eq(enrollments.academicYear, academicYear),
                    eq(enrollments.semester, semesterNo)
                ));

                await tx.insert(enrollments).values(data.courseIds.map(courseId => ({
                    studentId: data.studentId,
                    courseId,
                    academicYear,
                    semester: semesterNo
                })));
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
     * Approves a student's course registration (advisor/HOD level).
     */
    static async approveRegistration(studentId: number, sessionId: number, semester: '1' | '2', staffId: number) {
        return await db.transaction(async (tx) => {
            const regs = await tx.select().from(studentCourseRegistrations).where(and(
                eq(studentCourseRegistrations.studentId, studentId),
                eq(studentCourseRegistrations.sessionId, sessionId),
                eq(studentCourseRegistrations.semester, semester)
            ));

            for (const reg of regs) {
                let update: Partial<typeof studentCourseRegistrations.$inferInsert> = {};
                if (reg.advisorStatus === 'pending') {
                    update = { advisorStatus: 'approved', advisorApprovedBy: staffId, advisorApprovedAt: new Date() };
                } else if (reg.hodStatus === 'pending') {
                    update = { hodStatus: 'approved', hodApprovedBy: staffId, hodApprovedAt: new Date(), finalStatus: 'approved' };
                } else {
                    update = { finalStatus: 'approved' };
                }
                await tx.update(studentCourseRegistrations).set(update).where(eq(studentCourseRegistrations.id, reg.id));
            }
            return { success: true };
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

