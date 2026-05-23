import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);

        console.log('Connected to database.');

        // Create id_cards table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS id_cards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                user_type ENUM('student', 'staff') NOT NULL,
                card_type ENUM('digital', 'physical_print') DEFAULT 'digital',
                issue_id VARCHAR(50) UNIQUE NOT NULL,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NULL,
                status ENUM('active', 'expired', 'revoked') DEFAULT 'active',
                verification_code VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('Table id_cards created successfully.');

        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
