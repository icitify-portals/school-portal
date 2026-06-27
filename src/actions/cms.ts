"use server";

import { db } from "@/db/db";
import { cmsPages, cmsPageRevisions, cmsMenus, cmsHomePageSections, cmsSectionMedia, users } from "@/db/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

// --- PAGE ACTIONS ---

// --- PAGE ACTIONS ---

export async function getPages(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const pages = await db.query.cmsPages.findMany({
            orderBy: [desc(cmsPages.createdAt)]
        });
        return { success: true, data: pages };
    } catch (error) {
        return { success: false, error: "Failed to fetch pages" };
    }
}

export async function getPageById(id: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const page = await db.query.cmsPages.findFirst({
            where: eq(cmsPages.id, id)
        });
        if (!page) return { success: false, error: "Page not found" };
        return { success: true, data: page };
    } catch (error) {
        return { success: false, error: "Failed to fetch page" };
    }
}

export async function getPageBySlug(slug: string, locale: string = 'en') {
    try {
        // Try to get the specific locale version
        let page = await db.query.cmsPages.findFirst({
            where: and(eq(cmsPages.slug, slug), eq(cmsPages.locale, locale), eq(cmsPages.status, 'published')),
        });

        // Fallback to English if the requested locale isn't published yet
        if (!page && locale !== 'en') {
            page = await db.query.cmsPages.findFirst({
                where: and(eq(cmsPages.slug, slug), eq(cmsPages.locale, 'en'), eq(cmsPages.status, 'published')),
            });
        }

        if (!page) return { success: false, error: "Page not found" };
        return { success: true, data: page };
    } catch (error) {
        return { success: false, error: "Failed to fetch page" };
    }
}

export async function upsertPage(data: any): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
        const isAllowed = await hasPermission("cms.pages.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        const { id, savedById, ...pageData } = data;
        let targetId = id;
        
        if (id) {
            await db.update(cmsPages).set({ ...pageData, updatedAt: new Date() }).where(eq(cmsPages.id, id));
            revalidatePath("/admin/cms");
            if (pageData.slug) revalidatePath(`/${pageData.slug}`);
        } else {
            // Ensure locale is set
            if (!pageData.locale) pageData.locale = 'en';
            
            const [result] = await db.insert(cmsPages).values(pageData);
            targetId = (result as any).insertId;
            revalidatePath("/admin/cms");
        }

        // --- Revision Snapshotting ---
        if (targetId) {
            await db.insert(cmsPageRevisions).values({
                pageId: targetId,
                contentSnapshot: pageData.content || "",
                statusSnapshot: pageData.status || "draft",
                savedById: savedById || null,
                createdAt: new Date(),
            });

            // Keep only the last 10 revisions
            const history = await db.select({ id: cmsPageRevisions.id })
                .from(cmsPageRevisions)
                .where(eq(cmsPageRevisions.pageId, targetId))
                .orderBy(desc(cmsPageRevisions.createdAt));
            
            if (history.length > 10) {
                const idsToDelete = history.slice(10).map(r => r.id);
                await db.delete(cmsPageRevisions).where(inArray(cmsPageRevisions.id, idsToDelete));
            }
        }

        return { success: true, id: targetId };
    } catch (error: any) {
        console.error("CMS Page Upsert Error:", error);
        return { success: false, error: error.message || "Failed to save page" };
    }
}

export async function getPageRevisions(pageId: number) {
    try {
        const history = await db.select({
            id: cmsPageRevisions.id,
            contentSnapshot: cmsPageRevisions.contentSnapshot,
            statusSnapshot: cmsPageRevisions.statusSnapshot,
            createdAt: cmsPageRevisions.createdAt,
            savedBy: users.name
        })
        .from(cmsPageRevisions)
        .leftJoin(users, eq(cmsPageRevisions.savedById, users.id))
        .where(eq(cmsPageRevisions.pageId, pageId))
        .orderBy(desc(cmsPageRevisions.createdAt));

        return { success: true, data: history };
    } catch (error) {
        return { success: false, error: "Failed to fetch revisions" };
    }
}

