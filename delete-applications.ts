import { db } from "./src/db/db";
import { users, admissionApplicationsV2, paystackDeveloperFees } from "./src/db/schema";
import { inArray, eq } from "drizzle-orm";

async function run() {
    console.log("Finding users...");
    const targetUsers = await db.select().from(users).where(inArray(users.email, ['admin@icitifysolution.com', 'keuntech2025@gmail.com']));
    
    if (targetUsers.length === 0) {
        console.log("No users found with those emails.");
        process.exit(0);
    }

    const userIds = targetUsers.map(u => u.id);
    console.log("Found user IDs:", userIds);

    console.log("Finding applications for these users...");
    const apps = await db.select().from(admissionApplicationsV2).where(inArray(admissionApplicationsV2.applicantId, userIds));
    
    if (apps.length === 0) {
        console.log("No applications found for these users.");
        process.exit(0);
    }
    
    const appIds = apps.map(a => a.id);
    console.log("Found Application IDs:", appIds);

    console.log("Deleting associated paystack developer fees...");
    for (const appId of appIds) {
        await db.delete(paystackDeveloperFees).where(eq(paystackDeveloperFees.identifier, appId.toString()));
    }

    console.log("Deleting applications...");
    await db.delete(admissionApplicationsV2).where(inArray(admissionApplicationsV2.id, appIds));

    console.log("Deleted successfully.");
    process.exit(0);
}

run().catch(console.error);
