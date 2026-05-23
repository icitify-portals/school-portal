
import { db } from "../src/db/db";
import { sql } from "drizzle-orm";

async function runPatch() {
    try {
        console.log("🛠️ Starting Comprehensive LMS Database Patch...");

        // 1. Create Missing Tables
        console.log("Creating 'exam_slots'...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS exam_slots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                session_id INT NOT NULL,
                semester ENUM('1', '2') NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                type ENUM('quiz', 'exam') DEFAULT 'exam',
                max_candidates INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Creating 'question_banks'...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS question_banks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                course_id INT,
                description TEXT,
                created_by_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Creating 'quiz_questions'...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS quiz_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                quiz_id INT,
                bank_id INT,
                question_text MEDIUMTEXT NOT NULL,
                type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'numerical', 'ordering', 'hotspot') DEFAULT 'multiple_choice',
                options MEDIUMTEXT,
                correct_answer TEXT,
                points INT DEFAULT 1,
                explanation TEXT,
                rubric TEXT,
                ai_grading_enabled BOOLEAN DEFAULT FALSE
            )
        `);

        console.log("Creating 'quiz_attempts'...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                quiz_id INT NOT NULL,
                student_id INT NOT NULL,
                score INT DEFAULT 0,
                max_score INT DEFAULT 0,
                passed BOOLEAN DEFAULT FALSE,
                status ENUM('in_progress', 'submitted', 'graded', 'timed_out') DEFAULT 'submitted',
                submission_type ENUM('manual', 'auto_timer', 'auto_global') DEFAULT 'manual',
                started_at DATETIME NOT NULL,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                weighted_score DECIMAL(5,2),
                ai_grading_status ENUM('none', 'pending', 'completed', 'failed') DEFAULT 'none',
                extra_time_minutes INT DEFAULT 0,
                manual_feedback TEXT
            )
        `);

        console.log("Creating 'quiz_responses'...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS quiz_responses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                attempt_id INT NOT NULL,
                question_id INT NOT NULL,
                student_answer MEDIUMTEXT,
                score INT,
                feedback TEXT
            )
        `);

        console.log("Creating 'quiz_incidents'...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS quiz_incidents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                attempt_id INT NOT NULL,
                type ENUM('tab_blur', 'window_resize', 'fullscreen_exit', 'hardware_change') NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        `);

        console.log("Creating 'quiz_attempt_questions'...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS quiz_attempt_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                attempt_id INT NOT NULL,
                question_id INT NOT NULL,
                \`order\` INT NOT NULL
            )
        `);

        // 2. Patch Existing Tables for Missing Columns
        console.log("Patching 'quizzes' Table...");
        const [quizCols] = await db.execute(sql`DESCRIBE quizzes`);
        const quizColNames = (quizCols as any[]).map(c => c.Field);

        const quizUpdates = [
            { name: 'quiz_type', type: "ENUM('standard', 'examination') DEFAULT 'standard'" },
            { name: 'visibility_rule', type: "ENUM('always', 'scheduled') DEFAULT 'always'" },
            { name: 'grace_period_minutes', type: "INT DEFAULT 0" },
            { name: 'slot_id', type: "INT" },
            { name: 'include_in_ca', type: "BOOLEAN DEFAULT FALSE" },
            { name: 'ca_averaging_method', type: "ENUM('simple', 'weighted') DEFAULT 'simple'" },
            { name: 'total_weight', type: "INT DEFAULT 0" },
            { name: 'max_points', type: "INT DEFAULT 100" },
            { name: 'grading_strategy', type: "ENUM('highest', 'average', 'latest', 'first') DEFAULT 'highest'" },
            { name: 'proctoring_enabled', type: "BOOLEAN DEFAULT FALSE" },
            { name: 'is_pooled', type: "BOOLEAN DEFAULT FALSE" },
            { name: 'draw_count', type: "INT" }
        ];

        for (const update of quizUpdates) {
            if (!quizColNames.includes(update.name)) {
                console.log(`Adding ${update.name} to quizzes...`);
                await db.execute(sql.raw(`ALTER TABLE quizzes ADD COLUMN ${update.name} ${update.type}`));
            }
        }

        console.log("✅ Database Synchronization Complete.");
    } catch (e) {
        console.error("❌ Patch Failed:", e);
    }
    process.exit(0);
}

runPatch();