export async function restoreRevision(pageId: number, revisionId: number) {
    try {
        const isAllowed = await hasPermission("cms.pages.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        const [revision] = await db.select().from(cmsPageRevisions).where(eq(cmsPageRevisions.id, revisionId)).limit(1);
        if (!revision) return { success: false, error: "Revision not found" };

        await db.update(cmsPages).set({
            content: revision.contentSnapshot,
            status: revision.statusSnapshot as any,
            updatedAt: new Date()
        }).where(eq(cmsPages.id, pageId));

        // Create a new snapshot of this restoration so it's logged
        await db.insert(cmsPageRevisions).values({
            pageId: pageId,
            contentSnapshot: revision.contentSnapshot,
            statusSnapshot: revision.statusSnapshot,
            savedById: null, // or pass user ID if possible
            createdAt: new Date(),
        });

        revalidatePath("/admin/cms");
        return { success: true };
    } catch (error) {
        console.error("CMS Revision Restore Error:", error);
        return { success: false, error: "Failed to restore revision" };
    }
}

export async function duplicatePage(id: number): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
        const isAllowed = await hasPermission("cms.pages.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        const page = await db.query.cmsPages.findFirst({
            where: eq(cmsPages.id, id)
        });
        if (!page) return { success: false, error: "Source page not found" };

        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const newData = {
            ...page,
            id: undefined,
            title: `${page.title} (Copy)`,
            slug: `${page.slug}-copy-${randomSuffix}`,
            status: 'draft' as const,
            isSystemPage: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const [result] = await db.insert(cmsPages).values(newData);
        revalidatePath("/admin/cms");
        return { success: true, id: result.insertId };
    } catch (error) {
        console.error("Duplicate Page Error:", error);
        return { success: false, error: "Failed to duplicate page" };
    }
}

export async function deletePage(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        const isAllowed = await hasPermission("cms.pages.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        const page = await db.query.cmsPages.findFirst({
            where: eq(cmsPages.id, id)
        });
        
        if (page?.isSystemPage) {
            return { success: false, error: "Cannot delete system-critical pages" };
        }

        await db.delete(cmsPages).where(eq(cmsPages.id, id));
        revalidatePath("/admin/cms");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete page" };
    }
}

// --- MENU ACTIONS ---

export async function getMenus(locale: string = 'en'): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const allMenuItems = await db.select().from(cmsMenus)
            .where(eq(cmsMenus.locale, locale))
            .orderBy(asc(cmsMenus.order));

        // Build hierarchy in memory to avoid LATERAL JOIN
        const menuEntries = allMenuItems.map(m => ({ ...m, children: [] as any[] }));
        const menuMap = new Map(menuEntries.map(m => [m.id, m]));
        const rootMenus: any[] = [];

        for (const item of menuEntries) {
            if (item.parentId && menuMap.has(item.parentId)) {
                menuMap.get(item.parentId)!.children.push(item);
            } else {
                rootMenus.push(item);
            }
        }
        
        // Fallback to English if no menus found for this locale
        if (rootMenus.length === 0 && locale !== 'en') {
            return getMenus('en');
        }

        return { success: true, data: rootMenus };
    } catch (error) {
        console.error("Fetch Menus Error:", error);
        return { success: false, error: "Failed to fetch menus" };
    }
}

/**
 * Fetch menus for a specific slot (primary, secondary, footer), with hierarchy.
 * Falls back to English if no items found for requested locale.
 */
export async function getMenusBySlot(
    slot: string,
    locale: string = 'en'
): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const allMenuItems = await db.select().from(cmsMenus)
            .where(and(eq(cmsMenus.locale, locale), eq(cmsMenus.slot, slot)))
            .orderBy(asc(cmsMenus.order));

        const menuEntries = allMenuItems.map(m => ({ ...m, menu_style: m.menuStyle, children: [] as any[] }));
        const menuMap = new Map(menuEntries.map(m => [m.id, m]));
        const rootMenus: any[] = [];

        for (const item of menuEntries) {
            if (item.parentId && menuMap.has(item.parentId)) {
                menuMap.get(item.parentId)!.children.push(item);
            } else {
                rootMenus.push(item);
            }
        }

        if (rootMenus.length === 0 && locale !== 'en') {
            return getMenusBySlot(slot, 'en');
        }

        return { success: true, data: rootMenus };
    } catch (error) {
        console.error("Fetch Menus By Slot Error:", error);
        return { success: false, error: "Failed to fetch menus" };
    }
}

export async function upsertMenu(data: any): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
        const isAllowed = await hasPermission("cms.menus.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        const { id, children, ...menuData } = data;
        
        if (!menuData.locale) menuData.locale = 'en';
        if (!menuData.slot) menuData.slot = 'primary';

        // Normalize: admin UI sends menu_style, Drizzle schema uses menuStyle
        if (menuData.menu_style !== undefined) {
            menuData.menuStyle = menuData.menu_style;
            delete menuData.menu_style;
        }
        if (!menuData.menuStyle) menuData.menuStyle = 'dropdown';

        if (id) {
            await db.update(cmsMenus).set(menuData).where(eq(cmsMenus.id, id));
            revalidatePath("/");
            revalidatePath("/admin/cms/menu");
            return { success: true, id };
        } else {
            const [result] = await db.insert(cmsMenus).values(menuData);
            revalidatePath("/");
            revalidatePath("/admin/cms/menu");
            return { success: true, id: (result as any).insertId };
        }
    } catch (error) {
        console.error("Save Menu Error:", error);
        return { success: false, error: "Failed to save menu item" };
    }
}

