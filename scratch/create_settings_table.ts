import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not found in .env");
        process.exit(1);
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log("Creating system_settings table...");
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS system_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(255) NOT NULL UNIQUE,
            setting_value TEXT,
            description TEXT,
            is_sensitive BOOLEAN DEFAULT FALSE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log("Table created successfully!");

    console.log("Inserting default settings...");
    const DEFAULT_SETTINGS = [
        ["module.live_classes", "true", "Enable Live Classes"],
        ["module.hostels", "true", "Enable Hostels Module"],
        ["module.results", "true", "Enable Results Module"],
        ["module.admission", "true", "Enable Admission Module"],
        ["module.finance", "true", "Enable Finance Module"],
        ["module.hr", "true", "Enable HR Module"],
        ["module.library", "false", "Enable Library Module (Coming Soon)"]
    ];

    for (const [key, value, desc] of DEFAULT_SETTINGS) {
        await connection.execute(
            "INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)",
            [key, value, desc]
        );
    }
    console.log("Default settings inserted!");

    await connection.end();
}

run().catch(console.error);
