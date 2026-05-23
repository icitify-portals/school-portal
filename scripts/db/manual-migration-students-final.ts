import mysql from 'mysql2/promise';
import 'dotenv/config';

async function migrate() {
    console.log("🛠️ Starting final manual migration for students table...");
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL!);

        console.log("Adding missing columns to students table...");

        // Check current columns again to be safe and only add what's missing
        const [cols]: any = await connection.query('DESCRIBE students');
        const existingFields = cols.map((c: any) => c.Field);

        const updates = [];

        if (!existingFields.includes('dept_id')) {
            updates.push("ADD COLUMN dept_id INT AFTER programme_id");
        }
        if (!existingFields.includes('admission_year')) {
            updates.push("ADD COLUMN admission_year INT AFTER matric_number");
        }
        if (!existingFields.includes('gender')) {
            updates.push("ADD COLUMN gender ENUM('male', 'female', 'other') AFTER barcode");
        }
        if (!existingFields.includes('dob')) {
            updates.push("ADD COLUMN dob VARCHAR(50) AFTER gender");
        }
        if (!existingFields.includes('status')) {
            updates.push("ADD COLUMN status ENUM('active', 'graduated', 'withdrawn', 'suspended') DEFAULT 'active' AFTER dob");
        }

        if (updates.length > 0) {
            const sql = `ALTER TABLE students ${updates.join(', ')}`;
            console.log("Executing:", sql);
            await connection.execute(sql);
            console.log("✅ Migration successful!");
        } else {
            console.log("✨ All columns already exist. No changes needed.");
        }

        await connection.end();
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}

migrate();
