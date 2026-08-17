import { Worker } from 'bullmq';
import { config } from './lib/config';
import { BursaryService } from './services/BursaryService';
import { db } from './db/db';
import { students } from './db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const connection = config.redis.enabled ? {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
} : undefined;

if (!connection) {
    console.warn('--- BACKGROUND WORKER DISABLED: Redis not configured ---');
} else {
    console.log('--- BACKGROUND WORKER STARTING ---');

    const worker = new Worker('task-queue', async (job) => {
        console.log(`[JOB ${job.id}] Processing ${job.name}...`);

        if (job.name === 'BATCH_BILL_GEN') {
            const { sessionId, studentIds, note } = job.data;

            if (!studentIds || studentIds.length === 0) {
                console.log(`[JOB ${job.id}] No students to process.`);
                return { success: 0, fail: 0, total: 0 };
            }

            let success = 0;
            let fail = 0;

            for (let i = 0; i < studentIds.length; i++) {
                const id = studentIds[i];
                try {
                    await BursaryService.processSingleStudentBill(id, sessionId, note);
                    success++;
                } catch (err) {
                    console.error(`[JOB ${job.id}] Failed for student ${id}:`, err);
                    fail++;
                }

                // Update progress every 10 students or at the end
                if (i % 10 === 0 || i === studentIds.length - 1) {
                    await job.updateProgress(Math.floor(((i + 1) / studentIds.length) * 100));
                }
            }

            return { success, fail, total: studentIds.length };
        }
        
        if (job.name === 'SEND_BULK_MESSAGE') {
            const { broadcastId, title, message, channel, targetCriteria } = job.data;
            const { sendInAppNotification } = await import('./actions/notifications');
            const { broadcastMessages } = await import('./db/schema');
            
            try {
                // Parse target criteria
                let studentIds: number[] = [];
                
                if (targetCriteria.type === 'users') {
                    studentIds = targetCriteria.userIds || [];
                } else {
                    let conditions = [eq(students.status, 'active')];
                    
                    if (targetCriteria.type === 'levels' && targetCriteria.levels?.length) {
                        conditions.push(inArray(students.currentLevel, targetCriteria.levels));
                    } else if (targetCriteria.type === 'departments' && targetCriteria.departments?.length) {
                        conditions.push(inArray(students.deptId, targetCriteria.departments));
                    } else if (targetCriteria.type === 'programmes' && targetCriteria.programmes?.length) {
                        conditions.push(inArray(students.programmeId, targetCriteria.programmes));
                    }
                    
                    const queryResult = await db.select({ userId: students.userId })
                        .from(students)
                        .where(and(...conditions));
                        
                    studentIds = queryResult.filter(r => r.userId).map(r => r.userId as number);
                }
                
                if (!studentIds.length) {
                    await db.update(broadcastMessages)
                        .set({ status: 'completed', totalRecipients: 0 })
                        .where(eq(broadcastMessages.id, broadcastId));
                    return { success: 0, fail: 0, total: 0 };
                }
                
                await db.update(broadcastMessages)
                    .set({ status: 'processing', totalRecipients: studentIds.length })
                    .where(eq(broadcastMessages.id, broadcastId));
                
                let success = 0;
                let fail = 0;
                
                for (let i = 0; i < studentIds.length; i++) {
                    const userId = studentIds[i];
                    try {
                        await sendInAppNotification({
                            userId,
                            title,
                            message,
                            type: 'info',
                            channel: channel
                        });
                        success++;
                    } catch (err) {
                        fail++;
                    }
                    
                    if (i % 20 === 0 || i === studentIds.length - 1) {
                        await job.updateProgress(Math.floor(((i + 1) / studentIds.length) * 100));
                    }
                }
                
                await db.update(broadcastMessages)
                    .set({ status: 'completed' })
                    .where(eq(broadcastMessages.id, broadcastId));
                    
                return { success, fail, total: studentIds.length };
            } catch (error) {
                console.error(`[JOB ${job.id}] Fatal error:`, error);
                await db.update(broadcastMessages)
                    .set({ status: 'failed' })
                    .where(eq(broadcastMessages.id, broadcastId));
                throw error;
            }
        }
    }, { connection });

    worker.on('completed', job => {
        console.log(`[JOB ${job.id}] Completed with result:`, job.returnvalue);
    });

    worker.on('failed', (job, err) => {
        console.error(`[JOB ${job?.id}] Failed:`, err);
    });
}
