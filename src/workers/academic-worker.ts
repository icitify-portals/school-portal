import { Worker } from 'bullmq';
import { CacheEngine } from '../services/cache-engine';
import { RankingService } from '../services/RankingService';
import { redis } from '../lib/redis';
import { config } from '../lib/config';

const connection = config.redis.enabled ? {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
} : undefined;

export const academicWorker = connection ? new Worker('task-queue', async (job) => {
    const { type, term, sessionId, branchId, classId, context, taskId } = job.data;

    console.log(`[WORKER] Starting job ${job.id} of type ${type}`);

    try {
        switch (type) {
            case 'WARM_CACHE':
                await CacheEngine.cacheAllAcademicsDataInTerm(term, sessionId, branchId, taskId);
                break;
            case 'COMPUTE_RANKINGS':
                // Assuming we want to rank all subjects for this class
                // In a real scenario, this would iterate over class subjects
                await RankingService.computeBatchPositions(job.data.subjectId, classId, job.data.groupId, term, sessionId, context);
                break;
            case 'PROCESS_ANNUAL':
                await RankingService.processAnnualResults(sessionId, classId);
                break;
            default:
                console.warn(`[WORKER] Unknown job type: ${type}`);
        }
        console.log(`[WORKER] Finished job ${job.id}`);
    } catch (error) {
        console.error(`[WORKER] Job ${job.id} failed:`, error);
        throw error;
    }
}, { connection, concurrency: 1 }) : null;

if (academicWorker) {
    academicWorker.on('completed', (job) => {
        console.log(`[WORKER] Job ${job.id} completed!`);
    });

    academicWorker.on('failed', (job, err) => {
        console.error(`[WORKER] Job ${job?.id} failed with error: ${err.message}`);
    });
}
