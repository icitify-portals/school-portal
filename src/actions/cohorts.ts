"use strict";
"use server";

import { db } from "@/db/db";
import { cohorts, userCohorts, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAllCohorts() {
    try {
        const allCohorts = await db.select().from(cohorts);
        const userCounts = await db.select({
            cohortId: userCohorts.cohortId,
        }).from(userCohorts);

        return allCohorts.map(c => ({
            ...c,
            userCount: userCounts.filter(uc => uc.cohortId === c.id).length
        }));
    } catch (error) {
        console.error("Failed to fetch cohorts:", error);
        return [];
    }
}

export async function createCohort(name: string, description: string) {
    try {
        await db.insert(cohorts).values({ name, description });
        revalidatePath("/admin/cohorts");
        return { success: true };
    } catch (error) {
        console.error("Failed to create cohort:", error);
        return { success: false, error: "Cohort name must be unique" };
    }
}

export async function addUsersToCohort(cohortId: number, userIds: number[]) {
    try {
        await db.transaction(async (tx) => {
            for (const userId of userIds) {
                const existing = await tx.select().from(userCohorts)
                    .where(and(eq(userCohorts.userId, userId), eq(userCohorts.cohortId, cohortId)))
                    .limit(1);

                if (existing.length === 0) {
                    await tx.insert(userCohorts).values({ userId, cohortId });
                }
            }
        });
        revalidatePath("/admin/cohorts");
        return { success: true };
    } catch (error) {
        console.error("Failed to add users to cohort:", error);
        return { success: false, error: "Operation failed" };
    }
}

export async function removeUserFromCohort(cohortId: number, userId: number) {
    try {
        await db.delete(userCohorts).where(
            and(eq(userCohorts.userId, userId), eq(userCohorts.cohortId, cohortId))
        );
        revalidatePath("/admin/cohorts");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to remove user" };
    }
}
