import { db } from "@/db/db";
import { systemSettings, institutionalUnits } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export class SchoolConfigService {

    /**
     * Lists all available system setting keys.
     * Matches 'school list' from Rust.
     */
    static async listSettings() {
        return await db.select({ key: systemSettings.settingKey }).from(systemSettings);
    }

    /**
     * Retrieves a specific setting value.
     * Supports session/term context if stored in a structured way.
     */
    static async getSetting(key: string, sessionId?: number) {
        const [setting] = await db.select()
            .from(systemSettings)
            .where(eq(systemSettings.settingKey, key))
            .limit(1);
        
        if (!setting) return "Not Found";

        // In some implementations, settings are JSON blobs that vary by session
        // For now, we return the direct value
        return setting.settingValue;
    }

    /**
     * Updates or creates a school setting.
     * Matches 'school set' from Rust.
     */
    static async setSetting(key: string, value: string) {
        console.log(`Setting ${key} to ${value}...`);
        
        const [existing] = await db.select()
            .from(systemSettings)
            .where(eq(systemSettings.settingKey, key))
            .limit(1);

        if (existing) {
            await db.update(systemSettings)
                .set({ settingValue: value, updatedAt: new Date() })
                .where(eq(systemSettings.settingKey, key));
        } else {
            await db.insert(systemSettings)
                .values({ settingKey: key, settingValue: value });
        }
        
        return { success: true };
    }

    /**
     * Retrieves general institutional metadata.
     * Matches 'GeneralSettings' from Rust.
     */
    static async getGeneralInfo() {
        const [branch] = await db.select().from(institutionalUnits).limit(1); // Main branch info
        const settings = await db.select().from(systemSettings);
        
        return {
            institution: branch?.name || "School Portal",
            activeSettings: settings.length,
            environment: process.env.NODE_ENV || "development",
            database: process.env.DB_NAME || "mysql"
        };
    }
}
