
import { db } from "../src/db/db";
import { systemConfig } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const keys = await db.select({ key: systemConfig.key }).from(systemConfig);
    console.log(JSON.stringify(keys, null, 2));
    process.exit(0);
}

main();
