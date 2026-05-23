import { db } from "../db/db";
import { sql } from "drizzle-orm";

async function sync() {
    console.log("Starting Ultimate schema recovery...");

    const execute = async (query: string) => {
        try {
            await db.execute(sql.raw(query));
            console.log(`Success: ${query.substring(0, 60)}...`);
        } catch (e: any) {
            if (e.message.includes("already exists") || e.message.includes("Duplicate column name") || e.message.includes("Duplicate key name")) {
                console.log(`Skipped: ${query.substring(0, 60)}...`);
            } else {
                console.error(`Error: ${query.substring(0, 60)}`, e.message);
            }
        }
    };

    // 1. Institutional Units
    const unitCols = [
        "organization_id INT AFTER id",
        "academic_tier ENUM('k12', 'tertiary') DEFAULT 'tertiary' AFTER type",
        "slug VARCHAR(100) UNIQUE AFTER code",
        "is_active BOOLEAN DEFAULT TRUE AFTER settings"
    ];
    for (const col of unitCols) {
        await execute(`ALTER TABLE institutional_units ADD COLUMN ${col}`);
    }

    // 2. Students - Mass Recovery
    const stuCols = [
        "first_name VARCHAR(100) AFTER user_id",
        "last_name VARCHAR(100) AFTER first_name",
        "current_level INT DEFAULT 100 AFTER admission_year",
        "admission_year INT AFTER group_id",
        "unit_id INT AFTER dept_id",
        "group_id INT AFTER unit_id",
        "previous_matric_numbers TEXT AFTER matric_number",
        "legacy_access_units TEXT AFTER previous_matric_numbers",
        "admission_session_id INT AFTER admission_year",
        "jamb_number VARCHAR(50) AFTER admission_session_id",
        "wallet_balance DECIMAL(12,2) DEFAULT 0.00 AFTER jamb_number",
        "barcode VARCHAR(255) AFTER wallet_balance",
        "gender ENUM('male', 'female', 'other') AFTER barcode",
        "dob DATE AFTER gender",
        "image_url TEXT AFTER dob",
        "is_profile_locked BOOLEAN DEFAULT FALSE AFTER image_url",
        "nin VARCHAR(20) AFTER is_profile_locked",
        "nin_verified BOOLEAN DEFAULT FALSE AFTER nin",
        "status ENUM('active', 'inactive', 'suspended', 'graduated', 'withdrawn') DEFAULT 'active' AFTER nin_verified"
    ];
    for (const col of stuCols) {
        await execute(`ALTER TABLE students ADD COLUMN ${col}`);
    }

    // 3. student_groups table
    await execute(`
        CREATE TABLE IF NOT EXISTS student_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            unit_id INT,
            name VARCHAR(100) NOT NULL,
            level INT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 4. Results
    const resCols = [
        "rank_class VARCHAR(20)",
        "rank_level VARCHAR(20)",
        "ca_score DECIMAL(5,2) DEFAULT 0.00",
        "exam_score DECIMAL(5,2) DEFAULT 0.00"
    ];
    for (const col of resCols) {
        await execute(`ALTER TABLE results ADD COLUMN ${col}`);
    }

    // 5. annual_summaries table
    await execute(`
        CREATE TABLE IF NOT EXISTS annual_summaries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            session_id INT NOT NULL,
            total_score DECIMAL(10, 2) DEFAULT 0.00,
            average_score DECIMAL(5, 2) DEFAULT 0.00,
            rank_level VARCHAR(20),
            status ENUM('calculated', 'published', 'archived') DEFAULT 'calculated',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    console.log("Ultimate recovery completed.");
    process.exit(0);
}

sync();
