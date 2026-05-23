import { db } from "../db/db";
import { sql } from "drizzle-orm";

async function syncStaffTable() {
    try {
        console.log("Adding 'expertise' column to 'staff_profiles'...");
        await db.execute(sql`ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS expertise TEXT AFTER barcode`);
        console.log("Success!");
        process.exit(0);
    } catch (error) {
        console.error("Sync failed:", error);
        process.exit(1);
    }
}

syncStaffTable();
