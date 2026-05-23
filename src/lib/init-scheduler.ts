import { addJob, taskQueue } from "./queue";

/**
 * Initializes the default repeatable academic jobs.
 */
export async function initAcademicScheduler() {
    if (!taskQueue) return;

    console.log("[SCHEDULER] Initializing repeatable academic jobs...");

    // 1. Cache Warming at 2:00 AM daily
    await addJob('WARM_CACHE_DAILY', {
        type: 'WARM_CACHE',
        term: 1, // This should dynamic, but for now fixed
        sessionId: 1, // This should dynamic
    }, '0 2 * * *');

    // 2. Compute Rankings at 3:00 AM daily
    await addJob('COMPUTE_RANKINGS_DAILY', {
        type: 'COMPUTE_RANKINGS',
        term: 1,
        sessionId: 1,
    }, '0 3 * * *');

    console.log("[SCHEDULER] Periodic tasks scheduled.");
}
