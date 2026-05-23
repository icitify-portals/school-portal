
import { db } from "../src/db/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Running manual migration for Live Classes...");

    try {
        // Create virtual_classrooms table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS virtual_classrooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                lecturer_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                room_name VARCHAR(100) NOT NULL UNIQUE,
                timetable_slot_id INT,
                status ENUM('scheduled', 'active', 'ended') DEFAULT 'scheduled',
                started_at TIMESTAMP NULL,
                ended_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id),
                FOREIGN KEY (lecturer_id) REFERENCES users(id),
                FOREIGN KEY (timetable_slot_id) REFERENCES timetable_slots(id)
            );
        `);
        console.log("Created virtual_classrooms table.");

        // Create class_recordings table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS class_recordings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                classroom_id INT NOT NULL,
                s3_key VARCHAR(255) NOT NULL,
                s3_url VARCHAR(500) NOT NULL,
                duration_seconds INT,
                file_size INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (classroom_id) REFERENCES virtual_classrooms(id)
            );
        `);
        console.log("Created class_recordings table.");

        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
    process.exit(0);
}

main();
