
import { db } from "./src/db/db";
import { users, staffProfiles } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function checkMary() {
    const mary = await db.select().from(users).where(eq(users.name, "Mary Staff")).limit(1);
    console.log("Mary User:", mary);
    if (mary.length > 0) {
        const profile = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, mary[0].id)).limit(1);
        console.log("Mary Profile:", profile);
    }
}

checkMary().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
