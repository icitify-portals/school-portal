import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function finalCheck() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log("Connected to:", process.env.DATABASE_URL);

        const [rows]: any = await connection.execute("DESCRIBE results");
        console.log("COLUMNS IN RESULTS:");
        rows.forEach(r => {
            console.log(` - ${r.Field} (${r.Type})`);
        });

        const [dbName]: any = await connection.execute("SELECT DATABASE()");
        console.log("Current DB name from connection:", dbName[0]['DATABASE()']);

        await connection.end();
    } catch (error) {
        console.error("Check Failed:", error);
    }
}

finalCheck();
