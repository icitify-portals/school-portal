"use strict";
"use server";

import { db } from "@/db/db";
import {
    students, programmes, departments, users,
    matriculationAuditLog, matriculationSettings, matriculationSequences,
} from "@/db/schema";
import { eq, and, or, like, isNull, isNotNull, desc, asc, sql, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { generateMatricNumber } from "@/actions/matriculation";

export async function getMatricStudents(options?: {
    search?: string;
    deptId?: number;
    programmeType?: string;
    level?: number;
    matricStatus?: "all" | "assigned" | "pending";
    page?: number;
    pageSize?: number;
}) {
    await requireAdmin();
    try {
        const page = options?.page || 1;
        const pageSize = options?.pageSize || 50;
        const offset = (page - 1) * pageSize;

        const conditions: any[] = [];

        if (options?.search) {
            const s = `%${options.search}%`;
            conditions.push(
                or(
                    like(students.firstName, s),
                    like(students.lastName, s),
                    like(students.matricNumber, s),
                    like(students.admissionNumber, s),
                )
            );
        }
        if (options?.deptId) {
            conditions.push(eq(students.deptId, options.deptId));
        }
        if (options?.programmeType) {
            conditions.push(eq(students.programmeType, options.programmeType as "ND" | "HND"));
        }
        if (options?.level) {
            conditions.push(eq(students.currentLevel, options.level));
        }
        if (options?.matricStatus === "assigned") {
            conditions.push(isNotNull(students.matricNumber));
        } else if (options?.matricStatus === "pending") {
            conditions.push(isNull(students.matricNumber));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [totalRow] = await db
            .select({ value: count() })
            .from(students)
            .where(whereClause);
        const total = totalRow.value;

        const data = await db
            .select({
                id: students.id,
                firstName: students.firstName,
                lastName: students.lastName,
                otherNames: students.otherNames,
                matricNumber: students.matricNumber,
                previousMatricNumbers: students.previousMatricNumbers,
                admissionNumber: students.admissionNumber,
                programmeType: students.programmeType,
                currentLevel: students.currentLevel,
                studyMode: students.studyMode,
                status: students.status,
                deptId: students.deptId,
                programmeId: students.programmeId,
                deptName: departments.name,
                deptCode: departments.code,
                programmeName: programmes.name,
            })
            .from(students)
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .where(whereClause)
            .orderBy(
                asc(students.matricNumber),
                asc(students.lastName),
                asc(students.firstName)
            )
            .limit(pageSize)
            .offset(offset);

        return {
            students: data.map((s) => ({
                ...s,
                previousMatricNumbers: s.previousMatricNumbers
                    ? JSON.parse(s.previousMatricNumbers)
                    : [],
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    } catch (error) {
        console.error("[getMatricStudents] Failed:", error);
        return { students: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
    }
}

export async function previewNextMatricNumber(options: {
    deptId?: number;
    programmeType?: string;
}) {
    await requireAdmin();
    try {
        const year = new Date().getFullYear();
        const result = await generateMatricNumber({
            year,
            deptId: options.deptId,
        });
        return result;
    } catch (error) {
        console.error("[previewNextMatricNumber] Failed:", error);
        return { success: false, error: "Failed to preview" };
    }
}

export async function assignMatricNumber(studentId: number, matricNumber: string, reason?: string) {
    await requireAdmin();
    try {
        const admin = await requireAdmin();
        const adminUser = admin as any;
        const adminId = adminUser?.id;

        const student = await db.query.students.findFirst({
            where: eq(students.id, studentId),
        });
        if (!student) return { success: false, error: "Student not found" };
        if (student.matricNumber) {
            return { success: false, error: "Student already has a matriculation number. Use Change instead." };
        }

        const trimmed = matricNumber.trim();
        if (!trimmed) return { success: false, error: "Matriculation number cannot be empty" };

        const existing = await db.query.students.findFirst({
            where: eq(students.matricNumber, trimmed),
        });
        if (existing) {
            return { success: false, error: `Duplicate: "${trimmed}" is already assigned to another student.` };
        }

        await db.transaction(async (tx) => {
            await tx.update(students)
                .set({ matricNumber: trimmed })
                .where(eq(students.id, studentId));

            await tx.insert(matriculationAuditLog).values({
                studentId,
                action: "assigned",
                oldMatric: null,
                newMatric: trimmed,
                reason: reason || null,
                performedById: adminId,
            });
        });

        revalidatePath("/admin/registrar/matriculation");
        return { success: true };
    } catch (error) {
        console.error("[assignMatricNumber] Failed:", error);
        return { success: false, error: "Failed to assign matriculation number" };
    }
}

export async function changeMatricNumber(studentId: number, newMatricNumber: string, reason: string) {
    await requireAdmin();
    try {
        const admin = await requireAdmin();
        const adminUser = admin as any;
        const adminId = adminUser?.id;

        if (!reason?.trim()) {
            return { success: false, error: "Reason is required for changing a matriculation number" };
        }

        const student = await db.query.students.findFirst({
            where: eq(students.id, studentId),
        });
        if (!student) return { success: false, error: "Student not found" };

        const trimmed = newMatricNumber.trim();
        if (!trimmed) return { success: false, error: "Matriculation number cannot be empty" };

        if (student.matricNumber === trimmed) {
            return { success: false, error: "New number is the same as the current one" };
        }

        const existing = await db.query.students.findFirst({
            where: eq(students.matricNumber, trimmed),
        });
        if (existing) {
            return { success: false, error: `Duplicate: "${trimmed}" is already assigned to another student.` };
        }

        const oldMatric = student.matricNumber;
        const previousList: string[] = student.previousMatricNumbers
            ? JSON.parse(student.previousMatricNumbers)
            : [];
        if (oldMatric && !previousList.includes(oldMatric)) {
            previousList.push(oldMatric);
        }

        await db.transaction(async (tx) => {
            await tx.update(students)
                .set({
                    matricNumber: trimmed,
                    previousMatricNumbers: JSON.stringify(previousList),
                })
                .where(eq(students.id, studentId));

            await tx.insert(matriculationAuditLog).values({
                studentId,
                action: "changed",
                oldMatric,
                newMatric: trimmed,
                reason,
                performedById: adminId,
            });
        });

        revalidatePath("/admin/registrar/matriculation");
        return { success: true };
    } catch (error) {
        console.error("[changeMatricNumber] Failed:", error);
        return { success: false, error: "Failed to change matriculation number" };
    }
}

export async function restoreMatricNumber(studentId: number, restoreToMatric: string, reason: string) {
    await requireAdmin();
    try {
        const admin = await requireAdmin();
        const adminUser = admin as any;
        const adminId = adminUser?.id;

        if (!reason?.trim()) {
            return { success: false, error: "Reason is required for restoring a matriculation number" };
        }

        const student = await db.query.students.findFirst({
            where: eq(students.id, studentId),
        });
        if (!student) return { success: false, error: "Student not found" };

        const trimmed = restoreToMatric.trim();
        const previousList: string[] = student.previousMatricNumbers
            ? JSON.parse(student.previousMatricNumbers)
            : [];

        if (!previousList.includes(trimmed)) {
            return { success: false, error: `"${trimmed}" is not in the student's previous matriculation numbers` };
        }

        const duplicate = await db.query.students.findFirst({
            where: and(
                eq(students.matricNumber, trimmed),
                sql`${students.id} != ${studentId}`
            ),
        });
        if (duplicate) {
            return { success: false, error: `Cannot restore: "${trimmed}" is currently assigned to another student.` };
        }

        const oldMatric = student.matricNumber;
        const updatedPrevious = previousList.filter((m) => m !== trimmed);

        await db.transaction(async (tx) => {
            await tx.update(students)
                .set({
                    matricNumber: trimmed,
                    previousMatricNumbers: JSON.stringify(updatedPrevious),
                })
                .where(eq(students.id, studentId));

            await tx.insert(matriculationAuditLog).values({
                studentId,
                action: "restored",
                oldMatric,
                newMatric: trimmed,
                reason,
                performedById: adminId,
            });
        });

        revalidatePath("/admin/registrar/matriculation");
        return { success: true };
    } catch (error) {
        console.error("[restoreMatricNumber] Failed:", error);
        return { success: false, error: "Failed to restore matriculation number" };
    }
}

export async function getMatricAuditLog(options?: {
    search?: string;
    action?: string;
    page?: number;
    pageSize?: number;
}) {
    await requireAdmin();
    try {
        const page = options?.page || 1;
        const pageSize = options?.pageSize || 50;
        const offset = (page - 1) * pageSize;

        const conditions: any[] = [];

        if (options?.action && options.action !== "all") {
            conditions.push(eq(matriculationAuditLog.action, options.action as any));
        }

        if (options?.search) {
            const s = `%${options.search}%`;
            conditions.push(
                or(
                    like(students.firstName, s),
                    like(students.lastName, s),
                    like(students.matricNumber, s),
                    like(matriculationAuditLog.newMatric, s),
                    like(matriculationAuditLog.oldMatric, s),
                    like(users.name, s),
                )
            );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [totalRow] = await db
            .select({ value: count() })
            .from(matriculationAuditLog)
            .leftJoin(students, eq(matriculationAuditLog.studentId, students.id))
            .leftJoin(users, eq(matriculationAuditLog.performedById, users.id))
            .where(whereClause);
        const total = totalRow.value;

        const data = await db
            .select({
                id: matriculationAuditLog.id,
                action: matriculationAuditLog.action,
                oldMatric: matriculationAuditLog.oldMatric,
                newMatric: matriculationAuditLog.newMatric,
                reason: matriculationAuditLog.reason,
                createdAt: matriculationAuditLog.createdAt,
                studentId: students.id,
                studentFirstName: students.firstName,
                studentLastName: students.lastName,
                studentDeptId: students.deptId,
                deptName: departments.name,
                performedById: users.id,
                performedByName: users.name,
            })
            .from(matriculationAuditLog)
            .leftJoin(students, eq(matriculationAuditLog.studentId, students.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(users, eq(matriculationAuditLog.performedById, users.id))
            .where(whereClause)
            .orderBy(desc(matriculationAuditLog.createdAt))
            .limit(pageSize)
            .offset(offset);

        return {
            logs: data,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    } catch (error) {
        console.error("[getMatricAuditLog] Failed:", error);
        return { logs: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
    }
}

export async function getStudentMatricHistory(studentId: number) {
    await requireAdmin();
    try {
        const student = await db.query.students.findFirst({
            where: eq(students.id, studentId),
        });
        if (!student) return null;

        const logs = await db
            .select({
                id: matriculationAuditLog.id,
                action: matriculationAuditLog.action,
                oldMatric: matriculationAuditLog.oldMatric,
                newMatric: matriculationAuditLog.newMatric,
                reason: matriculationAuditLog.reason,
                createdAt: matriculationAuditLog.createdAt,
                performedByName: users.name,
            })
            .from(matriculationAuditLog)
            .leftJoin(users, eq(matriculationAuditLog.performedById, users.id))
            .where(eq(matriculationAuditLog.studentId, studentId))
            .orderBy(desc(matriculationAuditLog.createdAt));

        return {
            student: {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                matricNumber: student.matricNumber,
                previousMatricNumbers: student.previousMatricNumbers
                    ? JSON.parse(student.previousMatricNumbers)
                    : [],
            },
            logs,
        };
    } catch (error) {
        console.error("[getStudentMatricHistory] Failed:", error);
        return null;
    }
}
