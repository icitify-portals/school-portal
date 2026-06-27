"use strict";
"use server";

import { db } from "@/db/db";
import { faculties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getFaculties() {
    try {
        return await db.select().from(faculties);
    } catch (error) {
        console.error("Failed to fetch faculties:", error);
        return [];
    }
}

export async function createFaculty(name: string, code: string) {
    try {
        const allowed = await hasPermission("academic.faculties.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to create faculty" };

        await db.insert(faculties).values({ name, code });
        revalidatePath("/admin/faculties");
        revalidatePath("/admin/departments");
        return { success: true };
    } catch (error) {
        console.error("Failed to create faculty:", error);
        return { success: false, error: "Failed to create faculty (Code must be unique)" };
    }
}

export async function deleteFaculty(id: number) {
    try {
        const allowed = await hasPermission("academic.faculties.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to delete faculty" };

        await db.delete(faculties).where(eq(faculties.id, id));
        revalidatePath("/admin/faculties");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete faculty:", error);
        return { success: false, error: "Cannot delete faculty with existing departments" };
    }
}

export async function bulkImportFaculties(data: any[]) {
    try {
        const allowed = await hasPermission("academic.faculties.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to import faculties" };

        await db.transaction(async (tx) => {
            for (const row of data) {
                const { name, code } = row;
                if (!name || !code) continue;

                // Check if faculty exists
                const existing = await tx.select().from(faculties).where(eq(faculties.code, code)).limit(1);
                if (existing.length > 0) continue;

                await tx.insert(faculties).values({ name, code });
            }
        });

        revalidatePath("/admin/faculties");
        revalidatePath("/admin/departments");
        return { success: true, message: `Successfully processed ${data.length} records.` };
    } catch (error) {
        console.error("Bulk Faculty Import Error:", error);
        return { success: false, error: "Failed to process bulk import. Ensure faculty codes are unique." };
    }
}
