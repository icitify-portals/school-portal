import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

async function migrate() {
    console.log('Database URL present:', !!process.env.DATABASE_URL);
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not defined in .env');
        return;
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        console.log('Creating venues table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS venues (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                capacity INT,
                faculty_id INT,
                FOREIGN KEY (faculty_id) REFERENCES faculties(id)
            ) ENGINE=InnoDB;
        `);
        console.log('Venues table created successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate().catch(err => console.error('Unhandled error:', err));
