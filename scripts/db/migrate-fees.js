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
    console.log("Connected to MySQL (Fee Schema Sync)...");

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        const statements = [
            `CREATE TABLE IF NOT EXISTS \`fee_items\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` text,
                \`default_amount\` decimal(12,2) DEFAULT '0.00',
                \`category\` enum('tuition', 'hostel', 'library', 'lab', 'other') DEFAULT 'other',
                \`recurrence\` enum('once', 'per_semester', 'per_session') DEFAULT 'per_session',
                \`is_required\` boolean DEFAULT true,
                CONSTRAINT \`fee_items_id\` PRIMARY KEY(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`fee_structures\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`academic_year\` varchar(20) NOT NULL,
                \`level\` int NOT NULL,
                \`status\` enum('draft','pending_approval','approved','archived') DEFAULT 'draft',
                \`approved_by\` int,
                \`approved_at\` timestamp NULL,
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`fee_structures_id\` PRIMARY KEY(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`fee_structure_items\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`fee_structure_id\` int NOT NULL,
                \`fee_item_id\` int NOT NULL,
                \`amount\` decimal(12,2) NOT NULL,
                \`semester\` enum('1','2','both') DEFAULT 'both',
                CONSTRAINT \`fee_structure_items_id\` PRIMARY KEY(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`fee_allocations\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`fee_structure_id\` int NOT NULL,
                \`faculty_id\` int,
                \`dept_id\` int,
                \`programme_id\` int,
                \`student_id\` int,
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`fee_allocations_id\` PRIMARY KEY(\`id\`)
            );`,
            `CREATE TABLE IF NOT EXISTS \`discounts\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`student_id\` int NOT NULL,
                \`fee_item_id\` int,
                \`amount\` decimal(12,2),
                \`percentage\` decimal(5,2),
                \`reason\` text,
                \`status\` enum('pending','approved','rejected') DEFAULT 'pending',
                \`approved_by\` int,
                \`approved_at\` timestamp NULL,
                \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`discounts_id\` PRIMARY KEY(\`id\`)
            );`
        ];

        for (const sql of statements) {
            console.log(`Checking/Creating table...`);
            await connection.query(sql);
        }

        console.log("Fee Schema Sync successful!");
    } catch (error) {
        console.error("Fee Schema Sync failed:", error);
    } finally {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        await connection.end();
    }
}

migrate();
