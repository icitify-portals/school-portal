"use server";

import { db } from "@/db/db";
import { 
    organizations, 
    institutionalUnits, 
    students, 
    users, 
    movementLogs,
    userRoles,
    faculties,
    departments,
    programmes,
    courses,
    admissionSessions
} from "@/db/schema";
import { eq, sql, count, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { StudentService } from "@/services/StudentService";

/**
 * Fetch all soft-deleted students for the recycle bin.
 */
export async function getDeletedStudents() {
    try {
        const deleted = await db.select({
            id: students.id,
            admissionNumber: students.admissionNumber,
            name: users.name,
            deletedAt: students.deletedAt,
            branch: institutionalUnits.name
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .leftJoin(institutionalUnits, eq(students.unitId, institutionalUnits.id))
        .where(isNotNull(students.deletedAt))
        .orderBy(students.deletedAt);

        return deleted;
    } catch (error) {
        console.error("Failed to fetch deleted students:", error);
        return [];
    }
}

/**
 * Restore a student from the recycle bin.
 */
export async function restoreStudentAction(admissionNumber: string) {
    try {
        await StudentService.restoreStudent(admissionNumber);
        revalidatePath("/super-admin/recycle-bin");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Permanently purge a student record.
 */
export async function purgeStudentAction(admissionNumber: string) {
    try {
        await StudentService.permanentlyDeleteStudent(admissionNumber);
        revalidatePath("/super-admin/recycle-bin");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Empty the entire recycle bin.
 */
export async function emptyBinAction() {
    try {
        await StudentService.emptyRecycleBin();
        revalidatePath("/super-admin/recycle-bin");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Fetch aggregate statistics for the Super-Admin dashboard.
 */
export async function getSuperAdminStats() {
    try {
        const safeQuery = (promise: any) => promise.catch(() => [{ value: 0 }]);

        const [
            [unitCount], [studentCount], [staffCount], [orgCount], 
            [facultyCount], [deptCount], [progCount], [courseCount], [admissionCount]
        ] = await Promise.all([
            safeQuery(db.select({ value: count() }).from(institutionalUnits)),
            safeQuery(db.select({ value: count() }).from(students)),
            safeQuery(db.select({ value: count() }).from(users).where(eq(users.role, 'staff'))),
            safeQuery(db.select({ value: count() }).from(organizations)),
            safeQuery(db.select({ value: count() }).from(faculties)),
            safeQuery(db.select({ value: count() }).from(departments)),
            safeQuery(db.select({ value: count() }).from(programmes)),
            safeQuery(db.select({ value: count() }).from(courses)),
            safeQuery(db.select({ value: count() }).from(admissionSessions).where(eq(admissionSessions.isActive, true))),
        ]);

        // Recent movements
        const recentMovements = await db.select({
            id: movementLogs.id,
            entityType: movementLogs.entityType,
            reason: movementLogs.reason,
            createdAt: movementLogs.createdAt,
            fromUnit: institutionalUnits.name,
            toUnit: sql<string>`(SELECT name FROM institutional_units WHERE id = ${movementLogs.toUnitId})`,
            movedBy: users.name,
        })
        .from(movementLogs)
        .leftJoin(institutionalUnits, eq(movementLogs.fromUnitId, institutionalUnits.id))
        .leftJoin(users, eq(movementLogs.movedBy, users.id))
        .orderBy(movementLogs.createdAt)
        .limit(5)
        .catch(() => []);

        return {
            stats: {
                units: unitCount?.value || 0,
                students: studentCount?.value || 0,
                staff: staffCount?.value || 0,
                organizations: orgCount?.value || 0,
                faculties: facultyCount?.value || 0,
                departments: deptCount?.value || 0,
                programmes: progCount?.value || 0,
                courses: courseCount?.value || 0,
                admissions: admissionCount?.value || 0
            },
            recentMovements
        };
    } catch (error) {
        console.error("Failed to fetch Super-Admin stats:", error);
        return { 
            stats: { units: 0, students: 0, staff: 0, organizations: 0, faculties: 0, departments: 0, programmes: 0, courses: 0, admissions: 0 }, 
            recentMovements: [] 
        };
    }
}

/**
 * Onboard a new institutional unit (Branch/Annex).
 */
export async function onboardUnit(data: {
    name: string;
    code: string;
    slug: string;
    type: 'campus' | 'school' | 'college' | 'unit';
    academicTier: 'k12' | 'tertiary';
    organizationId?: number;
    headUserId?: number;
}) {
    try {
        await db.insert(institutionalUnits).values({
            ...data,
            settings: JSON.stringify({
                aliases: data.academicTier === 'k12' ? {
                    student: "Pupil",
                    course: "Subject",
                    term: "Term",
                } : {},
                termCount: data.academicTier === 'k12' ? 3 : 2,
                gradingLogic: data.academicTier === 'k12' ? 'CUMULATIVE' : 'GPA'
            })
        });
        
        revalidatePath("/super-admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to onboard unit:", error);
        return { success: false, error: "Onboarding failed" };
    }
}

/**
 * Elevate a user's role.
 */
export async function elevateUserRole(userId: number, newRole: 'admin' | 'staff' | 'student' | 'superadmin' | 'icitify_dev') {
    try {
        // 1. Ensure current user is a superadmin
        const { hasRole } = await import("@/lib/rbac");
        const isSuper = await hasRole("superadmin");
        if (!isSuper) throw new Error("Unauthorized: Only a Super-Admin can elevate roles");

        // 2. Update the role
        await db.update(users)
            .set({ role: newRole })
            .where(eq(users.id, userId));

        revalidatePath("/admin/users");
        revalidatePath("/super-admin/dashboard");
        return { success: true, message: `User role successfully updated to ${newRole}` };
    } catch (error) {
        console.error("Role elevation failed:", error);
        return { success: false, error: (error as Error).message };
    }
}
