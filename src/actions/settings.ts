"use server";

import { db } from "@/db/db";
import { systemConfig, academicSessions, schoolScheduleSettings, studentGroups, institutionalUnits, systemSettings, systemModules } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/encryption";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

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
    "module.library": "false",
    "system.theme": "default",
    "system.maintenance_mode": "false",
    "grading.default_proration": "false",
    "livekit.url": process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://live-class-ucgxm7sq.livekit.cloud",
    "livekit.api_key": process.env.LIVEKIT_API_KEY || "APIYD64Zp79j7ud",
    "livekit.api_secret": process.env.LIVEKIT_API_SECRET || "YJzE2eo5fLAMH9T8bw9ZQjPcdcS0BHzembbSj9tyhTpB",
};

/**
 * System Configuration Actions
 */

export async function updateTerminology(unitId: number, key: string, value: string) {
    const allowed = await hasPermission("system.settings.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };

    try {
        const fullKey = `unit_${unitId}_${key}`;
        return await updateSystemSetting(fullKey, value, 'terminology');
    } catch (error) {
        return { success: false, error: "Failed to update terminology" };
    }
}

export async function getPortalSettings() {
    try {
        const settings = await db.select().from(systemConfig);
        
        // Decrypt sensitive values
        return settings.map(s => ({
            ...s,
            value: s.isEncrypted ? decrypt(s.value) : s.value
        }));
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        return [];
    }
}

export async function getSettingByKey(key: string) {
    try {
        // 1. Check modern system_config
        const [setting] = await db.select().from(systemConfig).where(eq(systemConfig.key, key)).limit(1);
        if (setting) {
            return setting.isEncrypted ? decrypt(setting.value) : setting.value;
        }

        // 2. Fallback to legacy system_settings
        const [legacy] = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key)).limit(1);
        if (legacy) {
            return legacy.settingValue;
        }

        // 3. Fallback to hardcoded defaults
        return DEFAULT_SETTINGS[key] || null;
    } catch (error) {
        console.error(`Failed to fetch setting ${key}:`, error);
        return DEFAULT_SETTINGS[key] || null;
    }
}

