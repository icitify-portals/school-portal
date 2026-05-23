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

    const query = `
        CREATE TABLE IF NOT EXISTS direct_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            transaction_number VARCHAR(100) UNIQUE NOT NULL,
            student_id INT REFERENCES students(id),
            branch_id INT NOT NULL REFERENCES institutional_units(id),
            operator_id INT NOT NULL REFERENCES users(id),
            amount DECIMAL(12, 2) DEFAULT 0.00,
            teller_number VARCHAR(100),
            remark TEXT,
            status ENUM('active', 'nullified') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `;

    try {
        console.log("Executing CREATE TABLE direct_payments...");
        await connection.query(query);
        console.log("Success!");
    } catch (e: any) {
        console.error(`Failed: ${e.message}`);
    }

    await connection.end();
    console.log("Migration complete.");
}

migrate().catch(console.error);
