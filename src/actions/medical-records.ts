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

        // Build base conditions
        const conditions = [eq(students.deletedAt, null as any)];

        if (filters?.departmentId) {
            conditions.push(eq(students.deptId, filters.departmentId));
        }

        if (filters?.status === 'submitted') {
            conditions.push(sql`${students.medicalFormSubmittedAt} IS NOT NULL`);
        } else if (filters?.status === 'pending') {
            conditions.push(sql`${students.medicalFormSubmittedAt} IS NULL`);
        } else if (filters?.status === 'cleared') {
            conditions.push(eq(students.healthStatus, 'cleared'));
        }

        if (filters?.search) {
            const q = `%${filters.search}%`;
            conditions.push(
                or(
                    like(users.name, q),
                    like(students.firstName, q),
                    like(students.lastName, q),
                    like(students.matricNumber, q)
                )
            );
        }

        const whereClause = and(...conditions);

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
        .where(whereClause)
        .orderBy(users.name)
        .limit(limit)
        .offset(offset);

        // Get total count
        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(whereClause);

        return { success: true, data: rows, total: Number(count) };
    } catch (error) {
        return { success: false, error: (error as Error).message, data: [], total: 0 };
    }
}

export async function getMedicalRecordStats() {
    try {
        await ensureHealthAccess();

        const [stats] = await db.select({
            total: sql<number>`count(*)`,
            submitted: sql<number>`sum(${students.medicalFormSubmittedAt} IS NOT NULL)`,
            cleared: sql<number>`sum(${students.healthStatus} = 'cleared')`,
            pending: sql<number>`sum(${students.healthStatus} = 'pending')`,
        })
        .from(students)
        .where(eq(students.deletedAt, null as any));

        return { success: true, data: stats };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}