"use server";

import { db } from "@/db/db";
import { cmsMedia } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getMediaLibrary() {
    try {
        const media = await db.query.cmsMedia.findMany({
            orderBy: [desc(cmsMedia.createdAt)]
        });
        return { success: true, data: media };
    } catch (error) {
        console.error("Fetch media error:", error);
        return { success: false, error: "Failed to fetch media library" };
    }
}

export async function registerMedia(data: {
    filename: string;
    url: string;
    mimeType?: string;
    sizeBytes?: number;
    altText?: string;
    uploaderId?: number;
}) {
    try {
        const isAllowed = await hasPermission("cms.media.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };
        const [result] = await db.insert(cmsMedia).values(data);
        revalidatePath("/admin/cms");
        return { success: true, id: (result as any).insertId };
    } catch (error: any) {
        console.error("Register media error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteMedia(id: number) {
    try {
        const isAllowed = await hasPermission("cms.media.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };
        await db.delete(cmsMedia).where(eq(cmsMedia.id, id));
        revalidatePath("/admin/cms");
        return { success: true };
    } catch (error: any) {
        console.error("Delete media error:", error);
        return { success: false, error: "Failed to delete media record" };
    }
}
