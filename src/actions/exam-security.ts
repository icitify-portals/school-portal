"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { examSecuritySettings } from "@/db/schema";
import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getExamSecuritySettings() {
    try {
        const [settings] = await db.select().from(examSecuritySettings)
            .orderBy(desc(examSecuritySettings.id))
            .limit(1);

        if (settings) {
            return { success: true, settings };
        }

        // Return defaults
        return {
            success: true,
            settings: {
                id: null,
                disableCopyPaste: true,
                fullScreenRequired: true,
                autoSubmitOnTabSwitch: false,
                randomizeQuestions: true,
                randomizeOptions: true,
                maxAttempts: 1,
                showResultsImmediately: false,
                ipWhitelist: '',
                browserLockdown: false,
                webcamProctoring: false,
                screenshotInterval: null,
                maxIdleTime: 300,
            },
        };
    } catch (error) {
        console.error("Get Exam Security Error:", error);
        return { error: "Failed to fetch exam security settings." };
    }
}

export async function saveExamSecuritySettings(data: {
    disableCopyPaste: boolean;
    fullScreenRequired: boolean;
    autoSubmitOnTabSwitch: boolean;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    maxAttempts: number;
    showResultsImmediately: boolean;
    ipWhitelist: string;
    browserLockdown: boolean;
    webcamProctoring: boolean;
    screenshotInterval: number | null;
    maxIdleTime: number;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Unauthorized" };
        if ((session.user as any)?.role !== 'admin') return { error: "Unauthorized" };

        const userId = parseInt(session.user.id);

        // Upsert: check if row exists
        const [existing] = await db.select().from(examSecuritySettings).limit(1);

        if (existing) {
            const { eq } = await import("drizzle-orm");
            await db.update(examSecuritySettings)
                .set({ ...data, updatedBy: userId })
                .where(eq(examSecuritySettings.id, existing.id));
        } else {
            await db.insert(examSecuritySettings).values({
                ...data,
                updatedBy: userId,
            });
        }

        revalidatePath("/admin/security/exams");
        return { success: true, message: "Exam security settings saved." };
    } catch (error) {
        console.error("Save Exam Security Error:", error);
        return { error: "Failed to save exam security settings." };
    }
}
