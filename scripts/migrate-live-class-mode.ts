
import { db } from "../src/db/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Running migration: Add 'mode' to virtual_classrooms...");

    try {
        await db.execute(sql`
            ALTER TABLE virtual_classrooms
            ADD COLUMN mode ENUM('meeting', 'webinar') DEFAULT 'meeting' AFTER title;
        `);
        console.log("Successfully added 'mode' column.");
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'mode' already exists. Skipping.");
        } else {
            console.error("Migration failed:", error);
        }
    }
    process.exit(0);
}

main();
