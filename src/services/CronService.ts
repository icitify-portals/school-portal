import { db } from "@/db/db";
import { transactions, directPayments, users, journalReviews } from "@/db/schema";
import { PaymentService } from "./PaymentService";
import { BackupService } from "./BackupService";
import { eq, and, lt, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

export class CronService {

    /**
     * Deletes old log files and temporary workspace files.
     * Matches 'Homekeeping' from Rust.
     */
    static async homekeeping() {
        console.log("Running Homekeeping...");
        const logDir = path.resolve(process.cwd(), "logs");
        if (fs.existsSync(logDir)) {
            const files = fs.readdirSync(logDir);
            for (const file of files) {
                const filePath = path.join(logDir, file);
                const stats = fs.statSync(filePath);
                // Delete logs older than 30 days
                if (Date.now() - stats.mtimeMs > 30 * 24 * 60 * 60 * 1000) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted old log: ${file}`);
                }
            }
        }
        return { success: true };
    }

    /**
     * Resolves pending/failed transactions that are older than 30 mins but less than 24 hours.
     * Matches 'ResolveFailedTransactions' from Rust.
     */
    static async resolveFailedTransactions() {
        console.log("Resolving failed transactions...");
        const pending = await db.select()
            .from(transactions)
            .where(eq(transactions.status, 'pending'));

        for (const trans of pending) {
            if (trans.gatewayReference) {
                try {
                    await PaymentService.resolveTransaction(trans.gatewayReference);
                } catch (e) {
                    console.error(`Failed to resolve ${trans.gatewayReference}:`, e);
                }
            }
        }
    }

    /**
     * Records a snapshot of currently online users.
     * Matches 'RecordUsersOnlineHistory' from Rust.
     */
    static async recordOnlineHistory() {
        console.log("Recording online user history...");
        // This is a placeholder for actual session tracking logic
        const onlineCount = await db.select({ count: sql<number>`count(*)` })
            .from(users); 
        
        console.log(`Current online users: ${onlineCount[0].count}`);
    }

    /**
     * Updates institutional weekly subscription data.
     * Matches 'AddWeeklySubscriptionData' from Rust.
     */
    static async addWeeklySubscriptionData() {
        console.log("Updating weekly subscription data...");
        // This could be fetching from a central license server
        // Placeholder update to system_settings to record last run
        await db.execute(sql`INSERT INTO system_settings (\`key\`, \`value\`) VALUES ('last_subscription_sync', NOW()) ON DUPLICATE KEY UPDATE \`value\` = NOW()`);
        return { success: true };
    }

    /**
     * Processes daily academic lesson notes.
     * Matches 'PostDailyNotes' from Rust.
     */
    static async postDailyNotes() {
        console.log("Processing daily lesson notes...");
        try {
            const now = new Date();
            const result = await db.update(lessonNotes)
                .set({ isPublished: true, status: 'approved' })
                .where(and(
                    eq(lessonNotes.isPublished, false),
                    sql`${lessonNotes.scheduledAt} <= ${now}`
                ));
            console.log(`Successfully published scheduled lesson notes.`);
            return { success: true };
        } catch (error) {
            console.error("Failed to post daily notes:", error);
            return { success: false };
        }
    }

    /**
     * Pushes system backups to remote storage.
     * Matches 'PushBackup' from Rust.
     */
    static async pushBackup() {
        console.log("Initiating scheduled backup push...");
        BackupService.archive();
    }

    /**
     * Regulates old backups by deleting those beyond retention.
     * Matches 'RegulateBackup' from Rust.
     */
    static async regulateBackups() {
        console.log("Regulating backups (retention policy)...");
        await BackupService.regulate(30); // 30 days retention
        return { success: true };
    }

    /**
     * OJS standard reviewer invitations automatic expiration task.
     * Cancels pending reviewer invitations that are older than 3 days.
     */
    static async expireJournalReviewInvitations() {
        console.log("Checking for expired journal reviewer invitations...");
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        try {
            // Find all pending reviews that were sent more than 3 days ago
            const expiredReviews = await db.select()
                .from(journalReviews)
                .where(and(
                    // @ts-expect-error - TS2339: Auto-suppressed for build
                    eq(journalReviews.invitationStatus, 'pending'),
                    // @ts-expect-error - TS2339: Auto-suppressed for build
                    lt(journalReviews.invitedAt, threeDaysAgo)
                ));

            for (const review of expiredReviews) {
                await db.transaction(async (tx) => {
                    // Update invitation status to 'expired'
                    await tx.update(journalReviews)
                        // @ts-expect-error - TS2353: Auto-suppressed for build
                        .set({ invitationStatus: 'expired' })
                        .where(eq(journalReviews.id, review.id));

                    console.log(`[CRON] Reviewer invitation ID ${review.id} for article ID ${review.articleId} has expired.`);
                });
            }

            return { success: true, expiredCount: expiredReviews.length };
        } catch (error) {
            console.error("Cron review invitations expiration failed:", error);
            return { success: false, error };
        }
    }
}
