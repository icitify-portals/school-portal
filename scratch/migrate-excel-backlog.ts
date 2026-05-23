import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL not found in .env");
        process.exit(1);
    }

    console.log(`Connecting to ${url}...`);
    const connection = await mysql.createConnection(url);

    const queries = [
        `CREATE TABLE IF NOT EXISTS excel_uploads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            filename VARCHAR(255) NOT NULL,
            user_id INT NOT NULL REFERENCES users(id),
            branch_id INT NOT NULL REFERENCES institutional_units(id),
            total_rows INT DEFAULT 0,
            processed_rows INT DEFAULT 0,
            status ENUM('pending', 'processing', 'completed', 'failed', 'deleted') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,
        `ALTER TABLE direct_payments ADD COLUMN IF NOT EXISTS excel_upload_id INT REFERENCES excel_uploads(id);`
    ];

    for (const query of queries) {
        try {
            console.log(`Executing: ${query.slice(0, 50)}...`);
            await connection.query(query);
            console.log("Success!");
        } catch (e: any) {
            console.error(`Failed: ${e.message}`);
        }
    }

    await connection.end();
    console.log("Migration complete.");
}

migrate().catch(console.error);
