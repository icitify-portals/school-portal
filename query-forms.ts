import { db } from "./src/db/db";
import { admissionApplicationsV2 } from "./src/db/schema";
import { desc } from "drizzle-orm";

async function run() {
    const rows = await db.select({ id: admissionApplicationsV2.id, formNumber: admissionApplicationsV2.formNumber }).from(admissionApplicationsV2).orderBy(desc(admissionApplicationsV2.id)).limit(10);
    console.log(rows);
    process.exit(0);
}
run();
