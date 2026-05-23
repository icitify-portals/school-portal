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

        // Add columns to students table
        const queries = [
            `ALTER TABLE students ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) DEFAULT 'Nigerian'`,
            `ALTER TABLE students ADD COLUMN IF NOT EXISTS mode_of_entry VARCHAR(50) DEFAULT 'UTME'`,
            `ALTER TABLE students ADD COLUMN IF NOT EXISTS graduated_at TIMESTAMP NULL`,
            `ALTER TABLE students ADD COLUMN IF NOT EXISTS class_of_degree VARCHAR(100) NULL`
        ];

        for (const query of queries) {
            try {
                await connection.execute(query);
                console.log(`Executed: ${query.substring(0, 50)}...`);
            } catch (err) {
                if (err.code === 'ER_DUP_COLUMN_NAME') {
                    console.log('Column already exists, skipping.');
                } else {
                    throw err;
                }
            }
        }

        console.log('Migration completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
