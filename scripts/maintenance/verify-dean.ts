import { db } from './src/db/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function check() {
    try {
        const deanUsers = await db.select().from(users).where(eq(users.email, 'dean.science@school.com'));
        console.log(`Found ${deanUsers.length} users with email 'dean.science@school.com'`);
        deanUsers.forEach(u => console.log("User Data:", JSON.stringify(u, null, 2)));

        const allUsers = await db.select({ email: users.email }).from(users);
        const matches = allUsers.filter(u => u.email.trim() === 'dean.science@school.com');
        console.log("Trimmed matches in DB:", matches);

        process.exit(0);
    } catch (error) {
        console.error("Check Failed:", error);
        process.exit(1);
    }
}

check();
