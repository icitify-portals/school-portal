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
    maxRetriesPerRequest: null,
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
                } else if (targetCriteria.type === 'staff') {
                    const { users } = await import('./db/schema');
                    const queryResult = await db.select({ id: users.id })
                        .from(users)
                        .where(inArray(users.role, ['staff', 'admin', 'bursar', 'registrar', 'librarian', 'hod', 'dean', 'admission_officer', 'dvc', 'superadmin']));
                    studentIds = queryResult.map(r => r.id);
                } else if (targetCriteria.type === 'levels' && targetCriteria.levels?.length) {
                    const levelStr = targetCriteria.levels[0]; // Currently UI supports 1 level at a time
                    if (levelStr === 'Applicant') {
                        const { users } = await import('./db/schema');
                        const queryResult = await db.select({ id: users.id })
                            .from(users)
                            .where(eq(users.role, 'applicant'));
                        studentIds = queryResult.map(r => r.id);
                    } else {
                        let conditions: any[] = [];
                        if (levelStr === 'ND_graduated') {
                            conditions.push(eq(students.status, 'nd_graduated'));
                        } else if (levelStr === 'HND_graduated') {
                            conditions.push(eq(students.status, 'hnd_graduated'));
                        } else if (levelStr === 'ND 1') {
                            conditions.push(eq(students.status, 'active'));
                            conditions.push(eq(students.currentLevel, 100));
                            conditions.push(eq(students.programmeType, 'ND'));
                        } else if (levelStr === 'ND 2') {
                            conditions.push(eq(students.status, 'active'));
                            conditions.push(eq(students.currentLevel, 200));
                            conditions.push(eq(students.programmeType, 'ND'));
                        } else if (levelStr === 'HND 1') {
                            conditions.push(eq(students.status, 'active'));
                            conditions.push(eq(students.currentLevel, 100));
                            conditions.push(eq(students.programmeType, 'HND'));
                        } else if (levelStr === 'HND 2') {
                            conditions.push(eq(students.status, 'active'));
                            conditions.push(eq(students.currentLevel, 200));
                            conditions.push(eq(students.programmeType, 'HND'));
                        }

                        if (conditions.length > 0) {
                            const queryResult = await db.select({ userId: students.userId })
                                .from(students)
                                .where(and(...conditions));
                            studentIds = queryResult.filter(r => r.userId).map(r => r.userId as number);
                        }
                    }
                } else {
                    let conditions = [eq(students.status, 'active')];
                    
                    if (targetCriteria.type === 'departments' && targetCriteria.departments?.length) {
                        conditions.push(inArray(students.deptId, targetCriteria.departments));
                    } else if (targetCriteria.type === 'programmes' && targetCriteria.programmes?.length) {
                        conditions.push(inArray(students.programmeId, targetCriteria.programmes));
                    }
                    
                    const queryResult = await db.select({ userId: students.userId })
                        .from(students)
                        .where(and(...conditions));
                        
                    studentIds = queryResult.filter(r => r.userId).map(r => r.userId as number);
                }
                
                const externalEmails: string[] = targetCriteria.externalEmails || [];
                
                if (!studentIds.length && !externalEmails.length) {
                    await db.update(broadcastMessages)
                        .set({ status: 'completed', totalRecipients: 0 })
                        .where(eq(broadcastMessages.id, broadcastId));
                    return { success: 0, fail: 0, total: 0 };
                }
                
                await db.update(broadcastMessages)
                    .set({ status: 'processing', totalRecipients: studentIds.length + externalEmails.length })
                    .where(eq(broadcastMessages.id, broadcastId));
                
                let success = 0;
                let fail = 0;
                
                // 1. High-Performance Bulk In-App Notification Insertion
                if ((channel === 'both' || channel === 'toast') && studentIds.length > 0) {
                    try {
                        const { notifications } = await import('./db/schema');
                        const notifValues = studentIds.map(uid => ({
                            userId: uid,
                            title,
                            message,
                            type: 'info' as const,
                            channel: channel,
                            isRead: false,
                            isToasted: false,
                        }));
                        
                        const NOTIF_CHUNK = 250;
                        for (let i = 0; i < notifValues.length; i += NOTIF_CHUNK) {
                            const chunk = notifValues.slice(i, i + NOTIF_CHUNK);
                            await db.insert(notifications).values(chunk);
                        }
                    } catch (notifErr) {
                        console.error(`[JOB ${job.id}] In-app notification bulk insert error:`, notifErr);
                    }
                }
                
                // 2. High-Speed Concurrent Batch Email Dispatching
                if (channel === 'both' || channel === 'email') {
                    const { sendEmail } = await import('./lib/mail');
                    const { config } = await import('./lib/config');
                    const { users } = await import('./db/schema');
                    
                    let recipientEmails: string[] = [...externalEmails];
                    if (studentIds.length > 0) {
                        const dbUsers = await db.select({ email: users.email }).from(users).where(inArray(users.id, studentIds));
                        for (const u of dbUsers) {
                            if (u.email && !recipientEmails.includes(u.email)) {
                                recipientEmails.push(u.email);
                            }
                        }
                    }

                    const html = `<div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                            <h2 style="color: #4f46e5; margin-top: 0;">${title}</h2>
                            <p style="font-size: 15px; color: #334155; line-height: 1.6;">${message}</p>
                            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
                            <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from your institution's official portal.</p>
                        </div>`;
                    
                    const EMAIL_BATCH_SIZE = 10;
                    for (let i = 0; i < recipientEmails.length; i += EMAIL_BATCH_SIZE) {
                        const batch = recipientEmails.slice(i, i + EMAIL_BATCH_SIZE);
                        await Promise.all(batch.map(async (email) => {
                            try {
                                const res = await sendEmail(email, title, html, config.mail.from);
                                if (res.success) success++; else fail++;
                            } catch (err) {
                                fail++;
                            }
                        }));
                        await job.updateProgress(Math.floor(((i + batch.length) / recipientEmails.length) * 100));
                    }
                }
                
                await db.update(broadcastMessages)
                    .set({ status: 'completed' })
                    .where(eq(broadcastMessages.id, broadcastId));
                    
                return { success, fail, total: studentIds.length + externalEmails.length };
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
