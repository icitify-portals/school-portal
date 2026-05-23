
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        console.log("Creating admission_sessions table...");
        // Use DATETIME to avoid TIMESTAMP default issues in some MariaDB versions
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`admission_sessions\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`start_date\` datetime NOT NULL,
                \`end_date\` datetime NOT NULL,
                \`application_fee\` decimal(12,2) DEFAULT '0.00',
                \`screening_mode\` enum('CBT','Interview','Document Only') DEFAULT 'CBT',
                \`logo_url\` text,
                \`instructions\` text,
                \`dynamic_fields\` text,
                \`is_active\` boolean DEFAULT true,
                \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`admission_sessions_id\` PRIMARY KEY(\`id\`)
            )
        `);

        console.log("Adding columns to admission_applications...");
        try {
            await connection.query("ALTER TABLE `admission_applications` ADD COLUMN `session_id` int AFTER `programme_id` ");
            console.log("Added session_id");
        } catch (e) {
            console.log("session_id already exists or failed:", e.message);
        }

        try {
            await connection.query("ALTER TABLE `admission_applications` ADD COLUMN `extra_data` text AFTER `status` ");
            console.log("Added extra_data");
        } catch (e) {
            console.log("extra_data already exists or failed:", e.message);
        }

        try {
            await connection.query("ALTER TABLE `admission_applications` ADD CONSTRAINT `adm_app_session_fk` FOREIGN KEY (`session_id`) REFERENCES `admission_sessions`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
            console.log("Added foreign key");
        } catch (e) {
            console.log("Foreign key already exists or failed:", e.message);
        }

        console.log("Schema fix complete!");
    } catch (err) {
        console.error("Fix failed:", err.message);
    } finally {
        await connection.end();
    }
}

fix();
