import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function migrate() {
    if (!connectionString) {
        console.error("DATABASE_URL not found");
        return;
    }

    const connection = await mysql.createConnection(connectionString);
    console.log("Connected to MySQL (Academic Migration)...");

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        const statements = [
            'ALTER TABLE `courses` ADD COLUMN IF NOT EXISTS `description` text;',
            'ALTER TABLE `departments` ADD COLUMN IF NOT EXISTS `faculty_id` int;',
            'CREATE TABLE IF NOT EXISTS `course_department_settings` (`course_id` int NOT NULL, `dept_id` int NOT NULL, `semester` enum("1", "2") NOT NULL, `status` enum("compulsory", "elective") NOT NULL DEFAULT "compulsory", `level` int DEFAULT 100, PRIMARY KEY (`course_id`, `dept_id`));',
            'CREATE TABLE IF NOT EXISTS `course_prerequisites` (`course_id` int NOT NULL, `prerequisite_id` int NOT NULL, PRIMARY KEY (`course_id`, `prerequisite_id`));'
        ];

        for (const sql of statements) {
            console.log(`Executing: ${sql.substring(0, 50)}...`);
            await connection.query(sql);
        }

        console.log("Academic Migration successful!");
    } catch (error) {
        console.error("Academic Migration failed:", error);
    } finally {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        await connection.end();
    }
}

migrate();
