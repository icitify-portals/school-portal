import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function list() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
        });
        const [rows] = await connection.execute("SHOW DATABASES");
        console.log("Databases:", rows.map(r => r.Database).join(", "));
        await connection.end();
    } catch (error) {
        console.error("List Failed:", error);
    }
}

list();
