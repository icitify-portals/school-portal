import { db } from "../../src/db/db";
import { sql } from "drizzle-orm";

async function migrate() {
    console.log("🔄 Running attendance excuses migration...");

    try {
        // 1. Create attendance_excuses table (without FKs for compatibility)
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS attendance_excuses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                session_id INT NULL,
                course_id INT NOT NULL,
                reason TEXT NOT NULL,
                excuse_type ENUM('medical', 'official_duty', 'family_emergency', 'other') NOT NULL DEFAULT 'other',
                document_url VARCHAR(500) NULL,
                status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
                reviewed_by INT NULL,
                review_notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP NULL,
                INDEX idx_student (student_id),
                INDEX idx_course (course_id),
                INDEX idx_status (status)
            )
        `);
        console.log("✅ attendance_excuses table created");

        // 2. Add 'manual' to lecture_attendance method enum
        try {
            await db.execute(sql`
                ALTER TABLE lecture_attendance 
                MODIFY COLUMN method ENUM('qr', 'auto_online', 'manual_online', 'manual') NOT NULL DEFAULT 'qr'
            `);
            console.log("✅ lecture_attendance.method enum updated with 'manual'");
        } catch (e: any) {
            if (e.message?.includes("Duplicate") || e.code === 'ER_DUP_ENTRY') {
                console.log("ℹ️  lecture_attendance.method already has 'manual'");
            } else {
                console.warn("⚠️  Could not update lecture_attendance method enum:", e.message);
            }
        }

        console.log("🎉 Migration complete!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    }

    process.exit(0);
}

migrate();
