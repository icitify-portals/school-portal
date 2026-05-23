"use strict";
"use server";

import { db } from "@/db/db";
import { programmes, departments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

export async function createProgramme(name: string, deptId: number, durationMonths: number) {
    try {
        await db.insert(programmes).values({ name, deptId, durationMonths });
        revalidatePath("/admin/programmes");
        return { success: true };
    } catch (error) {
        console.error("Failed to create programme:", error);
        return { success: false, error: "Failed to create programme" };
    }
}

export async function deleteProgramme(id: number) {
    try {
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
