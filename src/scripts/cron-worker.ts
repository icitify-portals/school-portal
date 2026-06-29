import "dotenv/config";
import cron from "node-cron";
import { runBackup } from "../actions/backup";

console.log("==========================================");
console.log("🚀 Starting Icitify Background Worker Daemon");
console.log("==========================================");

// Schedule Daily Backup at 2:00 AM server time
cron.schedule("0 2 * * *", async () => {
    console.log(`[${new Date().toISOString()}] CRON TRIGGERED: Daily Automated Backup`);
    try {
        const result = await runBackup();
        if (result.success) {
            console.log(`[${new Date().toISOString()}] ✅ Backup Successful:`);
            console.log(`   S3 Upload: ${result.s3 ? 'Success' : 'Failed/Skipped'}`);
            console.log(`   Wasabi Upload: ${result.wasabi ? 'Success' : 'Failed/Skipped'}`);
        } else {
            console.error(`[${new Date().toISOString()}] ❌ Backup Failed:`, result.error);
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Backup CRON Encountered Fatal Error:`, error);
    }
});

console.log("✅ Cron scheduled: '0 2 * * *' (Daily at 2:00 AM)");
console.log("Listening for cron triggers... (Press Ctrl+C to exit)");
