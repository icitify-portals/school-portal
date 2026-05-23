"use server";

import { upsertPage } from "@/actions/cms";
import { translateToAllLocales } from "@/actions/cms-translation";
import { db } from "@/db/db";

export async function seedPanAfricanDemo() {
    try {
        const user = await db.query.users.findFirst();
        if (!user) return { success: false, error: "No user found" };

        // 1. Create Source English Page
        const res = await upsertPage({
            title: "African Research & Innovation Hub",
            slug: "african-research-hub",
            content: `
                <h2>Leading the Global Research Agenda</h2>
                <p>Our university is proud to serve as a beacon of academic excellence in Africa. We are currently pioneering research in sustainable energy, indigenous medical practices, and digital governance.</p>
                <p>Through our Pan-African collaboration network, we ensure that local knowledge is integrated with global scientific standards.</p>
                <ul>
                    <li>Over 50 African partner institutions</li>
                    <li>$100M Research Endowment</li>
                    <li>15 Innovation Labs across the continent</li>
                </ul>
            `,
            metaTitle: "African Research & Innovation Hub | University",
            metaDescription: "The official center for Pan-African research collaboration and pioneering academic breakthroughs.",
            status: "published",
            locale: "en",
            authorId: user.id
        });

        if (!res.success || !res.id) return res;

        // 2. Trigger Bulk Translation to all 12+ Pan-African Locales
        const transRes = await translateToAllLocales('page', res.id, true);
        
        // 3. Force publish all translations for demo
        const { cmsPages } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(cmsPages).set({ status: 'published' }).where(eq(cmsPages.translationGroupId, res.id));

        return { 
            success: true, 
            message: "Pan-African Hub seeded successfully", 
            sourceId: res.id,
            translations: transRes.languages 
        };
    } catch (error) {
        console.error("Pan-African Seed Error:", error);
        return { success: false, error: "Failed to seed Pan-African hub" };
    }
}
