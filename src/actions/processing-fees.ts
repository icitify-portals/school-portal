"use server";

import { db } from "@/db/db";
import { processingFeeRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getAllProcessingFeeRules() {
    try {
        const rules = await db.select().from(processingFeeRules);
        return { success: true, data: rules };
    } catch (error) {
        console.error("Failed to fetch processing fee rules:", error);
        return { success: false, error: "Failed to fetch processing fee rules." };
    }
}

export async function saveProcessingFeeRule(data: { id?: number; serviceType: string; amount: number; isActive: boolean }) {
    try {
        const session = await auth();
        const actorRole = (session?.user as any)?.role?.toLowerCase() || "";
        if (actorRole !== 'icitify_dev') {
            return { success: false, error: "Unauthorized: Only Icitify Developer can modify processing fee rules." };
        }

        if (data.id) {
            await db.update(processingFeeRules).set({
                serviceType: data.serviceType,
                amount: data.amount.toString(),
                isActive: data.isActive
            }).where(eq(processingFeeRules.id, data.id));
        } else {
            // Check if serviceType already exists
            const existing = await db.select().from(processingFeeRules).where(eq(processingFeeRules.serviceType, data.serviceType)).limit(1);
            if (existing.length > 0) {
                return { success: false, error: "A rule for this Service Type already exists." };
            }

            await db.insert(processingFeeRules).values({
                serviceType: data.serviceType,
                amount: data.amount.toString(),
                isActive: data.isActive
            });
        }

        revalidatePath("/super-admin/processing-fees");
        return { success: true, message: "Processing fee rule saved successfully." };
    } catch (error) {
        console.error("Failed to save processing fee rule:", error);
        return { success: false, error: "Failed to save processing fee rule." };
    }
}

export async function deleteProcessingFeeRule(id: number) {
    try {
        const session = await auth();
        const actorRole = (session?.user as any)?.role?.toLowerCase() || "";
        if (actorRole !== 'icitify_dev') {
            return { success: false, error: "Unauthorized: Only Icitify Developer can delete processing fee rules." };
        }

        await db.delete(processingFeeRules).where(eq(processingFeeRules.id, id));
        revalidatePath("/super-admin/processing-fees");
        return { success: true, message: "Processing fee rule deleted successfully." };
    } catch (error) {
        console.error("Failed to delete processing fee rule:", error);
        return { success: false, error: "Failed to delete processing fee rule." };
    }
}
