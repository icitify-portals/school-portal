import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

const baseUri = process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/moodledb";

async function migrateDb(dbName: string) {
    const parsedUrl = new URL(baseUri);
    // Remove trailing slash if present
    parsedUrl.pathname = `/${dbName}`;
    const uri = parsedUrl.toString();
    console.log(`Running migration for database: ${dbName}...`);
    
    const connection = await mysql.createConnection({ uri });
    const db = drizzle(connection);
    
    await migrate(db, { migrationsFolder: "./drizzle" });
    
    console.log(`Migration completed for database: ${dbName}!`);
    await connection.end();
}

async function main() {
    const tenants = ["portal_ajat_academy", "portal_citadel_uni", "school_portal"];
    for (const tenant of tenants) {
        try {
            await migrateDb(tenant);
        } catch (error) {
            console.error(`Migration failed for database: ${tenant}:`, error);
        }
    }
}

main().catch((err: any) => {
    console.error("Migration script failed:", err);
    process.exit(1);
});
