"use server";

import { db } from "@/db/db";
import { cmsPages, cmsNews, cmsEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAIProvider } from "@/lib/ai-service";
import { auth } from "@/auth";
import { hasPermission, hasRole } from "@/lib/rbac";

// Supported institution codes (internal to server actions)
const TARGET_LOCALES = [
    { code: 'ha', name: 'Hausa' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'ig', name: 'Igbo' },
    { code: 'sw', name: 'Kiswahili' },
    { code: 'am', name: 'Amharic' },
    { code: 'zu', name: 'isiZulu' },
    { code: 'xh', name: 'isiXhosa' },
    { code: 'om', name: 'Afaan Oromoo' },
    { code: 'wo', name: 'Wolof' },
    { code: 'pt', name: 'Português' },
    { code: 'fr', name: 'Français' },
    { code: 'ar', name: 'العربية' }
];

export async function translateToAllLocales(type: 'page' | 'news' | 'event', sourceId: number) {
    // SECURITY FIX M-5: Auth check is unconditional. The bypassAuth parameter has been
    // removed — it created a path where authentication could be skipped entirely.
    // Internal callers must operate within an authenticated request context.
    const isAllowed = type === 'page'
        ? (await hasPermission("cms.pages.manage") || await hasRole("admin") || await hasRole("superadmin"))
        : (await hasPermission("cms.content.manage") || await hasRole("admin") || await hasRole("superadmin"));
    if (!isAllowed) return { success: false, error: "Unauthorized" };

    console.log(`[TranslationHub] Starting bulk translation for ${type} ID: ${sourceId}`);
    const provider = getAIProvider(process.env.AI_PROVIDER || 'gemini');

    try {
        let source: any;
        if (type === 'page') source = await db.query.cmsPages.findFirst({ where: eq(cmsPages.id, sourceId) });
        else if (type === 'news') source = await db.query.cmsNews.findFirst({ where: eq(cmsNews.id, sourceId) });
        else source = await db.query.cmsEvents.findFirst({ where: eq(cmsEvents.id, sourceId) });

        if (!source) return { success: false, error: "Source not found" };

        // Ensure we have a translation group ID
        let groupId = source.translationGroupId;
        if (!groupId) {
            groupId = source.id; // Use primary version ID as group anchor
            if (type === 'page') await db.update(cmsPages).set({ translationGroupId: groupId }).where(eq(cmsPages.id, sourceId));
            else if (type === 'news') await db.update(cmsNews).set({ translationGroupId: groupId }).where(eq(cmsNews.id, sourceId));
            else await db.update(cmsEvents).set({ translationGroupId: groupId }).where(eq(cmsEvents.id, sourceId));
        }

        const results = [];
        for (const target of TARGET_LOCALES) {
            // Check if translation already exists for this locale
            let existing: any;
            if (type === 'page') existing = await db.query.cmsPages.findFirst({ where: and(eq(cmsPages.translationGroupId, groupId), eq(cmsPages.locale, target.code)) });
            else if (type === 'news') existing = await db.query.cmsNews.findFirst({ where: and(eq(cmsNews.translationGroupId, groupId), eq(cmsNews.locale, target.code)) });
            else existing = await db.query.cmsEvents.findFirst({ where: and(eq(cmsEvents.translationGroupId, groupId), eq(cmsEvents.locale, target.code)) });

            if (existing) continue;

            const prompt = `You are a professional institutional translator for a top-tier University. 
            Translate the following content from English to ${target.name}.
            Ensure the tone is academic, authoritative, yet inclusive.
            IMPORTANT: Preserve all HTML tags (like <h2>, <p>, <strong>, etc.) exactly as they are. Do NOT translate the tags themselves.
            
            Title: ${source.title}
            Content: ${source.content || source.description}
            ${source.teaser ? `Teaser: ${source.teaser}` : ''}
            
            Return the result in JSON format:
            {
              "title": "Translated Title",
              "content": "Translated HTML Content",
              "teaser": "Translated Teaser (if applicable)"
            }`;

            const text = await provider.generateText(prompt);
            
            // Extract JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) continue;
            const translated = JSON.parse(jsonMatch[0]);

            // Save translation
            const data: any = {
                ...source,
                id: undefined,
                title: translated.title,
                content: translated.content,
                description: type === 'event' ? translated.content : undefined,
                teaser: translated.teaser || source.teaser,
                locale: target.code,
                translationGroupId: groupId,
                slug: `${source.slug}-${target.code}`,
                status: 'draft' // All translations start as drafts for review
            };

            if (type === 'page') await db.insert(cmsPages).values(data);
            else if (type === 'news') await db.insert(cmsNews).values(data);
            else await db.insert(cmsEvents).values(data);

            results.push(target.name);
        }

        return { success: true, count: results.length, languages: results };
    } catch (error) {
        console.error("Translation Hub Error:", error);
        return { success: false, error: "Multi-locale translation failed" };
    }
}
