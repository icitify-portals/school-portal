import { db } from "./src/db";
import { admissionApplicationsV2 } from "./src/db/schema";
import { desc } from "drizzle-orm";

async function run() {
    const apps = await db.select().from(admissionApplicationsV2).orderBy(desc(admissionApplicationsV2.id)).limit(10);
    console.log("Recent Applications:");
    apps.forEach(a => {
        console.log(`ID: ${a.id}, Applicant: ${a.applicantId}, Template: ${a.templateId}, FormNo: ${a.formNumber}`);
    });
    process.exit(0);
}
run().catch(console.error);
