"use server";

import { db } from "@/db";
import { reportCardRubrics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getReportCardRubrics() {
    try {
        const rubrics = await db.select().from(reportCardRubrics);
        return rubrics.map(r => ({
            ...r,
            columnsConfig: r.columnsConfig ? JSON.parse(r.columnsConfig) : []
        }));
    } catch (e: any) {
        console.error("Failed to fetch rubrics", e);
        return [];
    }
}

export async function saveReportCardRubric(data: any) {
    try {
        if (data.id) {
            await db.update(reportCardRubrics)
                .set({
                    name: data.name,
                    isMidTerm: data.isMidTerm,
                    columnsConfig: JSON.stringify(data.columnsConfig),
                    isActive: data.isActive
                })
                .where(eq(reportCardRubrics.id, data.id));
        } else {
            await db.insert(reportCardRubrics).values({
                name: data.name,
                isMidTerm: data.isMidTerm,
                columnsConfig: JSON.stringify(data.columnsConfig),
                isActive: data.isActive !== undefined ? data.isActive : true
            });
        }
        revalidatePath("/admin/settings/academic/rubrics");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteReportCardRubric(id: number) {
    try {
        await db.delete(reportCardRubrics).where(eq(reportCardRubrics.id, id));
        revalidatePath("/admin/settings/academic/rubrics");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
