"use server";

import { db } from "@/db/db";
import { systemModules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getModuleStatus() {
    try {
        const modules = await db.select().from(systemModules);
        return modules.reduce((acc: any, mod) => {
            acc[mod.key] = mod.isEnabled;
            return acc;
        }, {});
    } catch (error) {
        console.error("Fetch module status error:", error);
        return {};
    }
}

export async function getAllModules() {
    try {
        return await db.select().from(systemModules);
    } catch (error) {
        return [];
    }
}

export async function toggleModule(key: string, isEnabled: boolean) {
    try {
        await db.update(systemModules)
            .set({ isEnabled })
            .where(eq(systemModules.key, key));
        
        revalidatePath("/"); // Global revalidate for menus
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function seedModules() {
    const modules = [
        { key: "its", name: "Intelligent Tutoring System", description: "AI Classroom, Vision, and Automation" },
        { key: "gamification", name: "Gamification Engine", description: "XP, Badges, and Leaderboards" },
        { key: "parent_portal", name: "Parent Portal", description: "Parental child monitoring and insights" },
        { key: "admission", name: "Admission Management", description: "Applications, Screening, and Admissions" },
        { key: "finance", name: "Finance & Accounting", description: "Bursary, Payroll, and Assets" },
        { key: "lms", name: "E-Learning & LMS", description: "Courses, CBT, and Virtual Classes" },
        { key: "hr", name: "Human Resources", description: "Staff profiles, Leave, and Performance" },
        { key: "security", name: "Security & Visitors", description: "Visitor tracking and Identity management" },
        { key: "sports", name: "Sports & Athletics", description: "Manage athletic teams, fixtures, rosters, and inventory" },
    ];

    for (const mod of modules) {
        try {
            await db.insert(systemModules).values(mod).onDuplicateKeyUpdate({ set: { name: mod.name } });
        } catch (e) {}
    }
}
