
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        console.log("Adding is_add_drop_open column to academic_sessions...");
        try {
            await connection.query("ALTER TABLE `academic_sessions` ADD COLUMN `is_add_drop_open` boolean DEFAULT false AFTER `is_registration_open` ");
            console.log("Added is_add_drop_open");
        } catch (e) {
            console.log("is_add_drop_open already exists or failed:", e.message);
        }

        console.log("Creating add_drop_requests table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`add_drop_requests\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`student_id\` int NOT NULL,
                \`session_id\` int NOT NULL,
                \`semester\` int NOT NULL,
                \`course_id\` int NOT NULL,
                \`type\` enum('add','remove') NOT NULL,
                \`status\` enum('pending','approved','rejected') DEFAULT 'pending',
                \`reason\` text,
                \`requested_at\` datetime DEFAULT CURRENT_TIMESTAMP,
                \`processed_by\` int,
                \`processed_at\` datetime DEFAULT NULL,
                CONSTRAINT \`add_drop_requests_id\` PRIMARY KEY(\`id\`),
                FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`),
                FOREIGN KEY (\`session_id\`) REFERENCES \`academic_sessions\`(\`id\`),
                FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`),
                FOREIGN KEY (\`processed_by\`) REFERENCES \`users\`(\`id\`)
            )
        `);
        console.log("Table add_drop_requests created or already exists");

        console.log("Schema fix complete!");
    } catch (err) {
        console.error("Fix failed:", err.message);
    } finally {
        await connection.end();
    }
}

fix();
