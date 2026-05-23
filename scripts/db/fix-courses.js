import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function fixCourses() {
    if (!connectionString) {
        console.error("DATABASE_URL not found");
        return;
    }

    const connection = await mysql.createConnection(connectionString);
    console.log("Connected to MySQL...");

    try {
        const statements = [
            'ALTER TABLE `courses` ADD COLUMN IF NOT EXISTS `is_practical` boolean DEFAULT false;',
            'ALTER TABLE `courses` ADD COLUMN IF NOT EXISTS `is_university_required` boolean DEFAULT false;',
            'ALTER TABLE `courses` ADD COLUMN IF NOT EXISTS `counts_for_cgpa` boolean DEFAULT true;'
        ];

        for (const sql of statements) {
            console.log(`Executing: ${sql}`);
            await connection.query(sql);
        }

        console.log("Courses table schema fix successful!");
    } catch (error) {
        console.error("Fix failed:", error);
    } finally {
        await connection.end();
    }
}

fixCourses();
