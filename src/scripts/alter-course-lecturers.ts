
import { db } from '../db/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log("Altering course_lecturers table...");

        await db.execute(sql`
            ALTER TABLE course_lecturers 
            ADD COLUMN role ENUM('main', 'co_lecturer') NOT NULL DEFAULT 'main',
            ADD COLUMN can_grade BOOLEAN DEFAULT TRUE;
        `);

        console.log("Successfully added role and can_grade columns.");

        // Add unique constraint (if not exists - tricky in MySQL/MariaDB in one line without check)
        // We'll try to add it, if it fails it might already exist or duplicates exist.
        // Given we want to enforce it, let's try.
        try {
            await db.execute(sql`
                ALTER TABLE course_lecturers 
                ADD UNIQUE KEY unq_assignment (session_id, course_id, staff_id, semester);
            `);
            console.log("Successfully added unique constraint.");
        } catch (e: any) {
            console.log("Unique constraint might already exist or duplicates found:", e.message);
        }

    } catch (error) {
        console.error("Migration failed:", error);
    }
    process.exit(0);
}

main();
