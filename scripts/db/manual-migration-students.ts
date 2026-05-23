import mysql from 'mysql2/promise';
import 'dotenv/config';

async function migrate() {
    console.log("🛠️ Starting manual migration for students table...");
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL!);

        console.log("Adding first_name and last_name columns to students table...");
        await connection.execute(`
            ALTER TABLE students 
            ADD COLUMN first_name VARCHAR(100) AFTER user_id,
            ADD COLUMN last_name VARCHAR(100) AFTER first_name
        `);

        console.log("✅ Migration successful!");
        await connection.end();
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}

migrate();
