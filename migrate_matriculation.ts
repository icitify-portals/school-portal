import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    try {
        const conn = await mysql.createConnection(process.env.DATABASE_URL as string);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS matriculation_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                unit_id INT,
                faculty_id INT,
                dept_id INT,
                nomenclature VARCHAR(100) DEFAULT 'Matriculation Number',
                format VARCHAR(255) NOT NULL,
                serial_start INT DEFAULT 1,
                serial_padding INT DEFAULT 3,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (unit_id) REFERENCES institutional_units(id),
                FOREIGN KEY (faculty_id) REFERENCES faculties(id),
                FOREIGN KEY (dept_id) REFERENCES departments(id)
            );
        `);
        
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS matriculation_sequences (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_id INT NOT NULL,
                year INT NOT NULL,
                current_serial INT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unq_setting_year (setting_id, year),
                FOREIGN KEY (setting_id) REFERENCES matriculation_settings(id)
            );
        `);
        console.log("Migration successful");
        await conn.end();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
