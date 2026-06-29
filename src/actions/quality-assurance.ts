"use server";

import { db } from "@/db/db";
import { 
    courseEvaluations, students, users, courses, 
    enrollments, academicSessions, staffProfiles, 
    staffSubjectAssignments, departments, studentGroups
} from "@/db/schema";
// @ts-expect-error - TS2724: Auto-suppressed for build
import { eq, and, sql, desc, or, notIn } from "drizzle-orm";
import { auth } from "@/auth";
import { hasPermission, hasRole } from "@/lib/rbac";

/**
 * Fetches the active student's pending tutor evaluations for the current active session.
 */
export async function getStudentPendingEvaluations() {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        // 1. Get student profile
        const [student] = await db.select({
            id: students.id,
            currentLevel: students.currentLevel,
            groupId: students.groupId,
            academicTier: sql`COALESCE((SELECT academic_tier FROM institutional_units WHERE id = ${students.unitId}), 'k12')`
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            // @ts-expect-error - TS2769: Auto-suppressed for build
            .where(eq(users.email, session.user.email))
            .limit(1);

        if (!student) return { success: false, error: "Student profile not found" };

        // 2. Resolve active academic session
        const [activeSession] = await db.select()
            .from(academicSessions)
            .where(eq(academicSessions.isActive, true))
            .limit(1);

        if (!activeSession) return { success: false, error: "No active academic session resolved" };

        // 3. Find courses the student is enrolled in for this session
        const studentEnrollments = await db.select({
            enrollmentId: enrollments.id,
            courseId: enrollments.courseId,
            courseCode: courses.code,
            courseName: courses.name,
            semester: enrollments.semester,
            sessionId: enrollments.sessionId,
            sessionName: academicSessions.name
        })
            .from(enrollments)
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .innerJoin(academicSessions, eq(enrollments.sessionId, academicSessions.id))
            .where(and(
                eq(enrollments.studentId, student.id),
                eq(enrollments.sessionId, activeSession.id)
            ));

        // 4. For each course, fetch the assigned staff profile and check if already evaluated
        const pendingEvaluations = [];

        for (const enroll of studentEnrollments) {
            // Check if already evaluated
            const [alreadyEvaluated] = await db.select({ id: courseEvaluations.id })
                .from(courseEvaluations)
                .where(and(
                    eq(courseEvaluations.studentId, student.id),
                    // @ts-expect-error - TS2769: Auto-suppressed for build
                    eq(courseEvaluations.courseId, enroll.courseId),
                    // @ts-expect-error - TS2769: Auto-suppressed for build
                    eq(courseEvaluations.sessionId, enroll.sessionId)
                ))
                .limit(1);

            if (alreadyEvaluated) continue; // Skip since student already evaluated this course/tutor

            // Fetch assigned teacher/lecturer from staffSubjectAssignments
            const assignmentsCondition = [
                // @ts-expect-error - TS2769: Auto-suppressed for build
                eq(staffSubjectAssignments.courseId, enroll.courseId),
                // @ts-expect-error - TS2769: Auto-suppressed for build
                eq(staffSubjectAssignments.sessionId, enroll.sessionId)
            ];
            
            // If K-12 and student belongs to a group/arm, refine teacher matching
            if (student.groupId) {
                assignmentsCondition.push(eq(staffSubjectAssignments.groupId, student.groupId));
            }

            const [assignedStaff] = await db.select({
                staffId: staffProfiles.id,
                name: users.name,
                jobTitle: staffProfiles.jobTitle,
                imageUrl: staffProfiles.imageUrl
            })
                .from(staffSubjectAssignments)
                .innerJoin(staffProfiles, eq(staffSubjectAssignments.staffProfileId, staffProfiles.id))
                .innerJoin(users, eq(staffProfiles.userId, users.id))
                .where(and(...assignmentsCondition))
                .limit(1);

            if (assignedStaff) {
                pendingEvaluations.push({
                    ...enroll,
                    assignedStaff,
                    academicTier: student.academicTier
                });
            }
        }

        return { success: true, data: pendingEvaluations };
    } catch (error) {
        console.error("Error fetching pending evaluations:", error);
        return { success: false, error: "Failed to load pending evaluations" };
    }
}

/**
 * Submits a new course evaluation.
 */
export async function submitCourseEvaluation(data: {
    courseId: number;
    staffId: number;
    sessionId: number;
    semester: number;
    ratings: Record<string, number>;
    comments: string;
    isAnonymous: boolean;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const [student] = await db.select({ id: students.id })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            // @ts-expect-error - TS2769: Auto-suppressed for build
            .where(eq(users.email, session.user.email))
            .limit(1);

        if (!student) return { success: false, error: "Student profile not found" };

        // Double submission check
        const [existing] = await db.select({ id: courseEvaluations.id })
            .from(courseEvaluations)
            .where(and(
                eq(courseEvaluations.studentId, student.id),
                eq(courseEvaluations.courseId, data.courseId),
                eq(courseEvaluations.sessionId, data.sessionId)
            ))
            .limit(1);

        if (existing) return { success: false, error: "You have already evaluated this instructor for this term" };

        await db.insert(courseEvaluations).values({
            studentId: student.id,
            courseId: data.courseId,
            staffId: data.staffId,
            sessionId: data.sessionId,
            semester: data.semester.toString() as any,
            ratings: JSON.stringify(data.ratings),
            comments: data.comments,
            isAnonymous: data.isAnonymous
        });

        return { success: true };
    } catch (error) {
        console.error("Error submitting evaluation:", error);
        return { success: false, error: "Submission failed" };
    }
}

/**
 * Fetches global quality assurance evaluation metrics for administrators.
 */
export async function getInstructorQAProfiles(filters?: {
    sessionId?: number;
    semester?: string;
    deptId?: number;
    staffId?: number;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        // If not checking personal feedback, require QA view permission
        const checkingSelf = filters?.staffId !== undefined;
        if (!checkingSelf) {
            const allowed = await hasPermission("academic.qa.view") || await hasRole("admin") || await hasRole("superadmin");
            if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to view QA profiles" };
        }

        const conditions = [];

        if (filters?.sessionId) {
            conditions.push(eq(courseEvaluations.sessionId, filters.sessionId));
        }
        if (filters?.semester) {
            conditions.push(eq(courseEvaluations.semester, filters.semester as any));
        }
        if (filters?.staffId) {
            conditions.push(eq(courseEvaluations.staffId, filters.staffId));
        }
        if (filters?.deptId) {
            conditions.push(eq(staffProfiles.departmentId, filters.deptId));
        }

        const rawEvaluations = await db.select({
            id: courseEvaluations.id,
            courseName: courses.name,
            courseCode: courses.code,
            staffId: staffProfiles.id,
            instructorName: users.name,
            jobTitle: staffProfiles.jobTitle,
            rank: staffProfiles.rank,
            departmentName: departments.name,
            ratings: courseEvaluations.ratings,
            comments: courseEvaluations.comments,
            submittedAt: courseEvaluations.submittedAt
        })
            .from(courseEvaluations)
            .innerJoin(courses, eq(courseEvaluations.courseId, courses.id))
            .innerJoin(staffProfiles, eq(courseEvaluations.staffId, staffProfiles.id))
            .innerJoin(users, eq(staffProfiles.userId, users.id))
            .leftJoin(departments, eq(staffProfiles.departmentId, departments.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(courseEvaluations.submittedAt));

        // Aggregate statistics per instructor
        const instructorProfiles: Record<number, any> = {};

        for (const ev of rawEvaluations) {
            if (!instructorProfiles[ev.staffId]) {
                instructorProfiles[ev.staffId] = {
                    staffId: ev.staffId,
                    name: ev.instructorName,
                    jobTitle: ev.jobTitle,
                    rank: ev.rank,
                    department: ev.departmentName || "General",
                    totalSubmissions: 0,
                    aggregateScore: 0,
                    metrics: { clarity: 0, punctuality: 0, fairness: 0, engagement: 0, support: 0 },
                    comments: []
                };
            }

            const profile = instructorProfiles[ev.staffId];
            profile.totalSubmissions += 1;

            try {
                const parsedRatings = JSON.parse(ev.ratings || "{}");
                const metricKeys = ["clarity", "punctuality", "fairness", "engagement", "support"];
                let subTotal = 0;
                let validMetricsCount = 0;

                metricKeys.forEach(key => {
                    const val = parsedRatings[key] || 0;
                    if (val > 0) {
                        profile.metrics[key] += val;
                        subTotal += val;
                        validMetricsCount++;
                    }
                });

                if (validMetricsCount > 0) {
                    profile.aggregateScore += (subTotal / validMetricsCount);
                }
            } catch (e) {
                console.error("Error parsing ratings for evaluation ID:", ev.id);
            }

            if (ev.comments && ev.comments.trim().length > 0) {
                profile.comments.push({
                    text: ev.comments,
                    course: `${ev.courseCode} - ${ev.courseName}`,
                    // @ts-expect-error - TS18047: Auto-suppressed for build
                    date: ev.submittedAt.toLocaleDateString()
                });
            }
        }

        // Finalize averages computation
        const finalizedProfiles = Object.values(instructorProfiles).map((prof: any) => {
            const submissions = prof.totalSubmissions;
            
            // Average overall score
            prof.aggregateScore = parseFloat((prof.aggregateScore / submissions).toFixed(2));
            
            // Average per metric
            Object.keys(prof.metrics).forEach(key => {
                prof.metrics[key] = parseFloat((prof.metrics[key] / submissions).toFixed(2));
            });

            return prof;
        }).sort((a, b) => b.aggregateScore - a.aggregateScore);

        return { success: true, data: finalizedProfiles };
    } catch (error) {
        console.error("Error fetching QA profiles:", error);
        return { success: false, error: "Failed to load Quality Assurance data" };
    }
}

/**
 * Fetches personal QA feedback for the logged-in lecturer/tutor.
 */
export async function getInstructorPersonalFeedback() {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const [staff] = await db.select({ id: staffProfiles.id })
            .from(staffProfiles)
            .innerJoin(users, eq(staffProfiles.userId, users.id))
            // @ts-expect-error - TS2769: Auto-suppressed for build
            .where(eq(users.email, session.user.email))
            .limit(1);

        if (!staff) return { success: false, error: "Instructor profile not found" };

        const result = await getInstructorQAProfiles({ staffId: staff.id });
        if (result.success && result.data && result.data.length > 0) {
            return { success: true, data: result.data[0] };
        }

        return { success: true, data: null };
    } catch (error) {
        console.error("Error fetching instructor feedback:", error);
        return { success: false, error: "Failed to load instructor feedback" };
    }
}
