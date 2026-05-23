"use server";

import { db } from "@/db/db";
import { 
    students, 
    movementLogs, 
    userRoles,
    users,
    institutionalUnits
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Transfer a student from one branch to another.
 * Handles: unitId update, matricNumber archiving, log generation, and legacy access.
 */
export async function transferStudent(data: {
    studentId: number;
    toUnitId: number;
    newMatricNumber: string;
    reason: string;
    movedBy: number;
}) {
    try {
        const [student] = await db.select().from(students).where(eq(students.id, data.studentId)).limit(1);
        if (!student) throw new Error("Student not found");

        const fromUnitId = student.unitId;
        
        // 1. Update previous matric numbers and legacy access
        const previousMatrics = JSON.parse(student.previousMatricNumbers || "[]");
        if (student.matricNumber) previousMatrics.push(student.matricNumber);

        const legacyUnits = JSON.parse(student.legacyAccessUnits || "[]");
        if (fromUnitId && !legacyUnits.includes(fromUnitId)) legacyUnits.push(fromUnitId);

        // 2. Perform transfer in a transaction
        await db.transaction(async (tx) => {
            // Update Student record
            await tx.update(students)
                .set({
                    unitId: data.toUnitId,
                    matricNumber: data.newMatricNumber,
                    previousMatricNumbers: JSON.stringify(previousMatrics),
                    legacyAccessUnits: JSON.stringify(legacyUnits),
                })
                .where(eq(students.id, data.studentId));

            // Log the movement
            await tx.insert(movementLogs).values({
                entityId: student.userId!,
                entityType: 'student',
                fromUnitId: fromUnitId,
                toUnitId: data.toUnitId,
                movedBy: data.movedBy,
                reason: data.reason
            });
        });

        revalidatePath("/super-admin/dashboard");
        revalidatePath("/admin/students");
        return { success: true };
    } catch (error) {
        console.error("Transfer failed:", error);
        return { success: false, error: "Transfer operation failed" };
    }
}

/**
 * Assign or Reassign staff to a branch.
 */
export async function assignStaff(data: {
    userId: number;
    unitId: number;
    roleId: number;
    movedBy: number;
    reason: string;
}) {
    try {
        // Add role entry for the unit
        await db.insert(userRoles).values({
            userId: data.userId,
            roleId: data.roleId,
            unitId: data.unitId
        });

        // Log the assignment
        await db.insert(movementLogs).values({
            entityId: data.userId,
            entityType: 'staff',
            toUnitId: data.unitId,
            movedBy: data.movedBy,
            reason: data.reason
        });

        revalidatePath("/super-admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Staff assignment failed:", error);
        return { success: false, error: "Assignment failed" };
    }
}
