import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Altering admission_form_templates...");
    
    try {
        await db.execute(sql`
            ALTER TABLE \`admission_form_templates\` 
            ADD COLUMN \`flow_type\` ENUM('payment_first', 'form_first', 'free_form') DEFAULT 'form_first',
            ADD COLUMN \`fee_structure_id\` int;
        `);
        console.log("Successfully altered admission_form_templates!");
    } catch (e) {
        console.error("Error altering table:", e);
    }
    
    process.exit(0);
}

run();
