import { db } from "../../src/db/db";
import { sql } from "drizzle-orm";

async function migrate() {
    console.log("🔄 Running promotion module migration...");

    try {
        // 1. Add 'rusticated' to users.status
        try {
            await db.execute(sql`
                ALTER TABLE users MODIFY COLUMN status ENUM('active', 'suspended', 'withdrawn', 'graduated', 'rusticated') DEFAULT 'active'
            `);
            console.log("✅ users.status enum updated with 'rusticated'");
        } catch (e: any) {
            console.warn("⚠️  users.status:", e.message?.substring(0, 80));
        }

        // 2. Add 'rusticated' to students.status
        try {
            await db.execute(sql`
                ALTER TABLE students MODIFY COLUMN status ENUM('active', 'graduated', 'withdrawn', 'suspended', 'rusticated') DEFAULT 'active'
            `);
            console.log("✅ students.status enum updated with 'rusticated'");
        } catch (e: any) {
            console.warn("⚠️  students.status:", e.message?.substring(0, 80));
        }

        // 3. Add duration_years to programmes
        try {
            await db.execute(sql`ALTER TABLE programmes ADD COLUMN duration_years INT DEFAULT 4`);
            console.log("✅ programmes.duration_years added");
        } catch (e: any) {
            if (e.message?.includes("Duplicate")) {
                console.log("ℹ️  programmes.duration_years already exists");
            } else {
                console.warn("⚠️  programmes.duration_years:", e.message?.substring(0, 80));
            }
        }

        // 4. Update duration_years from duration_months where possible
        try {
            await db.execute(sql`
                UPDATE programmes SET duration_years = CEIL(duration_months / 12) WHERE duration_years IS NULL OR duration_years = 4
            `);
            console.log("✅ duration_years calculated from duration_months");
        } catch (e: any) {
            console.warn("⚠️  Could not update duration_years:", e.message?.substring(0, 80));
        }

        // 5. Create promotion_criteria table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS promotion_criteria (
                id INT AUTO_INCREMENT PRIMARY KEY,
                dept_id INT NOT NULL,
                session_id INT NULL,
                min_cgpa DECIMAL(4,2) DEFAULT 1.00,
                min_credits_per_session INT DEFAULT 25,
                additional_rules TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_dept (dept_id),
                INDEX idx_session (session_id)
            )
        `);
        console.log("✅ promotion_criteria table created");

        // 6. Create promotion_logs table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS promotion_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                from_level INT NOT NULL,
                to_level INT NOT NULL,
                from_session_id INT NOT NULL,
                to_session_id INT NULL,
                decision ENUM('promoted', 'withdrawn', 'graduated', 'repeat', 'rusticated') NOT NULL,
                cgpa DECIMAL(4,2) NULL,
                credits_earned INT NULL,
                reason TEXT NULL,
                promoted_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_student (student_id),
                INDEX idx_session (from_session_id),
                INDEX idx_decision (decision)
            )
        `);
        console.log("✅ promotion_logs table created");

        console.log("🎉 Promotion migration complete!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    }

    process.exit(0);
}

migrate();
