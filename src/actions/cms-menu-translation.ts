"use server";

import { db } from "@/db/db";
import { cmsMenus } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAIProvider } from "@/lib/ai-service";
import { auth } from "@/auth";

// Supported institution codes
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

export async function translateAllMenus(sourceLocale: string = 'en') {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const sourceMenus = await db.query.cmsMenus.findMany({
            where: eq(cmsMenus.locale, sourceLocale)
        });

        if (sourceMenus.length === 0) return { success: false, error: "No source menus found" };

        const provider = getAIProvider(process.env.AI_PROVIDER || 'gemini');
        let count = 0;

        for (const target of TARGET_LOCALES) {
            if (target.code === sourceLocale) continue;

            for (const menu of sourceMenus) {
                // Check if already exists
                const existing = await db.query.cmsMenus.findFirst({
                    where: and(
                        eq(cmsMenus.translationGroupId, menu.translationGroupId || menu.id),
                        eq(cmsMenus.locale, target.code)
                    )
                });

                if (existing) continue;

                const prompt = `Translate this institutional menu item from English to ${target.name}.
                Label: ${menu.label}
                Description: ${menu.description || ""}

                Return JSON only:
                {
                  "label": "Translated Label",
                  "description": "Translated Description (if applicable)"
                }`;

                const responseText = await provider.generateText(prompt);
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) continue;
                const translated = JSON.parse(jsonMatch[0]);

                await db.insert(cmsMenus).values({
                    ...menu,
                    id: undefined,
                    label: translated.label,
                    description: translated.description || menu.description,
                    locale: target.code,
                    translationGroupId: menu.translationGroupId || menu.id,
                });
                count++;
            }
        }

        return { success: true, count };
    } catch (error) {
        console.error("Menu Translation Error:", error);
        return { success: false, error: "Failed to translate menus" };
    }
}
