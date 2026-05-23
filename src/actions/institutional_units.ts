"use server";

import { db } from "@/db/db";
import { institutionalUnits, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getInstitutionalUnits() {
    try {
        const units = await db.select({
            unit: institutionalUnits,
            head: {
                id: users.id,
                name: users.name,
                email: users.email
            }
        })
            .from(institutionalUnits)
            .leftJoin(users, eq(institutionalUnits.headUserId, users.id));
        return units;
    } catch (error) {
        console.error("Failed to fetch units:", error);
        return [];
    }
}

export async function createInstitutionalUnit(data: {
    name: string;
    code: string;
    type: 'campus' | 'school' | 'college' | 'unit';
    headTitle?: string;
    headUserId?: number;
    settings?: string;
}) {
    try {
        await db.insert(institutionalUnits).values(data);
        revalidatePath("/admin/settings/units");
        return { success: true };
    } catch (error) {
        console.error("Failed to create unit:", error);
        return { success: false, error: "Unit creation failed" };
    }
}

export async function updateInstitutionalUnit(id: number, data: Partial<{
    name: string;
    code: string;
    type: 'campus' | 'school' | 'college' | 'unit';
    headTitle?: string;
    headUserId?: number;
    settings?: string;
    isActive: boolean;
}>) {
    try {
        await db.update(institutionalUnits)
            .set(data)
            .where(eq(institutionalUnits.id, id));
        revalidatePath("/admin/settings/units");
        return { success: true };
    } catch (error) {
        console.error("Failed to update unit:", error);
        return { success: false, error: "Unit update failed" };
    }
}

export async function deleteInstitutionalUnit(id: number) {
    try {
        await db.delete(institutionalUnits).where(eq(institutionalUnits.id, id));
        revalidatePath("/admin/settings/units");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete unit:", error);
        
        // Handle Foreign Key constraints
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return { 
                success: false, 
                error: "Integrity Constraint: This branch contains active students, faculties, or departments and cannot be deleted. Please deactivate it instead or move the data first." 
            };
        }
        
        return { success: false, error: "Unit deletion failed. System error." };
    }
}
