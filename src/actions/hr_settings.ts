"use server";

import { db } from "@/db/db";
import { hrSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getHRSettings() {
    const results = await db.select().from(hrSettings);
    const settings: Record<string, string> = {};
    results.forEach(s => {
        settings[s.settingKey] = s.value;
    });
    return settings;
}

export async function updateHRSettings(data: Record<string, string>) {
    try {
        await db.transaction(async (tx) => {
            for (const [key, value] of Object.entries(data)) {
                await tx.insert(hrSettings)
                    .values({ settingKey: key, value })
                    .onDuplicateKeyUpdate({ set: { value } });
            }
        });
        revalidatePath("/admin/hr/settings");
        return { success: true };
    } catch (error) {
        console.error("Update HR settings error:", error);
        return { success: false, error: "Failed to update HR settings" };
    }
}