export async function updateMenuOrder(items: { id: number; order: number; parentId?: number | null }[]): Promise<{ success: boolean; error?: string }> {
    try {
        const isAllowed = await hasPermission("cms.menus.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        for (const item of items) {
            await db.update(cmsMenus)
                .set({ order: item.order, parentId: item.parentId !== undefined ? item.parentId : undefined })
                .where(eq(cmsMenus.id, item.id));
        }
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Order Update Error:", error);
        return { success: false, error: "Failed to update menu order" };
    }
}

export async function deleteMenu(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        const isAllowed = await hasPermission("cms.menus.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        await db.delete(cmsMenus).where(eq(cmsMenus.id, id));
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete menu item" };
    }
}

// --- HOMEPAGE SECTION ACTIONS ---

export async function getHomePageSections(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const baseSections = await db.select().from(cmsHomePageSections)
            .where(eq(cmsHomePageSections.isActive, true))
            .orderBy(asc(cmsHomePageSections.order));

        if (baseSections.length === 0) return { success: true, data: [] };

        const sectionIds = baseSections.map(s => s.id);
        const allMedia = await db.select().from(cmsSectionMedia)
            .where(inArray(cmsSectionMedia.sectionId, sectionIds))
            .orderBy(asc(cmsSectionMedia.order));

        const sections = baseSections.map(s => ({
            ...s,
            media: allMedia.filter(m => m.sectionId === s.id)
        }));

        return { success: true, data: sections };
    } catch (error) {
        console.error("Fetch Sections Error:", error);
        return { success: false, error: "Failed to fetch sections" };
    }
}

export async function upsertSection(data: any, mediaItems?: any[]): Promise<{ success: boolean; error?: string }> {
    try {
        const isAllowed = await hasPermission("cms.homepage.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        let sectionId = data.id;
        if (sectionId) {
            await db.update(cmsHomePageSections).set(data).where(eq(cmsHomePageSections.id, sectionId));
        } else {
            const [result] = await db.insert(cmsHomePageSections).values(data);
            sectionId = result.insertId;
        }

        if (mediaItems) {
            // Delete old media and re-insert new ones (simplest sync)
            await db.delete(cmsSectionMedia).where(eq(cmsSectionMedia.sectionId, sectionId));
            for (const item of mediaItems) {
                await db.insert(cmsSectionMedia).values({ 
                    ...item, 
                    sectionId,
                    metadata: item.metadata ? JSON.stringify(item.metadata) : null
                });
            }
        }

        revalidatePath("/");
        revalidatePath("/admin/cms/homepage");
        return { success: true };
    } catch (error) {
        console.error("Save Section Error:", error);
        return { success: false, error: "Failed to save section" };
    }
}

export async function updateSectionOrder(orders: { id: number; order: number }[]): Promise<{ success: boolean; error?: string }> {
    try {
        const isAllowed = await hasPermission("cms.homepage.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        for (const item of orders) {
            await db.update(cmsHomePageSections).set({ order: item.order }).where(eq(cmsHomePageSections.id, item.id));
        }
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update orders" };
    }
}

// --- MEDIA ACTIONS ---

import { compressImage } from "@/lib/compression";
import { storage } from "@/lib/storage";

export async function uploadMedia(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const isAllowed = await hasPermission("cms.media.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        const file = formData.get("file") as File;
        const type = formData.get("type") as string; // image, video, audio
        const subDir = formData.get("subDir") as string || "cms";

        if (!file) return { success: false, error: "No file provided" };

        const buffer = Buffer.from(await file.arrayBuffer());
        let finalBuffer = buffer;
        let finalFilename = file.name;
        let mimeType = file.type;

        // Apply compression for images
        if (type === 'image' || file.type.startsWith('image/')) {
            const { buffer: compressedBuffer } = await compressImage(buffer, {
                quality: 80,
                format: 'webp',
                maxWidth: 1920
            });
            finalBuffer = compressedBuffer as any;
            finalFilename = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            mimeType = "image/webp";
        }

        const uploadRes = await storage.upload(finalBuffer, finalFilename, subDir, mimeType);
        
        return uploadRes;
    } catch (error) {
        console.error("Upload Media Error:", error);
        return { success: false, error: "Failed to upload media" };
    }
}
