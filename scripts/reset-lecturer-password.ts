
import { db } from "../src/db/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
    const email = "araromi@school.com";
    const newPassword = "password123";

    console.log(`Resetting password for ${email}...`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, email));

    console.log(`Password reset successfully to: ${newPassword}`);
    process.exit(0);
}

main();
