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

            // Check if table already exists
            const [tables]: any = await connection.execute(`
                SHOW TABLES LIKE 'security_lost_and_found'
            `);

            if (tables.length === 0) {
                console.log(`Creating security_lost_and_found table in ${dbName}...`);
                await connection.execute(`
                    CREATE TABLE security_lost_and_found (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        type ENUM('lost', 'found') NOT NULL,
                        item_name VARCHAR(255) NOT NULL,
                        category ENUM('electronics', 'documents', 'clothing', 'keys', 'other') NOT NULL,
                        description TEXT NOT NULL,
                        date_reported DATETIME NOT NULL,
                        location VARCHAR(255) NOT NULL,
                        status ENUM('open', 'matched', 'claimed', 'disposed') NOT NULL DEFAULT 'open',
                        reported_by_id INT NOT NULL,
                        claimed_by_id INT DEFAULT NULL,
                        storage_location VARCHAR(255) DEFAULT NULL,
                        image_url VARCHAR(500) DEFAULT NULL,
                        claim_proof_image_url VARCHAR(500) DEFAULT NULL,
                        resolved_at DATETIME DEFAULT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (reported_by_id) REFERENCES users(id),
                        FOREIGN KEY (claimed_by_id) REFERENCES users(id)
                    )
                `);
                console.log(`Successfully migrated ${dbName}!`);
            } else {
                console.log(`Table security_lost_and_found already exists in ${dbName}.`);
            }

            await connection.end();
        } catch (error: any) {
            console.error(`Failed to migrate ${dbName}:`, error.message);
        }
    }
}

run();
