"use server";

import { db } from "@/db/db";
import { cmsTerms, cmsTermRelationships } from "@/db/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getTerms(vocabulary: string) {
    try {
        const terms = await db.select()
            .from(cmsTerms)
            .where(eq(cmsTerms.vocabulary, vocabulary))
            .orderBy(asc(cmsTerms.name));
        return { success: true, data: terms };
    } catch (error) {
        console.error("Fetch terms error:", error);
        return { success: false, error: "Failed to fetch terms" };
    }
}

export async function upsertTerm(data: any) {
    try {
        const isAllowed = await hasPermission("cms.taxonomy.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };
        if (data.id) {
            await db.update(cmsTerms).set(data).where(eq(cmsTerms.id, data.id));
        } else {
            await db.insert(cmsTerms).values(data);
        }
        revalidatePath("/admin/cms");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getEntityTerms(entityType: 'news' | 'event' | 'page', entityId: number) {
    try {
        const rels = await db.select({
            termId: cmsTerms.id,
            name: cmsTerms.name,
            vocabulary: cmsTerms.vocabulary
        })
        .from(cmsTermRelationships)
        .innerJoin(cmsTerms, eq(cmsTermRelationships.termId, cmsTerms.id))
        .where(
            and(
                eq(cmsTermRelationships.entityType, entityType),
                eq(cmsTermRelationships.entityId, entityId)
            )
        );
        return { success: true, data: rels };
    } catch (error) {
        return { success: false, error: "Failed to fetch entity terms" };
    }
}

export async function setEntityTerms(entityType: 'news' | 'event' | 'page', entityId: number, termIds: number[]) {
    try {
        const isAllowed = await hasPermission("cms.taxonomy.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };
        // First delete existing relationships for this entity
        await db.delete(cmsTermRelationships).where(
            and(
                eq(cmsTermRelationships.entityType, entityType),
                eq(cmsTermRelationships.entityId, entityId)
            )
        );

        // Then insert new ones
        if (termIds.length > 0) {
            const values = termIds.map(tid => ({
                entityType,
                entityId,
                termId: tid
            }));
            await db.insert(cmsTermRelationships).values(values);
        }
        
        revalidatePath("/admin/cms");
        return { success: true };
    } catch (error: any) {
        console.error("Set Entity Terms Error:", error);
        return { success: false, error: error.message };
    }
}
