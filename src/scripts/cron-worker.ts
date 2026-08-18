try {
    const dotenv = await import("dotenv");
    dotenv.default.config();
} catch (e) {
    // Environment variables supplied directly by container in production
}
let cron: any = null;
try {
    const cronModule = await import("node-cron");
    cron = cronModule.default || cronModule;
} catch (e) {
    console.log("node-cron unavailable in standalone mode; automated cron tasks skipped.");
}
import { runBackup } from "../actions/backup";
import { processAutomatedMessages } from "../actions/automated-messages-processor";
import "../worker";

console.log("==========================================");
console.log("🚀 Starting Icitify Background Worker Daemon");
console.log("==========================================");

if (cron) {
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

console.log("✅ Cron scheduled: '0 2 * * *' (Daily at 2:00 AM for Backup)");

// Schedule Automated Felicitation Messages daily at 1:00 AM server time
cron.schedule("0 1 * * *", async () => {
    console.log(`[${new Date().toISOString()}] CRON TRIGGERED: Daily Automated Felicitation Messages`);
    try {
        await processAutomatedMessages();
        console.log(`[${new Date().toISOString()}] ✅ Automated Messages Queued`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Automated Messages CRON Encountered Fatal Error:`, error);
    }
});
    console.log("✅ Cron scheduled: '0 1 * * *' (Daily at 1:00 AM for Felicitation Messages)");
}

console.log("Listening for background worker tasks... (Press Ctrl+C to exit)");
