"use server";

import { db } from "@/db/db";
import { systemSettings, systemModules } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export interface SystemSetting {
    key: string;
    value: string; // JSON string or simple value
    description?: string;
    isSensitive?: boolean;
}

const DEFAULT_SETTINGS: Record<string, string> = {
    "module.live_classes": "true",
    "module.hostels": "true",
    "module.results": "true",
    "module.admission": "true",
    "module.finance": "true",
    "module.hr": "true",
    "module.its": "true",
    "module.gamification": "true",
    "module.parent_portal": "true",
    "module.sports": "true",
    "module.library": "false", // Not yet implemented
    "system.theme": "default",
    "system.maintenance_mode": "false",
    "grading.default_proration": "false",
    "livekit.url": process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://live-class-ucgxm7sq.livekit.cloud",
    "livekit.api_key": process.env.LIVEKIT_API_KEY || "APIYD64Zp79j7ud",
    "livekit.api_secret": process.env.LIVEKIT_API_SECRET || "YJzE2eo5fLAMH9T8bw9ZQjPcdcS0BHzembbSj9tyhTpB",
};

export async function getSystemSettings() {
    try {
        const session = await auth();
        const user = session?.user as any;
        if (!user || user.role !== 'admin') {
            // Return only non-sensitive public settings if needed, or empty
            // For now, restricting broadly, but the sidebar needs access.
            // We'll separate admin fetch from public/sidebar fetch.
        }

        const settings = await db.select().from(systemSettings);

        // Merge with defaults to ensure all keys exist
        const settingsMap = new Map<string, string>();

        // Load defaults
        Object.entries(DEFAULT_SETTINGS).forEach(([k, v]) => settingsMap.set(k, v));

        // Override with DB values
        settings.forEach(s => {
            if (s.settingValue !== null) {
                settingsMap.set(s.settingKey, s.settingValue);
            }
        });

        return Array.from(settingsMap.entries()).map(([key, value]) => ({ key, value }));
    } catch (error) {
        console.error("Failed to fetch system settings:", error);
        return Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value }));
    }
}


export async function getEnabledModules() {
    // Public/Shared accessor for Sidebar
    const modules: Record<string, boolean> = {};

    // 1. Load Defaults
    Object.keys(DEFAULT_SETTINGS).filter(k => k.startsWith('module.')).forEach(k => {
        const shortName = k.replace('module.', '');
        modules[shortName] = DEFAULT_SETTINGS[k] === 'true';
    });

    try {
        // 2. Load from system_settings (Legacy/Global)
        const settings = await db.select().from(systemSettings).where(
            inArray(systemSettings.settingKey, Object.keys(DEFAULT_SETTINGS).filter(k => k.startsWith('module.')))
        );

        settings.forEach(s => {
            const shortName = s.settingKey.replace('module.', '');
            modules[shortName] = s.settingValue === 'true';
        });

        // 3. Load from system_modules (Enhanced Management)
        const registeredModules = await db.select().from(systemModules);
        registeredModules.forEach(m => {
            modules[m.key] = m.isEnabled || false;
        });
    } catch (error) {
        console.error("Failed to fetch enabled modules:", error);
    }

    return modules;
}

export async function getLiveKitCredentials() {
    const settings = await getSystemSettings();
    let url = settings.find(s => s.key === 'livekit.url')?.value || process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://live-class-ucgxm7sq.livekit.cloud";
    let apiKey = settings.find(s => s.key === 'livekit.api_key')?.value || process.env.LIVEKIT_API_KEY || "APIYD64Zp79j7ud";
    let apiSecret = settings.find(s => s.key === 'livekit.api_secret')?.value || process.env.LIVEKIT_API_SECRET || "YJzE2eo5fLAMH9T8bw9ZQjPcdcS0BHzembbSj9tyhTpB";

    // Auto-detect local Docker server
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        await fetch("http://localhost:7880/", { method: "HEAD", signal: controller.signal });
        clearTimeout(timeoutId);

        // If successful without throwing, local server is up
        url = "ws://localhost:7880";
        apiKey = "devkey";
        apiSecret = "secret";
        console.log("Local LiveKit server detected, overriding UI credentials");
    } catch (e) {
        // Local server is not accessible, fallback to DB/Cloud configurations
        console.log("Local LiveKit server not detected, using configured cloud credentials");
    }

    return { url, apiKey, apiSecret };
}


export async function updateSystemSetting(key: string, value: string) {
    const allowed = await hasPermission("system.settings.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) {
        return { success: false, error: "Unauthorized: Insufficient permissions to update system settings" };
    }

    // Check if exists
    const existing = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key)).limit(1);

    if (existing.length > 0) {
        await db.update(systemSettings)
            .set({ settingValue: value, updatedAt: new Date() })
            .where(eq(systemSettings.settingKey, key));
    } else {
        await db.insert(systemSettings).values({
            settingKey: key,
            settingValue: value,
            description: "System Setting",
        });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/"); // Revalidate everywhere as sidebar changes
}

export async function toggleModule(moduleName: string, isEnabled: boolean) {
    return updateSystemSetting(`module.${moduleName}`, String(isEnabled));
}
