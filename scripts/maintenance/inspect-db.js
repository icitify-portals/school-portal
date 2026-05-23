import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function inspect() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        const [rows] = await connection.execute("DESCRIBE results");
        console.log("Results Column Count:", rows.length);
        rows.forEach(r => console.log(` - ${r.Field}`));

        const [auditRows] = await connection.execute("SHOW TABLES LIKE 'result_audit_logs'");
        console.log("Audit Logs Table exists:", auditRows.length > 0);

        await connection.end();
    } catch (error) {
        console.error("Inspection Failed:", error);
    }
}

inspect();
