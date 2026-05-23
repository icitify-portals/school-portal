"use server";

import { db } from "@/db/db";
import { journalAnnouncements } from "@/db/schema";
import { eq, and, gte, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(data: {
    journalId?: number;
    title: string;
    content: string;
    type: string;
    isPublic: boolean;
    expiryDate?: string;
}) {
    try {
        await db.insert(journalAnnouncements).values({
            ...data,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        });
        revalidatePath("/admin/staff/journal");
        revalidatePath("/student/journal");
        return { success: true };
    } catch (error) {
        console.error("Failed to create announcement:", error);
        return { success: false, error: "Database failure" };
    }
}

export async function getActiveAnnouncements() {
    try {
        const now = new Date();
        return await db.select().from(journalAnnouncements).where(
            or(
                eq(journalAnnouncements.expiryDate, null as any),
                gte(journalAnnouncements.expiryDate, now)
            )
        );
    } catch (error) {
        console.error("Failed to fetch announcements:", error);
        return [];
    }
}

export async function deleteAnnouncement(id: number) {
    try {
        await db.delete(journalAnnouncements).where(eq(journalAnnouncements.id, id));
        revalidatePath("/admin/staff/journal");
        revalidatePath("/student/journal");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete announcement:", error);
        return { success: false };
    }
}
