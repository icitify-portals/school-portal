import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    try {
        const conn = await mysql.createConnection(process.env.DATABASE_URL as string);

        await conn.execute(`
            ALTER TABLE annual_summaries ADD COLUMN principal_comment TEXT;
        `);
        console.log("Migration successful");
        await conn.end();
        process.exit(0);
    } catch (e) {
        // Ignore if already exists
        console.log(e);
        process.exit(0);
    }
}
run();
