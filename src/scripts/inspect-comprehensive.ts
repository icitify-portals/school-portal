import { db } from "../db/db";
import { sql } from "drizzle-orm";

async function inspect() {
    const tables = ['staff', 'departments', 'programmes', 'course_assignments', 'institutional_units', 'student_groups'];
    for (const table of tables) {
        try {
            const [cols] = await db.execute(sql.raw(`DESCRIBE ${table}`));
            console.log(`--- ${table} ---`);
            console.log(cols);
        } catch (e) {
            console.log(`--- ${table} (MISSING or ERROR) ---`);
        }
    }
    process.exit(0);
}

inspect();
