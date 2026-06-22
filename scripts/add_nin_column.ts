import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Altering admission_applications_v2...");
    
    try {
        await db.execute(sql`
            ALTER TABLE \`admission_applications_v2\` 
            ADD COLUMN \`nin\` varchar(11) UNIQUE;
        `);
        console.log("Successfully altered admission_applications_v2!");
    } catch (e) {
        console.error("Error altering table:", e);
    }
    
    process.exit(0);
}

run();
