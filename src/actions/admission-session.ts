'use server';

import { db } from "@/db";
import { admissionSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getAdmissionSessions() {
    try {
        const sessions = await db.select().from(admissionSessions).orderBy(desc(admissionSessions.startDate));
        return { success: true, sessions };
    } catch (error) {
        console.error("Error fetching admission sessions:", error);
        return { success: false, error: "Failed to fetch sessions" };
    }
}

export async function getAdmissionSession(id: number) {
    try {
        const [session] = await db.select().from(admissionSessions).where(eq(admissionSessions.id, id)).limit(1);
        return { success: true, session };
    } catch (error) {
        console.error("Error fetching session:", error);
        return { success: false, error: "Failed to fetch session" };
    }
}

export async function upsertAdmissionSession(data: any) {
    try {
        const allowed = await hasPermission("admission.sessions.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to manage admission sessions" };

        if (data.id) {
            await db.update(admissionSessions)
                .set({
                    ...data,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                })
                .where(eq(admissionSessions.id, data.id));
        } else {
            await db.insert(admissionSessions).values({
                ...data,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
            });
        }

        revalidatePath('/admin/admission/sessions');
        return { success: true };
    } catch (error) {
        console.error("Error saving admission session:", error);
        return { success: false, error: "Failed to save session" };
    }
}

export async function toggleSessionStatus(id: number, isActive: boolean) {
    try {
        const allowed = await hasPermission("admission.sessions.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to manage admission sessions" };

        await db.update(admissionSessions)
            .set({ isActive })
            .where(eq(admissionSessions.id, id));

        revalidatePath('/admin/admission/sessions');
        return { success: true };
    } catch (error) {
        console.error("Error toggling session status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
