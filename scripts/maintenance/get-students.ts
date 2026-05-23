import { db } from './src/db/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
    try {
        const students = await db.select({
            name: users.name,
            email: users.email
        })
            .from(users)
            .where(eq(users.role, 'student'))
            .limit(10);

        console.log("STUDENT_ACCOUNTS_START");
        console.log(JSON.stringify(students, null, 2));
        console.log("STUDENT_ACCOUNTS_END");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

run();
