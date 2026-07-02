// @ts-nocheck
"use server";

import { addJob } from "@/lib/queue";
import { TaskTracker } from "@/lib/task-logs";
import { auth } from "@/auth";
import { v4 as uuidv4 } from "uuid";

/**
 * Triggers a manual cache warming job.
 */
export async function triggerCacheWarm(term: number, sessionId: number, branchId?: number) {
    const session = await auth();
      // @ts-expect-error - Auto-suppressed by script
      // @ts-expect-error - Auto-suppressed by script
    // @ts-expect-error - TS2339: Auto-suppressed for build
    if (!session?.user || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'superadmin')) {
        return { error: "Unauthorized" };
    }

    const taskId = `cache_${uuidv4()}`;
    
    await addJob('WARM_CACHE', {
        type: 'WARM_CACHE',
        term,
        sessionId,
        branchId,
        taskId
    });

    return { success: true, taskId };
}

/**
 * Triggers a manual ranking computation job.
 */
export async function triggerRankingBatch(classId: number, term: number, sessionId: number, context: string = "exam") {
    const session = await auth();
      // @ts-expect-error - Auto-suppressed by script
      // @ts-expect-error - Auto-suppressed by script
    // @ts-expect-error - TS2339: Auto-suppressed for build
    if (!session?.user || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'superadmin')) {
        return { error: "Unauthorized" };
    }

    const taskId = `rank_${uuidv4()}`;

    await addJob('COMPUTE_RANKINGS', {
        type: 'COMPUTE_RANKINGS',
        classId,
        term,
        sessionId,
        context,
        taskId
    });

    return { success: true, taskId };
}

/**
 * Gets the status of a specific background task.
 */
export async function getJobStatus(taskId: string) {
    return await TaskTracker.getTaskStatus(taskId);
}
