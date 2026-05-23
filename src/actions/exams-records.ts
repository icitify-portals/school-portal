"use server";

import { db } from "@/db/db";
import {
    students, users, programmes, departments,
    enrollments, results, academicSessions, semesterSummaries, courses,
    institutionalUnits, studentGroups, annualSummaries
} from "@/db/schema";
import { eq, and, sql, desc, or } from "drizzle-orm";
import { auth } from "@/auth";

/**
 * Fetches students who are likely in their final year or have graduated.
 * Logic: Current level matches or exceeds programme duration (assuming 100 level/year).
 */
export async function getGraduatingStudents(filters?: {
    programmeId?: number;
    deptId?: number;
    status?: string;
    search?: string;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const conditions = [
            or(
                eq(users.status, 'graduated'),
                // Simple heuristic for final year: level >= (duration/12 * 100)
                // e.g. 48 months / 12 = 4 years -> level 400
                sql`${students.currentLevel} >= (${programmes.durationMonths} / 12) * 100`
            )
        ];

        if (filters?.programmeId) {
            conditions.push(eq(students.programmeId, filters.programmeId));
        }
        if (filters?.deptId) {
            conditions.push(eq(students.deptId, filters.deptId));
        }
        if (filters?.status) {
            conditions.push(eq(users.status, filters.status as any));
        }
        if (filters?.search) {
            conditions.push(or(
                sql`${users.name} LIKE ${`%${filters.search}%`}`,
                sql`${students.matricNumber} LIKE ${`%${filters.search}%`}`
            ));
        }

        const data = await db.select({
            id: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            status: users.status,
            programme: programmes.name,
            programmeDuration: programmes.durationMonths,
            department: departments.name
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .innerJoin(programmes, eq(students.programmeId, programmes.id))
            .innerJoin(departments, eq(students.deptId, departments.id))
            .where(and(...conditions));

        return { success: true, data };
    } catch (error) {
        console.error("Error fetching graduating students:", error);
        return { success: false, error: "Failed to fetch student records" };
    }
}

/**
 * Fetches detailed academic history for a student.
 */
export async function getStudentAcademicRecord(studentId: number) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        // 1. Student Info with Unit Tier and Class Arm
        const [student] = await db.select({
            id: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            programme: programmes.name,
            department: departments.name,
            admissionYear: students.admissionYear,
            status: users.status,
            classOfDegree: students.classOfDegree,
            currentLevel: students.currentLevel,
            academicTier: institutionalUnits.academicTier,
            groupName: studentGroups.name
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(institutionalUnits, eq(students.unitId, institutionalUnits.id))
            .leftJoin(studentGroups, eq(students.groupId, studentGroups.id))
            .where(eq(students.id, studentId))
            .limit(1);

        if (!student) return { success: false, error: "Student not found" };

        // 2. Semester Summaries
        const summaries = await db.select()
            .from(semesterSummaries)
            .where(eq(semesterSummaries.studentId, studentId))
            .orderBy(semesterSummaries.sessionId, semesterSummaries.semester);

        // 3. Course Results (with Rank and Detailed Scores)
        const allResults = await db.select({
            code: courses.code,
            title: courses.name,
            units: courses.creditUnits,
            totalScore: results.totalScore,
            caScore: results.caScore,
            examScore: results.examScore,
            grade: results.grade,
            gp: results.gradePoint,
            rankClass: results.rankClass,
            rankLevel: results.rankLevel,
            sessionId: enrollments.sessionId,
            semester: enrollments.semester,
            sessionName: academicSessions.name
        })
            .from(results)
            .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .innerJoin(academicSessions, eq(enrollments.sessionId, academicSessions.id))
            .where(eq(enrollments.studentId, studentId))
            .orderBy(enrollments.sessionId, enrollments.semester);

        // 4. Annual Summaries
        const annuals = await db.select()
            .from(annualSummaries)
            .where(eq(annualSummaries.studentId, studentId))
            .orderBy(desc(annualSummaries.sessionId));

        return {
            success: true,
            data: {
                student,
                summaries,
                results: allResults,
                annualSummaries: annuals
            }
        };
    } catch (error) {
        console.error("Error fetching academic record:", error);
        return { success: false, error: "Failed to fetch record" };
    }
}
/**
 * Searches all students in the database.
 */
export async function searchAllStudents(filters: { search?: string; programmeId?: number; deptId?: number }) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        let query = db.select({
            id: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            status: users.status,
            programme: programmes.name,
            department: departments.name
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id));

        const conditions = [];
        if (filters.search) {
            conditions.push(or(
                sql`${users.name} LIKE ${`%${filters.search}%`}`,
                sql`${students.matricNumber} LIKE ${`%${filters.search}%`}`
            ));
        }
        if (filters.programmeId) {
            conditions.push(eq(students.programmeId, filters.programmeId));
        }
        if (filters.deptId) {
            conditions.push(eq(students.deptId, filters.deptId));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        const data = await query.limit(50);
        return { success: true, data };
    } catch (error) {
        console.error("Error searching students:", error);
        return { success: false, error: "Search failed" };
    }
}

/**
 * Fetches computed results for a specific level (class) and arm (group) within an academic session/term.
 */
export async function getGeneratedResultsForClass(filters: {
    sessionId: number;
    semester: number;
    level: number;
    groupId?: number;
    deptId?: number;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const conditions = [
            eq(students.currentLevel, filters.level),
            eq(semesterSummaries.sessionId, filters.sessionId),
            eq(semesterSummaries.semester, filters.semester.toString() as any)
        ];

        if (filters.groupId) {
            conditions.push(eq(students.groupId, filters.groupId));
        }

        if (filters.deptId) {
            conditions.push(eq(students.deptId, filters.deptId));
        }

        const data = await db.select({
            studentId: students.id,
            name: users.name,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            groupName: studentGroups.name,
            departmentName: departments.name,
            tcr: semesterSummaries.tcr,
            tce: semesterSummaries.tce,
            gpa: semesterSummaries.gpa,
            cgpa: semesterSummaries.cgpa,
            teacherComment: semesterSummaries.teacherComment,
            principalComment: semesterSummaries.principalComment,
            approvalStatus: semesterSummaries.approvalStatus
        })
            .from(semesterSummaries)
            .innerJoin(students, eq(semesterSummaries.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(studentGroups, eq(students.groupId, studentGroups.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .where(and(...conditions))
            .orderBy(desc(semesterSummaries.gpa));

        return { success: true, data };
    } catch (error) {
        console.error("Error fetching class results:", error);
        return { success: false, error: "Failed to fetch class results" };
    }
}

/**
 * Fetches metadata filters (academic sessions, classes/levels, and arms/groups) for result viewing.
 */
export async function getResultFilterMetadata() {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const sessions = await db.select().from(academicSessions).orderBy(desc(academicSessions.name));
        const groups = await db.select().from(studentGroups).orderBy(studentGroups.level, studentGroups.name);
        const depts = await db.select().from(departments).orderBy(departments.name);
        
        // Extract unique levels
        const levels = Array.from(new Set(groups.map(g => g.level))).sort((a, b) => a - b);

        return {
            success: true,
            data: {
                sessions,
                groups,
                levels,
                departments: depts
            }
        };
    } catch (error) {
        console.error("Failed to fetch result filter metadata:", error);
        return { success: false, error: "Failed to load filters" };
    }
}
