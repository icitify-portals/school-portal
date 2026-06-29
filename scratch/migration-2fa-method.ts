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

            // Check if column already exists
            const [columns]: any = await connection.execute(`
                SHOW COLUMNS FROM users LIKE 'two_factor_method'
            `);

            if (columns.length === 0) {
                console.log(`Adding two_factor_method to ${dbName}.users table...`);
                await connection.execute(`
                    ALTER TABLE users 
                    ADD COLUMN two_factor_method ENUM('app', 'email', 'sms') DEFAULT 'app'
                `);
                console.log(`Successfully migrated ${dbName}!`);
            } else {
                console.log(`Column two_factor_method already exists in ${dbName}.`);
            }

            await connection.end();
        } catch (error: any) {
            console.error(`Failed to migrate ${dbName}:`, error.message);
        }
    }
}

run();