export async function updateSystemSetting(key: string, value: string, group: string = 'general', isEncrypted: boolean = false) {
    const allowed = await hasPermission("system.settings.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };

    try {
        const finalValue = isEncrypted ? encrypt(value) : value;

        const [existing] = await db.select().from(systemConfig).where(eq(systemConfig.key, key)).limit(1);

        if (existing) {
            await db.update(systemConfig)
                .set({ value: finalValue, configGroup: group, isEncrypted })
                .where(eq(systemConfig.key, key));
        } else {
            await db.insert(systemConfig).values({
                key,
                value: finalValue,
                configGroup: group,
                isEncrypted
            });
        }

        revalidatePath("/admin/settings/integrations");
        return { success: true };
    } catch (error) {
        console.error(`Failed to update setting ${key}:`, error);
        return { success: false, error: "Failed to save setting." };
    }
}

/**
 * Migration Helpers for compatibility with existing modules
 */

export async function getIDCardSettings() {
    const enabled = await getSettingByKey('id_card_enabled');
    const studentWindow = await getSettingByKey('id_card_student_window');
    const staffWindow = await getSettingByKey('id_card_staff_window');
    
    return {
        enabled: enabled === 'true',
        studentWindow: studentWindow || 'closed',
        staffWindow: staffWindow || 'closed'
    };
}

export async function updateIDCardSettings(data: any) {
    const allowed = await hasPermission("system.settings.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };

    try {
        await updateSystemSetting('id_card_enabled', data.enabled.toString(), 'id_card');
        await updateSystemSetting('id_card_student_window', data.studentWindow, 'id_card');
        await updateSystemSetting('id_card_staff_window', data.staffWindow, 'id_card');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getBrandingSettings() {
    const portalName = await getSettingByKey('portal_name') || 'Academic Portal';
    const portalLogo = await getSettingByKey('portal_logo') || '';
    const schoolMotto = await getSettingByKey('school_motto') || '';
    const schoolAddress = await getSettingByKey('school_address') || '';
    const schoolBillNote = await getSettingByKey('school_bill_note') || '';
    const homepagePageId = await getSettingByKey('cms_homepage_page_id') || 'default';

    return {
        portalName,
        portalLogo,
        schoolMotto,
        schoolAddress,
        schoolBillNote,
        homepagePageId,
        // Legacy/Alternative keys for compatibility with various UI components
        INST_NAME: portalName,
        INST_LOGO: portalLogo,
        INST_MOTTO: schoolMotto,
        INST_ADDRESS: schoolAddress,
        HOMEPAGE_PAGE_ID: homepagePageId,
        COLOR_PRIMARY: await getSettingByKey('primary_color') || await getSettingByKey('c_o_l_o_r__p_r_i_m_a_r_y') || '#4f46e5',
        COLOR_SECONDARY: await getSettingByKey('secondary_color') || await getSettingByKey('c_o_l_o_r__s_e_c_o_n_d_a_r_y') || '#0f172a',
        COLOR_ACCENT: await getSettingByKey('accent_color') || await getSettingByKey('c_o_l_o_r__a_c_c_e_n_t') || '#6366f1',
        FONT_FAMILY: await getSettingByKey('font_family') || await getSettingByKey('f_o_n_t__f_a_m_i_l_y') || 'Inter',
        SIDEBAR_STYLE: await getSettingByKey('sidebar_style') || await getSettingByKey('s_i_d_e_b_a_r__s_t_y_l_e') || 'modern',
        LAYOUT_DENSITY: await getSettingByKey('layout_density') || await getSettingByKey('l_a_y_o_u_t__d_e_n_s_i_t_y') || 'comfortable',
        DARK_MODE_DEFAULT: await getSettingByKey('dark_mode_default') || await getSettingByKey('d_a_r_k__m_o_d_e__d_e_f_a_u_l_t') || 'false',
        supportEmail: await getSettingByKey('support_email') || 'support@institution.edu'
    };
}

export async function updateBrandingSettings(data: any) {
    const allowed = await hasPermission("system.settings.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };

    try {
        for (const [key, value] of Object.entries(data)) {
            // Map common aliases to canonical DB keys
            let dbKey = key;
            if (key === 'INST_NAME' || key === 'portalName') dbKey = 'portal_name';
            else if (key === 'INST_LOGO' || key === 'portalLogo') dbKey = 'portal_logo';
            else if (key === 'INST_MOTTO' || key === 'schoolMotto') dbKey = 'school_motto';
            else if (key === 'COLOR_PRIMARY' || key === 'colorPrimary') dbKey = 'primary_color';
            else if (key === 'COLOR_SECONDARY' || key === 'colorSecondary') dbKey = 'secondary_color';
            else if (key === 'COLOR_ACCENT' || key === 'colorAccent') dbKey = 'accent_color';
            else if (key === 'FONT_FAMILY' || key === 'fontFamily') dbKey = 'font_family';
            else if (key === 'SIDEBAR_STYLE' || key === 'sidebarStyle') dbKey = 'sidebar_style';
            else if (key === 'LAYOUT_DENSITY' || key === 'layoutDensity') dbKey = 'layout_density';
            else if (key === 'DARK_MODE_DEFAULT' || key === 'darkModeDefault') dbKey = 'dark_mode_default';
            else if (key === 'HOMEPAGE_PAGE_ID' || key === 'homepagePageId') dbKey = 'cms_homepage_page_id';
            else {
                // CamelCase/PascalCase to snake_case converter
                dbKey = key
                    .replace(/([A-Z])/g, (match, p1, offset) => (offset > 0 ? "_" : "") + match.toLowerCase())
                    .toLowerCase();
            }

            await updateSystemSetting(dbKey, value as string, 'branding');
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getAttendanceSettings() {
    return {
        safeThreshold: parseInt(await getSettingByKey('attendance_safe_threshold') || '75'),
        warningThreshold: parseInt(await getSettingByKey('attendance_warning_threshold') || '60'),
        eligibilityThreshold: parseInt(await getSettingByKey('attendance_eligibility_threshold') || '75'),
        qrRotationInterval: parseInt(await getSettingByKey('attendance_qr_rotation') || '30'),
        excuseWindowDays: parseInt(await getSettingByKey('attendance_excuse_window') || '7'),
        lateThresholdMinutes: parseInt(await getSettingByKey('attendance_late_threshold') || '15'),
    };
}

export async function updateAttendanceSettings(data: any) {
    const allowed = await hasPermission("system.settings.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };

    try {
        for (const [key, value] of Object.entries(data)) {
            const dbKey = "attendance_" + key.replace(/([A-Z])/g, "_$1").toLowerCase();
            await updateSystemSetting(dbKey, value?.toString() || "", 'attendance');
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getAISettings() {
    return {
        OPENAI_API_KEY: await getSettingByKey('openai_api_key') || '',
        GEMINI_API_KEY: await getSettingByKey('gemini_api_key') || '',
        DEEPSEEK_API_KEY: await getSettingByKey('deepseek_api_key') || ''
    };
}

export async function getLeaderboardMetrics() {
    return {
        certWeight: parseInt(await getSettingByKey('leaderboard_cert_weight') || '10'),
        badgeWeight: parseInt(await getSettingByKey('leaderboard_badge_weight') || '5'),
        cgpaWeight: parseInt(await getSettingByKey('leaderboard_cgpa_weight') || '20')
    };
}

export async function updateLeaderboardMetrics(data: any) {
    const allowed = await hasPermission("system.settings.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };

    try {
        await updateSystemSetting('leaderboard_cert_weight', data.certWeight.toString(), 'leaderboard');
        await updateSystemSetting('leaderboard_badge_weight', data.badgeWeight.toString(), 'leaderboard');
        await updateSystemSetting('leaderboard_cgpa_weight', data.cgpaWeight.toString(), 'leaderboard');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
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
        // 2. Load from system_config (Modern)
        const modernSettings = await db.select().from(systemConfig).where(
            and(
                inArray(systemConfig.key, Object.keys(DEFAULT_SETTINGS).filter(k => k.startsWith('module.'))),
                eq(systemConfig.configGroup, 'module')
            )
        );
        modernSettings.forEach(s => {
            const shortName = s.key.replace('module.', '');
            modules[shortName] = s.value === 'true';
        });

        // 3. Load from system_settings (Legacy/Global)
        const legacySettings = await db.select().from(systemSettings).where(
            inArray(systemSettings.settingKey, Object.keys(DEFAULT_SETTINGS).filter(k => k.startsWith('module.')))
        );
        legacySettings.forEach(s => {
            const shortName = s.settingKey.replace('module.', '');
            // Only override if not already set by modern config
            if (modules[shortName] === (DEFAULT_SETTINGS[`module.${shortName}`] === 'true')) {
                modules[shortName] = s.settingValue === 'true';
            }
        });

        // 4. Load from system_modules (Enhanced Management)
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
    const url = await getSettingByKey('livekit.url') || "wss://live-class-ucgxm7sq.livekit.cloud";
    const apiKey = await getSettingByKey('livekit.api_key') || "APIYD64Zp79j7ud";
    const apiSecret = await getSettingByKey('livekit.api_secret') || "YJzE2eo5fLAMH9T8bw9ZQjPcdcS0BHzembbSj9tyhTpB";

    // Auto-detect local Docker server
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        await fetch("http://localhost:7880/", { method: "HEAD", signal: controller.signal });
        clearTimeout(timeoutId);

        // If successful without throwing, local server is up
        return { 
            url: "ws://localhost:7880", 
            apiKey: "devkey", 
            apiSecret: "secret",
            isLocal: true 
        };
    } catch (e) {
        return { url, apiKey, apiSecret, isLocal: false };
    }
}

export async function toggleModule(moduleName: string, isEnabled: boolean) {
    const allowed = await hasPermission("system.settings.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };

    return updateSystemSetting(`module.${moduleName}`, String(isEnabled), 'module');
}

export async function getStudentGroups(unitId: number) {
    return await db.query.studentGroups.findMany({
        where: eq(studentGroups.unitId, unitId),
        orderBy: (groups, { asc }) => [asc(groups.level), asc(groups.name)]
    });
}

export async function updateSchoolSchedule(data: {
    sessionId: number;
    term: "1" | "2" | "3";
    daysOpen: number;
    termStart: string;
    termEnd: string;
    nextTermStart: string;
    unitId?: number;
}) {
    const allowed = await hasPermission("system.settings.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };

    try {
        const { sessionId, term, daysOpen, termStart, termEnd, nextTermStart, unitId } = data;
        
        const existing = await db.query.schoolScheduleSettings.findFirst({
            where: and(
                eq(schoolScheduleSettings.sessionId, sessionId),
                eq(schoolScheduleSettings.term, term),
                unitId ? eq(schoolScheduleSettings.unitId, unitId) : undefined
            )
        });

        const payload = {
            sessionId,
            term,
            daysOpen,
            termStart: new Date(termStart),
            termEnd: new Date(termEnd),
            nextTermStart: new Date(nextTermStart),
            unitId,
            updatedAt: new Date()
        };

        if (existing) {
            await db.update(schoolScheduleSettings)
                .set(payload)
                .where(eq(schoolScheduleSettings.id, existing.id));
        } else {
            await db.insert(schoolScheduleSettings).values(payload as any);
        }

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update schedule:", error);
        return { success: false, error: error.message };
    }
}

export async function addClassOrArm(data: {
    unitId: number;
    name: string;
    level: number;
    description?: string;
}) {
    const allowed = await hasPermission("system.settings.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };

    try {
        await db.insert(studentGroups).values(data);
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteStudentGroup(id: number) {
    const allowed = await hasPermission("system.settings.manage") || await hasRole("admin") || await hasRole("superadmin");
    if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions" };

    try {
        await db.delete(studentGroups).where(eq(studentGroups.id, id));
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

