import { db } from "@/db/db";
import { institutionalUnits } from "@/db/schema";
import { eq } from "drizzle-orm";

export class AliasService {

    /**
     * Retrieves the nomenclature alias map for a specific institutional unit.
     * Matches 'Alias::map(branch, pool)' from Rust.
     */
    static async getMap(unitId: number): Promise<Record<string, string>> {
        const [unit] = await db.select({ settings: institutionalUnits.settings })
            .from(institutionalUnits)
            .where(eq(institutionalUnits.id, unitId))
            .limit(1);

        if (!unit || !unit.settings) return {};

        try {
            const settings = JSON.parse(unit.settings);
            return settings.aliases || {};
        } catch (e) {
            return {};
        }
    }

    /**
     * Translates content by replacing aliased terms based on institutional settings.
     * Matches 'alias.translate(&content)' from Rust.
     */
    static async translate(content: string, unitId: number): Promise<string> {
        const aliasMap = await this.getMap(unitId);
        let translated = content;

        for (const [original, alias] of Object.entries(aliasMap)) {
            // Case-insensitive replacement
            const regex = new RegExp(`\\b${original}\\b`, 'gi');
            translated = translated.replace(regex, alias);
        }

        return translated;
    }
}
