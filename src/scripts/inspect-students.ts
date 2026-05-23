import { db } from "../db/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        const [cols] = await db.execute(sql.raw("DESCRIBE students"));
        console.log(cols);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

run();
