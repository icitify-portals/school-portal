"use server";

import { db } from "@/db/db";
import { cmsNews, cmsEvents, cmsPages, cmsMedia } from "@/db/schema";
import { eq, asc, desc, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

// --- NEWS ACTIONS ---

export async function getNews() {
    try {
        const news = await db.select({
            id: cmsNews.id,
            title: cmsNews.title,
            slug: cmsNews.slug,
            teaser: cmsNews.teaser,
            content: cmsNews.content,
            featuredImage: cmsMedia.url,
            featuredImageId: cmsNews.featuredImageId,
            status: cmsNews.status,
            publishedAt: cmsNews.publishedAt,
            createdAt: cmsNews.createdAt,
            authorId: cmsNews.authorId
        })
        .from(cmsNews)
        .leftJoin(cmsMedia, eq(cmsNews.featuredImageId, cmsMedia.id))
        .orderBy(desc(cmsNews.publishedAt), desc(cmsNews.createdAt));
        return { success: true, data: news };
    } catch (error) {
        console.error("Fetch News error", error);
        return { success: false, error: "Failed to fetch news" };
    }
}

export async function getNewsBySlug(slug: string) {
    try {
        const [item] = await db.select({
            id: cmsNews.id,
            title: cmsNews.title,
            slug: cmsNews.slug,
            teaser: cmsNews.teaser,
            content: cmsNews.content,
            featuredImage: cmsMedia.url,
            featuredImageId: cmsNews.featuredImageId,
            status: cmsNews.status,
            publishedAt: cmsNews.publishedAt,
            createdAt: cmsNews.createdAt,
            authorId: cmsNews.authorId
        })
        .from(cmsNews)
        .leftJoin(cmsMedia, eq(cmsNews.featuredImageId, cmsMedia.id))
        .where(eq(cmsNews.slug, slug))
        .limit(1);
        
        return { success: true, data: item };
    } catch (error) {
        return { success: false, error: "Failed to fetch news item" };
    }
}

export async function upsertNews(data: any) {
    try {
        const isAllowed = await hasPermission("cms.content.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        const { id, termIds, category, ...newsData } = data;

        if (newsData.status === 'published' && !newsData.publishedAt) {
            newsData.publishedAt = new Date();
        }

        let targetId = id;
        if (id) {
            await db.update(cmsNews).set(newsData).where(eq(cmsNews.id, id));
        } else {
            const [result] = await db.insert(cmsNews).values(newsData);
            targetId = (result as any).insertId;
        }

        // Handle Taxonomy terms via new API
        if (targetId && termIds !== undefined) {
             const { setEntityTerms } = await import("@/actions/cms-taxonomy");
             await setEntityTerms('news', targetId, termIds);
        }

        revalidatePath("/admin/cms/news");
        revalidatePath("/news");
        return { success: true, id: targetId };
    } catch (error) {
        console.error("News Save Error:", error);
        return { success: false, error: "Failed to save news" };
    }
}

// --- EVENT ACTIONS ---

export async function getEvents() {
    try {
        const events = await db.select({
            id: cmsEvents.id,
            title: cmsEvents.title,
            slug: cmsEvents.slug,
            description: cmsEvents.description,
            location: cmsEvents.location,
            startDate: cmsEvents.startDate,
            endDate: cmsEvents.endDate,
            isVirtual: cmsEvents.isVirtual,
            eventLink: cmsEvents.eventLink,
            featuredImage: cmsMedia.url,
            featuredImageId: cmsEvents.featuredImageId,
            status: cmsEvents.status
        })
        .from(cmsEvents)
        .leftJoin(cmsMedia, eq(cmsEvents.featuredImageId, cmsMedia.id))
        .orderBy(desc(cmsEvents.startDate));
        return { success: true, data: events };
    } catch (error) {
        return { success: false, error: "Failed to fetch events" };
    }
}

export async function upsertEvent(data: any) {
    try {
        const isAllowed = await hasPermission("cms.content.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };

        const { id, termIds, ...eventData } = data;
        let targetId = id;
        
        if (id) {
            await db.update(cmsEvents).set(eventData).where(eq(cmsEvents.id, id));
        } else {
            const [result] = await db.insert(cmsEvents).values(eventData);
            targetId = (result as any).insertId;
        }

        if (targetId && termIds !== undefined) {
             const { setEntityTerms } = await import("@/actions/cms-taxonomy");
             await setEntityTerms('event', targetId, termIds);
        }

        revalidatePath("/admin/cms/events");
        revalidatePath("/events");
        return { success: true, id: targetId };
    } catch (error) {
        console.error("Event Save Error:", error);
        return { success: false, error: "Failed to save event" };
    }
}

// --- PUBLISHING & APPROVAL WORKFLOW ---

export async function getReviewQueue() {
    try {
        const pages = await db.query.cmsPages.findMany({
            where: eq(cmsPages.status, 'pending_review'),
            orderBy: [desc(cmsPages.updatedAt)]
        });
        const news = await db.query.cmsNews.findMany({
            where: eq(cmsNews.status, 'pending_review'),
            orderBy: [desc(cmsNews.updatedAt)]
        });
        const events = await db.query.cmsEvents.findMany({
            where: eq(cmsEvents.status, 'pending_review'),
            orderBy: [desc(cmsEvents.updatedAt)]
        });

        return { 
            success: true, 
            data: { pages, news, events }
        };
    } catch (error) {
        return { success: false, error: "Failed to fetch review queue" };
    }
}

export async function approveContent(type: 'page' | 'news' | 'event', id: number) {
    try {
        const isAllowed = await hasPermission("cms.publishing.approve") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };
        if (type === 'page') {
            await db.update(cmsPages).set({ status: 'published' }).where(eq(cmsPages.id, id));
            revalidatePath("/admin/cms");
        } else if (type === 'news') {
            await db.update(cmsNews).set({ status: 'published', publishedAt: new Date() }).where(eq(cmsNews.id, id));
            revalidatePath("/admin/cms/news");
        } else {
            await db.update(cmsEvents).set({ status: 'published' }).where(eq(cmsEvents.id, id));
            revalidatePath("/admin/cms/events");
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: "Approval failed" };
    }
}

export async function rejectContent(type: 'page' | 'news' | 'event', id: number) {
    try {
        const isAllowed = await hasPermission("cms.publishing.approve") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };
        if (type === 'page') {
            await db.update(cmsPages).set({ status: 'rejected' }).where(eq(cmsPages.id, id));
        } else if (type === 'news') {
            await db.update(cmsNews).set({ status: 'rejected' }).where(eq(cmsNews.id, id));
        } else {
            await db.update(cmsEvents).set({ status: 'rejected' }).where(eq(cmsEvents.id, id));
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: "Rejection failed" };
    }
}
