"use strict";
"use server";

import { db } from "@/db/db";
import {
    departments,
    courses,
    enrollments,
    results,
    coursePrerequisites,
    academicSessions,
    students,
    courseDepartmentSettings,
    users,
    addDropRequests,
    staffProfiles,
    registrationLevelControls,
    registrationConcessions,
    academicCarryOvers
} from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";
import { getActiveSevereSanctions } from "@/actions/disciplinary";

/**
 * Validates a list of courses against institutional and departmental rules.
 */
export async function validateRegistration(studentId: number, courseIds: number[], academicYear: string, semester: number) {
    try {
        // 1. Fetch Student & Dept Info
        const studentRows = await db.select({
            student: students,
            department: departments
        })
            .from(students)
            .leftJoin(departments, eq(students.deptId, departments.id))
            .where(eq(students.id, studentId))
            .limit(1);

        const student = studentRows[0] ? {
            ...studentRows[0].student,
            department: studentRows[0].department
        } : null;

        if (!student || !student.deptId) return { success: false, error: "Student department mapping not found" };
        const dept = student.department as any;

        // 2. Fetch Session Info & Registration Settings
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.name, academicYear)).limit(1);

        if (!session) return { success: false, error: "Academic session not found" };

        let canRegister = session.isRegistrationOpen;

        // Hierarchical Check: If global is closed, check level-specific
        if (!canRegister) {
            const [levelControl] = await db.select().from(registrationLevelControls).where(and(
                eq(registrationLevelControls.sessionId, session.id),
                eq(registrationLevelControls.level, student.currentLevel || 100)
            )).limit(1);
            if (levelControl?.isOpen) canRegister = true;
        }

        // Tier 3 Check: Concessions (DVC Approval)
        if (!canRegister) {
            const [concession] = await db.select().from(registrationConcessions).where(and(
                eq(registrationConcessions.studentId, studentId),
                eq(registrationConcessions.sessionId, session.id),
                eq(registrationConcessions.status, 'approved'),
                sql`${registrationConcessions.expiresAt} IS NULL OR ${registrationConcessions.expiresAt} > NOW()`
            )).limit(1);
            if (concession) canRegister = true;
        }

        if (!canRegister) {
            return {
                success: false,
                error: "Registration is currently closed for your level. Please contact the Registrar's office or apply for a concession if needed."
            };
        }

        const isAnnual = session?.registrationType === 'annual';

        // 2.5 Enforce Carry-Overs
        const pendingCarryOvers = await db.select().from(academicCarryOvers).where(and(
            eq(academicCarryOvers.studentId, studentId),
            eq(academicCarryOvers.status, 'pending'),
            eq(academicCarryOvers.semester, semester.toString() as '1' | '2') // Semester matching
        ));

        if (pendingCarryOvers.length > 0) {
            const requestedCourseIds = new Set(courseIds);
            const missingCarryOvers = pendingCarryOvers.filter(co => !requestedCourseIds.has(co.courseId));
            
            if (missingCarryOvers.length > 0) {
                // Fetch names of missing carry overs for a better error message
                const missingCourses = await db.select({ code: courses.code })
                    .from(courses)
                    .where(inArray(courses.id, missingCarryOvers.map(co => co.courseId)));
                const missingCodes = missingCourses.map(c => c.code).join(', ');
                
                return {
                    success: false,
                    error: `You have unresolved carry-over courses for this semester that you must register for: ${missingCodes}`
                };
            }
        }

        // 3. Fetch Course Details
        const selectedCourses = await db.select().from(courses).where(inArray(courses.id, courseIds));
        const totalUnits = selectedCourses.reduce((sum, c) => sum + (c.creditUnits || 0), 0);

        // 4. Validate Unit Limits
        if (isAnnual) {
            if (totalUnits < (dept.minUnitsAnnual || 24)) return { success: false, error: `Minimum annual units required: ${dept.minUnitsAnnual || 24}. Current: ${totalUnits}` };
            if (totalUnits > (dept.maxUnitsAnnual || 48)) return { success: false, error: `Maximum annual units allowed: ${dept.maxUnitsAnnual || 48}. Current: ${totalUnits}` };
        } else {
            if (totalUnits < (dept.minUnitsSemester || 12)) return { success: false, error: `Minimum semester units required: ${dept.minUnitsSemester || 12}. Current: ${totalUnits}` };
            if (totalUnits > (dept.maxUnitsSemester || 24)) return { success: false, error: `Maximum semester units allowed: ${dept.maxUnitsSemester || 24}. Current: ${totalUnits}` };
        }

        // 5. Check Prerequisites
        // Fetch all prerequisites for selected courses
        const prereqs = await db.select().from(coursePrerequisites).where(inArray(coursePrerequisites.courseId, courseIds));

        if (prereqs.length > 0) {
            // Fetch student's passed courses (Grade not 'F', or score >= 40)
            const passedCourses = await db
                .select({ courseId: enrollments.courseId })
                .from(results)
                .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
                .where(and(
                    eq(enrollments.studentId, studentId),
                    sql`${results.score} >= 40` // Simple pass threshold for now
                ));

            const passedIds = new Set(passedCourses.map(p => p.courseId));

            for (const p of prereqs) {
                if (!passedIds.has(p.prerequisiteId)) {
                    const [prereqCourse] = await db.select().from(courses).where(eq(courses.id, p.prerequisiteId)).limit(1);
                    const targetCourse = selectedCourses.find(c => c.id === p.courseId);
                    return {
                        success: false,
                        error: `Prerequisite Missing: You must pass ${prereqCourse?.code} before registering for ${targetCourse?.code}`
                    };
                }
            }
        }

        return { success: true, totalUnits };
    } catch (error) {
        console.error("Validation Error:", error);
        return { success: false, error: "System error during registration validation" };
    }
}

