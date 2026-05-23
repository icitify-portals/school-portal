"use strict";
"use server";

import { db } from "@/db/db";
import { departments, faculties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getDepartments() {
    try {
        const allDepts = await db.select().from(departments);
        const allFaculties = await db.select().from(faculties);

        return allDepts.map(d => ({
            ...d,
            faculty: allFaculties.find(f => f.id === d.facultyId)
        }));
    } catch (error) {
        console.error("Failed to fetch departments:", error);
        return [];
    }
}

export async function createDepartment(name: string, code: string, facultyId: number, data?: any) {
    try {
        await db.insert(departments).values({
            name,
            code,
            facultyId,
            minUnitsAnnual: data?.minUnitsAnnual || 24,
            maxUnitsAnnual: data?.maxUnitsAnnual || 48,
            minUnitsSemester: data?.minUnitsSemester || 12,
            maxUnitsSemester: data?.maxUnitsSemester || 24,
        });
        revalidatePath("/admin/departments");
        return { success: true };
    } catch (error) {
        console.error("Failed to create department:", error);
        return { success: false, error: "Failed to create department" };
    }
}

export async function updateDepartment(id: number, data: any) {
    try {
        await db.update(departments)
            .set(data)
            .where(eq(departments.id, id));
        revalidatePath("/admin/departments");
        return { success: true };
    } catch (error) {
        console.error("Failed to update department:", error);
        return { success: false, error: "Failed to update department" };
    }
}

export async function deleteDepartment(id: number) {
    try {
        await db.delete(departments).where(eq(departments.id, id));
        revalidatePath("/admin/departments");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete department:", error);
        return { success: false, error: "Failed to delete department" };
    }
}

export async function bulkImportDepartments(data: any[]) {
    try {
        await db.transaction(async (tx) => {
            for (const row of data) {
                const { name, code, facultyId } = row;
                if (!name || !code || !facultyId) continue;

                // Check if dept exists
                const existing = await tx.select().from(departments).where(eq(departments.code, code)).limit(1);
                if (existing.length > 0) continue;

                await tx.insert(departments).values({
                    name,
                    code,
                    facultyId: parseInt(facultyId)
                });
            }
        });

        revalidatePath("/admin/departments");
        return { success: true, message: `Successfully processed ${data.length} records.` };
    } catch (error) {
        console.error("Bulk Dept Import Error:", error);
        return { success: false, error: "Failed to process bulk import. Ensure department codes are unique." };
    }
}
