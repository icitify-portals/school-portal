
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;

async function migrate() {
    if (!connectionString) {
        console.error("DATABASE_URL not found");
        return;
    }

    const connection = await mysql.createConnection(connectionString);
    console.log("Connected to MySQL for Manual Migration...");

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        const migrationFile = path.join(__dirname, '../drizzle/0008_crazy_killraven.sql');
        console.log(`Reading migration file: ${migrationFile}`);

        const sqlContent = fs.readFileSync(migrationFile, 'utf-8');
        // Split by Drizzle's breakpoint
        const statements = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);

        console.log(`Found ${statements.length} statements to execute.`);

        for (const [index, sql] of statements.entries()) {
            console.log(`Executing statement ${index + 1}...`);
            // console.log(sql); 
            try {
                await connection.query(sql);
            } catch (err: any) {
                // If column exists error, ignore (idempotency attempt)
                if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`Skipping duplicate/existing: ${err.message}`);
                } else {
                    throw err;
                }
            }
        }

        console.log("Migration executed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        await connection.end();
    }
}

migrate();
