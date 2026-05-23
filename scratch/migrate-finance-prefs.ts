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
        CREATE TABLE IF NOT EXISTS finance_preferences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_id INT NOT NULL REFERENCES academic_sessions(id),
            branch_id INT NOT NULL REFERENCES institutional_units(id),
            data TEXT NOT NULL,
            updated_by INT NOT NULL REFERENCES users(id),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unq_session_branch (session_id, branch_id)
        );
    `;

    try {
        console.log("Executing CREATE TABLE finance_preferences...");
        await connection.query(query);
        console.log("Success!");
    } catch (e: any) {
        console.error(`Failed: ${e.message}`);
    }

    await connection.end();
    console.log("Migration complete.");
}

migrate().catch(console.error);
