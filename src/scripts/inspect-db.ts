import { db } from "../db/db";
import { sql } from "drizzle-orm";

async function inspect() {
    const tables = ['students', 'results', 'institutional_units', 'enrollments'];
    for (const table of tables) {
        try {
            const [cols] = await db.execute(sql.raw(`DESCRIBE ${table}`));
            console.log(`--- ${table} ---`);
            console.log(cols);
        } catch (e) {
            console.log(`--- ${table} (MISSING) ---`);
        }
    }
    process.exit(0);
}

inspect();
