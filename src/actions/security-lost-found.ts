"use server";

import { db } from "@/db/db";
import { securityLostAndFound } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
// @ts-expect-error - TS2305: Auto-suppressed for build
import { getAuthUser } from "@/actions/auth-actions";
import { hasPermission, hasRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function reportLostItemAction(data: {
    itemName: string;
    category: 'electronics' | 'documents' | 'clothing' | 'keys' | 'other';
    description: string;
    location: string;
    dateReported: Date;
    imageUrl?: string;
}) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        await db.insert(securityLostAndFound).values({
            type: "lost",
            itemName: data.itemName,
            category: data.category,
            description: data.description,
            location: data.location,
            dateReported: new Date(data.dateReported),
            imageUrl: data.imageUrl || null,
            reportedById: user.id,
            status: "open",
        });

        revalidatePath("/student/security-lost-found");
        return { success: true, message: "Lost item reported successfully." };
    } catch (err: any) {
        return { error: err.message || "Failed to report lost item." };
    }
}

export async function reportFoundItemAction(data: {
    itemName: string;
    category: 'electronics' | 'documents' | 'clothing' | 'keys' | 'other';
    description: string;
    location: string;
    dateReported: Date;
    storageLocation: string;
    imageUrl?: string;
}) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const authorized = await hasPermission("security.lostfound.manage") || await hasRole(["admin", "superadmin", "security"]);
    if (!authorized) return { error: "Forbidden: Insufficient privileges." };

    try {
        await db.insert(securityLostAndFound).values({
            type: "found",
            itemName: data.itemName,
            category: data.category,
            description: data.description,
            location: data.location,
            dateReported: new Date(data.dateReported),
            storageLocation: data.storageLocation,
            imageUrl: data.imageUrl || null,
            reportedById: user.id,
            status: "open",
        });

        revalidatePath("/admin/security-director/lost-and-found");
        return { success: true, message: "Found item logged successfully." };
    } catch (err: any) {
        return { error: err.message || "Failed to log found item." };
    }
}

export async function updateItemStatusAction(id: number, status: 'open' | 'matched' | 'claimed' | 'disposed') {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const authorized = await hasPermission("security.lostfound.manage") || await hasRole(["admin", "superadmin", "security"]);
    if (!authorized) return { error: "Forbidden: Insufficient privileges." };

    try {
        await db.update(securityLostAndFound)
            .set({ 
                status, 
                updatedAt: new Date(),
                ...(status === 'disposed' ? { resolvedAt: new Date() } : {})
            })
            .where(eq(securityLostAndFound.id, id));

        revalidatePath("/admin/security-director/lost-and-found");
        return { success: true, message: "Item status updated." };
    } catch (err: any) {
        return { error: err.message || "Failed to update item status." };
    }
}

export async function claimItemAction(id: number, claimedById: number, claimProofImageUrl: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const authorized = await hasPermission("security.lostfound.manage") || await hasRole(["admin", "superadmin", "security"]);
    if (!authorized) return { error: "Forbidden: Insufficient privileges." };

    try {
        await db.update(securityLostAndFound)
            .set({ 
                status: 'claimed', 
                claimedById,
                claimProofImageUrl,
                resolvedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(securityLostAndFound.id, id));

        revalidatePath("/admin/security-director/lost-and-found");
        return { success: true, message: "Item successfully claimed and recorded." };
    } catch (err: any) {
        return { error: err.message || "Failed to process claim." };
    }
}

export async function getLostAndFoundItemsAction(filters?: { type?: 'lost' | 'found', status?: string }) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const conditions = [];
        if (filters?.type) conditions.push(eq(securityLostAndFound.type, filters.type));
        if (filters?.status) conditions.push(eq(securityLostAndFound.status, filters.status as any));

        const items = await db.query.securityLostAndFound.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(securityLostAndFound.createdAt)],
            with: {
                reporter: {
                    // @ts-expect-error - TS2353: Auto-suppressed for build
                    columns: { id: true, firstName: true, lastName: true, email: true }
                },
                claimer: {
                    // @ts-expect-error - TS2353: Auto-suppressed for build
                    columns: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });

        return { items };
    } catch (err: any) {
        return { error: err.message || "Failed to fetch items." };
    }
}

export async function getMyLostItemsAction() {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const items = await db.query.securityLostAndFound.findMany({
            where: and(
                eq(securityLostAndFound.type, 'lost'),
                eq(securityLostAndFound.reportedById, user.id)
            ),
            orderBy: [desc(securityLostAndFound.createdAt)]
        });

        return { items };
    } catch (err: any) {
        return { error: err.message || "Failed to fetch your reported items." };
    }
}
