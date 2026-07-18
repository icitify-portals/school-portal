"use strict";
"use server";

import { db } from "@/db/db";
import { programmes, departments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getProgrammes() {
    try {
        const allProgrammes = await db.select().from(programmes);
        const allDepts = await db.select().from(departments);

        return allProgrammes.map(p => ({
            ...p,
            department: allDepts.find(d => d.id === p.deptId)
        }));
    } catch (error) {
        console.error("Failed to fetch programmes:", error);
        return [];
    }
}

export async function createProgramme(name: string, deptId: number, durationMonths: number, code?: string, durationYears?: number) {
    try {
        const allowed = await hasPermission("academic.programmes.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to create programme" };

        await db.insert(programmes).values({ name, deptId, durationMonths, code, durationYears });
        revalidatePath("/admin/programmes");
        return { success: true };
    } catch (error) {
        console.error("Failed to create programme:", error);
        return { success: false, error: "Failed to create programme" };
    }
}

export async function updateProgramme(id: number, data: { name?: string; deptId?: number; durationMonths?: number; code?: string; durationYears?: number }) {
    try {
        const allowed = await hasPermission("academic.programmes.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to update programme" };

        await db.update(programmes).set(data).where(eq(programmes.id, id));
        revalidatePath("/admin/programmes");
        return { success: true };
    } catch (error) {
        console.error("Failed to update programme:", error);
        return { success: false, error: "Failed to update programme" };
    }
}

export async function deleteProgramme(id: number) {
    try {
        const allowed = await hasPermission("academic.programmes.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to delete programme" };

        await db.delete(programmes).where(eq(programmes.id, id));
        revalidatePath("/admin/programmes");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete programme:", error);
        return { success: false, error: "Failed to delete programme" };
    }
}

export async function bulkImportProgrammes(data: any[]) {
    try {
        const allowed = await hasPermission("academic.programmes.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to import programmes" };

        await db.transaction(async (tx) => {
            for (const row of data) {
                const { name, deptId, durationMonths } = row;
                if (!name || !deptId) continue;

                await tx.insert(programmes).values({
                    name,
                    deptId: parseInt(deptId),
                    durationMonths: parseInt(durationMonths) || 48
                });
            }
        });

        revalidatePath("/admin/programmes");
        return { success: true, message: `Successfully processed ${data.length} records.` };
    } catch (error) {
        console.error("Bulk Programme Import Error:", error);
        return { success: false, error: "Failed to process bulk import." };
    }
}
