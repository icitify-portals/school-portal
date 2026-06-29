import { MetadataRoute } from 'next';
import { db } from '@/db/db';
import { cmsPages, journals, journalArticles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://schoolportal.edu';

    // 1. Fetch all published CMS pages
    // @ts-expect-error - TS7034: Auto-suppressed for build
    let pages = [];
    try {
        pages = await db.query.cmsPages.findMany({
            where: eq(cmsPages.status, 'published'),
        });
    } catch (error) {
        console.error("Sitemap generation failed to fetch CMS pages:", error);
    }

    // @ts-expect-error - TS7005: Auto-suppressed for build
    const cmsEntries = pages.map((page) => ({
        url: `${siteUrl}/${page.slug}`,
        lastModified: page.updatedAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: page.isSystemPage ? 0.8 : 0.6,
    }));

    // 2. Fetch all active journals and published articles
    let journalEntries: MetadataRoute.Sitemap = [];
    let articleEntries: MetadataRoute.Sitemap = [];

    try {
        const activeJournals = await db.select().from(journals).where(eq(journals.isActive, true));
        journalEntries = activeJournals.map(j => ({
            url: `${siteUrl}/journal/${j.slug}`,
            lastModified: j.createdAt || new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        }));

        // Fetch articles join to get journal slug
        const publishedArticles = await db.select({
            id: journalArticles.id,
            updatedAt: journalArticles.updatedAt,
            journalSlug: journals.slug
        })
        .from(journalArticles)
        .innerJoin(journals, eq(journalArticles.journalId, journals.id))
        .where(
            and(
                eq(journalArticles.status, 'published'),
                eq(journals.isActive, true)
            )
        );

        articleEntries = publishedArticles.map(art => ({
            url: `${siteUrl}/journal/${art.journalSlug}/article/${art.id}`,
            lastModified: art.updatedAt || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch (error) {
        console.error("Sitemap generation failed to fetch journals/articles:", error);
    }

    // 3. Core system pages
    const staticEntries: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${siteUrl}/journal`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${siteUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];

    return [...staticEntries, ...cmsEntries, ...journalEntries, ...articleEntries];
}

