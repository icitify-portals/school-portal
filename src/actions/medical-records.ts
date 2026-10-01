"use server";

import { db } from "@/db/db";
import { students, users, departments, studentMedicalRecords } from "@/db/schema";
import { eq, and, like, or, sql } from "drizzle-orm";
import { auth } from "@/auth";

async function ensureHealthAccess() {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { role: true }
    });
    if (!user || !["admin", "healthadmin", "ict_manager", "registrar"].includes(user.role || "")) {
        throw new Error("Access denied. Health Admin or Admin role required.");
    }
}

export async function getMedicalRecords(filters?: {
    departmentId?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) {
    try {
        await ensureHealthAccess();

        const limit = filters?.limit || 20;
        const page = filters?.page || 1;
        const offset = (page - 1) * limit;

        let whereConditions = eq(students.deletedAt, null as any);

        if (filters?.departmentId) {
            whereConditions = and(whereConditions, eq(students.deptId, filters.departmentId));
        }

        if (filters?.status === 'submitted') {
            whereConditions = and(whereConditions, sql`${students.medicalFormSubmittedAt} IS NOT NULL`);
        } else if (filters?.status === 'pending') {
            whereConditions = and(whereConditions, sql`${students.medicalFormSubmittedAt} IS NULL`);
        } else if (filters?.status === 'cleared') {
            whereConditions = and(whereConditions, eq(students.healthStatus, 'cleared'));
        }

        const rows = await db.select({
            studentId: students.id,
            studentName: users.name,
            matricNumber: students.matricNumber,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            deptId: students.deptId,
            deptName: departments.name,
            healthStatus: students.healthStatus,
            medicalFormSubmittedAt: students.medicalFormSubmittedAt,
            bloodGroup: students.bloodGroup,
            genotype: students.genotype,
            allergies: studentMedicalRecords.allergies,
            medicalHistory: studentMedicalRecords.medicalHistory,
            currentMedications: studentMedicalRecords.currentMedications,
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .leftJoin(studentMedicalRecords, eq(studentMedicalRecords.studentId, students.id))
        .where(whereConditions)
        .orderBy(users.name)
        .limit(limit)
        .offset(offset);

        // Filter by search
        let filtered = rows;
        if (filters?.search) {
            const q = filters.search.toLowerCase();
            filtered = rows.filter(r =>
                (r.studentName || '').toLowerCase().includes(q) ||
                (r.matricNumber || '').toLowerCase().includes(q)
            );
        }

        // Get total count
        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .where(whereConditions);

        return { success: true, data: filtered, total: count };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [], total: 0 };
    }
}