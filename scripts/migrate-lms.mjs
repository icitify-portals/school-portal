import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function migrate() {
    const migrationFile = './drizzle/0006_complex_darkstar.sql';

    if (!fs.existsSync(migrationFile)) {
        console.error(`Migration file not found: ${migrationFile}`);
        process.exit(1);
    }

    console.log(`Reading migration file: ${migrationFile}`);
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log("Connecting to database...");
    const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL
    });

    try {
        console.log("Applying migration...");

        // Split file by drizzle-kit delimiter
        const statements = sql.split('--> statement-breakpoint');

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                } catch (err) {
                    if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === '1050') {
                        console.log("Table already exists, skipping...");
                    } else if (err.code === 'ER_DUP_KEYNAME') {
                        console.log("Index/Constraint already exists, skipping...");
                    } else {
                        throw err;
                    }
                }
            }
        }

        console.log("Migration applied successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.end();
    }
}

migrate();
