import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const baseUri = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";

const databases = ["school_portal", "portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];

async function run() {
    for (const dbName of databases) {
        console.log(`Running migration for ${dbName}...`);
        try {
            const parsedUrl = new URL(baseUri);
            parsedUrl.pathname = `/${dbName}`;
            
            const connection = await mysql.createConnection(parsedUrl.toString());

            console.log(`Creating security_keys table in ${dbName}...`);
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS security_keys (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    office_name VARCHAR(255) NOT NULL,
                    key_identifier VARCHAR(100) NOT NULL UNIQUE,
                    status ENUM('available', 'checked_out', 'lost') DEFAULT 'available' NOT NULL,
                    current_holder_id INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (current_holder_id) REFERENCES users(id) ON DELETE SET NULL
                )
            `);

            console.log(`Creating security_key_logs table in ${dbName}...`);
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS security_key_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    key_id INT NOT NULL,
                    user_id INT NOT NULL,
                    action ENUM('checkout', 'return') NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    notes TEXT,
                    FOREIGN KEY (key_id) REFERENCES security_keys(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);

            console.log(`Successfully migrated ${dbName}!`);
            await connection.end();
        } catch (error: any) {
            console.error(`Failed to migrate ${dbName}:`, error.message);
        }
    }
}

run();
