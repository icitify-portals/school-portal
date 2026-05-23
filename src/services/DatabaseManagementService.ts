import { db } from "@/db/db";
import { sql } from "drizzle-orm";
import { execSync } from "child_process";

export class DatabaseManagementService {

    /**
     * Executes a raw MySQL query.
     * Matches 'mysql_execute' from Rust.
     */
    static async execute(query: string) {
        console.log(`Executing: ${query}`);
        try {
            // Using Drizzle's execute for safety, but could also use child_process for CLI parity
            const result = await db.execute(sql.raw(query));
            return result;
        } catch (error: any) {
            throw new Error(`Execution failed: ${error.message}`);
        }
    }

    /**
     * Renames the database by moving tables one by one.
     * Matches 'rename' from Rust.
     */
    static async renameDatabase(newName: string, verbose: boolean = false) {
        // 1. Get current database name
        const dbNameResult: any = await db.execute(sql`SELECT DATABASE() as db`);
        const oldDb = dbNameResult[0][0].db;

        if (oldDb === newName) {
            console.log("Old and new database names are the same. Skipping.");
            return;
        }

        console.log(`Renaming database ${oldDb} to ${newName}...`);

        // 2. Create new database
        await db.execute(sql.raw(`CREATE DATABASE IF NOT EXISTS ${newName}`));

        // 3. Get all tables
        const tablesResult: any = await db.execute(sql`SHOW TABLES`);
        const tables = tablesResult[0].map((row: any) => Object.values(row)[0]);

        // 4. Move tables
        for (const table of tables) {
            if (verbose) console.log(`Moving table: ${table}`);
            await db.execute(sql.raw(`RENAME TABLE ${oldDb}.${table} TO ${newName}.${table}`));
        }

        // 5. Drop old database
        await db.execute(sql.raw(`DROP DATABASE ${oldDb}`));

        console.log(`Successfully renamed database to ${newName}.`);
        console.log("NOTE: You must update your .env file's DB_NAME to reflect this change.");
    }
}