/**
 * Main function to register a student for multiple courses.
 */
export async function registerCourses(studentId: number, courseIds: number[], academicYear: string, semester: number) {
    try {
        // SECURITY FIX: Block suspended/expelled/rusticated students from registering courses
        const studentUserRecord = await db.query.students.findFirst({ where: eq(students.id, studentId) });
        if (studentUserRecord) {
            // @ts-expect-error - TS2345: Auto-suppressed for build
            const sanctions = await getActiveSevereSanctions(studentUserRecord.userId);
            if (sanctions.length > 0) {
                return { success: false, error: "Course registration is blocked. You have an active disciplinary sanction. Please contact the Registrar's office." };
            }
        }

        // Run validation
        const val = await validateRegistration(studentId, courseIds, academicYear, semester);
        if (!val.success) return val;

        // Perform registration (Bulk Insert)
        await db.transaction(async (tx) => {
            // Check for existing enrollments to avoid duplicates
            const existing = await tx.select().from(enrollments).where(and(
                eq(enrollments.studentId, studentId),
                eq(enrollments.academicYear, academicYear),
                eq(enrollments.semester, semester)
            ));

            const existingIds = new Set(existing.map(e => e.courseId));
            const newCourses = courseIds.filter(id => !existingIds.has(id));

            if (newCourses.length === 0) return;

            await tx.insert(enrollments).values(newCourses.map(courseId => ({
                studentId,
                courseId,
                academicYear,
                semester
            })));
        });

        revalidatePath("/student/registration");
        revalidatePath("/admin/students");

        // --- Gamification: Award XP ---
        try {
            const { awardXP, checkAchievements } = await import("@/actions/gamification");
            await awardXP(500, "course_registration", academicYear);
            await checkAchievements(studentId, 'registration');
        } catch (e) {
            console.error("Gamification error:", e);
        }

        return { success: true, message: "Course registration successful!" };
    } catch (error) {
        console.error("Registration failed:", error);
        return { success: false, error: "Failed to finalize course registration" };
    }
}

/**
 * Fetches registrations that need approval.
 */
