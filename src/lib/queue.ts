import { Queue, Worker, QueueEvents } from 'bullmq';
import { config } from './config';

const connection = config.redis.enabled ? {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null,
} : undefined;

// --- QUEUE DEFINITION ---
export const taskQueue = connection ? new Queue('task-queue', { connection }) : null;

// --- QUEUE EVENTS (Optional, for monitoring) ---
export const queueEvents = connection ? new QueueEvents('task-queue', { connection }) : null;

/**
 * Helper to add a job to the queue
 */
export async function addJob(name: string, data: any, cron?: string, delay?: number) {
    if (!taskQueue) {
        console.warn(`[QUEUE] Redis is disabled. Throwing error to trigger inline processing for job: ${name}`);
        throw new Error("Redis is disabled");
    }

    const options: any = {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    };

    if (cron) {
        options.repeat = { pattern: cron };
    }
    
    if (delay) {
        options.delay = delay;
    }

    return await taskQueue.add(name, data, options);
}
