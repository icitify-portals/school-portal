
import { db } from "../src/db/db";
import { sql } from "drizzle-orm";

async function patchSchema() {
    try {
        console.log("🛠️ Starting DB Schema Patch (Continuous Assessment & Lesson Note Support)...");

        // 1. Check assignments table
        console.log("Patcing 'assignments' table...");
        const columnsAssignments = await db.execute(sql`DESCRIBE assignments`);
        const colNamesAssignments = (columnsAssignments[0] as any[]).map(c => c.Field);

        const assignmentsPatch = [
            { name: 'include_in_ca', sql: sql`ALTER TABLE assignments ADD COLUMN include_in_ca BOOLEAN DEFAULT FALSE` },
            { name: 'ca_averaging_method', sql: sql`ALTER TABLE assignments ADD COLUMN ca_averaging_method ENUM('simple', 'weighted') DEFAULT 'simple'` },
            { name: 'allow_resubmission', sql: sql`ALTER TABLE assignments ADD COLUMN allow_resubmission BOOLEAN DEFAULT TRUE` },
            { name: 'lesson_id', sql: sql`ALTER TABLE assignments ADD COLUMN lesson_id INT, ADD INDEX (lesson_id)` },
            { name: 'cut_off_date', sql: sql`ALTER TABLE assignments ADD COLUMN cut_off_date DATETIME` }
        ];

        for (const patch of assignmentsPatch) {
            if (!colNamesAssignments.includes(patch.name)) {
                console.log(`Adding ${patch.name} to assignments...`);
                await db.execute(patch.sql);
            }
        }

        // 2. Check quizzes table
        console.log("Patching 'quizzes' table...");
        const columnsQuizzes = await db.execute(sql`DESCRIBE quizzes`);
        const colNamesQuizzes = (columnsQuizzes[0] as any[]).map(c => c.Field);

        const quizzesPatch = [
            { name: 'total_weight', sql: sql`ALTER TABLE quizzes ADD COLUMN total_weight INT DEFAULT 100` },
            { name: 'max_points', sql: sql`ALTER TABLE quizzes ADD COLUMN max_points INT` },
            { name: 'grading_strategy', sql: sql`ALTER TABLE quizzes ADD COLUMN grading_strategy ENUM('absolute', 'weighted') DEFAULT 'absolute'` },
            { name: 'proctoring_enabled', sql: sql`ALTER TABLE quizzes ADD COLUMN proctoring_enabled BOOLEAN DEFAULT FALSE` },
            { name: 'is_pooled', sql: sql`ALTER TABLE quizzes ADD COLUMN is_pooled BOOLEAN DEFAULT FALSE` },
            { name: 'draw_count', sql: sql`ALTER TABLE quizzes ADD COLUMN draw_count INT` },
            { name: 'available_from', sql: sql`ALTER TABLE quizzes ADD COLUMN available_from DATETIME` },
            { name: 'available_until', sql: sql`ALTER TABLE quizzes ADD COLUMN available_until DATETIME` },
            { name: 'quiz_type', sql: sql`ALTER TABLE quizzes ADD COLUMN quiz_type ENUM('standard', 'examination') DEFAULT 'standard'` },
            { name: 'visibility_rule', sql: sql`ALTER TABLE quizzes ADD COLUMN visibility_rule ENUM('always', 'scheduled') DEFAULT 'always'` },
            { name: 'grace_period_minutes', sql: sql`ALTER TABLE quizzes ADD COLUMN grace_period_minutes INT DEFAULT 0` },
            { name: 'slot_id', sql: sql`ALTER TABLE quizzes ADD COLUMN slot_id INT` },
            { name: 'include_in_ca', sql: sql`ALTER TABLE quizzes ADD COLUMN include_in_ca BOOLEAN DEFAULT FALSE` },
            { name: 'ca_averaging_method', sql: sql`ALTER TABLE quizzes ADD COLUMN ca_averaging_method ENUM('simple', 'weighted') DEFAULT 'simple'` },
            { name: 'lesson_id', sql: sql`ALTER TABLE quizzes ADD COLUMN lesson_id INT, ADD INDEX (lesson_id)` }
        ];

        for (const patch of quizzesPatch) {
            if (!colNamesQuizzes.includes(patch.name)) {
                console.log(`Adding ${patch.name} to quizzes...`);
                await db.execute(patch.sql);
            }
        }

        // 3. Ensure grading_configurations exists
        console.log("Ensuring 'grading_configurations' table exists...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS grading_configurations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                session_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                type ENUM('assignment', 'quiz', 'attendance', 'manual', 'exam') NOT NULL,
                linked_id INT,
                max_marks INT NOT NULL,
                weight INT NOT NULL,
                \`order\` INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("✅ DB Patch Successfully Applied.");
    } catch (error) {
        console.error("❌ DB Patch Failed:", error);
    }
    process.exit(0);
}

patchSchema();