export async function getPendingRegistrations() {
    try {
        const allowed = await hasPermission("academic.registration.approve") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar") || await hasRole("hod") || await hasRole("dean");
        if (!allowed) return [];
        const pending = await db.select({
            studentId: enrollments.studentId,
            academicYear: enrollments.academicYear,
            semester: enrollments.semester,
            studentName: users.name,
            matricNumber: students.matricNumber,
        })
            .from(enrollments)
            .innerJoin(students, eq(enrollments.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(enrollments.status, 'pending'))
            .groupBy(enrollments.studentId, enrollments.academicYear, enrollments.semester);

        // For each distinct registration "bundle", fetch courses
        const results = await Promise.all(pending.map(async (reg) => {
            const coursesInReg = await db.select({
                id: courses.id,
                code: courses.code,
                name: courses.name,
                units: courses.creditUnits
            })
                .from(enrollments)
                .innerJoin(courses, eq(enrollments.courseId, courses.id))
                .where(and(
                    eq(enrollments.studentId, reg.studentId!),
                    eq(enrollments.academicYear, reg.academicYear!),
                    eq(enrollments.semester, reg.semester!),
                    eq(enrollments.status, 'pending')
                ));

            return {
                ...reg,
                courses: coursesInReg,
                totalUnits: coursesInReg.reduce((s, c) => s + (c.units || 0), 0)
            };
        }));

        return results;
    } catch (error) {
        console.error("Failed to fetch pending registrations:", error);
        return [];
    }
}

export async function processRegistration(studentId: number, academicYear: string, semester: number, action: 'approved' | 'rejected') {
    try {
        const allowed = await hasPermission("academic.registration.approve") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar") || await hasRole("hod") || await hasRole("dean");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };
        await db.update(enrollments)
            .set({ status: action })
            .where(and(
                eq(enrollments.studentId, studentId),
                eq(enrollments.academicYear, academicYear),
                eq(enrollments.semester, semester),
                eq(enrollments.status, 'pending')
            ));

        revalidatePath("/admin/courses/approvals");
        return { success: true };
    } catch (error) {
        console.error(`Failed to ${action} registration:`, error);
        return { success: false, error: `Failed to ${action} registration` };
    }
}

export async function batchProcessRegistrations(
    registrations: { studentId: number, academicYear: string, semester: number }[],
    action: 'approved' | 'rejected'
) {
    try {
        const allowed = await hasPermission("academic.registration.approve") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar") || await hasRole("hod") || await hasRole("dean");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to batch process registrations" };
        await db.transaction(async (tx) => {
            for (const reg of registrations) {
                await tx.update(enrollments)
                    .set({ status: action })
                    .where(and(
                        eq(enrollments.studentId, reg.studentId),
                        eq(enrollments.academicYear, reg.academicYear),
                        eq(enrollments.semester, reg.semester),
                        eq(enrollments.status, 'pending')
                    ));
            }
        });

        revalidatePath("/admin/courses/approvals");
        return { success: true };
    } catch (error) {
        console.error(`Failed to batch ${action} registrations:`, error);
        return { success: false, error: `Failed to bulk ${action} registrations` };
    }
}

/**
 * Submits a request to add or drop a course.
 */
export async function submitAddDropRequest(studentId: number, courseId: number, type: 'add' | 'remove', reason?: string) {
    try {
        const studentRows = await db.select({
            student: students,
            admissionSession: academicSessions
        })
            .from(students)
            .leftJoin(academicSessions, eq(students.admissionSessionId, academicSessions.id))
            .where(eq(students.id, studentId))
            .limit(1);

        const student = studentRows[0] ? {
            ...studentRows[0].student,
            admissionSession: studentRows[0].admissionSession
        } : null;

        if (!student) return { success: false, error: "Student not found" };

        const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        if (!currentSession) return { success: false, error: "No active academic session found" };
        if (!currentSession.isAddDropOpen) return { success: false, error: "Add/Drop window is currently closed" };

        const semester = currentSession.currentSemester === '2' ? 2 : 1;

        // Check if a similar request already exists
        const [existing] = await db.select().from(addDropRequests).where(and(
            eq(addDropRequests.studentId, studentId),
            eq(addDropRequests.courseId, courseId),
            eq(addDropRequests.sessionId, currentSession.id),
            eq(addDropRequests.type, type),
            eq(addDropRequests.status, 'pending')
        )).limit(1);

        if (existing) return { success: false, error: "You already have a pending request for this course" };

        await db.insert(addDropRequests).values({
            studentId,
            sessionId: currentSession.id,
            semester,
            courseId,
            type,
            reason,
            status: 'pending'
        });

        revalidatePath("/student/registration/add-drop");
        return { success: true, message: "Request submitted successfully" };
    } catch (error) {
        console.error("Failed to submit Add/Drop request:", error);
        return { success: false, error: "Failed to submit request" };
    }
}

/**
 * Fetches Add/Drop requests for approval, optionally filtered by department.
 */
