"use server";

import { RankingService } from "@/services/RankingService";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Trigger subject ranking calculation for a specific course/session.
 */
export async function calculateSubjectPositions(courseId: number, sessionId: number, semester: number) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await RankingService.calculateSubjectRankings(courseId, sessionId, semester);
        revalidatePath("/admin/academics/results");
        return { success: true };
    } catch (error: any) {
        console.error("Ranking calculation error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Trigger annual cumulative result processing for a level.
 */
export async function processAnnualLevelResults(sessionId: number, level: number) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || user.role !== 'admin') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await RankingService.processAnnualResults(sessionId, level);
        revalidatePath("/admin/academics/results");
        return { success: true };
    } catch (error: any) {
        console.error("Annual processing error:", error);
        return { success: false, error: error.message };
    }
}
