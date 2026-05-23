"use server";

import { db } from "@/db/db";
import { cmsNews, cmsEvents, cmsPages } from "@/db/schema";
import { eq, asc, desc, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- NEWS ACTIONS ---

export async function getNews() {
    try {
        const news = await db.query.cmsNews.findMany({
            orderBy: [desc(cmsNews.publishedAt), desc(cmsNews.createdAt)]
        });
        return { success: true, data: news };
    } catch (error) {
        return { success: false, error: "Failed to fetch news" };
    }
}

export async function getNewsBySlug(slug: string) {
    try {
        const item = await db.query.cmsNews.findFirst({
            where: eq(cmsNews.slug, slug)
        });
        return { success: true, data: item };
    } catch (error) {
        return { success: false, error: "Failed to fetch news item" };
    }
}

export async function upsertNews(data: any) {
    try {
        if (data.status === 'published' && !data.publishedAt) {
            data.publishedAt = new Date();
        }

        if (data.id) {
            await db.update(cmsNews).set(data).where(eq(cmsNews.id, data.id));
        } else {
            await db.insert(cmsNews).values(data);
        }
        revalidatePath("/admin/cms/news");
        revalidatePath("/news");
        return { success: true };
    } catch (error) {
        console.error("News Save Error:", error);
        return { success: false, error: "Failed to save news" };
    }
}

// --- EVENT ACTIONS ---

export async function getEvents() {
    try {
        const events = await db.query.cmsEvents.findMany({
            orderBy: [desc(cmsEvents.startDate)]
        });
        return { success: true, data: events };
    } catch (error) {
        return { success: false, error: "Failed to fetch events" };
    }
}

export async function upsertEvent(data: any) {
    try {
        if (data.id) {
            await db.update(cmsEvents).set(data).where(eq(cmsEvents.id, data.id));
        } else {
            await db.insert(cmsEvents).values(data);
        }
        revalidatePath("/admin/cms/events");
        revalidatePath("/events");
        return { success: true };
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
