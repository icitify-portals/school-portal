import { db } from "./src/db/db";
import { admissionFormTemplates } from "./src/db/schema";

async function run() {
    const rows = await db.select().from(admissionFormTemplates);
    console.log(rows);
    process.exit(0);
}
run();
