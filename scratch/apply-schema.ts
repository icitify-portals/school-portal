
import { db } from "../src/db/db";
import { sql } from "drizzle-orm";

async function applySchema() {
    try {
        console.log("Applying Corrected LMS Schema Changes...");

        // 1. Re-create lesson_note_approvers with correct columns
        console.log("- Creating lesson_note_approvers with all columns...");
        // Drop it first if it exists from the previous half-baked run
        await db.execute(sql.raw(`DROP TABLE IF EXISTS \`lesson_note_approvers\`;`));
        
        await db.execute(sql.raw(`
            CREATE TABLE \`lesson_note_approvers\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`supervisor_id\` int NOT NULL,
                \`target_user_id\` int,
                \`target_dept_id\` int,
                \`target_faculty_id\` int,
                \`unit_id\` int,
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`lesson_note_approvers_id\` PRIMARY KEY(\`id\`),
                CONSTRAINT \`lesson_note_approvers_supervisor_id_users_id_fk\` FOREIGN KEY (\`supervisor_id\`) REFERENCES \`users\`(\`id\`),
                CONSTRAINT \`lesson_note_approvers_target_user_id_users_id_fk\` FOREIGN KEY (\`target_user_id\`) REFERENCES \`users\`(\`id\`),
                CONSTRAINT \`lesson_note_approvers_target_dept_id_departments_id_fk\` FOREIGN KEY (\`target_dept_id\`) REFERENCES \`departments\`(\`id\`),
                CONSTRAINT \`lesson_note_approvers_target_faculty_id_faculties_id_fk\` FOREIGN KEY (\`target_faculty_id\`) REFERENCES \`faculties\`(\`id\`),
                CONSTRAINT \`lesson_note_approvers_unit_id_institutional_units_id_fk\` FOREIGN KEY (\`unit_id\`) REFERENCES \`institutional_units\`(\`id\`)
            );
        `));

        console.log("Schema applied successfully.");
    } catch (error) {
        console.error("Failed to apply schema:", error);
    }
    process.exit(0);
}

applySchema();
