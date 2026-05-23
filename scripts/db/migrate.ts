import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("Starting migration...");
    const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
    });

    const db = drizzle(connection);

    await migrate(db, { migrationsFolder: "./drizzle" });

    console.log("Migration completed!");
    await connection.end();
    process.exit(0);
}

main().catch((err: any) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
