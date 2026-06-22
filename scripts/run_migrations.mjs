import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true
});

const db = drizzle(connection);

console.log("Running migrations...");

try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migrations applied successfully!");
} catch (error) {
    console.error("Migration failed:", error);
} finally {
    await connection.end();
}
