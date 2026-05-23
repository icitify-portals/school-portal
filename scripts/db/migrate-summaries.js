import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log('Connected to database.');

        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        // Create table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`semester_summaries\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`student_id\` int NOT NULL,
                \`session_id\` int NOT NULL,
                \`semester\` enum('1', '2') NOT NULL,
                CONSTRAINT \`semester_summaries_id\` PRIMARY KEY(\`id\`),
                FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`),
                FOREIGN KEY (\`session_id\`) REFERENCES \`academic_sessions\`(\`id\`)
            );
        `);

        // Check columns and ADD if missing
        const [columns] = await connection.query('DESCRIBE semester_summaries;');
        const columnNames = columns.map(c => c.Field);

        const expectedColumns = [
            { name: 'tcr', definition: 'int DEFAULT 0' },
            { name: 'tce', definition: 'int DEFAULT 0' },
            { name: 'twgp', definition: "decimal(7,2) DEFAULT '0.00'" },
            { name: 'gpa', definition: "decimal(4,2) DEFAULT '0.00'" },
            { name: 'cgpa', definition: "decimal(4,2) DEFAULT '0.00'" },
            { name: 'updated_at', definition: 'timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
        ];

        for (const col of expectedColumns) {
            if (!columnNames.includes(col.name)) {
                console.log(`Adding column: ${col.name}`);
                await connection.query(`ALTER TABLE \`semester_summaries\` ADD COLUMN \`${col.name}\` ${col.definition};`);
            } else {
                console.log(`Column \`${col.name}\` already exists.`);
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        console.log('Migration completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
