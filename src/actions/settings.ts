"use server";

import { db } from "@/db/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hasRole, hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function getAutoApproveSetting() {
    const res = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, "auto_approve_course_registration")).limit(1);
    return res[0]?.settingValue === "true";
}

export async function toggleAutoApproveSettingAction(value: boolean) {
    const isStaff = await hasPermission("academic.registration.approve") || await hasRole("admin") || await hasRole("superadmin");
    if (!isStaff) throw new Error("Unauthorized");

    const existing = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, "auto_approve_course_registration")).limit(1);
    if (existing[0]) {
        await db.update(systemSettings).set({ settingValue: value ? "true" : "false" }).where(eq(systemSettings.settingKey, "auto_approve_course_registration"));
    } else {
        await db.insert(systemSettings).values({ settingKey: "auto_approve_course_registration", settingValue: value ? "true" : "false" });
    }
    revalidatePath("/admin/registration/controls");
    return { success: true, value };
}
