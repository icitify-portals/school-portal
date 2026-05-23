"use server";

import { auth } from "@/auth";
import { TranscriptService } from "@/services/TranscriptService";
import { db } from "@/db/db";
import { students, departments, faculties, academicSessions, users, programmes, staffProfiles, institutionalUnits } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getTranscriptAction(studentId?: number, type: 'semester' | 'session' | 'full' = 'full', sessionId?: number, semester?: number) {
    const session = await auth();
    const user = session?.user as any;
    if (!user) return { success: false, error: "Unauthorized" };

    let targetStudentId = studentId;

    // If student is requesting their own transcript
    if (user.role === 'student') {
        const [student] = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.userId, parseInt(user.id)))
            .limit(1);

        if (!student) return { success: false, error: "Student profile not found" };
        targetStudentId = student.id;
    } else if (!targetStudentId) {
        return { success: false, error: "Student ID required for admin/staff" };
    }

    // Role-based verification for non-admins
    if (user.role !== 'admin' && user.role !== 'student') {
        const [staff] = await db.select({ unitCode: institutionalUnits.code })
            .from(staffProfiles)
            .leftJoin(institutionalUnits, eq(staffProfiles.unitId, institutionalUnits.id))
            .where(eq(staffProfiles.userId, parseInt(user.id)))
            .limit(1);

        if (staff?.unitCode !== 'EXAMS_RECORDS') {
            // For now, if not in E&R unit and not admin/student, we might restrict
        }
    }

    try {
        const data = await TranscriptService.getStudentTranscript(targetStudentId, { sessionId, semester });
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getTranscriptSearch(filters: { facultyId?: number, deptId?: number, search?: string }) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'dvc')) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const [staff] = await db.select({
            deptId: staffProfiles.departmentId,
            unitId: staffProfiles.unitId,
            unitCode: institutionalUnits.code,
            facultyId: departments.facultyId
        })
            .from(staffProfiles)
            .leftJoin(departments, eq(staffProfiles.departmentId, departments.id))
            .leftJoin(institutionalUnits, eq(staffProfiles.unitId, institutionalUnits.id))
            .where(eq(staffProfiles.userId, parseInt(user.id)))
            .limit(1);

        let query = db.select({
            student: students,
            user: users,
            prog: programmes,
            dept: departments,
            fac: faculties
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(faculties, eq(departments.facultyId, faculties.id));

        // Role-Based Scoping
        if (user.role === 'staff' && staff) {
            // Exams & Records Unit gets global access
            if (staff.unitCode === 'EXAMS_RECORDS') {
                // No additional where clauses needed for scoping
            } else if (staff.deptId) {
                query = query.where(eq(students.deptId, staff.deptId)) as any;
            }
        }

        if (filters.facultyId) {
            query = query.where(eq(faculties.id, filters.facultyId)) as any;
        }
        if (filters.deptId) {
            query = query.where(eq(departments.id, filters.deptId)) as any;
        }
        if (filters.search) {
            query = query.where(sql`${users.name} LIKE ${`%${filters.search}%`} OR ${students.matricNumber} LIKE ${`%${filters.search}%`}`) as any;
        }

        const data = await query;
        return { success: true, data };
    } catch (error: any) {
        console.error("Search error:", error);
        return { success: false, error: error.message };
    }
}

export async function getDepartmentStudents(deptId: number) {
    const session = await auth();
    if (!session?.user) return [];

    // Authorization check for HOD
    // ...

    return await TranscriptService.getDepartmentalTranscripts(deptId);
}

export async function getAcademicSessions() {
    try {
        return await db.select().from(academicSessions).orderBy(desc(academicSessions.name));
    } catch (error) {
        return [];
    }
}
