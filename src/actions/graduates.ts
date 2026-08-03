"use server";

import { db } from "@/db/db";
import { students, users, departments, feeAllocations } from "@/db/schema";
import { eq, and, or, like, desc, inArray, count, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasRole, hasPermission } from "@/lib/rbac";

export async function getGraduates(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    programmeType?: 'ND' | 'HND' | 'all';
    status?: 'nd_graduated' | 'hnd_graduated' | 'all';
    deptId?: number;
}) {
    try {
        const canManage = await hasPermission("users.manage") || await hasRole("registrar") || await hasRole("bursar");
        if (!canManage) throw new Error("Unauthorized access");

        const page = options.page || 1;
        const pageSize = options.pageSize || 10;
        const offset = (page - 1) * pageSize;

        const conditions = [];
        
        // Base condition: Only graduated students (unless explicitly requesting all for some reason, but we restrict it)
        if (options.status && options.status !== 'all') {
            conditions.push(eq(students.status, options.status));
        } else {
            // Default: Both ND and HND graduated
            conditions.push(inArray(students.status, ['nd_graduated', 'hnd_graduated']));
        }

        if (options.programmeType && options.programmeType !== 'all') {
            conditions.push(eq(students.programmeType, options.programmeType));
        }

        if (options.deptId) {
            conditions.push(eq(students.deptId, options.deptId));
        }

        if (options.search) {
            const term = `%${options.search}%`;
            conditions.push(
                or(
                    like(users.name, term),
                    like(students.matricNumber, term),
                    like(students.admissionNumber, term)
                )
            );
        }

        const queryConditions = conditions.length > 0 ? and(...conditions) : undefined;

        // Count total
        const [totalRes] = await db
            .select({ count: count() })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(queryConditions);

        const totalCount = totalRes?.count || 0;

        // Fetch paginated data
        const data = await db.select({
            id: students.id,
            userId: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            matricNumber: students.matricNumber,
            admissionNumber: students.admissionNumber,
            programmeType: students.programmeType,
            currentLevel: students.currentLevel,
            status: students.status,
            departmentName: departments.name,
            imageUrl: students.imageUrl
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(queryConditions)
        .orderBy(desc(students.id))
        .limit(pageSize)
        .offset(offset);

        return { success: true, data, totalCount };
    } catch (error: any) {
        console.error("Failed to fetch graduates:", error);
        return { success: false, error: error.message || "Failed to fetch graduates" };
    }
}

export async function bulkAllocateFeeToGraduates(studentIds: number[], feeStructureId: number) {
    try {
        const canManage = await hasPermission("finance.ledger.manage") || await hasRole("bursar");
        if (!canManage) throw new Error("Unauthorized to allocate fees");

        if (!studentIds.length || !feeStructureId) {
            return { success: false, error: "Invalid selection" };
        }

        // Insert individually to handle IGNORE duplicates effectively
        const values = studentIds.map(id => ({
            feeStructureId,
            targetType: 'student' as const,
            studentId: id
        }));

        // Insert using raw query to skip duplicates safely if one already exists
        for(const val of values) {
           await db.insert(feeAllocations).values(val).onDuplicateKeyUpdate({ set: { feeStructureId: sql`feeStructureId` }});
        }
        
        revalidatePath("/admin/graduates");
        return { success: true, count: values.length };
    } catch (error: any) {
        console.error("Failed to bulk allocate fee:", error);
        return { success: false, error: error.message || "Failed to allocate fees" };
    }
}

export async function updateStudentStatus(studentId: number, status: string, currentLevel: number) {
    try {
        const canManage = await hasPermission("users.manage") || await hasRole("registrar");
        if (!canManage) throw new Error("Unauthorized to edit student status");

        await db.update(students)
            .set({ 
                // @ts-expect-error
                status: status, 
                currentLevel 
            })
            .where(eq(students.id, studentId));
            
        revalidatePath("/admin/graduates");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update student status:", error);
        return { success: false, error: error.message || "Failed to update status" };
    }
}