export async function getAddDropRequests(deptId?: number) {
    try {
        const allowed = await hasPermission("academic.registration.approve") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar") || await hasRole("hod") || await hasRole("dean");
        if (!allowed) return [];
        const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        if (!currentSession) return [];

        const conditions = [
            eq(addDropRequests.sessionId, currentSession.id),
            eq(addDropRequests.status, 'pending')
        ];

        // This is a naive join-based filter since Drizzle filters are powerful
        const requestsRaw = await db.select({
            request: addDropRequests,
            student: students,
            user: users,
            course: courses
        })
            .from(addDropRequests)
            .innerJoin(students, eq(addDropRequests.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .innerJoin(courses, eq(addDropRequests.courseId, courses.id))
            .where(and(...conditions));

        const requests = requestsRaw.map(r => ({
            ...r.request,
            student: {
                ...r.student,
                user: r.user
            },
            course: r.course
        }));

        // If deptId is provided, filter manually if we can't do it in query easily with relations
        if (deptId) {
            return requests.filter(r => r.student.deptId === deptId);
        }

        return requests;
    } catch (error) {
        console.error("Failed to fetch Add/Drop requests:", error);
        return [];
    }
}

/**
 * Processes (approves/rejects) an Add/Drop request.
 */
export async function processAddDropRequest(requestId: number, action: 'approved' | 'rejected', processorId: number) {
    try {
        const allowed = await hasPermission("academic.registration.approve") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar") || await hasRole("hod") || await hasRole("dean");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to process Add/Drop request" };
        const requestRows = await db.select({
            request: addDropRequests,
            session: academicSessions
        })
            .from(addDropRequests)
            .leftJoin(academicSessions, eq(addDropRequests.sessionId, academicSessions.id))
            .where(eq(addDropRequests.id, requestId))
            .limit(1);

        const request = requestRows[0] ? {
            ...requestRows[0].request,
            session: requestRows[0].session
        } : null;

        if (!request || request.status !== 'pending') {
            return { success: false, error: "Request not found or already processed" };
        }

        await db.transaction(async (tx) => {
            // Update request status
            await tx.update(addDropRequests)
                .set({
                    status: action,
                    processedBy: processorId,
                    processedAt: new Date()
                })
                .where(eq(addDropRequests.id, requestId));

            if (action === 'approved') {
                if (request.type === 'add') {
                    // Logic to add enrollment
                    await tx.insert(enrollments).values({
                        studentId: request.studentId,
                        courseId: request.courseId,
                        academicYear: request.session?.name || "Unknown",
                        semester: request.semester,
                        status: 'approved' // Automatically approved since the request was approved
                    });
                } else {
                    // Logic to remove enrollment
                    await tx.delete(enrollments).where(and(
                        eq(enrollments.studentId, request.studentId),
                        eq(enrollments.courseId, request.courseId),
                        eq(enrollments.academicYear, request.session?.name || ""),
                        eq(enrollments.semester, request.semester)
                    ));
                }
            }
        });

        revalidatePath("/admin/students/add-drop");
        revalidatePath("/student/registration");
        return { success: true, message: `Request ${action} successfully` };
    } catch (error) {
        console.error(`Failed to ${action} request:`, error);
        return { success: false, error: `Failed to ${action} request` };
    }
}

/**
 * Direct enrollment update for Super Admin or designated staff (Scenario A).
 */
export async function directEnrollmentUpdate(studentId: number, courseId: number, type: 'add' | 'remove', processorId: number) {
    try {
        const allowed = await hasPermission("academic.registration.approve") || await hasRole("admin") || await hasRole("superadmin") || await hasRole("academic_registrar");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to perform direct enrollment update" };
        const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        if (!currentSession) return { success: false, error: "No active session" };

        const semester = currentSession.currentSemester === '2' ? 2 : 1;

        if (type === 'add') {
            await db.insert(enrollments).values({
                studentId,
                courseId,
                academicYear: currentSession.name,
                semester,
                status: 'approved'
            });
        } else {
            await db.delete(enrollments).where(and(
                eq(enrollments.studentId, studentId),
                eq(enrollments.courseId, courseId),
                eq(enrollments.academicYear, currentSession.name),
                eq(enrollments.semester, semester)
            ));
        }

        revalidatePath(`/admin/students/${studentId}`);
        return { success: true, message: "Enrollment updated successfully" };
    } catch (error) {
        console.error("Direct update failed:", error);
        return { success: false, error: "Failed to update enrollment" };
    }
}
